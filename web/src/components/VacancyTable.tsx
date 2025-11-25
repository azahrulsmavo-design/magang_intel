import React from 'react';
import { X, ArrowUpDown } from 'lucide-react';

interface Vacancy {
    posisi: string;
    nama_perusahaan: string;
    nama_provinsi: string;
    jumlah_kuota: number;
    jumlah_terdaftar: number;
    competition_ratio: number;
    match_count: number;
    kategori_posisi: string;
}

interface VacancyTableProps {
    data: Vacancy[];
    limit: number | "Semua";
    filters?: {
        province: string;
        category: string;
        search: string;
        skills: string;
        maxRatio: number;
    };
    onReset?: () => void;
}

export function VacancyTable({ data, limit, filters, onReset }: VacancyTableProps) {
    const displayData = limit === "Semua" ? data : data.slice(0, limit);

    const hasActiveFilters = filters && (
        filters.province !== "(Semua)" ||
        filters.category !== "(Semua)" ||
        filters.search !== "" ||
        filters.skills !== "excel, sql, python" ||
        filters.maxRatio !== 10.0
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        Hasil Pencarian
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-sm font-medium rounded-full">
                            {data.length.toLocaleString()}
                        </span>
                    </h3>
                    {filters && (
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-slate-500">
                            <span>Filter aktif:</span>
                            {filters.province !== "(Semua)" && (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                                    {filters.province}
                                </span>
                            )}
                            {filters.category !== "(Semua)" && (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                                    {filters.category}
                                </span>
                            )}
                            {filters.skills && (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">
                                    Skill: {filters.skills}
                                </span>
                            )}
                            {hasActiveFilters && onReset && (
                                <button
                                    onClick={onReset}
                                    className="ml-2 text-red-600 hover:text-red-700 font-medium hover:underline flex items-center gap-1"
                                >
                                    <X className="w-3 h-3" /> Reset
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full text-sm text-left relative">
                        <thead className="text-xs font-bold text-slate-500 uppercase bg-slate-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-4">Posisi</th>
                                <th className="px-6 py-4">Perusahaan</th>
                                <th className="px-6 py-4">Provinsi</th>
                                <th className="px-6 py-4 text-right">Kuota</th>
                                <th className="px-6 py-4 text-right">Pendaftar</th>
                                <th className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        Rasio
                                        <ArrowUpDown className="w-3 h-3" />
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-center">Skill Match</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {displayData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <p className="font-medium">Tidak ada lowongan yang cocok</p>
                                            <p className="text-xs">Coba kurangi filter atau ubah kata kunci pencarian</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                displayData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50/50 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            <div className="line-clamp-2" title={row.posisi}>{row.posisi}</div>
                                            <div className="text-xs text-slate-500 mt-1 font-normal">{row.kategori_posisi}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div className="line-clamp-1" title={row.nama_perusahaan}>{row.nama_perusahaan}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{row.nama_provinsi}</td>
                                        <td className="px-6 py-4 text-right text-slate-600 font-mono">{row.jumlah_kuota}</td>
                                        <td className="px-6 py-4 text-right text-slate-600 font-mono">{row.jumlah_terdaftar}</td>
                                        <td className="px-6 py-4 text-right font-medium">
                                            <span className={`
                                                inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold
                                                ${row.competition_ratio <= 2 ? "bg-emerald-100 text-emerald-800" :
                                                    row.competition_ratio <= 10 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}
                                            `}>
                                                {row.competition_ratio.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {row.match_count > 0 ? (
                                                <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full shadow-sm shadow-blue-200">
                                                    {row.match_count}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {limit !== "Semua" && data.length > limit && (
                    <div className="p-4 text-center text-xs text-slate-500 border-t border-slate-100 bg-slate-50">
                        Menampilkan {limit} dari {data.length} hasil terbaik.
                    </div>
                )}
            </div>
        </div>
    );
}
