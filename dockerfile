# ===== Dockerfile untuk Hugging Face Spaces (Streamlit + Pandas) =====
FROM python:3.11-slim

# Env & basic settings
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps (ringan)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl && \
    rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App files
COPY . .

# Streamlit on HF Spaces harus dengar di $PORT dan 0.0.0.0
ENV PORT=7860
EXPOSE 7860

CMD ["bash", "-lc", "streamlit run app.py --server.port ${PORT} --server.address 0.0.0.0"]
