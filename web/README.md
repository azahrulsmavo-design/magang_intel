# Magang Intel — Lowongan Pemagangan Analisis & Insight  
Dashboard interaktif untuk menganalisis rasio persaingan lowongan magang di Indonesia (MagangHub & sumber terkait).  
Dibangun sebagai proyek portofolio Data Analyst menggunakan Next.js + TypeScript + Tailwind + Python pipeline.

---

## 🚀 Overview

**Magang Intel** adalah aplikasi web yang membantu peserta magang melihat:  
- Rasio persaingan lowongan (applicant-to-quota ratio)  
- Tingkat peluang keterimaan  
- Statistik perusahaan  
- Ringkasan data berdasarkan kategori, lokasi, dan batch pendaftaran  

Tujuan utama proyek ini adalah memberikan **transparansi**, **prediksi peluang**, dan **visualisasi data** bagi peserta pemagangan.

---

## 🎯 Features

### 📊 **Data Insight**
- Competition Ratio (peluang keterimaan)
- Applicants vs Quota
- Sorting & filtering cerdas (ascending/descending)
- Keterangan per kategori pekerjaan
- **Favorites** - Simpan lowongan favorit dengan localStorage

### 🔍 **Interactive Table**
- **Sortable columns** - Klik header untuk sort data
- **Full-width layout** - Tabel menggunakan lebar penuh layar
- Pop-up modal untuk melihat semua data
- Download table (CSV)  
- Responsive & mobile-friendly

### 📑 **Timeline Program Resmi**
Menampilkan jadwal pelaksanaan pemagangan:
- Perpanjangan pendaftaran perusahaan
- Pendaftaran peserta
- Seleksi & pengumuman
- Pelaksanaan magang (16 Des 2025 – 15 Jun 2026)

### 🧮 **Countdown Otomatis**
- Menampilkan hitung mundur menuju batch deadline
- Informasi kontak resmi MagangHub

### 📧 **Cek Status Lamaran**
- Halaman khusus untuk cek status lamaran via email
- Integrasi dengan API MagangHub/Pantauloker
- Tampilan status: diterima, ditolak, atau diterima di perusahaan lain

### 🌐 **External Links**
- Akses langsung ke website MagangHub  
- Call center & kontak resmi Kemnaker  
- Link ke lowongan/perusahaan terkait

---

## 🧱 Tech Stack

### **Frontend**
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Framer Motion
- Recharts (visualisasi data)
- Lucide Icons

### **Backend / Data Pipeline**
- Python (fetch, clean, score)
- Pandas
- PyArrow
- GitHub Actions automation
- JSON dataset

### **Deployment**
- Vercel

---

## 📁 Project Structure

```
/web
├── src/
│   ├── app/
│   │   ├── page.tsx                → Dashboard utama
│   │   ├── layout.tsx              → Root layout
│   │   ├── cek-lamaran/
│   │   │   └── page.tsx            → Cek status lamaran
│   │   └── globals.css             → Styling global
│   │
│   └── components/
│       ├── ResultsSection.tsx      → Tabel kompetisi (sortable, favorites)
│       ├── TimelinePemagangan.tsx  → Komponen timeline
│       ├── MagangHubInfo.tsx       → Countdown & info
│       ├── Filters.tsx             → Filter panel
│       ├── Stats.tsx               → KPI cards
│       └── Charts.tsx              → Visualisasi data
│
├── public/
│   └── data.json                   → Dataset lowongan
│
└── scripts/
    └── convert_data.py             → Python data pipeline
```

---

## ⚙️ Setup & Development

### 1️⃣ Clone Repo
```bash
git clone https://github.com/Azahrulsmavo-design/magang_intel.git
cd magang_intel/web
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Run Development Server
```bash
npm run dev
```

Akses via: [http://localhost:3000](http://localhost:3000)

### 4️⃣ Build for Production
```bash
npm run build
npm start
```

---

## 🧪 Data Pipeline (Python)

Repository ini menggunakan workflow otomatis:

1. Fetch data dari sumber
2. Clean & transform
3. Hitung scoring (competition ratio)
4. Simpan ke JSON dataset
5. Update otomatis via GitHub Actions setiap 6 jam

**Run manual:**
```bash
cd scripts
python convert_data.py
```

---

## 📦 Features Implemented

- ✅ Filtering by category, province, & skills
- ✅ Sortable table columns (ascending/descending)
- ✅ Favorites system with localStorage
- ✅ Full-width responsive table layout
- ✅ CSV export functionality
- ✅ Cek status lamaran page
- ✅ Timeline jadwal pemagangan
- ✅ Auto-update data (client & server)
- ✅ KPI cards & charts visualization

---

## 🚀 Roadmap

- [ ] Laporan (Reports) page - Statistics dashboard
- [ ] Predictive difficulty scoring (ML)
- [ ] Notifikasi lowongan baru
- [ ] Export to Excel/Google Sheets
- [ ] Versi mobile PWA
- [ ] Advanced filtering & search

---

## 👤 Author

**Muhammad Azahrul Ramadhan**  
Aspiring Data Analyst · Education & E-commerce  
📍 Jakarta, Indonesia

- 🌐 Portfolio: [https://azahrul-portofolio.vercel.app](https://azahrul-portofolio.vercel.app)
- 💼 LinkedIn: [https://linkedin.com/in/muhammad-azahrul-ramadhan-9728bb252](https://linkedin.com/in/muhammad-azahrul-ramadhan-9728bb252)
- 🐙 GitHub: [https://github.com/Azahrulsmavo-design](https://github.com/Azahrulsmavo-design)
- ✉️ Email: [azahrulsmavo@gmail.com](mailto:azahrulsmavo@gmail.com)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## ⭐ Support

Jika proyek ini bermanfaat, jangan lupa beri **⭐ Star** untuk repo ini!

---

## 🙏 Acknowledgments

- Data source: MagangHub (Kementerian Ketenagakerjaan RI)
- API integration: Pantauloker.co
- Design inspiration: PrimalTraining editorial style
