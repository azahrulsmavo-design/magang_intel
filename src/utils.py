# src/utils.py
import os
import json
import datetime as dt
from pathlib import Path
import yaml
import pandas as pd

# ============================================================
# CONFIG & PATH UTILITIES
# ============================================================

def load_yaml(path: str | Path) -> dict:
    """Baca YAML dan kembalikan dict."""
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"File tidak ditemukan: {p}")
    with open(p, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def ensure_dir(path: str | Path) -> Path:
    """Pastikan direktori ada (buat kalau belum)."""
    p = Path(path)
    p.mkdir(parents=True, exist_ok=True)
    return p


def get_timestamp(tzname: str = "Asia/Jakarta") -> str:
    """Timestamp lokal (default: Asia/Jakarta)."""
    try:
        import zoneinfo
        tz = zoneinfo.ZoneInfo(tzname)
        return dt.datetime.now(tz).strftime("%Y-%m-%d_%H-%M-%S")
    except Exception:
        return dt.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")


# ============================================================
# LOGGING UTILITIES
# ============================================================

def init_log(log_dir: str | Path, prefix: str = "run") -> Path:
    """Buat file log baru dan kembalikan Path-nya."""
    log_dir = ensure_dir(log_dir)
    ts = get_timestamp()
    log_path = log_dir / f"{prefix}_{ts}.log"
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(f"[START] {ts}\n")
    return log_path


def log(message: str, log_file: Path | None = None, print_console: bool = True):
    """Tulis pesan ke file log dan/atau console."""
    ts = dt.datetime.now().strftime("%H:%M:%S")
    msg = f"[{ts}] {message}"
    if print_console:
        print(msg)
    if log_file:
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(msg + "\n")


# ============================================================
# JSON & FILE IO
# ============================================================

def save_json(obj, path: str | Path, indent: int = 2):
    """Simpan objek ke file JSON UTF-8."""
    path = Path(path)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=indent)
    return path


def load_json(path: str | Path) -> dict:
    """Muat file JSON menjadi dict."""
    p = Path(path)
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)


def concat_parquet_files(files: list[Path], output_path: Path | None = None) -> pd.DataFrame:
    """Gabungkan beberapa file Parquet menjadi satu DataFrame."""
    dfs = [pd.read_parquet(f) for f in files]
    df = pd.concat(dfs, ignore_index=True)
    if output_path:
        ensure_dir(output_path.parent)
        df.to_parquet(output_path, index=False)
    return df


# ============================================================
# DATE/TIME HELPERS
# ============================================================

def parse_date_safe(value) -> pd.Timestamp | None:
    """Konversi tanggal string ke Timestamp (atau None jika gagal)."""
    if not value or pd.isna(value):
        return None
    try:
        return pd.to_datetime(value)
    except Exception:
        return None


def days_until(date_value) -> int | None:
    """Hitung jumlah hari dari hari ini hingga tanggal tertentu."""
    t = parse_date_safe(date_value)
    if not t:
        return None
    today = pd.Timestamp.now(tz="Asia/Jakarta").normalize()
    return (t - today).days


# ============================================================
# DATAFRAME INSPECTION
# ============================================================

def preview(df: pd.DataFrame, n: int = 5):
    """Cetak preview dataframe dengan kolom & ukuran."""
    print(f"DataFrame shape: {df.shape}")
    print(f"Columns: {', '.join(df.columns[:15])}{'...' if len(df.columns) > 15 else ''}")
    print(df.head(n))


# ============================================================
# SIMPLE TIMER
# ============================================================

class Timer:
    """Helper untuk menghitung durasi eksekusi."""
    def __init__(self, label=""):
        self.label = label
        self.start = dt.datetime.now()

    def stop(self, verbose=True):
        end = dt.datetime.now()
        delta = (end - self.start).total_seconds()
        if verbose:
            print(f"[TIMER] {self.label}: {delta:.2f}s")
        return delta


# ============================================================
# USAGE EXAMPLE
# ============================================================

if __name__ == "__main__":
    # Contoh pemakaian cepat
    log_file = init_log("logs", "demo")
    log("Mulai demo utils.py", log_file)
    cfg = {"foo": 123, "bar": "ok"}
    save_json(cfg, "logs/demo_config.json")
    log("Selesai demo utils.py", log_file)
    print(load_json("logs/demo_config.json"))
