"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Building2, MapPin, Users, Briefcase, ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { enrichCategory } from "@/utils/category";

interface Vacancy {
    posisi: string;
    nama_perusahaan: string;
    nama_provinsi: string;
    nama_kabupaten_kota?: string;
    jumlah_kuota: number;
    jumlah_terdaftar: number;
    competition_ratio: number;
    kategori_posisi: string;
}

type SortColumn = 'province' | 'companies' | 'positions' | 'quota' | 'applicants' | null;
type SortDirection = 'asc' | 'desc';

export default function LaporanPage() {
    const [data, setData] = useState<Vacancy[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortColumn, setSortColumn] = useState<SortColumn>('applicants');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    useEffect(() => {
        fetch("/data.json")
            .then((res) => res.json())
            .then((json) => {
                const enrichedData = json.map((item: any) => ({
                    ...item,
                    kategori_posisi: enrichCategory(item.posisi, item.kategori_posisi)
                }));
                setData(enrichedData);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to load data:", err);
                setLoading(false);
            });
    }, []);

    // National Statistics
    const nationalStats = useMemo(() => {
        const totalPositions = data.length;
        const totalCompanies = new Set(data.map(v => v.nama_perusahaan)).size;
        const totalQuota = data.reduce((sum, v) => sum + v.jumlah_kuota, 0);
        const totalApplicants = data.reduce((sum, v) => sum + v.jumlah_terdaftar, 0);
        const avgCompetition = totalApplicants / totalQuota || 0;

        return {
            totalPositions,
            totalCompanies,
            totalQuota,
            totalApplicants,
            avgCompetition,
        };
    }, [data]);

    // Province Statistics
    const provinceStats = useMemo(() => {
        const stats = new Map<string, {
            companies: Set<string>;
            positions: number;
            quota: number;
            applicants: number;
        }>();

        data.forEach(vacancy => {
            const province = vacancy.nama_provinsi;
            if (!stats.has(province)) {
                stats.set(province, {
                    companies: new Set(),
                    positions: 0,
                    quota: 0,
                    applicants: 0,
                });
            }
            const stat = stats.get(province)!;
            stat.companies.add(vacancy.nama_perusahaan);
            stat.positions += 1;
            stat.quota += vacancy.jumlah_kuota;
            stat.applicants += vacancy.jumlah_terdaftar;
        });

        return Array.from(stats.entries()).map(([province, stat]) => ({
            province,
            companies: stat.companies.size,
            positions: stat.positions,
            quota: stat.quota,
            applicants: stat.applicants,
            competition: stat.applicants / stat.quota || 0,
        }));
    }, [data]);

    // Sort province stats
    const sortedProvinceStats = useMemo(() => {
        if (!sortColumn) return provinceStats;

        return [...provinceStats].sort((a, b) => {
            let aVal: number;
            let bVal: number;

            switch (sortColumn) {
                case 'province':
                    return sortDirection === 'asc'
                        ? a.province.localeCompare(b.province)
                        : b.province.localeCompare(a.province);
                case 'companies':
                    aVal = a.companies;
                    bVal = b.companies;
                    break;
                case 'positions':
                    aVal = a.positions;
                    bVal = b.positions;
                    break;
                case 'quota':
                    aVal = a.quota;
                    bVal = b.quota;
                    break;
                case 'applicants':
                    aVal = a.applicants;
                    bVal = b.applicants;
                    break;
                default:
                    return 0;
            }

            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        });
    }, [provinceStats, sortColumn, sortDirection]);

    // Top Companies
    const topCompanies = useMemo(() => {
        const companyStats = new Map<string, {
            positions: number;
            quota: number;
            applicants: number;
        }>();

        data.forEach(vacancy => {
            const company = vacancy.nama_perusahaan;
            if (!companyStats.has(company)) {
                companyStats.set(company, { positions: 0, quota: 0, applicants: 0 });
            }
            const stat = companyStats.get(company)!;
            stat.positions += 1;
            stat.quota += vacancy.jumlah_kuota;
            stat.applicants += vacancy.jumlah_terdaftar;
        });

        return Array.from(companyStats.entries())
            .map(([company, stat]) => ({
                company,
                ...stat,
                competition: stat.applicants / stat.quota || 0,
            }))
            .sort((a, b) => b.positions - a.positions)
            .slice(0, 10);
    }, [data]);

    // Category Distribution
    const categoryStats = useMemo(() => {
        const categories = new Map<string, number>();
        data.forEach(vacancy => {
            const cat = vacancy.kategori_posisi || 'Lainnya';
            categories.set(cat, (categories.get(cat) || 0) + 1);
        });

        return Array.from(categories.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);
    }, [data]);

    const handleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('desc');
        }
    };

    const SortIcon = ({ column }: { column: SortColumn }) => {
        if (sortColumn !== column) {
            return <ArrowUpDown className="w-3 h-3 text-slate-400" />;
        }
        return sortDirection === 'asc'
            ? <ChevronUp className="w-3 h-3 text-indigo-600" />
            : <ChevronDown className="w-3 h-3 text-indigo-600" />;
    };

    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Memuat data statistik...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/"
                                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Kembali
                            </Link>
                            <div className="h-6 w-px bg-slate-300" />
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">Laporan Statistik</h1>
                                <p className="text-xs text-slate-500">Data Lowongan Magang MagangHub</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs font-medium text-slate-600">
                                {nationalStats.totalPositions.toLocaleString()} lowongan
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* National Stats Cards */}
                <section>
                    <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        Statistik Nasional
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <Briefcase className="w-8 h-8 text-indigo-600" />
                            </div>
                            <p className="text-2xl font-bold text-slate-900">
                                {nationalStats.totalPositions.toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Posisi Tersedia</p>
                        </div>

                        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <Building2 className="w-8 h-8 text-purple-600" />
                            </div>
                            <p className="text-2xl font-bold text-slate-900">
                                {nationalStats.totalCompanies.toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Perusahaan</p>
                        </div>

                        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <Users className="w-8 h-8 text-blue-600" />
                            </div>
                            <p className="text-2xl font-bold text-slate-900">
                                {nationalStats.totalQuota.toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Total Kuota</p>
                        </div>

                        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <Users className="w-8 h-8 text-emerald-600" />
                            </div>
                            <p className="text-2xl font-bold text-slate-900">
                                {nationalStats.totalApplicants.toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Total Pelamar</p>
                        </div>

                        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <TrendingUp className="w-8 h-8 text-amber-600" />
                            </div>
                            <p className="text-2xl font-bold text-slate-900">
                                {nationalStats.avgCompetition.toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Rata-rata Rasio</p>
                        </div>
                    </div>
                </section>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top 10 Provinces by Applicants */}
                    <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <h3 className="text-base font-semibold text-slate-900 mb-4">
                            Top 10 Provinsi (Berdasarkan Pelamar)
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={sortedProvinceStats.slice(0, 10)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="province"
                                    tick={{ fontSize: 11 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="applicants" fill="#6366f1" name="Pelamar" />
                            </BarChart>
                        </ResponsiveContainer>
                    </section>

                    {/* Category Distribution */}
                    <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <h3 className="text-base font-semibold text-slate-900 mb-4">
                            Distribusi Kategori Posisi
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categoryStats}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry: any) => `${entry.name} (${(entry.percent * 100).toFixed(0)}%)`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {categoryStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </section>
                </div>

                {/* Province Statistics Table */}
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-indigo-600" />
                            Statistik Per Provinsi
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Klik header kolom untuk mengurutkan data
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th
                                        className="px-4 py-3 text-left cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                        onClick={() => handleSort('province')}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            Provinsi
                                            <SortIcon column="province" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                        onClick={() => handleSort('companies')}
                                    >
                                        <div className="flex items-center justify-end gap-1.5">
                                            Perusahaan
                                            <SortIcon column="companies" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                        onClick={() => handleSort('positions')}
                                    >
                                        <div className="flex items-center justify-end gap-1.5">
                                            Posisi
                                            <SortIcon column="positions" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                        onClick={() => handleSort('quota')}
                                    >
                                        <div className="flex items-center justify-end gap-1.5">
                                            Kuota
                                            <SortIcon column="quota" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                        onClick={() => handleSort('applicants')}
                                    >
                                        <div className="flex items-center justify-end gap-1.5">
                                            Pelamar
                                            <SortIcon column="applicants" />
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Rasio Kompetisi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sortedProvinceStats.map((stat) => (
                                    <tr key={stat.province} className="hover:bg-indigo-50/60 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-900">
                                            {stat.province}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                                            {stat.companies}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                                            {stat.positions}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                                            {stat.quota.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">
                                            {stat.applicants.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${stat.competition > 10
                                                ? 'bg-red-100 text-red-700'
                                                : stat.competition > 5
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {stat.competition.toFixed(2)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Top Companies */}
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                            Top 10 Perusahaan
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Berdasarkan jumlah posisi yang dibuka
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Perusahaan</th>
                                    <th className="px-4 py-3 text-right">Posisi</th>
                                    <th className="px-4 py-3 text-right">Kuota</th>
                                    <th className="px-4 py-3 text-right">Pelamar</th>
                                    <th className="px-4 py-3 text-right">Rasio</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {topCompanies.map((company, idx) => (
                                    <tr key={company.company} className="hover:bg-indigo-50/60 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-900">
                                            <div className="flex items-center gap-2">
                                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">
                                                    {idx + 1}
                                                </span>
                                                {company.company}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                                            {company.positions}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                                            {company.quota.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">
                                            {company.applicants.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${company.competition > 10
                                                ? 'bg-red-100 text-red-700'
                                                : company.competition > 5
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {company.competition.toFixed(2)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}
