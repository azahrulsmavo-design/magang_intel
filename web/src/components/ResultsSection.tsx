
"use client";

import { useMemo, useState } from "react";

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

    // ⚙️ Buat CSV sekali saja tiap jobs berubah
    const csvContent = useMemo(() => {
        if (!jobs || jobs.length === 0) return "";

        const header = [
            "Posisi",
            "Perusahaan",
            "Provinsi",
            "Kategori",
            "Kuota",
            "Pendaftar",
            "Rasio",
        ];

        const rows = jobs.map((job) => [
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
    }, [jobs]);

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
                            {jobs.length.toLocaleString("id-ID")}
                        </span>{" "}
                        lowongan terbaik
                    </h3>
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
                            <th className="px-4 py-3 text-left">Posisi</th>
                            <th className="px-4 py-3 text-left">Perusahaan</th>
                            <th className="px-4 py-3 text-left">Provinsi</th>
                            <th className="px-4 py-3 text-right">Kuota</th>
                            <th className="px-4 py-3 text-right">Pelamar</th>
                            <th className="px-4 py-3 text-right">Rasio</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobs.slice(0, 10).map((job, idx) => (
                            <tr
                                key={idx}
                                className="border-t border-slate-100 hover:bg-indigo-50/60"
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
                            </tr>
                        ))}
                    </tbody>
                </table>
                {jobs.length > 10 && (
                    <p className="px-4 py-3 text-xs text-slate-500 border-t border-slate-100">
                        Menampilkan 10 dari {jobs.length.toLocaleString("id-ID")} hasil.
                        Klik <span className="font-semibold">“Lihat tabel penuh”</span> untuk
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
                                    {jobs.length.toLocaleString("id-ID")} lowongan sesuai filter
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
                                        <th className="px-3 py-2 text-left">Posisi</th>
                                        <th className="px-3 py-2 text-left">Kategori</th>
                                        <th className="px-3 py-2 text-left">Perusahaan</th>
                                        <th className="px-3 py-2 text-left">Provinsi</th>
                                        <th className="px-3 py-2 text-right">Kuota</th>
                                        <th className="px-3 py-2 text-right">Pelamar</th>
                                        <th className="px-3 py-2 text-right">Rasio</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {jobs.map((job, idx) => (
                                        <tr
                                            key={idx}
                                            className="border-t border-slate-100 hover:bg-indigo-50/70"
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
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer modal kecil */}
                        <div className="px-5 py-2 border-t border-slate-100 text-[0.72rem] text-slate-500 flex justify-between">
                            <span>
                                Tip: sort & filter dulu di panel kiri, lalu unduh CSV untuk
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
