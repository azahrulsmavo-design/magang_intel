# app.py
# -----------------------------------------------
# Streamlit app: Fokus pada "persaingan" (pelamar/kuota)
# -----------------------------------------------
from pathlib import Path
import json
import numpy as np
import pandas as pd
import streamlit as st
import matplotlib.pyplot as plt

# ================ CONFIG ================
st.set_page_config(page_title="Peluang Magang — Fokus Persaingan", layout="wide")

# ================ PATH & DATA LOADER ================
ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data" / "clean"
PARQUET_SCORED = DATA_DIR / "vacancies_scored.parquet"
PARQUET_BASE = DATA_DIR / "vacancies.parquet"

if PARQUET_SCORED.exists():
    df = pd.read_parquet(PARQUET_SCORED)
else:
    if not PARQUET_BASE.exists():
        st.error(
            f"File data tidak ditemukan. Harap jalankan pipeline hingga "
            f"`data/clean/vacancies.parquet` (via 01_build_dataset atau prepare.py)."
        )
        st.stop()
    df = pd.read_parquet(PARQUET_BASE)

# Pastikan kolom competition_ratio ada
if "competition_ratio" not in df.columns:
    df["competition_ratio"] = (df["jumlah_terdaftar"] / df["jumlah_kuota"]).where(df["jumlah_kuota"] > 0)

# ================ HELPERS ================
def to_list_of_str(x):
    """Normalisasi berbagai tipe (None, list, ndarray, json string) → list[str] lowercase."""
    if x is None:
        return []
    if isinstance(x, (list, tuple, set)):
        return [str(i).lower() for i in x]
    if isinstance(x, np.ndarray):
        return [str(i).lower() for i in x.tolist()]
    if isinstance(x, str):
        s = x.strip()
        # coba parse json-like list
        if (s.startswith("[") and s.endswith("]")) or (s.startswith("(") and s.endswith(")")):
            try:
                obj = json.loads(s.replace("(", "[").replace(")", "]"))
                if isinstance(obj, list):
                    return [str(i).lower() for i in obj]
            except Exception:
                pass
        return [s.lower()]
    return []

def simplify_role(title: str) -> str:
    """Kategori profesi sederhana agar mudah dibaca."""
    if not isinstance(title, str):
        return "Other"
    t = title.lower()
    if ("data" in t) or ("analyst" in t) or ("analytics" in t):
        return "Data & Analytics"
    if ("admin" in t) or ("operator" in t) or ("pengadministrasi" in t):
        return "Administration"
    if ("marketing" in t) or ("brand" in t) or ("customer" in t):
        return "Marketing & Sales"
    if ("design" in t) or ("video" in t) or ("creative" in t):
        return "Creative"
    if ("perawat" in t) or ("ners" in t) or ("kesehatan" in t):
        return "Health"
    if ("bkkbn" in t) or ("kementerian" in t) or ("direktorat" in t):
        return "Public Sector"
    return "Other"

# Siapkan kolom bantu
if "kategori_posisi" not in df.columns:
    df["kategori_posisi"] = df["posisi"].apply(simplify_role)

# Siapkan kolom skills_norm dan match_count (aman jika skills_extracted tidak ada)
if "skills_extracted" in df.columns:
    df["skills_norm"] = df["skills_extracted"].apply(to_list_of_str)
else:
    df["skills_norm"] = [[] for _ in range(len(df))]

# ================ SIDEBAR FILTERS ================
with st.sidebar:
    st.header("⚙️ Filter")
    provinsi_opts = ["(Semua)"] + sorted([p for p in df["nama_provinsi"].dropna().unique().tolist() if p])
    prov_choice = st.selectbox("Provinsi", provinsi_opts, index=0)

    kategori_opts = ["(Semua)"] + sorted(df["kategori_posisi"].dropna().unique().tolist())
    kat_choice = st.selectbox("Kategori posisi", kategori_opts, index=0)

    keyword = st.text_input("Keyword judul posisi (opsional)", value="")

    skills_csv = st.text_input("Skill saya (pisahkan koma, opsional)",
                               value="excel, sql, python")

    max_ratio = st.slider("Batas rasio maksimum (pelamar/kuota) → peluang makin baik jika makin kecil",
                          min_value=0.0, max_value=50.0, value=10.0, step=0.5)

    top_n = st.slider("Top N hasil", 10, 300, 50, 10)

    st.caption("Tip: Set rasio ≤ 2.0 untuk fokus pada peluang sangat tinggi.")

# Normalisasi preferensi skill user
want_skills = [s.strip().lower() for s in skills_csv.split(",") if s.strip()]

# ================ FILTERING ================
q = df.copy()

if prov_choice != "(Semua)":
    q = q[q["nama_provinsi"] == prov_choice]

if kat_choice != "(Semua)":
    q = q[q["kategori_posisi"] == kat_choice]

if keyword.strip():
    q = q[q["posisi"].str.contains(keyword.strip(), case=False, na=False)]

# Hanya baris dengan rasio valid
q = q[q["competition_ratio"].notna()]

# Terapkan filter rasio maksimum
q = q[q["competition_ratio"] <= max_ratio]

# Hitung match_count (jika user mengisi skill)
if want_skills:
    q["match_count"] = q["skills_norm"].apply(lambda lst: sum(1 for s in lst if s in want_skills))
else:
    q["match_count"] = 0

# Urutkan: kecocokan skill (desc) → rasio (asc) → kuota (desc)
q = q.sort_values(by=["match_count", "competition_ratio", "jumlah_kuota"],
                  ascending=[False, True, False])

# ================ HEADER & KPI ================
st.title("📊 Peluang Magang — Fokus Persaingan")
st.caption("Semakin kecil rasio **(Pendaftar/Kuota)**, semakin besar peluang.")

colA, colB, colC, colD = st.columns(4)
with colA:
    st.metric("Total lowongan (setelah filter)", f"{len(q):,}")
with colB:
    st.metric("Median rasio", f"{q['competition_ratio'].median(skipna=True):.2f}" if len(q) else "—")
with colC:
    st.metric("Rata-rata rasio", f"{q['competition_ratio'].mean(skipna=True):.2f}" if len(q) else "—")
with colD:
    st.metric("Perusahaan unik", f"{q['nama_perusahaan'].nunique():,}" if len(q) else "—")

st.divider()

# ================ TABEL HASIL ================
st.subheader("Hasil (diurutkan: kecocokan skill → rasio kecil → kuota besar)")
cols_show = [
    "posisi", "kategori_posisi", "nama_perusahaan", "nama_provinsi",
    "jumlah_kuota", "jumlah_terdaftar", "competition_ratio", "match_count"
]
present = [c for c in cols_show if c in q.columns]
st.dataframe(q.head(top_n)[present], use_container_width=True)

# Download CSV
csv_bytes = q.head(top_n)[present].to_csv(index=False, encoding="utf-8-sig").encode("utf-8-sig")
st.download_button("⬇️ Download CSV (Top N)", data=csv_bytes, file_name="peluang_magang_topN.csv", mime="text/csv")

st.divider()

# ================ CHARTS (opsional, simple) ================
left, right = st.columns(2)

with left:
    st.markdown("### Provinsi dengan perusahaan terbanyak (Top 10, setelah filter)")
    if len(q):
        series = q.groupby("nama_provinsi")["nama_perusahaan"].nunique().sort_values(ascending=False).head(10)
        fig, ax = plt.subplots(figsize=(6, 4))
        series.sort_values(ascending=True).plot(kind="barh", ax=ax)
        ax.set_title("Perusahaan unik per provinsi")
        ax.set_xlabel("Jumlah perusahaan")
        ax.set_ylabel("Provinsi")
        plt.tight_layout()
        st.pyplot(fig)
    else:
        st.info("Tidak ada data untuk ditampilkan.")

with right:
    st.markdown("### Posisi dengan pendaftar terbanyak (Top 10, setelah filter)")
    if len(q):
        series = q.groupby("posisi")["jumlah_terdaftar"].sum().sort_values(ascending=False).head(10)
        fig, ax = plt.subplots(figsize=(6, 4))
        series.sort_values(ascending=True).plot(kind="barh", ax=ax)
        ax.set_title("Total pendaftar per posisi")
        ax.set_xlabel("Jumlah pendaftar")
        ax.set_ylabel("Posisi")
        plt.tight_layout()
        st.pyplot(fig)
    else:
        st.info("Tidak ada data untuk ditampilkan.")

st.divider()

# ================ CATATAN BAWAH ================
with st.expander("ℹ️ Catatan metode"):
    st.markdown(
        """
        **Definisi rasio persaingan**: `competition_ratio = jumlah_terdaftar / jumlah_kuota`.  
        - Rasio lebih kecil → peluang lebih tinggi  
        - Contoh: rasio **0.5** = 1 pelamar untuk 2 kuota (sangat baik), **1.0** = 1:1 (baik),
          **10.0** = 10 pelamar per 1 kuota (sulit).

        **Urutan hasil**:  
        1) `match_count` (jumlah skill kamu yang cocok dengan `skills_extracted`) — jika kamu mengisi skill  
        2) `competition_ratio` (naik → turun; makin kecil makin atas)  
        3) `jumlah_kuota` (besar lebih baik)

        **Tips pakai filter**:
        - Atur *Batas rasio maksimum* ke **≤ 2.0** untuk fokus peluang tinggi.  
        - Gunakan *keyword judul posisi* untuk spesifik (mis. `data`, `marketing`, `perawat`).  
        - Masukkan skill kamu (mis. `excel, sql, python`) agar prioritas naik untuk lowongan yang relevan.
        """
    )
