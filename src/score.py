# src/score.py (versi sederhana — fokus kompetisi)
import pandas as pd
from pathlib import Path
import math

ROOT = Path(__file__).resolve().parents[1]
CLEAN_DIR = ROOT / "data" / "clean"
OUTPUT_DIR = ROOT / "output" / "tables"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def main():
    in_path = CLEAN_DIR / "vacancies.parquet"
    out_csv = OUTPUT_DIR / "vacancies_competition.csv"

    df = pd.read_parquet(in_path)
    print(f"[INFO] Loaded {len(df)} rows")

    # Hitung rasio persaingan
    df["competition_ratio"] = df.apply(
        lambda x: x["jumlah_terdaftar"] / x["jumlah_kuota"]
        if x["jumlah_kuota"] and x["jumlah_kuota"] > 0 else None,
        axis=1
    )

    # Semakin kecil rasio → peluang tinggi
    df["competition_score"] = df["competition_ratio"].apply(
        lambda r: 1 / (1 + r) if pd.notnull(r) else 0
    )

    # Rank berdasarkan peluang
    df["rank"] = df["competition_ratio"].rank(method="dense", ascending=True).astype(int)

    # Urutkan
    df = df.sort_values("competition_ratio", ascending=True)

    # Simpan
    df.to_csv(out_csv, index=False, encoding="utf-8-sig")
    print(f"[DONE] Saved to {out_csv}")

    print(df[["rank","posisi","nama_perusahaan","nama_provinsi","jumlah_kuota","jumlah_terdaftar","competition_ratio"]].head(10))

if __name__ == "__main__":
    main()
