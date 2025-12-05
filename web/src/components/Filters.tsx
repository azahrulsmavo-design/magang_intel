import React, { useState, useRef, useEffect } from 'react';
import { Search, Settings2, Building2, ChevronDown, Check } from 'lucide-react';

interface FiltersProps {
  provinces: string[];
  categories: string[];
  companies: string[];
  filters: {
    province: string;
    category: string;
    company: string;
    search: string;
    skills: string;
    maxRatio: number;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    province: string;
    category: string;
    company: string;
    search: string;
    skills: string;
    maxRatio: number;
  }>>;
}

export function Filters({ provinces, categories, companies, filters, setFilters }: FiltersProps) {
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const companyRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (companyRef.current && !companyRef.current.contains(event.target as Node)) {
        setIsCompanyOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter companies based on search
  const filteredCompanies = companies.filter(c =>
    c.toLowerCase().includes(companySearch.toLowerCase())
  );

  return (
    <div className="glass p-6 rounded-3xl shadow-float space-y-6 animate-ios-slide-up" style={{ animationDelay: '0.1s' }}>
      <div className="flex items-center gap-2 pb-3 border-b border-black/5">
        <Settings2 className="w-5 h-5 text-slate-700" />
        <h2 className="font-bold text-lg text-slate-900 tracking-tight">Filter</h2>
      </div>

      <div className="space-y-5">
        {/* Search - Morphing Expansion */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Keyword Judul</label>
          <div className="relative group transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] w-full hover:shadow-lg focus-within:shadow-lg bg-slate-100/50 hover:bg-white focus-within:bg-white rounded-2xl overflow-hidden flex items-center border border-transparent hover:border-slate-200 focus-within:border-[var(--accent-blue)]">
            <span className="pl-4 text-slate-400 group-focus-within:text-[var(--accent-blue)] transition-colors duration-300">
              <Search className="h-5 w-5" />
            </span>
            <input
              type="text"
              className="w-full bg-transparent border-none focus:ring-0 px-3 py-3.5 text-sm text-slate-700 placeholder:text-slate-400 transition-opacity duration-300"
              placeholder="Search jobs..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>

        {/* Company Filter - Searchable Combobox */}
        <div className="space-y-2 relative" ref={companyRef}>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Perusahaan</label>
          <div
            className="relative cursor-pointer"
            onClick={() => setIsCompanyOpen(!isCompanyOpen)}
          >
            <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <div className={`w-full pl-10 pr-10 border ${isCompanyOpen ? 'border-[var(--accent-blue)] ring-2 ring-[var(--accent-blue)] bg-white' : 'border-slate-200 bg-white/50'} rounded-xl p-3 text-sm hover:bg-white transition-all shadow-sm select-none truncate`}>
              {filters.company === "(Semua)" ? <span className="text-slate-500">(Semua Perusahaan)</span> : filters.company}
            </div>
            <ChevronDown className={`absolute right-3 top-3 h-4 w-4 text-slate-400 transition-transform ${isCompanyOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* Dropdown Menu */}
          {isCompanyOpen && (
            <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-2 border-b border-slate-50">
                <input
                  type="text"
                  className="w-full p-2 text-xs bg-slate-50 rounded-lg border-none focus:ring-1 focus:ring-[var(--accent-blue)] text-slate-700 placeholder:text-slate-400"
                  placeholder="Cari nama perusahaan..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              </div>
              <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${filters.company === "(Semua)" ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                  onClick={() => {
                    setFilters(prev => ({ ...prev, company: "(Semua)" }));
                    setIsCompanyOpen(false);
                    setCompanySearch("");
                  }}
                >
                  {filters.company === "(Semua)" && <Check className="w-3 h-3" />}
                  (Semua Perusahaan)
                </div>
                {filteredCompanies.length > 0 ? (
                  filteredCompanies.slice(0, 100).map(c => (
                    <div
                      key={c}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${filters.company === c ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                      onClick={() => {
                        setFilters(prev => ({ ...prev, company: c }));
                        setIsCompanyOpen(false);
                        setCompanySearch("");
                      }}
                    >
                      {filters.company === c && <Check className="w-3 h-3" />}
                      <span className="truncate">{c}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-4 text-center text-xs text-slate-400 italic">
                    Perusahaan tidak ditemukan
                  </div>
                )}
                {filteredCompanies.length > 100 && (
                  <div className="px-3 py-2 text-xs text-center text-slate-400 border-t border-slate-50 mt-1">
                    + {filteredCompanies.length - 100} lainnya...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Filters Group */}
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Provinsi</label>
            <select
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-[var(--accent-blue)] bg-white/50 hover:bg-white transition-colors cursor-pointer"
              value={filters.province}
              onChange={(e) => setFilters(prev => ({ ...prev, province: e.target.value }))}
            >
              <option value="(Semua)">(Semua)</option>
              {provinces.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Kategori</label>
            <select
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-[var(--accent-blue)] bg-white/50 hover:bg-white transition-colors cursor-pointer"
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="(Semua)">(Semua)</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Skill Saya</label>
          <input
            type="text"
            className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-[var(--accent-blue)] bg-white/50 hover:bg-white transition-colors"
            placeholder="excel, sql, python"
            value={filters.skills}
            onChange={(e) => setFilters(prev => ({ ...prev, skills: e.target.value }))}
          />
          <p className="text-[10px] text-slate-400 font-medium">Pisahkan dengan koma</p>
        </div>

        {/* Ratio Slider */}
        <div className="pt-4 border-t border-black/5">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Batas Rasio
            </label>
            <span className="px-2.5 py-1 bg-[var(--accent-soft)] text-[var(--accent-blue)] text-xs font-bold rounded-lg">
              ≤ {filters.maxRatio}:1
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            step="0.5"
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[var(--accent-blue)]"
            value={filters.maxRatio}
            onChange={(e) => setFilters(prev => ({ ...prev, maxRatio: parseFloat(e.target.value) }))}
          />
          <p className="text-[10px] text-slate-500 mt-2 leading-relaxed font-medium">
            Rasio Pelamar/Kuota. <span className="text-emerald-600">Angka kecil = peluang besar.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
