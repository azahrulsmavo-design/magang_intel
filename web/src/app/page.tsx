"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Filters } from '@/components/Filters';
import { Stats } from '@/components/Stats';
import { Charts } from '@/components/Charts';
import { Github, X, Filter as FilterIcon, Search, BarChart3 } from "lucide-react";
import MagangHubInfo from '@/components/MagangHubInfo';
import TimelinePemagangan from '@/components/TimelinePemagangan';
import { ResultsSection } from '@/components/ResultsSection';

interface Vacancy {
  id_posisi: string;
  posisi: string;
  nama_perusahaan: string;
  nama_provinsi: string;
  jumlah_kuota: number;
  jumlah_terdaftar: number;
  competition_ratio: number;
  kategori_posisi: string;
  skills_norm: string[];
  match_count: number;
}

export default function Home() {
  const [data, setData] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [filters, setFilters] = useState({
    province: "(Semua)",
    category: "(Semua)",
    company: "(Semua)",
    search: "",
    skills: "excel, sql, python",
    maxRatio: 10.0
  });

  useEffect(() => {
    const fetchData = () => {
      fetch('/data.json')
        .then(res => res.json())
        .then(data => {
          // --- ENRICH CATEGORIES START ---
          const enrichCategory = (pos: string, currentCat: string) => {
            const p = pos.toLowerCase();
            // Prioritize keywords to create richer categories
            if (p.includes('android') || p.includes('ios') || p.includes('mobile') || p.includes('flutter') || p.includes('react native')) return 'Mobile Development';
            if (p.includes('frontend') || p.includes('backend') || p.includes('full stack') || p.includes('web') || p.includes('software') || p.includes('website')) return 'Web & Software Dev';
            if (p.includes('ui/ux') || p.includes('product design') || p.includes('user interface')) return 'UI/UX Design';
            if (p.includes('data') || p.includes('analyst') || p.includes('science') || p.includes('ai') || p.includes('machine learning')) return 'Data & AI';
            if (p.includes('network') || p.includes('security') || p.includes('cyber') || p.includes('infra') || p.includes('sysadmin')) return 'Network & Security';

            if (p.includes('social media') || p.includes('content') || p.includes('copywrit') || p.includes('creative')) return 'Content & Social Media';
            if (p.includes('marketing') || p.includes('market') || p.includes('seo') || p.includes('brand') || p.includes('digital')) return 'Marketing & Branding';
            if (p.includes('sales') || p.includes('business dev') || p.includes('account')) return 'Sales & BizDev';

            if (p.includes('finance') || p.includes('account') || p.includes('tax') || p.includes('pajak') || p.includes('audit')) return 'Finance & Accounting';
            if (p.includes('admin') || p.includes('sekretaris') || p.includes('arsip')) return 'Administration';
            if (p.includes('hr') || p.includes('human') || p.includes('recruit') || p.includes('talent')) return 'Human Resources';

            if (p.includes('graphic') || p.includes('desain grafis') || p.includes('illustrator') || p.includes('video') || p.includes('motion') || p.includes('editor')) return 'Creative Design & Multimedia';

            if (p.includes('operas') || p.includes('logistik') || p.includes('warehouse') || p.includes('supply')) return 'Operations & Logistics';
            if (p.includes('hukum') || p.includes('legal')) return 'Legal';

            // If no keyword match, keep existing or fallback to Lainnya
            if (currentCat && currentCat !== 'Lainnya' && currentCat !== '') return currentCat;

            return 'Lainnya';
          };

          const enrichedData = data.map((item: any) => ({
            ...item,
            kategori_posisi: enrichCategory(item.posisi, item.kategori_posisi)
          }));

          setData(enrichedData);
          setLoading(false);
          // --- ENRICH CATEGORIES END ---
        })
        .catch(err => {
          console.error("Failed to load data", err);
          setLoading(false);
        });
    };

    fetchData(); // Initial fetch

    // Auto-update every 6 hours (in milliseconds)
    const interval = setInterval(fetchData, 6 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Filter & Sort Logic
  const filteredData = useMemo(() => {
    if (!data.length) return [];

    const wantSkills = filters.skills.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const searchLower = filters.search.toLowerCase();

    let result = data.filter(item => {
      // Province
      if (filters.province !== "(Semua)" && item.nama_provinsi !== filters.province) return false;

      // Category
      if (filters.category !== "(Semua)" && item.kategori_posisi !== filters.category) return false;

      // Company
      if (filters.company !== "(Semua)" && item.nama_perusahaan !== filters.company) return false;

      // Search
      if (searchLower && !item.posisi.toLowerCase().includes(searchLower)) return false;

      // Ratio
      if (item.competition_ratio > filters.maxRatio) return false;

      return true;
    });

    // Calculate Match Count
    result = result.map(item => {
      let count = 0;
      if (wantSkills.length > 0 && Array.isArray(item.skills_norm)) {
        const itemSkills = item.skills_norm.map(s => String(s).toLowerCase());
        count = itemSkills.filter(s => wantSkills.includes(s)).length;
      }
      return { ...item, match_count: count };
    });

    // Sort: Match Count (desc) -> Ratio (asc) -> Quota (desc)
    result.sort((a, b) => {
      if (a.match_count !== b.match_count) return b.match_count - a.match_count;
      if (a.competition_ratio !== b.competition_ratio) return a.competition_ratio - b.competition_ratio;
      return b.jumlah_kuota - a.jumlah_kuota;
    });

    return result;
  }, [data, filters]);

  // --- DEPENDENT FILTERING LOGIC ---
  // Create subsets of data to derive available options based on CURRENT selections.
  // We want:
  // - Available Companies: based on (Province + Category + Search). Ignore Company filter itself.
  // - Available Provinces: based on (Company + Category + Search). Ignore Province filter itself.
  // - Available Categories: based on (Company + Province + Search). Ignore Category filter itself.

  const baseFilter = (item: Vacancy, ignoreKey: 'company' | 'province' | 'category') => {
    const searchLower = filters.search.toLowerCase();

    // Check Search
    if (searchLower && !item.posisi.toLowerCase().includes(searchLower)) return false;
    // Check Ratio
    if (item.competition_ratio > filters.maxRatio) return false;

    // Check Filters (skipping the one we are generating options for)
    if (ignoreKey !== 'province' && filters.province !== "(Semua)" && item.nama_provinsi !== filters.province) return false;
    if (ignoreKey !== 'category' && filters.category !== "(Semua)" && item.kategori_posisi !== filters.category) return false;
    if (ignoreKey !== 'company' && filters.company !== "(Semua)" && item.nama_perusahaan !== filters.company) return false;

    return true;
  };

  const provinces = useMemo(() => {
    const subset = data.filter(d => baseFilter(d, 'province'));
    const s = new Set(subset.map(d => d.nama_provinsi).filter(Boolean));
    return Array.from(s).sort();
  }, [data, filters.category, filters.company, filters.search, filters.maxRatio]); // Re-calc when other filters change

  const categories = useMemo(() => {
    const subset = data.filter(d => baseFilter(d, 'category'));
    const s = new Set(subset.map(d => d.kategori_posisi).filter(Boolean));
    return Array.from(s).sort();
  }, [data, filters.province, filters.company, filters.search, filters.maxRatio]);

  const companies = useMemo(() => {
    const subset = data.filter(d => baseFilter(d, 'company'));
    const s = new Set(subset.map(d => d.nama_perusahaan).filter(Boolean));
    return Array.from(s).sort();
  }, [data, filters.province, filters.category, filters.search, filters.maxRatio]);

  // Stats
  const stats = useMemo(() => {
    const totalVacancies = filteredData.length;
    const ratios = filteredData.map(d => d.competition_ratio);
    const medianRatio = ratios.length ? ratios.sort((a, b) => a - b)[Math.floor(ratios.length / 2)] : 0;
    const avgRatio = ratios.length ? ratios.reduce((a, b) => a + b, 0) / ratios.length : 0;
    const uniqueCompanies = new Set(filteredData.map(d => d.nama_perusahaan)).size;

    return { totalVacancies, medianRatio, avgRatio, uniqueCompanies };
  }, [filteredData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium tracking-wide">Memuat data lowongan...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg-main)] font-sans text-[var(--ink-main)] pb-12 selection:bg-[var(--accent-soft)] selection:text-[var(--accent-blue)]">
      {/* Decorative Background Blobs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[80px] mix-blend-multiply opacity-70 animate-blob"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-100/40 rounded-full blur-[80px] mix-blend-multiply opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-pink-100/40 rounded-full blur-[100px] mix-blend-multiply opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navbar with Glass Effect */}
      <div className="navbar w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight">
                Magang Intel
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 hidden sm:block font-semibold">
                Peta Peluang MagangHub
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/60 rounded-full border border-white/50 shadow-sm backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
              <span className="text-xs font-bold text-slate-600">
                {data.length.toLocaleString()} Lowongan
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/laporan"
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[var(--accent-blue)] transition-all px-4 py-2 rounded-full hover:bg-white/80 active:scale-95"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Laporan</span>
            </Link>
            <Link
              href="/cek-lamaran"
              className="flex items-center gap-2 text-sm font-semibold text-white transition-all px-4 py-2 rounded-full bg-[var(--accent-main)] hover:bg-orange-600 shadow-lg shadow-orange-500/20 active:scale-95 active:shadow-none"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Cek Lamaran</span>
            </Link>
            <a
              href="https://github.com/Azahrulsmavo-design/magang_intel"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-slate-900 transition-colors bg-white/50 rounded-full hover:bg-white"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* MagangHub Info Section */}
        <MagangHubInfo />

        {/* Timeline Jadwal */}
        <TimelinePemagangan />

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-6 mt-8">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-white/80 p-3 rounded-2xl border border-white/60 shadow-sm text-slate-700 font-bold hover:bg-white active:scale-[0.99] transition-all backdrop-blur-md"
          >
            <FilterIcon className="w-4 h-4" />
            Filter Lowongan
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          {/* Sidebar Filters */}
          <div className={`
            fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity lg:hidden
            ${isMobileFilterOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}
          `} onClick={() => setIsMobileFilterOpen(false)} />

          <div className={`
            fixed inset-y-0 left-0 z-50 w-80 bg-[var(--bg-main)] shadow-2xl transform transition-transform duration-300 ease-in-out lg:transform-none lg:static lg:z-auto lg:w-auto lg:shadow-none lg:bg-transparent lg:col-span-3
            ${isMobileFilterOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            <div className="h-full overflow-y-auto lg:h-auto lg:overflow-visible p-6 lg:p-0">
              <div className="flex items-center justify-between mb-6 lg:hidden">
                <h2 className="text-lg font-bold text-slate-900">Filter</h2>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="sticky top-24">
                <Filters
                  provinces={provinces}
                  categories={categories}
                  companies={companies}
                  filters={filters}
                  setFilters={setFilters}
                />
              </div>
            </div>
          </div>

          {/* Main Content - Stats and Charts only */}
          <div className="lg:col-span-9 space-y-8">
            <Stats {...stats} />

            <Charts data={filteredData} />
          </div>
        </div>
      </div>

      {/* Full-Width Results Section */}
      <div className="relative z-10 w-full bg-white/40 border-t border-white/60 mt-12 backdrop-blur-xl">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
          <div id="results">
            <ResultsSection jobs={filteredData} />
          </div>
        </div>
      </div>

      {/* Footer CTA — Data Analyst Profile */}
      <section id="hire-me" className="footer-cta relative z-10">
        <div className="footer-cta-inner">
          <motion.div
            initial={{ opacity: 0, x: -20, filter: 'blur(5px)' }}
            whileInView={{ opacity: 1, x: 0, filter: 'blur(0)' }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            className="footer-cta-text"
          >
            <p className="eyebrow">AVAILABLE FOR ANALYTICS & WEB PROJECTS</p>
            <h2>
              Need a <span>clean modern website</span><br />
              or <span>data analysis</span> that supports real decisions?
            </h2>
            <p className="subtitle">
              I’m a Data Analyst with experience in automation, forecasting, and
              dashboard design — helping businesses turn messy data into clear,
              actionable insights. I also build simple, fast websites for personal
              brands and small businesses.
            </p>

            <ul className="services-list">
              <li>• Portfolio / company website (static / simple landing)</li>
              <li>• Data cleaning & exploratory analysis (Python / SQL)</li>
              <li>• Dashboard & reporting automation (Power Query / Power BI)</li>
              <li>• Forecasting & business analytics for SMEs / e-commerce</li>
            </ul>

            <div className="footer-cta-actions">
              <a href="mailto:azahrulsmavo@gmail.com" className="btn-primary">
                Email me a brief
              </a>
            </div>

            <div className="footer-social">
              <a
                href="https://github.com/Azahrulsmavo-design"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/muhammad-azahrul-ramadhan-9728bb252/"
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.96, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0)' }}
            viewport={{ once: true }}
            transition={{
              duration: 0.8,
              ease: [0.32, 0.72, 0, 1],
              type: "spring",
              stiffness: 100,
              damping: 20
            }}
            className="footer-cta-side"
          >
            <p className="badge">Portfolio v1.0</p>

            <p className="highlight-number">266K+</p>
            <p className="highlight-caption">
              rows analyzed in traffic, sales,<br />
              and forecasting projects.
            </p>

            <p className="highlight-number">5+</p>
            <p className="highlight-caption">
              projects in data analysis,<br />
              automation, and education.
            </p>

            <p className="note">
              Feel free to reach out — a short WhatsApp chat is totally fine.
              No pressure, just seeing if we’re a good fit.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="site-footer relative z-10">
        &copy; {new Date().getFullYear()} Muhammad Azahrul Ramadhan. All rights reserved.
      </div>
    </main >
  );
}
