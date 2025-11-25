// src/app/cek-lamaran/page.tsx
"use client";

import { useState } from "react";
import { Mail, Search, Info, AlertCircle, ArrowLeft, Loader2, BarChart3 } from "lucide-react";
import Link from "next/link";

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
        <main className="min-h-screen bg-slate-950 text-slate-50">
            {/* Top bar / back link */}
            <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="inline-flex items-center text-sm text-slate-400 hover:text-slate-50"
                        >
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Kembali ke Beranda
                        </Link>
                        <span className="h-4 w-px bg-slate-700" />
                        <span className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">
                            Magang Intel
                        </span>
                    </div>

                    <Link
                        href="https://maganghub.kemnaker.go.id/"
                        target="_blank"
                        className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
                    >
                        maganghub.kemnaker.go.id ↗
                    </Link>
                </div>
            </header>

            <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-16 pt-10 lg:flex-row">
                {/* LEFT: Form & Info */}
                <section className="w-full lg:w-[40%] space-y-6">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
                            Cek Status Lamaran
                        </p>
                        <h1 className="mt-2 text-2xl font-semibold text-slate-50 sm:text-3xl">
                            Cek Status Lamaran MagangHub
                        </h1>
                        <p className="mt-2 text-sm text-slate-400">
                            Masukan email yang kamu gunakan di MagangHub untuk melihat status lamaranmu,
                            tanpa perlu{" "}
                            <span className="font-medium text-slate-100">
                                inspect element
                            </span>{" "}
                            lagi.
                        </p>
                    </div>

                    {/* Info box */}
                    <div className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                        <div className="mt-0.5">
                            <Info className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
                                INFO
                            </p>
                            <p className="text-sm text-slate-200">
                                Email yang kamu masukan{" "}
                                <span className="font-semibold text-emerald-300">
                                    langsung diproses oleh API MagangHub / Pantauloker
                                </span>{" "}
                                — aplikasi ini tidak menyimpan data emailmu.
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label
                                htmlFor="email"
                                className="block text-xs font-medium uppercase tracking-[0.19em] text-slate-400"
                            >
                                Email MagangHub
                            </label>
                            <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2 focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-400/60">
                                <Mail className="h-4 w-4 text-slate-400" />
                                <input
                                    id="email"
                                    type="email"
                                    className="h-9 w-full bg-transparent text-sm text-slate-50 placeholder-slate-500 outline-none"
                                    placeholder="contoh@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <p className="text-xs text-slate-500">
                                Email kamu{" "}
                                <span className="font-semibold text-slate-300">
                                    tidak disimpan
                                </span>{" "}
                                di server aplikasi ini.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email.trim()}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-emerald-800 disabled:text-slate-300"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <Search className="h-4 w-4" />
                                    Cek Lamaran
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-emerald-400 hover:text-emerald-200"
                        >
                            <BarChart3 className="h-4 w-4" />
                            <span>Lihat Statistik (segera hadir)</span>
                        </button>
                    </form>

                    {error && (
                        <div className="flex gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-4">
                            <AlertCircle className="mt-0.5 h-5 w-5 text-red-400" />
                            <p className="text-sm text-red-100">{error}</p>
                        </div>
                    )}

                    {!error && hasSearched && apps !== null && apps.length === 0 && !loading && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-200">
                            Tidak ada data lamaran untuk email tersebut. <br />
                            <span className="text-slate-400">
                                Coba lagi beberapa saat lagi, atau pastikan email sama dengan yang digunakan saat daftar di MagangHub.
                            </span>
                        </div>
                    )}
                </section>

                {/* RIGHT: Results */}
                <section className="w-full lg:w-[60%]">
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
                                    Hasil Lamaran
                                </p>
                                <h2 className="mt-1 text-sm font-medium text-slate-100 sm:text-base">
                                    Ringkasan status lamaran berdasarkan email kamu
                                </h2>
                            </div>
                            {apps && apps.length > 0 && (
                                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                                    {apps.length} posisi ditemukan
                                </span>
                            )}
                        </div>

                        {!hasSearched && (
                            <div className="flex min-h-[180px] items-center justify-center text-center">
                                <p className="max-w-xs text-sm text-slate-400">
                                    Masukan email dan klik{" "}
                                    <span className="font-semibold text-slate-100">
                                        Cek Lamaran
                                    </span>{" "}
                                    untuk melihat status lamaranmu di sini.
                                </p>
                            </div>
                        )}

                        {loading && (
                            <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 text-sm text-slate-300">
                                <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                                <p>Sedang memproses data dari MagangHub, mohon tunggu...</p>
                            </div>
                        )}

                        {!loading && apps && apps.length > 0 && (
                            <div className="mt-2 space-y-3">
                                <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                                    {apps.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-4 transition hover:border-emerald-400/60 hover:bg-slate-900"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                                                        {item.company_name || "Perusahaan"}
                                                    </p>
                                                    <h3 className="mt-1 text-sm font-semibold text-slate-50 sm:text-base">
                                                        {item.position_name || "Posisi Magang"}
                                                    </h3>
                                                </div>
                                                {item.status_text && (
                                                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-emerald-300">
                                                        {item.status_text}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300 sm:grid-cols-4">
                                                {item.province_name && (
                                                    <div>
                                                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                                                            Provinsi
                                                        </p>
                                                        <p>{item.province_name}</p>
                                                    </div>
                                                )}
                                                {item.city_name && (
                                                    <div>
                                                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                                                            Kota/Kabupaten
                                                        </p>
                                                        <p>{item.city_name}</p>
                                                    </div>
                                                )}
                                                {typeof item.quota === "number" && (
                                                    <div>
                                                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                                                            Kuota
                                                        </p>
                                                        <p>{item.quota}</p>
                                                    </div>
                                                )}
                                                {typeof item.registered === "number" && (
                                                    <div>
                                                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                                                            Terdaftar
                                                        </p>
                                                        <p>{item.registered}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {(typeof item.accepted === "number" ||
                                                typeof item.rejected === "number" ||
                                                typeof item.accepted_other_company === "number") && (
                                                    <div className="mt-3 border-t border-slate-800 pt-3 text-[11px] text-slate-400">
                                                        <p className="mb-1 font-semibold text-slate-300">
                                                            Rekap Status Peserta
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {typeof item.accepted === "number" && (
                                                                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                                                                    Diterima: {item.accepted}
                                                                </span>
                                                            )}
                                                            {typeof item.rejected === "number" && (
                                                                <span className="rounded-full bg-red-400/10 px-3 py-1 text-xs text-red-300">
                                                                    Tidak diterima: {item.rejected}
                                                                </span>
                                                            )}
                                                            {typeof item.accepted_other_company === "number" && (
                                                                <span className="rounded-full bg-blue-400/10 px-3 py-1 text-xs text-blue-300">
                                                                    Diterima di perusahaan lain: {item.accepted_other_company}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                        </div>
                                    ))}
                                </div>
                                <p className="pt-1 text-[11px] text-slate-500">
                                    Data diambil secara langsung dari endpoint yang digunakan MagangHub / Pantauloker.
                                    Jika hasil terasa aneh / kosong, kemungkinan server resmi sedang lambat atau down.
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}
