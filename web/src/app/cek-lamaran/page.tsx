"use client";

import { useState } from "react";
import { Mail, Search, Info, AlertCircle, ArrowLeft, Loader2, BarChart3, CheckCircle2, XCircle, Building2, MapPin } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = "https://cekstatus.pantauloker.co/api/mh/p";
const P_PARAM =
    "L2JlL3YxL2FwaS9saXN0L2NydWQtcHJvZ3JhbS1wYXJ0aWNpcGFudHM%2Fb3JkZXJfZGlyZWN0aW9uPUFTQyZwYWdlPTEmbGltaXQ9NTAmZW1haWw9";
const S_PARAM = "AyL9Vu9WWgETMMDlig7GwbE8GnU9dOBWShgf6MI6j0A";

interface ApplicationStat {
    position_name?: string;
    company_name?: string;
    province_name?: string;
    city_name?: string;
    quota?: number;
    registered?: number;
    accepted?: number;
    rejected?: number;
    accepted_other_company?: number;
    status_text?: string;
}

export default function CekLamaranPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [apps, setApps] = useState<ApplicationStat[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setApps(null);
        setHasSearched(true);

        if (!email.trim()) {
            setError("Silakan isi email terlebih dahulu.");
            return;
        }

        try {
            setLoading(true);
            const url = `${API_BASE}?p=${P_PARAM}${encodeURIComponent(email.trim())}&s=${S_PARAM}`;

            const res = await fetch(url, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                },
                cache: "no-store",
            });

            if (!res.ok) {
                throw new Error(`Gagal memuat data (${res.status})`);
            }

            const json: any = await res.json();

            // Bentuk data API bisa berbeda, jadi kita baca dengan defensif
            const list: ApplicationStat[] =
                json?.data?.applications ??
                json?.data ??
                json?.applications ??
                [];

            if (!Array.isArray(list) || list.length === 0) {
                setApps([]);
            } else {
                setApps(list);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Terjadi kesalahan saat memproses permintaan.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-[#f0f4ff] via-[#fdf2f8] to-[#f0fdff] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* Top bar / back link */}
            <header className="sticky top-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur-xl">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="group inline-flex items-center text-sm font-medium text-slate-500 transition hover:text-indigo-600"
                        >
                            <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 transition group-hover:scale-105 group-hover:shadow-md">
                                <ArrowLeft className="h-4 w-4" />
                            </div>
                            Kembali ke Beranda
                        </Link>
                    </div>

                    <Link
                        href="https://maganghub.kemnaker.go.id/"
                        target="_blank"
                        className="rounded-full bg-white/50 px-4 py-1.5 text-xs font-semibold text-indigo-600 ring-1 ring-indigo-100 transition hover:bg-indigo-50 hover:ring-indigo-300"
                    >
                        maganghub.kemnaker.go.id ↗
                    </Link>
                </div>
            </header>

            <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 pb-20 pt-10 lg:flex-row">
                {/* LEFT: Form & Info */}
                <motion.section
                    initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0)' }}
                    transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                    className="w-full lg:w-[40%] space-y-8"
                >
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600"
                        >
                            <Search className="h-3 w-3" />
                            Status Tracker
                        </motion.div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                            Cek Status <span className="text-indigo-600">Lamaran</span>
                        </h1>
                        <p className="mt-3 text-lg leading-relaxed text-slate-600">
                            Masukan email MagangHub-mu untuk melihat status seleksi secara realtime tanpa ribet inspect element.
                        </p>
                    </div>

                    {/* Info box */}
                    <div className="glass p-5 rounded-2xl border border-indigo-100 bg-indigo-50/50">
                        <div className="flex gap-4">
                            <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100">
                                <Info className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                                    PRIVASI AMAN
                                </p>
                                <p className="text-sm leading-relaxed text-slate-600">
                                    Email kamu <span className="font-bold text-slate-900">tidak disimpan</span>.
                                    Aplikasi ini hanya meneruskan request ke API publik Pantauloker/MagangHub.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="glass space-y-5 rounded-[2rem] border border-white/60 p-6 shadow-float">
                        <div className="space-y-2">
                            <label
                                htmlFor="email"
                                className="ml-1 block text-xs font-bold uppercase tracking-wider text-slate-500"
                            >
                                Email Terdaftar
                            </label>
                            <div className="group relative transition-all focus-within:scale-[1.02]">
                                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    className="h-14 w-full rounded-2xl border border-slate-200 bg-white/80 pl-12 pr-4 text-base font-medium text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                    placeholder="nama@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={loading || !email.trim()}
                                className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-slate-900 px-6 py-4 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:opacity-80"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin text-indigo-300" />
                                        <span>Sedang Mengecek...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Lihat Hasil Lamaran</span>
                                        <ArrowLeft className="h-4 w-4 rotate-180" />
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
                            >
                                <BarChart3 className="h-4 w-4" />
                                <span>Statistik (Coming Soon)</span>
                            </button>
                        </div>
                    </form>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm"
                        >
                            <AlertCircle className="h-6 w-6 text-red-500" />
                            <p className="text-sm font-medium text-red-800">{error}</p>
                        </motion.div>
                    )}
                </motion.section>

                {/* RIGHT: Results */}
                <motion.section
                    initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0)' }}
                    transition={{ duration: 0.6, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
                    className="w-full lg:w-[60%]"
                >
                    <div className="glass min-h-[500px] rounded-[2.5rem] border border-white/60 p-6 shadow-float sm:p-8">
                        <div className="mb-8 flex items-end justify-between gap-4 border-b border-slate-100 pb-6">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Live Status
                                </p>
                                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                                    Hasil Pencarian
                                </h2>
                            </div>
                            {apps && apps.length > 0 && (
                                <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-bold text-emerald-600 ring-1 ring-emerald-100">
                                    {apps.length} Aplikasi Ditemukan
                                </span>
                            )}
                        </div>

                        {!hasSearched && (
                            <div className="flex min-h-[300px] flex-col items-center justify-center text-center opacity-60">
                                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100">
                                    <Search className="h-8 w-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Belum ada data</h3>
                                <p className="max-w-xs text-sm text-slate-500">
                                    Masukan email di panel sebelah kiri untuk mulai melihat status lamaranmu.
                                </p>
                            </div>
                        )}

                        {loading && (
                            <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-center">
                                <div className="relative h-16 w-16">
                                    <div className="absolute inset-0 animate-ping rounded-full bg-indigo-100 opacity-75"></div>
                                    <div className="relative flex h-full w-full items-center justify-center rounded-full bg-indigo-50">
                                        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-slate-500">Mengambil data terbaru...</p>
                            </div>
                        )}

                        {!loading && apps && apps.length === 0 && hasSearched && !error && (
                            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                                    <XCircle className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Tidak Ditemukan</h3>
                                <p className="mt-1 max-w-sm text-sm text-slate-500">
                                    Tidak ada data lamaran untuk email tersebut. Pastikan email sesuai dengan yang terdaftar di MagangHub.
                                </p>
                            </div>
                        )}

                        {!loading && apps && apps.length > 0 && (
                            <div className="space-y-4">
                                <AnimatePresence mode="popLayout">
                                    {apps.map((item, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 20, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ delay: idx * 0.05, type: "spring", stiffness: 300, damping: 24 }}
                                            className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
                                        >
                                            <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                                                <div className="flex items-start gap-4">
                                                    <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                        <Building2 className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                            {item.position_name || "Posisi Tanpa Nama"}
                                                        </h3>
                                                        <p className="text-sm font-medium text-slate-500">
                                                            {item.company_name || "Perusahaan Tanpa Nama"}
                                                        </p>
                                                    </div>
                                                </div>

                                                {item.status_text && (
                                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide
                                                        ${item.status_text.toLowerCase().includes('terima') || item.status_text.toLowerCase().includes('lulus')
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : item.status_text.toLowerCase().includes('tolak') || item.status_text.toLowerCase().includes('gagal')
                                                                ? 'bg-red-50 text-red-600'
                                                                : 'bg-blue-50 text-blue-600'
                                                        }
                                                    `}>
                                                        {item.status_text.toLowerCase().includes('terima') && <CheckCircle2 className="h-3 w-3" />}
                                                        {item.status_text.toLowerCase().includes('tolak') && <XCircle className="h-3 w-3" />}
                                                        {!item.status_text.toLowerCase().includes('terima') && !item.status_text.toLowerCase().includes('tolak') && <Info className="h-3 w-3" />}
                                                        {item.status_text}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50/50 p-4 sm:grid-cols-4">
                                                <div>
                                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Lokasi</p>
                                                    <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                                        <MapPin className="h-3 w-3 text-slate-400" />
                                                        {item.city_name || item.province_name || "-"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Kuota</p>
                                                    <p className="text-xs font-semibold text-slate-700">{item.quota || 0} Kursi</p>
                                                </div>
                                                <div>
                                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Pendaftar</p>
                                                    <p className="text-xs font-semibold text-slate-700">{item.registered || 0} Orang</p>
                                                </div>
                                                <div>
                                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Persaingan</p>
                                                    <p className="text-xs font-semibold text-slate-700">
                                                        1 : {item.quota && item.registered ? Math.round(item.registered / item.quota) : "-"}
                                                    </p>
                                                </div>
                                            </div>

                                            {(item.accepted || item.rejected || item.accepted_other_company) ? (
                                                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                                                    {typeof item.accepted === "number" && (
                                                        <span className="rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-700 border border-emerald-100">
                                                            Diterima: <b>{item.accepted}</b>
                                                        </span>
                                                    )}
                                                    {typeof item.rejected === "number" && (
                                                        <span className="rounded-md bg-red-50 px-2 py-1 font-medium text-red-700 border border-red-100">
                                                            Ditolak: <b>{item.rejected}</b>
                                                        </span>
                                                    )}
                                                </div>
                                            ) : null}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </motion.section>
            </div>
        </main>
    );
}
