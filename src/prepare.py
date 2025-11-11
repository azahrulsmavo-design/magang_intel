# src/prepare.py
import os, sys, json, math, datetime as dt
from pathlib import Path
import pandas as pd
import numpy as np
import yaml

from src.enrich_skills import load_skills_config, extract_from_title_and_desc

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "config" / "params.yaml"
SKILLS_PATH = ROOT / "config" / "skills.yaml"
RAW_DIR = ROOT / "data" / "raw"
CLEAN_DIR = ROOT / "data" / "clean"
CLEAN_DIR.mkdir(parents=True, exist_ok=True)

def load_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def flatten_vacancy(x: dict) -> dict:
    """Ambil kolom inti dari 1 baris vacancy"""
    perusahaan = x.get("perusahaan") or {}
    jadwal = x.get("jadwal") or {}
    status = (x.get("ref_status_posisi") or {}).get("nama_status_posisi")

    return {
        "id_posisi": x.get("id_posisi"),
        "posisi": x.get("posisi"),
        "deskripsi_posisi": x.get("deskripsi_posisi"),
        "jumlah_kuota": x.get("jumlah_kuota"),
        "jumlah_terdaftar": x.get("jumlah_terdaftar"),
        "status_posisi": status,
        "nama_perusahaan": perusahaan.get("nama_perusahaan"),
        "nama_provinsi": perusahaan.get("nama_provinsi"),
        "nama_kabupaten": perusahaan.get("nama_kabupaten"),
        "alamat_perusahaan": perusahaan.get("alamat"),
        "logo": perusahaan.get("logo"),
        "government_agency_name": x.get("government_agency_name"),
        "sub_government_agency_name": x.get("sub_government_agency_name"),
        "tanggal_pendaftaran_awal": jadwal.get("tanggal_pendaftaran_awal"),
        "tanggal_pendaftaran_akhir": jadwal.get("tanggal_pendaftaran_akhir"),
        "tanggal_mulai": jadwal.get("tanggal_mulai"),
        "tanggal_selesai": jadwal.get("tanggal_selesai"),
        "jenjang_raw": x.get("jenjang"),
        "program_studi_raw": x.get("program_studi"),
    }

def safe_parse_json_field(value):
    """Beberapa field berformat string JSON (jenjang, program_studi)"""
    if not value:
        return []
    if isinstance(value, (list, dict)):
        return value
    try:
        return json.loads(value)
    except Exception:
        return []

def compute_days_to_deadline(tgl_akhir: str) -> float:
    if not tgl_akhir:
        return np.nan
    try:
        end = pd.to_datetime(tgl_akhir)
        today = pd.Timestamp.now(tz="Asia/Jakarta").normalize()
        delta = (end - today).days
        return delta
    except Exception:
        return np.nan

def compute_competition_ratio(terdaftar, kuota) -> float:
    try:
        if kuota in (0, None):
            return np.nan
        return round(terdaftar / kuota, 4)
    except Exception:
        return np.nan

def load_all_raw_json() -> list[dict]:
    """Gabungkan semua data di data/raw/run_*/page_*.json"""
    all_items = []
    runs = sorted(RAW_DIR.glob("run_*"))
    if not runs:
        print("[WARN] Tidak ada folder run_* di data/raw/")
        return []
    latest_run = runs[-1]
    pages = sorted(latest_run.glob("page_*.json"))
    print(f"[INFO] Membaca {len(pages)} halaman dari {latest_run.name}")

    for p in pages:
        try:
            js = json.loads(p.read_text(encoding="utf-8"))
            items = js.get("data") or []
            all_items.extend(items)
        except Exception as e:
            print(f"[WARN] Gagal baca {p.name}: {e}")
            continue
    print(f"[INFO] Total items: {len(all_items)}")
    return all_items

def main():
    cfg = load_config()
    skills_cfg = load_skills_config(SKILLS_PATH)

    data = load_all_raw_json()
    if not data:
        print("[ERROR] Tidak ada data untuk diproses.")
        return

    # 1️⃣ Flatten
    rows = [flatten_vacancy(x) for x in data]
    df = pd.DataFrame(rows)

    # 2️⃣ Parse field JSON
    df["program_studi"] = df["program_studi_raw"].apply(safe_parse_json_field)
    df["jenjang"] = df["jenjang_raw"].apply(safe_parse_json_field)
    df.drop(columns=["program_studi_raw", "jenjang_raw"], inplace=True)

    # 3️⃣ Compute kolom turunan
    df["competition_ratio"] = df.apply(
        lambda x: compute_competition_ratio(x["jumlah_terdaftar"], x["jumlah_kuota"]), axis=1
    )
    df["days_to_deadline"] = df["tanggal_pendaftaran_akhir"].apply(compute_days_to_deadline)

    # 4️⃣ Ekstraksi skill (gabungkan judul + deskripsi)
    print("[INFO] Ekstraksi skill dari judul + deskripsi...")
    res = df.apply(
        lambda x: extract_from_title_and_desc(
            x.get("posisi"), x.get("deskripsi_posisi"), skills_cfg
        ),
        axis=1,
    )

    df["skills_extracted"] = res.apply(lambda r: r.get("skills_extracted"))
    df["skills_score"] = res.apply(lambda r: r.get("skills_score"))

    # Flag relevansi data
    df["is_data_related"] = df["skills_extracted"].apply(
        lambda lst: any(
            s for s in (lst or [])
            if any(k in s for k in ["data", "analisis", "python", "sql", "excel", "power bi"])
        )
    )

    # 5️⃣ Simpan hasil
    out_path = CLEAN_DIR / "vacancies.parquet"
    df.to_parquet(out_path, index=False)
    print(f"[DONE] Disimpan ke {out_path} | {len(df)} baris")

    # 6️⃣ (opsional) quick summary
    print(df[["id_posisi", "posisi", "nama_perusahaan", "competition_ratio", "days_to_deadline", "skills_score"]].head(5))

if __name__ == "__main__":
    """
    Jalankan:
      python src/prepare.py

    Langkah:
      - Gabungkan semua JSON dari data/raw/run_*/
      - Flatten field penting
      - Hitung kolom turunan: competition_ratio, days_to_deadline
      - Ekstrak skills + score
      - Simpan ke data/clean/vacancies.parquet
    """
    try:
        main()
    except KeyboardInterrupt:
        print("\n[INTERRUPTED]")
        sys.exit(130)
