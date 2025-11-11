import re, json
from pathlib import Path
from collections import defaultdict, Counter
import yaml

# ---------- Loader ----------
def load_skills_config(path: str | Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)
    # Pre-compile regex dari skill.regex per kategori
    compiled = {}
    for cat, spec in cfg.get("skills", {}).items():
        compiled[cat] = [re.compile(rx, re.I) for rx in spec.get("regex", [])]
    cfg["_compiled_regex"] = compiled
    # Siapkan frasa terms yang sudah di-lower untuk pencocokan frasa
    for cat, spec in cfg.get("skills", {}).items():
        spec["terms"] = [t.lower() for t in spec.get("terms", [])]
    return cfg

# ---------- Normalisasi dasar ----------
def _normalize_text(text: str, cfg: dict) -> str:
    if not text:
        return ""
    text = text.strip()
    if cfg.get("normalize", {}).get("lowercase", True):
        text = text.lower()
    # mapping alias (frasa → canonical)
    for src, dst in (cfg.get("aliases") or {}).items():
        # ganti sebagai frasa utuh dengan batas kata
        text = re.sub(rf"\b{re.escape(src.lower())}\b", dst.lower(), text)
    if cfg.get("normalize", {}).get("strip_punctuation", True):
        # sisakan huruf/angka/spasi + beberapa simbol umum BI tools
        text = re.sub(r"[^\w\s\./\-+#]", " ", text)
    # rapikan spasi
    text = re.sub(r"\s+", " ", text).strip()
    return text

# ---------- Ekstraksi ----------
def extract_skills(text: str, cfg: dict) -> dict:
    """
    Return:
      {
        "skills_extracted": [list canonical],
        "by_category": {"data_core": ["excel",...], ...},
        "counts": {"excel": 3, ...}  # jika muncul berulang
      }
    """
    text_norm = _normalize_text(text or "", cfg)
    token_boundary = cfg.get("normalize", {}).get("token_boundary_regex", r"\b")

    found_by_cat = defaultdict(list)
    counts = Counter()

    # 1) Frasa 'terms' (prioritas frasa utuh)
    if cfg.get("extraction", {}).get("prefer_phrase_match", True):
        for cat, spec in (cfg.get("skills") or {}).items():
            for phrase in spec.get("terms", []):
                # cari frasa utuh
                pat = re.compile(rf"{token_boundary}{re.escape(phrase)}{token_boundary}", re.I)
                if pat.search(text_norm):
                    found_by_cat[cat].append(phrase)
                    counts[phrase] += 1

    # 2) Regex khusus per kategori
    for cat, compiled_list in cfg.get("_compiled_regex", {}).items():
        for rx in compiled_list:
            for m in rx.finditer(text_norm):
                val = m.group(0).lower().strip()
                if val:
                    found_by_cat[cat].append(val)
                    counts[val] += 1

    # 3) (Opsional) Token-based simple match untuk single-word terms
    #    Hanya untuk terms 1 kata agar tidak kebanyakan false positive.
    tokens = set(re.findall(r"\b[\w\+#/.:-]{2,}\b", text_norm))
    stop = set(cfg.get("stopwords") or [])
    for cat, spec in (cfg.get("skills") or {}).items():
        for term in spec.get("terms", []):
            if " " in term:  # sudah ditangani frasa
                continue
            if term in tokens and term not in stop:
                found_by_cat[cat].append(term)
                counts[term] += 1

    # Dedup & sort per kategori
    for cat in list(found_by_cat.keys()):
        uniq = sorted(set(found_by_cat[cat]), key=lambda x: (len(x), x))
        found_by_cat[cat] = uniq

    # Gabungan semua skill unik
    all_skills = sorted(set([s for v in found_by_cat.values() for s in v]))

    return {
        "skills_extracted": all_skills[: cfg.get("extraction", {}).get("max_skills_per_post", 30)],
        "by_category": dict(found_by_cat),
        "counts": dict(counts),
    }

# ---------- Skor sederhana (opsional) ----------
def compute_skills_score(extracted_by_cat: dict, cfg: dict, target_cats: list[str] | None = None) -> float:
    """
    Hitung skor berdasarkan bobot kategori yang muncul.
    Jika target_cats None → semua kategori berbobot >0 dihitung.
    """
    weights = cfg.get("weights") or {}
    if target_cats is None:
        target_cats = [c for c, w in weights.items() if (w or 0) > 0]
    if not target_cats:
        return 0.0
    numer = 0.0
    denom = 0.0
    for cat in target_cats:
        w = float(weights.get(cat, 0))
        denom += max(w, 0)
        if extracted_by_cat.get(cat):
            numer += max(w, 0)
    return round(numer / denom, 4) if denom > 0 else 0.0

# ---------- Helper untuk gabung judul + deskripsi ----------
def extract_from_title_and_desc(title: str, desc: str, cfg: dict) -> dict:
    text = " ".join([title or "", desc or ""])
    res = extract_skills(text, cfg)
    res["skills_score"] = compute_skills_score(res["by_category"], cfg)
    return res

# ---------- Contoh pakai ----------
if __name__ == "__main__":
    cfg = load_skills_config("config/skills.yaml")
    title = "Internship Assistant - Data Analytic"
    desc = """
    - Melakukan pengolahan dan Analisis Data (Excel, SQL, Python)
    - Menyusun dashboard Power BI dan reporting KPI
    - Kurasi & validasi data, memastikan kualitas data (SNI/TKDN)
    """
    out = extract_from_title_and_desc(title, desc, cfg)
    print(json.dumps(out, ensure_ascii=False, indent=2))
