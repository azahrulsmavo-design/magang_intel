# src/fetch.py
import os, sys, time, json, math, uuid, datetime as dt
from pathlib import Path
from typing import Any, Dict, Tuple, Optional
import requests
import yaml
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "config" / "params.yaml"

def load_config() -> dict:
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)
    return cfg

def ensure_dirs(raw_dir: Path, logs_dir: Path) -> None:
    raw_dir.mkdir(parents=True, exist_ok=True)
    logs_dir.mkdir(parents=True, exist_ok=True)

def now_ts(tzname: str = "Asia/Jakarta") -> str:
    try:
        import zoneinfo
        tz = zoneinfo.ZoneInfo(tzname)
        return dt.datetime.now(tz).strftime("%Y%m%d_%H%M%S")
    except Exception:
        return dt.datetime.now().strftime("%Y%m%d_%H%M%S")

def request_page(
    url: str,
    params: Dict[str, Any],
    headers: Dict[str, str],
    timeout_s: int,
    max_retries: int,
    retry_backoff_s: int,
) -> Tuple[dict, requests.Response]:
    """GET with simple retry incl. 429 + 5xx. Honors Retry-After if present."""
    attempt = 0
    while True:
        r = requests.get(url, params=params, headers=headers, timeout=timeout_s)
        if r.status_code == 200:
            try:
                return r.json(), r
            except Exception as e:
                raise RuntimeError(f"Gagal parse JSON: {e}") from e

        # handle rate limit / server error
        if r.status_code in (429, 500, 502, 503, 504) and attempt < max_retries:
            attempt += 1
            ra = r.headers.get("Retry-After")
            wait_s = int(ra) if ra and ra.isdigit() else retry_backoff_s * attempt
            time.sleep(wait_s)
            continue

        # hard fail
        raise RuntimeError(f"Request gagal: HTTP {r.status_code} | {r.text[:300]}")

def main():
    cfg = load_config()

    url         = cfg["source"]["url"]
    base_params = cfg["source"].get("params", {}) or {}
    headers     = cfg["source"].get("headers", {}) or {}

    timeout_s       = int(cfg.get("run", {}).get("timeout_s", 60))
    max_retries     = int(cfg.get("run", {}).get("max_retries", 3))
    retry_backoff_s = int(cfg.get("run", {}).get("retry_backoff_s", 5))
    sleep_ms        = int(cfg.get("run", {}).get("sleep_ms", 200))
    respect_rl      = bool(cfg.get("run", {}).get("respect_rate_limit", True))
    pages_cfg       = cfg.get("run", {}).get("pages", None)  # None/0 => ALL pages

    raw_dir  = ROOT / cfg["output"]["raw_dir"]
    logs_dir = ROOT / cfg["output"]["logs_dir"]
    ensure_dirs(raw_dir, logs_dir)

    run_id = f"run_{now_ts(cfg.get('project', {}).get('timezone', 'Asia/Jakarta'))}_{uuid.uuid4().hex[:8]}"
    run_dir = raw_dir / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    # start page / limit
    page  = int(base_params.get("page", 1))
    limit = int(base_params.get("limit", 100))

    # fetch first page
    params = dict(base_params, page=page, limit=limit)
    data, resp = request_page(url, params, headers, timeout_s, max_retries, retry_backoff_s)

    # Save page 1
    with open(run_dir / f"page_{page:05d}.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)

    raw_meta = data.get("meta") or {}
    meta = raw_meta.get("pagination", raw_meta)

    total     = int(meta.get("total") or 0)
    last_page = int(meta.get("last_page") or 0)
    per_page  = int(meta.get("per_page") or limit)
    got_items  = len(data.get("data") or [])
    print(f"[INFO] Page {page} OK | items={got_items} | total={total} | last_page={last_page} | per_page={per_page}")

    # Determine how many pages to pull:
    # - If 'pages' in config is None or 0 => pull ALL until last_page (or until no items)
    # - Else, pull up to 'pages' starting from current 'page'
    pull_all = (pages_cfg in (None, 0, "all"))
    target_last_page = last_page or math.ceil(total / per_page)

    # Loop next pages
    current_page = page
    while True:
        if not pull_all and current_page >= target_last_page:
            break
        if pull_all and last_page and current_page >= last_page:
            break

        current_page += 1
        params["page"] = current_page

        # Optional: respect simple rate-limit budget from headers
        if respect_rl:
            remaining = int(resp.headers.get("x-ratelimit-remaining", "1") or "1")
            if remaining <= 1:
                ra = resp.headers.get("Retry-After")
                wait_s = int(ra) if ra and ra.isdigit() else max(5, retry_backoff_s)
                print(f"[RL] remaining={remaining} → sleep {wait_s}s")
                time.sleep(wait_s)

        # small sleep between calls
        time.sleep(sleep_ms / 1000.0)

        try:
            data, resp = request_page(url, params, headers, timeout_s, max_retries, retry_backoff_s)
        except Exception as e:
            print(f"[ERROR] page {current_page}: {e}")
            break

        with open(run_dir / f"page_{current_page:05d}.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)

        items = len(data.get("data") or [])
        raw_meta = data.get("meta") or {}
        meta = raw_meta.get("pagination", raw_meta)
        last_page = int(meta.get("last_page") or last_page)
        print(f"[INFO] Page {current_page} OK | items={items}")

        if items == 0:
            print("[INFO] No more items; stopping.")
            break

    # Write run metadata
    run_meta = {
        "run_id": run_id,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "url": url,
        "params_base": base_params,
        "headers": headers,
        "first_page": page,
        "limit": limit,
        "pull_all": pull_all,
        "last_seen_page": current_page,
        "total_from_api": total,
        "notes": "RAW JSON disimpan per halaman. Lanjutkan normalisasi di src/prepare.py"
    }
    with open(run_dir / "run_meta.json", "w", encoding="utf-8") as f:
        json.dump(run_meta, f, ensure_ascii=False, indent=2)

    # Append to log file
    log_file = logs_dir / f"{run_id}.log"
    with open(log_file, "w", encoding="utf-8") as f:
        f.write(f"{run_meta}\n")

    print(f"[DONE] Saved to {run_dir}")

if __name__ == "__main__":
    """
    Cara pakai:
      python src/fetch.py

    Perilaku:
      - Baca config/params.yaml
      - Jika run.pages = null/0/"all" → ambil SEMUA halaman (sampai last_page dari API)
      - Jika run.pages = N → ambil N halaman mulai dari page awal di params
      - RAW tiap halaman → data/raw/run_*/page_00001.json, dst.
    """
    try:
        main()
    except KeyboardInterrupt:
        print("\n[INTERRUPTED]")
        sys.exit(130)
