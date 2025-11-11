# src/score.py
from __future__ import annotations

import os
from pathlib import Path
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data" / "clean"
IN_PARQUET = DATA_DIR / "vacancies.parquet"            # input dasar
OUT_PARQUET = DATA_DIR / "vacancies_scored.parquet"    # output enriched

def safe_competition_ratio(df: pd.DataFrame) -> pd.Series:
    """Hitung rasio persaingan = pendaftar/kuota secara aman:
       - pendaftar NaN -> 0
       - kuota <=0 atau NaN -> ∞ (sangat kompetitif / tidak layak)
       - hasil bisa mengandung ∞ dan NaN
    """
    applicants = pd.to_numeric(df.get("jumlah_terdaftar"), errors="coerce").fillna(0)
    quota = pd.to_numeric(df.get("jumlah_kuota"), errors="coerce")

    # kuota <= 0 atau NaN dianggap tak tersedia -> rasio = ∞
    quota_clean = quota.where(quota > 0, np.nan)
    ratio = applicants / quota_clean
    ratio = ratio.replace([np.inf, -np.inf], np.inf)  # amankan infinities
    return ratio

def build_category(title: str) -> str:
    if not isinstance(title, str):
        return "Other"
    t = title.lower()
    if ("data" in t) or ("analyst" in t) or ("analytics" in t):
        return "Data & Analytics"
    if ("admin" in t) or ("operator" in t) or ("pengadministrasi" in t):
        return "Administration"
    if ("marketing" in t) or ("brand" in t) or ("customer" in t) or ("sales" in t):
        return "Marketing & Sales"
    if ("design" in t) or ("video" in t) or ("creative" in t):
        return "Creative"
    if ("perawat" in t) or ("ners" in t) or ("kesehatan" in t):
        return "Health"
    if ("bkkbn" in t) or ("kementerian" in t) or ("direktorat" in t):
        return "Public Sector"
    return "Other"

def main():
    if not IN_PARQUET.exists():
        raise FileNotFoundError(f"File input tidak ditemukan: {IN_PARQUET}")

    df = pd.read_parquet(IN_PARQUET)
    print(f"[INFO] Loaded {len(df)} rows")

    # Rasio persaingan aman
    df["competition_ratio"] = safe_competition_ratio(df)

    # Kategori profesi sederhana (kalau belum ada)
    if "kategori_posisi" not in df.columns:
        df["kategori_posisi"] = df["posisi"].apply(build_category)

    # Ranking: lebih kecil rasio -> peringkat lebih baik
    # Gunakan na_option="bottom" supaya NaN ditempatkan di bawah (rank terbesar)
    # Hasil rank float -> konversi ke nullable Int64 agar aman dengan NA.
    rank_series = df["competition_ratio"].rank(
        method="dense", ascending=True, na_option="bottom"
    )
    df["rank"] = rank_series.astype("Int64")

    # Tambahan ringkas: bucket rasio (opsional, memudahkan filter di app)
    cuts = [-np.inf, 0.5, 1.0, 2.0, 5.0, 10.0, np.inf]
    labels = ["≤0.5", "0.5–1", "1–2", "2–5", "5–10", ">10/∞"]
    df["competition_bucket"] = pd.cut(df["competition_ratio"], bins=cuts, labels=labels)

    # Simpan
    df.to_parquet(OUT_PARQUET, index=False)
    print(f"[DONE] Wrote: {OUT_PARQUET} | rows={len(df)}")

if __name__ == "__main__":
    main()
