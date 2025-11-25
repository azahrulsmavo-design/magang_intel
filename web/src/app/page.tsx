"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Filters } from '@/components/Filters';
import { Stats } from '@/components/Stats';
import { Charts } from '@/components/Charts';
import { Github, X, Filter as FilterIcon, Search } from "lucide-react";
import MagangHubInfo from '@/components/MagangHubInfo';
import TimelinePemagangan from '@/components/TimelinePemagangan';
import { ResultsSection } from '@/components/ResultsSection';

interface Vacancy {
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
    search: "",
    skills: "excel, sql, python",
    maxRatio: 10.0
  });

  useEffect(() => {
    const fetchData = () => {
      fetch('/data.json')
        .then(res => res.json())
        .then(data => {
          setData(data);
          setLoading(false);
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

  // Extract unique options
  const provinces = useMemo(() => {
    const s = new Set(data.map(d => d.nama_provinsi).filter(Boolean));
    return Array.from(s).sort();
  }, [data]);

  const categories = useMemo(() => {
    const s = new Set(data.map(d => d.kategori_posisi).filter(Boolean));
    return Array.from(s).sort();
  }, [data]);

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Memuat data lowongan...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      {/* Hero Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Magang Intel
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Peta Peluang Magang MagangHub
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-medium text-slate-600">
                Data: {data.length.toLocaleString()} lowongan
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-xs text-slate-500">Update: 25 Nov 2025</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/cek-lamaran"
              className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Cek Lamaran</span>
            </Link>
            <a
              href="https://github.com/Azahrulsmavo-design/magang_intel"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">Dokumentasi</span>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* MagangHub Info Section */}
        <MagangHubInfo />

        {/* Timeline Jadwal */}
        <TimelinePemagangan />

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-6 mt-8">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-slate-700 font-medium hover:bg-slate-50 active:scale-[0.99] transition-all"
          >
            <FilterIcon className="w-4 h-4" />
            Filter Lowongan
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          {/* Sidebar Filters */}
          <div className={`
            fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden
            ${isMobileFilterOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}
          `} onClick={() => setIsMobileFilterOpen(false)} />

          <div className={`
            fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:transform-none lg:static lg:z-auto lg:w-auto lg:shadow-none lg:bg-transparent lg:col-span-3
            ${isMobileFilterOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            <div className="h-full overflow-y-auto lg:h-auto lg:overflow-visible p-6 lg:p-0">
              <div className="flex items-center justify-between mb-6 lg:hidden">
                <h2 className="text-lg font-bold text-slate-900">Filter</h2>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="sticky top-24">
                <Filters
                  provinces={provinces}
                  categories={categories}
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
      <div className="w-full bg-gradient-to-b from-slate-50 to-white border-t border-slate-200 mt-8">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div id="results">
            <ResultsSection jobs={filteredData} />
          </div>
        </div>
      </div>

      {/* Footer CTA — Data Analyst Profile */}
      <section id="hire-me" className="footer-cta">
        <div className="footer-cta-inner">
          <div className="footer-cta-text">
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
          </div>

          <div className="footer-cta-side">
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
          </div>
        </div>
      </section>

      <div className="site-footer">
        &copy; {new Date().getFullYear()} Muhammad Azahrul Ramadhan. All rights reserved.
      </div>
    </main >
  );
}
