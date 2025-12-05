"use client";

import { useMemo, useState, useEffect } from "react";
import { ArrowUp, ArrowDown, ChevronsUpDown, Star, ExternalLink, Download, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Vacancy {
    id_posisi: string;
    posisi: string;
    nama_perusahaan: string;
    nama_provinsi: string;
    jumlah_kuota: number;
    jumlah_terdaftar: number;
    competition_ratio: number;
    kategori_posisi: string;
}

interface ResultsSectionProps {
    jobs: Vacancy[];
}

type SortColumn = 'posisi' | 'nama_perusahaan' | 'nama_provinsi' | 'jumlah_kuota' | 'jumlah_terdaftar' | 'competition_ratio' | null;
type SortDirection = 'asc' | 'desc' | null;
type ViewMode = 'all' | 'favorites';

function getJobId(job: Vacancy): string {
    return job.id_posisi; // Use proper unique ID
}

function formatCompetitionRatio(value: unknown) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value.toFixed(2);
    }
    return "—";
}

export function ResultsSection({ jobs }: ResultsSectionProps) {
    const [showModal, setShowModal] = useState(false);
    const [sortColumn, setSortColumn] = useState<SortColumn>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('all');
    const [favorites, setFavorites] = useState<Set<string>>(new Set());

    useEffect(() => {
        const stored = localStorage.getItem('magang-intel-favorites');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setFavorites(new Set(parsed));
            } catch (e) {
                console.error('Failed to parse favorites', e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('magang-intel-favorites', JSON.stringify(Array.from(favorites)));
    }, [favorites]);

    const toggleFavorite = (job: Vacancy) => {
        const id = getJobId(job);
        setFavorites(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const isFavorite = (job: Vacancy) => favorites.has(getJobId(job));

    const filteredJobs = useMemo(() => {
        if (viewMode === 'favorites') {
            return jobs.filter(job => isFavorite(job));
        }
        return jobs;
    }, [jobs, viewMode, favorites]);

    const sortedJobs = useMemo(() => {
        if (!sortColumn || !sortDirection) return filteredJobs;

        return [...filteredJobs].sort((a, b) => {
            let aVal = a[sortColumn];
            let bVal = b[sortColumn];

            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }

            const aStr = String(aVal).toLowerCase();
            const bStr = String(bVal).toLowerCase();

            if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
            if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredJobs, sortColumn, sortDirection]);

    const handleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else if (sortDirection === 'desc') {
                setSortColumn(null);
                setSortDirection(null);
            }
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const SortIcon = ({ column }: { column: SortColumn }) => {
        if (sortColumn !== column) {
            return <ChevronsUpDown className="w-3 h-3 text-slate-300" />;
        }
        if (sortDirection === 'asc') {
            return <ArrowUp className="w-3 h-3 text-[var(--accent-blue)]" />;
        }
        return <ArrowDown className="w-3 h-3 text-[var(--accent-blue)]" />;
    };

    const csvContent = useMemo(() => {
        if (!sortedJobs || sortedJobs.length === 0) return "";

        const header = [
            "Posisi",
            "Perusahaan",
            "Provinsi",
            "Kategori",
            "Kuota",
            "Pendaftar",
            "Rasio",
            "Link"
        ];

        const rows = sortedJobs.map((job) => [
            job.posisi,
            job.nama_perusahaan,
            job.nama_provinsi,
            job.kategori_posisi,
            job.jumlah_kuota,
            job.jumlah_terdaftar,
            formatCompetitionRatio(job.competition_ratio),
            `https://maganghub.kemnaker.go.id/lowongan/view/${job.id_posisi}`
        ]);

        const escape = (value: unknown) => {
            if (value === null || value === undefined) return "";
            const s = String(value);
            if (/[",\n]/.test(s)) {
                return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
        };

        const lines = [
            header.map(escape).join(","),
            ...rows.map((row) => row.map(escape).join(",")),
        ];

        return lines.join("\n");
    }, [sortedJobs]);

    const handleDownload = () => {
        if (!csvContent) return;
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const timestamp = new Date().toISOString().slice(0, 10);
        link.download = `magang-intel-results-${timestamp}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <section className="mt-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-1 h-6 bg-[var(--accent-main)] rounded-full"></span>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">
                            Database Lowongan
                        </p>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Menampilkan{" "}
                        <span className="text-[var(--accent-blue)] underline decoration-wavy decoration-blue-200">
                            {sortedJobs.length.toLocaleString("id-ID")}
                        </span>{" "}
                        hasil
                    </h3>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    {/* View Mode Tabs */}
                    <div className="bg-slate-100/80 p-1 rounded-xl flex gap-1">
                        <button
                            onClick={() => setViewMode('all')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'all'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Semua
                        </button>
                        <button
                            onClick={() => setViewMode('favorites')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${viewMode === 'favorites'
                                ? 'bg-white text-amber-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Star className="w-3.5 h-3.5" fill={viewMode === 'favorites' ? 'currentColor' : 'none'} />
                            Favorit
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">CSV</span>
                        </button>

                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 hover:shadow-xl transition-all active:scale-95"
                        >
                            <Search className="w-4 h-4" />
                            Lihat Tabel Penuh
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Table Preview */}
            <div className="overflow-hidden rounded-3xl bg-white/70 backdrop-blur-md shadow-card border border-white/60">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50/80 text-[10px] uppercase tracking-[0.1em] text-slate-400 font-bold border-b border-slate-100">
                            <tr>
                                <th
                                    className="px-6 py-4 text-left cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                                    onClick={() => handleSort('posisi')}
                                >
                                    <div className="flex items-center gap-1.5 group-hover:text-slate-700">
                                        Posisi
                                        <SortIcon column="posisi" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-left cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                                    onClick={() => handleSort('nama_perusahaan')}
                                >
                                    <div className="flex items-center gap-1.5 group-hover:text-slate-700">
                                        Perusahaan
                                        <SortIcon column="nama_perusahaan" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                                    onClick={() => handleSort('jumlah_kuota')}
                                >
                                    <div className="flex items-center justify-end gap-1.5 group-hover:text-slate-700">
                                        Kuota
                                        <SortIcon column="jumlah_kuota" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                                    onClick={() => handleSort('jumlah_terdaftar')}
                                >
                                    <div className="flex items-center justify-end gap-1.5 group-hover:text-slate-700">
                                        Pelamar
                                        <SortIcon column="jumlah_terdaftar" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                                    onClick={() => handleSort('competition_ratio')}
                                >
                                    <div className="flex items-center justify-end gap-1.5 group-hover:text-slate-700">
                                        Rasio
                                        <SortIcon column="competition_ratio" />
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <AnimatePresence mode="popLayout">
                                {sortedJobs.slice(0, 10).map((job, idx) => {
                                    const favorited = isFavorite(job);
                                    return (
                                        <motion.tr
                                            layout
                                            initial={{ opacity: 0, y: 20, scale: 0.96, filter: 'blur(10px)' }}
                                            whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0)' }}
                                            viewport={{ once: true, margin: "-50px" }}
                                            transition={{
                                                duration: 0.6,
                                                ease: [0.32, 0.72, 0, 1], // iOS Ease
                                                delay: idx * 0.05
                                            }}
                                            key={job.id_posisi}
                                            className={`group transition-colors ${favorited
                                                ? 'bg-amber-50/50 hover:bg-amber-100/50'
                                                : 'hover:bg-blue-50/50'
                                                }`}
                                        >
                                            <td className="px-6 py-4 font-bold text-slate-800">
                                                <div className="line-clamp-2 leading-relaxed">{job.posisi}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                <div className="line-clamp-1">{job.nama_perusahaan}</div>
                                                <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wide">{job.nama_provinsi}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right tabular-nums text-slate-600 font-mono tracking-tight">
                                                {job.jumlah_kuota}
                                            </td>
                                            <td className="px-6 py-4 text-right tabular-nums text-slate-600 font-mono tracking-tight">
                                                {job.jumlah_terdaftar}
                                            </td>
                                            <td className="px-6 py-4 text-right tabular-nums font-bold">
                                                <span className={`
                                                px-2 py-1 rounded-lg text-xs
                                                ${job.competition_ratio <= 2 ? "bg-emerald-100 text-emerald-700" :
                                                        job.competition_ratio <= 10 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}
                                            `}>
                                                    {formatCompetitionRatio(job.competition_ratio)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleFavorite(job);
                                                        }}
                                                        className={`p-2 rounded-full transition-all active:scale-95 ${favorited ? 'bg-amber-100 text-amber-500' : 'bg-slate-100 text-slate-400 hover:bg-amber-50 hover:text-amber-400'}`}
                                                        title={favorited ? 'Hapus dari favorit' : 'Tambah ke favorit'}
                                                    >
                                                        <Star className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
                                                    </button>
                                                    <a
                                                        href={`https://maganghub.kemnaker.go.id/lowongan/view/${job.id_posisi}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 rounded-full bg-slate-100 text-slate-400 hover:bg-[var(--accent-soft)] hover:text-[var(--accent-blue)] transition-all active:scale-95"
                                                        title="Lihat Detail"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
                {sortedJobs.length > 10 && (
                    <div className="p-4 bg-slate-50/50 backdrop-blur-sm border-t border-slate-100 text-center">
                        <button
                            onClick={() => setShowModal(true)}
                            className="text-xs font-bold text-[var(--accent-blue)] hover:text-blue-700 hover:underline transition-all"
                        >
                            Lihat {sortedJobs.length - 10} lowongan lainnya...
                        </button>
                    </div>
                )}
            </div>

            {/* ===== MODAL TABEL PENUH ===== */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-[#FDFBF7] rounded-[2rem] shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
                        {/* Header modal */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
                            <div>
                                <h4 className="text-lg font-bold text-slate-900">
                                    Tabel Lengkap
                                </h4>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    {sortedJobs.length.toLocaleString("id-ID")} Lowongan
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body modal: scrollable table */}
                        <div className="flex-1 overflow-auto bg-white custom-scrollbar">
                            <table className="min-w-full text-xs md:text-sm">
                                <thead className="bg-slate-50/90 backdrop-blur-sm text-[10px] uppercase tracking-widest text-slate-400 font-bold sticky top-0 z-10 border-b border-slate-100 shadow-sm">
                                    <tr>
                                        <th className="px-4 py-3 text-center w-12">★</th>
                                        <th
                                            className="px-4 py-3 text-left cursor-pointer hover:bg-slate-100 transition-colors group"
                                            onClick={() => handleSort('posisi')}
                                        >
                                            <div className="flex items-center gap-1.5 group-hover:text-slate-700">
                                                Posisi <SortIcon column="posisi" />
                                            </div>
                                        </th>
                                        <th
                                            className="px-4 py-3 text-left cursor-pointer hover:bg-slate-100 transition-colors group"
                                            onClick={() => handleSort('nama_perusahaan')}
                                        >
                                            <div className="flex items-center gap-1.5 group-hover:text-slate-700">
                                                Perusahaan <SortIcon column="nama_perusahaan" />
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 text-left hidden md:table-cell">Provinsi</th>
                                        <th
                                            className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors group"
                                            onClick={() => handleSort('jumlah_kuota')}
                                        >
                                            <div className="flex items-center justify-end gap-1.5 group-hover:text-slate-700">
                                                Kuota <SortIcon column="jumlah_kuota" />
                                            </div>
                                        </th>
                                        <th
                                            className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors group"
                                            onClick={() => handleSort('competition_ratio')}
                                        >
                                            <div className="flex items-center justify-end gap-1.5 group-hover:text-slate-700">
                                                Rasio <SortIcon column="competition_ratio" />
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 text-center">Link</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sortedJobs.map((job) => {
                                        const favorited = isFavorite(job);
                                        return (
                                            <tr
                                                key={job.id_posisi}
                                                className={`transition-colors text-slate-600 hover:text-slate-900 ${favorited
                                                    ? 'bg-amber-50/50 hover:bg-amber-100/50'
                                                    : 'hover:bg-blue-50/30'
                                                    }`}
                                            >
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleFavorite(job);
                                                        }}
                                                        className="text-slate-300 hover:text-amber-400 transition-colors"
                                                    >
                                                        <Star className={`w-4 h-4 ${favorited ? 'fill-amber-400 text-amber-400' : ''}`} />
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 font-medium">
                                                    {job.posisi}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {job.nama_perusahaan}
                                                </td>
                                                <td className="px-4 py-3 hidden md:table-cell text-slate-500">
                                                    {job.nama_provinsi}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums font-mono text-slate-500">
                                                    {job.jumlah_kuota}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums font-bold">
                                                    <span className={`${job.competition_ratio <= 10 ? 'text-emerald-600' : 'text-slate-600'}`}>
                                                        {formatCompetitionRatio(job.competition_ratio)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <a
                                                        href={`https://maganghub.kemnaker.go.id/lowongan/view/${job.id_posisi}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-[var(--accent-blue)] hover:bg-blue-50 transition-colors"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
