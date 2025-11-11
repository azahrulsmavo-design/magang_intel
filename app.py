import time
from pathlib import Path
import json
import numpy as np
import pandas as pd
import streamlit as st

# ================== CONFIG ==================
st.set_page_config(page_title="Peluang Magang — Fokus Persaingan", layout="wide")

# Jika data disimpan di HF Datasets, isi repo & nama berkasnya:
REPO_ID  = "Azahrul/magang-intel-data"       # ganti jika perlu
PREF_FILE = "vacancies_scored.parquet"       # prioritas
FALLBACK_FILE = "vacancies.parquet"          # fallback

LOCAL_CANDIDATES = [
    Path("data/clean/vacancies_scored.parquet"),
    Path("data/clean/vacancies.parquet"),
]

# ================== HELPERS ==================
def _read_parquet_safely(path: str | Path) -> pd.DataFrame:
    """Coba baca dengan pyarrow, fallback ke fastparquet jika perlu."""
    try:
        return pd.read_parquet(path)  # pyarrow default
    except Exception:
        return pd.read_parquet(path, engine="fastparquet")

def _ensure_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Pastikan kolom-kolom penting ada dan bertipe benar."""
    # Kolom minimal yang sering dipakai
    for col in ["posisi", "nama_perusahaan", "nama_provinsi"]:
        if col not in df.columns:
            df[col] = None

    # Pastikan numeric untuk hitung rasio
    for col in ["jumlah_kuota", "jumlah_terdaftar"]:
        if col not in df.columns:
            df[col] = np.nan
        # coerce to numeric
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # competition_ratio
    if "competition_ratio" not in df.columns:
        # hindari bagi nol
        df["competition_ratio"] = np.where(
            df["jumlah_kuota"] > 0,
            df["jumlah_terdaftar"] / df["jumlah_kuota"],
            np.nan
        )

    # kategori_posisi
    if "kategori_posisi" not in df.columns:
        df["kategori_posisi"] = df["posisi"].apply(simplify_role)

    # skills_norm
    if "skills_norm" not in df.columns:
        if "skills_extracted" in df.columns:
            df["skills_norm"] = df["skills_extracted"].apply(to_list_of_str)
        else:
            df["skills_norm"] = [[] for _ in range(len(df))]

    return df

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
    if ("marketing" in t) or ("brand" in t) or ("customer" in t) or ("sales" in t):
        return "Marketing & Sales"
    if ("design" in t) or ("video" in t) or ("creative" in t) or ("grafis" in t):
        return "Creative"
    if ("perawat" in t) or ("ners" in t) or ("kesehatan" in t):
        return "Health"
    if ("bkkbn" in t) or ("kementerian" in t) or ("direktorat" in t):
        return "Public Sector"
    return "Other"

# ================== DATA LOADER ==================
@st.cache_data(ttl=15*60, max_entries=4, show_spinner="Updating data...")
def load_live() -> pd.DataFrame:
    """
    Urutan:
    1) Coba parquet lokal (cepat saat dev / jika kamu upload file kecil).
    2) Jika tidak ada → unduh dari HF Datasets (LFS).
    3) (Opsional) merge incremental dari API (tambahkan sendiri).
    """
    # 1) Lokal
    for p in LOCAL_CANDIDATES:
        if p.exists():
            base_df = _read_parquet_safely(p)
            break
    else:
        # 2) HF Datasets
        try:
            from huggingface_hub import hf_hub_download
            try:
                local_path = hf_hub_download(repo_id=REPO_ID, filename=PREF_FILE)
            except Exception:
                local_path = hf_hub_download(repo_id=REPO_ID, filename=FALLBACK_FILE)
            base_df = _read_parquet_safely(local_path)
        except Exception as e:
            st.error(f"Gagal memuat data dari HF Datasets: {e}")
            return pd.DataFrame()

    # 3) (Opsional) incremental fetch — tambahkan fungsi kamu di sini.
    # recent_df = fetch_recent_pages(limit_pages=3)
    # if not recent_df.empty:
    #     key = "id" if "id" in recent_df.columns else None
    #     if key and key in base_df.columns:
    #         base_df = (pd.concat([recent_df, base_df], ignore_index=True)
    #                      .drop_duplicates(subset=[key], keep="first"))
    #     else:
    #         base_df = pd.concat([recent_df, base_df], ignore_index=True).drop_duplicates()

    base_df = _ensure_columns(base_df)
    base_df.attrs["last_updated_ts"] = time.time()
    return base_df

# ================== UI ==================
df = load_live()

# Tombol refresh manual
if st.button("🔄 Refresh now"):
    load_live.clear()
    st.rerun()

# Indikator kesegaran data
ts = df.attrs.get("last_updated_ts")
if ts:
    st.caption(f"Last updated: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(ts))} (auto refresh setiap 15 menit)")

st.title("📊 Peluang Magang — Fokus Persaingan")
st.caption("Semakin kecil rasio **(Pendaftar/Kuota)**, semakin besar peluang.")

# -------- Sidebar Filters --------
with st.sidebar:
    st.header("⚙️ Filter")
    provinsi_opts = ["(Semua)"] + sorted([p for p in df["nama_provinsi"].dropna().unique().tolist() if p])
    prov_choice = st.selectbox("Provinsi", provinsi_opts, index=0)

    kategori_opts = ["(Semua)"] + sorted(df["kategori_posisi"].dropna().unique().tolist())
    kat_choice = st.selectbox("Kategori posisi", kategori_opts, index=0)

    keyword = st.text_input("Keyword judul posisi (opsional)", value="")

    skills_csv = st.text_input("Skill saya (pisahkan koma, opsional)",
                               value="excel, sql, python")

    max_ratio = st.slider(
        "Batas rasio maksimum (pelamar/kuota) → peluang makin baik jika makin kecil",
        min_value=0.0, max_value=50.0, value=10.0, step=0.5
    )

    top_n = st.slider("Top N hasil", 10, 300, 50, 10)

    st.caption("Tip: Set rasio ≤ 2.0 untuk fokus pada peluang sangat tinggi.")

# -------- Filtering --------
want_skills = [s.strip().lower() for s in skills_csv.split(",") if s.strip()]
q = df.copy()

if prov_choice != "(Semua)":
    q = q[q["nama_provinsi"] == prov_choice]

if kat_choice != "(Semua)":
    q = q[q["kategori_posisi"] == kat_choice]

if keyword.strip():
    q = q[q["posisi"].astype(str).str.contains(keyword.strip(), case=False, na=False)]

# valid ratio & batas
q = q[q["competition_ratio"].notna()]
q = q[q["competition_ratio"] <= max_ratio]

# match_count
if want_skills:
    q = q.assign(match_count=q["skills_norm"].apply(lambda lst: sum(1 for s in lst if s in want_skills)))
else:
    q = q.assign(match_count=0)

# Urutkan: match desc → ratio asc → kuota desc
q = q.sort_values(by=["match_count", "competition_ratio", "jumlah_kuota"],
                  ascending=[False, True, False])

# -------- KPI --------
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

# -------- Tabel hasil --------
st.subheader("Hasil (urut: kecocokan skill → rasio kecil → kuota besar)")
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

# -------- Charts --------
import matplotlib.pyplot as plt  # impor disini supaya lazy-load

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

with st.expander("ℹ️ Catatan metode"):
    st.markdown("""
**Definisi rasio persaingan**: `competition_ratio = jumlah_terdaftar / jumlah_kuota`.

- Rasio lebih kecil → peluang lebih tinggi  
- Contoh: **0.5** = 1 pelamar untuk 2 kuota (sangat baik), **1.0** = 1:1 (baik),
  **10.0** = 10 pelamar per 1 kuota (sulit).

**Urutan hasil**:
1) `match_count` (jumlah skill kamu cocok dengan `skills_extracted`)
2) `competition_ratio` (kecil lebih baik)
3) `jumlah_kuota` (besar lebih baik)

**Tips**:
- Set *Batas rasio maksimum* ke **≤ 2.0** untuk fokus peluang tinggi.
- Pakai keyword judul posisi (mis. `data`, `marketing`, `perawat`).
- Isi skill (mis. `excel, sql, python`) agar prioritas naik untuk lowongan relevan.
""")
