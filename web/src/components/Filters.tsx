import React from 'react';
import { Search, Settings2 } from 'lucide-react';

interface FiltersProps {
  provinces: string[];
  categories: string[];
  filters: {
    province: string;
    category: string;
    search: string;
    skills: string;
    maxRatio: number;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    province: string;
    category: string;
    search: string;
    skills: string;
    maxRatio: number;
  }>>;
}

export function Filters({ provinces, categories, filters, setFilters }: FiltersProps) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <Settings2 className="w-5 h-5 text-slate-700" />
        <h2 className="font-bold text-lg text-slate-900">Filter</h2>
      </div>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700">Provinsi</label>
          <select
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 hover:bg-white transition-colors"
            value={filters.province}
            onChange={(e) => setFilters(prev => ({ ...prev, province: e.target.value }))}
          >
            <option value="(Semua)">(Semua)</option>
            {provinces.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700">Kategori Posisi</label>
          <select
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 hover:bg-white transition-colors"
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
          >
            <option value="(Semua)">(Semua)</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700">Keyword Judul</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              className="w-full pl-10 border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 hover:bg-white transition-colors"
              placeholder="Cari posisi..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700">Skill Saya</label>
          <input
            type="text"
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 hover:bg-white transition-colors"
            placeholder="excel, sql, python"
            value={filters.skills}
            onChange={(e) => setFilters(prev => ({ ...prev, skills: e.target.value }))}
          />
          <p className="text-xs text-slate-500">Pisahkan dengan koma</p>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-slate-700">
              Batas Rasio
            </label>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-md">
              {filters.maxRatio}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            step="0.5"
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            value={filters.maxRatio}
            onChange={(e) => setFilters(prev => ({ ...prev, maxRatio: parseFloat(e.target.value) }))}
          />
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Maksimum rasio (Pelamar/Kuota). <br />
            <span className="text-emerald-600 font-medium">Semakin kecil = peluang lebih besar.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
