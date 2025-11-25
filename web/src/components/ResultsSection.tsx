"use client";

import { useMemo, useState, useEffect } from "react";
import { ArrowUp, ArrowDown, ChevronsUpDown, Star } from "lucide-react";

// Assuming Vacancy interface matches what we have in page.tsx, but simplified for this component
interface Vacancy {
    posisi: string;
    nama_perusahaan: string;
    nama_provinsi: string;
    jumlah_kuota: number;
    jumlah_terdaftar: number;
    competition_ratio: number;
    kategori_posisi: string;
    // Add other fields if needed
}

interface ResultsSectionProps {
    jobs: Vacancy[];
}

type SortColumn = 'posisi' | 'nama_perusahaan' | 'nama_provinsi' | 'jumlah_kuota' | 'jumlah_terdaftar' | 'competition_ratio' | null;
type SortDirection = 'asc' | 'desc' | null;
type ViewMode = 'all' | 'favorites';

// Generate unique ID for each job
function getJobId(job: Vacancy): string {
    return `${job.posisi}|${job.nama_perusahaan}|${job.nama_provinsi}`;
}

function formatCompetitionRatio(value: unknown) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value.toFixed(2);
    }

    if (typeof value === "string") {
        const num = Number(value.replace(",", "."));
        if (Number.isFinite(num)) {
            return num.toFixed(2);
        }
    }

    // Fallback kalau kosong / gak valid
    return "—";
}

export function ResultsSection({ jobs }: ResultsSectionProps) {
    const [showModal, setShowModal] = useState(false);
    const [sortColumn, setSortColumn] = useState<SortColumn>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('all');
    const [favorites, setFavorites] = useState<Set<string>>(new Set());

    // Load favorites from localStorage on mount
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

    // Save favorites to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('magang-intel-favorites', JSON.stringify(Array.from(favorites)));
    }, [favorites]);

    // Toggle favorite
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

    // Check if job is favorited
    const isFavorite = (job: Vacancy) => favorites.has(getJobId(job));

    // Filter by view mode
    const filteredJobs = useMemo(() => {
        if (viewMode === 'favorites') {
            return jobs.filter(job => isFavorite(job));
        }
        return jobs;
    }, [jobs, viewMode, favorites]);

    // Universal sort function
    const sortedJobs = useMemo(() => {
        if (!sortColumn || !sortDirection) return filteredJobs;

        return [...filteredJobs].sort((a, b) => {
            let aVal = a[sortColumn];
            let bVal = b[sortColumn];

            // Handle null/undefined
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;

            // Handle numbers
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }

            // Handle strings (case-insensitive)
            const aStr = String(aVal).toLowerCase();
            const bStr = String(bVal).toLowerCase();

            if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
            if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredJobs, sortColumn, sortDirection]);

    // Handle column header click
    const handleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            // Cycle: asc -> desc -> null
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

    // Sort icon component
    const SortIcon = ({ column }: { column: SortColumn }) => {
        if (sortColumn !== column) {
            return <ChevronsUpDown className="w-3 h-3 text-slate-400" />;
        }
        if (sortDirection === 'asc') {
            return <ArrowUp className="w-3 h-3 text-indigo-600" />;
        }
        return <ArrowDown className="w-3 h-3 text-indigo-600" />;
    };

    // ⚙️ Buat CSV sekali saja tiap jobs berubah
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
        ];

        const rows = sortedJobs.map((job) => [
            job.posisi,
            job.nama_perusahaan,
            job.nama_provinsi,
            job.kategori_posisi,
            job.jumlah_kuota,
            job.jumlah_terdaftar,
            formatCompetitionRatio(job.competition_ratio),
        ]);

        const escape = (value: unknown) => {
            if (value === null || value === undefined) return "";
            const s = String(value);
            // escape koma & kutip
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
        // aman karena fungsi ini cuma dipanggil di client (onClick)
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
        <section className="mt-6">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        Hasil Pencarian
                    </p>
                    <h3 className="text-lg font-semibold">
                        Menampilkan{" "}
                        <span className="font-bold">
                            {sortedJobs.length.toLocaleString("id-ID")}
                        </span>{" "}
                        lowongan terbaik
                    </h3>
                </div>

                {/* View Mode Tabs */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setViewMode('all')}
                        className={`px-4 py-2 text-xs font-semibold rounded-full transition ${viewMode === 'all'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Semua ({jobs.length})
                    </button>
                    <button
                        onClick={() => setViewMode('favorites')}
                        className={`px-4 py-2 text-xs font-semibold rounded-full transition flex items-center gap-1.5 ${viewMode === 'favorites'
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        <Star className="w-3 h-3" fill={viewMode === 'favorites' ? 'currentColor' : 'none'} />
                        Favorit ({favorites.size})
                    </button>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <div className="flex gap-2">
                        <button
                            onClick={handleDownload}
                            className="px-3 py-2 text-xs font-semibold rounded-full border border-indigo-300 text-slate-800 bg-indigo-50 hover:bg-indigo-100 transition"
                        >
                            ⬇ Unduh CSV
                        </button>

                        <button
                            onClick={() => setShowModal(true)}
                            className="px-3 py-2 text-xs font-semibold rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-md transition"
                        >
                            🔍 Lihat tabel penuh
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-500 italic">
                        *Perhatian: Tunggu sebentar untuk melihat full tabel
                    </p>
                </div>
            </div>

            {/* Tabel ringkas versi di halaman utama */}
            <div className="overflow-x-auto rounded-2xl bg-white shadow">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                        <tr>
                            <th
                                className="px-4 py-3 text-left cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                onClick={() => handleSort('posisi')}
                            >
                                <div className="flex items-center gap-1.5">
                                    Posisi
                                    <SortIcon column="posisi" />
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                onClick={() => handleSort('nama_perusahaan')}
                            >
                                <div className="flex items-center gap-1.5">
                                    Perusahaan
                                    <SortIcon column="nama_perusahaan" />
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                onClick={() => handleSort('nama_provinsi')}
                            >
                                <div className="flex items-center gap-1.5">
                                    Provinsi
                                    <SortIcon column="nama_provinsi" />
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                onClick={() => handleSort('jumlah_kuota')}
                            >
                                <div className="flex items-center justify-end gap-1.5">
                                    Kuota
                                    <SortIcon column="jumlah_kuota" />
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                onClick={() => handleSort('jumlah_terdaftar')}
                            >
                                <div className="flex items-center justify-end gap-1.5">
                                    Pelamar
                                    <SortIcon column="jumlah_terdaftar" />
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                onClick={() => handleSort('competition_ratio')}
                            >
                                <div className="flex items-center justify-end gap-1.5">
                                    Rasio
                                    <SortIcon column="competition_ratio" />
                                </div>
                            </th>
                            <th className="px-4 py-3 text-center w-16">
                                <Star className="w-3.5 h-3.5 inline-block text-slate-400" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedJobs.slice(0, 10).map((job, idx) => {
                            const favorited = isFavorite(job);
                            return (
                                <tr
                                    key={idx}
                                    className={`border-t border-slate-100 transition-colors ${favorited
                                        ? 'bg-amber-50/60 hover:bg-amber-100/60'
                                        : 'hover:bg-indigo-50/60'
                                        }`}
                                >
                                    <td className="px-4 py-3 font-medium text-slate-900">
                                        {job.posisi}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{job.nama_perusahaan}</td>
                                    <td className="px-4 py-3 text-slate-600">{job.nama_provinsi}</td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {job.jumlah_kuota}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {job.jumlah_terdaftar}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums font-semibold">
                                        {formatCompetitionRatio(job.competition_ratio)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFavorite(job);
                                            }}
                                            className="p-1 rounded-full hover:bg-slate-200 transition-colors"
                                            title={favorited ? 'Hapus dari favorit' : 'Tambah ke favorit'}
                                        >
                                            <Star
                                                className={`w-4 h-4 transition-all ${favorited
                                                    ? 'fill-amber-400 text-amber-400'
                                                    : 'text-slate-400 hover:text-amber-400'
                                                    }`}
                                            />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {sortedJobs.length > 10 && (
                    <p className="px-4 py-3 text-xs text-slate-500 border-t border-slate-100">
                        Menampilkan 10 dari {sortedJobs.length.toLocaleString("id-ID")} hasil.
                        Klik <span className="font-semibold">"Lihat tabel penuh"</span> untuk
                        melihat semuanya.
                    </p>
                )}
            </div>

            {/* ===== MODAL TABEL PENUH ===== */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-[95vw] max-w-6xl max-h-[85vh] flex flex-col">
                        {/* Header modal */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                            <div>
                                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                                    Tabel Lengkap
                                </p>
                                <h4 className="text-sm font-semibold">
                                    {sortedJobs.length.toLocaleString("id-ID")} lowongan sesuai filter
                                </h4>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleDownload}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-full border border-indigo-300 text-slate-800 bg-indigo-50 hover:bg-indigo-100 transition"
                                >
                                    ⬇ Unduh CSV
                                </button>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-full bg-slate-900 text-white hover:bg-slate-800 transition"
                                >
                                    ✕ Tutup
                                </button>
                            </div>
                        </div>

                        {/* Body modal: scrollable table */}
                        <div className="flex-1 overflow-auto">
                            <table className="min-w-full text-xs md:text-sm">
                                <thead className="bg-slate-50 text-[0.7rem] md:text-xs uppercase tracking-[0.14em] text-slate-500 sticky top-0 z-10">
                                    <tr>
                                        <th
                                            className="px-3 py-2 text-left cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                            onClick={() => handleSort('posisi')}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                Posisi
                                                <SortIcon column="posisi" />
                                            </div>
                                        </th>
                                        <th className="px-3 py-2 text-left">Kategori</th>
                                        <th
                                            className="px-3 py-2 text-left cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                            onClick={() => handleSort('nama_perusahaan')}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                Perusahaan
                                                <SortIcon column="nama_perusahaan" />
                                            </div>
                                        </th>
                                        <th
                                            className="px-3 py-2 text-left cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                            onClick={() => handleSort('nama_provinsi')}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                Provinsi
                                                <SortIcon column="nama_provinsi" />
                                            </div>
                                        </th>
                                        <th
                                            className="px-3 py-2 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                            onClick={() => handleSort('jumlah_kuota')}
                                        >
                                            <div className="flex items-center justify-end gap-1.5">
                                                Kuota
                                                <SortIcon column="jumlah_kuota" />
                                            </div>
                                        </th>
                                        <th
                                            className="px-3 py-2 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                            onClick={() => handleSort('jumlah_terdaftar')}
                                        >
                                            <div className="flex items-center justify-end gap-1.5">
                                                Pelamar
                                                <SortIcon column="jumlah_terdaftar" />
                                            </div>
                                        </th>
                                        <th
                                            className="px-3 py-2 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                            onClick={() => handleSort('competition_ratio')}
                                        >
                                            <div className="flex items-center justify-end gap-1.5">
                                                Rasio
                                                <SortIcon column="competition_ratio" />
                                            </div>
                                        </th>
                                        <th className="px-3 py-2 text-center w-12">
                                            <Star className="w-3 h-3 inline-block text-slate-400" />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedJobs.map((job, idx) => {
                                        const favorited = isFavorite(job);
                                        return (
                                            <tr
                                                key={idx}
                                                className={`border-t border-slate-100 transition-colors ${favorited
                                                        ? 'bg-amber-50/70 hover:bg-amber-100/70'
                                                        : 'hover:bg-indigo-50/70'
                                                    }`}
                                            >
                                                <td className="px-3 py-2 font-medium text-slate-900">
                                                    {job.posisi}
                                                </td>
                                                <td className="px-3 py-2 text-slate-600">
                                                    {job.kategori_posisi}
                                                </td>
                                                <td className="px-3 py-2 text-slate-600">
                                                    {job.nama_perusahaan}
                                                </td>
                                                <td className="px-3 py-2 text-slate-600">
                                                    {job.nama_provinsi}
                                                </td>
                                                <td className="px-3 py-2 text-right tabular-nums">
                                                    {job.jumlah_kuota}
                                                </td>
                                                <td className="px-3 py-2 text-right tabular-nums">
                                                    {job.jumlah_terdaftar}
                                                </td>
                                                <td className="px-3 py-2 text-right tabular-nums font-semibold">
                                                    {formatCompetitionRatio(job.competition_ratio)}
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleFavorite(job);
                                                        }}
                                                        className="p-0.5 rounded-full hover:bg-slate-200 transition-colors"
                                                        title={favorited ? 'Hapus dari favorit' : 'Tambah ke favorit'}
                                                    >
                                                        <Star
                                                            className={`w-3.5 h-3.5 transition-all ${favorited
                                                                    ? 'fill-amber-400 text-amber-400'
                                                                    : 'text-slate-400 hover:text-amber-400'
                                                                }`}
                                                        />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer modal kecil */}
                        <div className="px-5 py-2 border-t border-slate-100 text-[0.72rem] text-slate-500 flex justify-between">
                            <span>
                                Tip: Klik header kolom untuk sort, lalu unduh CSV untuk
                                dianalisis di Excel / Python.
                            </span>
                            <span>Magang Intel · v0.1</span>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
