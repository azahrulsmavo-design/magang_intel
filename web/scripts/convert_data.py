import pandas as pd
import json
import os
from pathlib import Path

def convert_data():
    # Paths
    base_dir = Path(__file__).parent.parent.parent
    parquet_path = base_dir / "data" / "clean" / "vacancies.parquet"
    output_path = base_dir / "web" / "public" / "data.json"

    print(f"Reading from: {parquet_path}")
    
    if not parquet_path.exists():
        print(f"Error: File not found at {parquet_path}")
        return

    try:
        df = pd.read_parquet(parquet_path)
        
        # Ensure columns exist (logic borrowed from app.py)
        for col in ["posisi", "nama_perusahaan", "nama_provinsi"]:
            if col not in df.columns:
                df[col] = None

        for col in ["jumlah_kuota", "jumlah_terdaftar"]:
            if col not in df.columns:
                df[col] = 0
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

        # Calculate ratio if missing
        if "competition_ratio" not in df.columns:
            df["competition_ratio"] = df.apply(
                lambda x: x["jumlah_terdaftar"] / x["jumlah_kuota"] if x["jumlah_kuota"] > 0 else 0, 
                axis=1
            )
        
        # Simplify role (logic borrowed from app.py)
        def simplify_role(title):
            if not isinstance(title, str): return "Other"
            t = title.lower()
            if any(x in t for x in ["data", "analyst", "analytics"]): return "Data & Analytics"
            if any(x in t for x in ["admin", "operator", "pengadministrasi"]): return "Administration"
            if any(x in t for x in ["marketing", "brand", "customer", "sales"]): return "Marketing & Sales"
            if any(x in t for x in ["design", "video", "creative", "grafis"]): return "Creative"
            if any(x in t for x in ["perawat", "ners", "kesehatan"]): return "Health"
            if any(x in t for x in ["bkkbn", "kementerian", "direktorat"]): return "Public Sector"
            return "Other"

        if "kategori_posisi" not in df.columns:
            df["kategori_posisi"] = df["posisi"].apply(simplify_role)

        # Clean up for JSON
        # Fill NaNs with empty string or 0
        df = df.fillna("")
        
        # Explicitly convert numeric columns to float/int to avoid numpy types
        for col in df.select_dtypes(include=['float', 'float32', 'float64']).columns:
            df[col] = df[col].astype(float)
        for col in df.select_dtypes(include=['int', 'int32', 'int64']).columns:
            df[col] = df[col].astype(int)
            
        # Convert to records
        data = df.to_dict(orient="records")
        
        import numpy as np
        def convert_numpy(obj):
            if isinstance(obj, dict):
                return {k: convert_numpy(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_numpy(i) for i in obj]
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            elif hasattr(obj, 'item'):
                return obj.item()
            return obj

        data = convert_numpy(data)

        # Save to JSON
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        print(f"Successfully converted {len(data)} records to {output_path}")

    except Exception:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    convert_data()
