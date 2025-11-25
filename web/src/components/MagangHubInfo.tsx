"use client";

import { useEffect, useState } from "react";

type Phase = {
    name: string;
    start: string;
    end: string;
};

const phases: Phase[] = [
    {
        name: "[UPDATE] Perpanjangan Pendaftaran Perusahaan",
        start: "2025-11-24T00:00:00",
        end: "2025-12-03T23:59:59",
    },
    {
        name: "Pendaftaran Peserta Pemagangan",
        start: "2025-12-04T00:00:00",
        end: "2025-12-07T23:59:59",
    },
    {
        name: "Seleksi & Pengumuman Peserta",
        start: "2025-12-08T00:00:00",
        end: "2025-12-11T23:59:59",
    },
    {
        name: "Pelaksanaan Magang",
        start: "2025-12-16T00:00:00",
        end: "2026-06-15T23:59:59",
    },
];

export default function MagangHubInfo() {
    const [now, setNow] = useState(new Date());
    const [activeIndex, setActiveIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState("");

    // Menentukan fase yang sedang berjalan
    useEffect(() => {
        const checkPhase = () => {
            const current = new Date();
            let idx = phases.findIndex(
                (p) =>
                    current >= new Date(p.start) && current <= new Date(p.end)
            );
            if (idx === -1) idx = phases.length - 1;
            setActiveIndex(idx);
            setNow(current);
        };

        checkPhase();
    }, []);

    // Countdown
    useEffect(() => {
        const timer = setInterval(() => {
            const end = new Date(phases[activeIndex].end).getTime();
            const diff = end - new Date().getTime();

            if (diff <= 0) {
                setTimeLeft("00 : 00 : 00 : 00");
                return;
            }

            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const m = Math.floor((diff / (1000 * 60)) % 60);
            const s = Math.floor((diff / 1000) % 60);

            setTimeLeft(
                `${String(d).padStart(2, "0")}d : ${String(h).padStart(
                    2,
                    "0"
                )}h : ${String(m).padStart(2, "0")}m : ${String(s).padStart(
                    2,
                    "0"
                )}s`
            );
        }, 1000);

        return () => clearInterval(timer);
    }, [activeIndex]);

    const phase = phases[activeIndex];

    return (
        <div className="w-full py-12 px-6 md:px-16 bg-gradient-to-b from-white to-blue-50 rounded-3xl mt-10 shadow-xl border border-slate-200">

            {/* Judul */}
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 mb-4">
                MAGANG HUB 2025
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10">
                Temukan tempat magang terbaik favoritmu. Sambut masa depan karir dengan
                pengalaman kerja yang berharga.
            </p>

            {/* Countdown */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-xl shadow-md">
                <p className="text-sm font-semibold tracking-wide text-indigo-600 uppercase mb-1">
                    Fase Berjalan Sekarang
                </p>
                <h2 className="text-xl font-bold text-slate-900 mb-3">
                    {phase.name}
                </h2>

                <div className="text-3xl font-black text-indigo-700 tracking-wider">
                    {timeLeft}
                </div>

                <p className="text-xs text-slate-500 mt-2">
                    Berakhir pada {new Date(phase.end).toLocaleDateString("id-ID")}
                </p>
            </div>

            {/* Kontak */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
                <div className="p-5 bg-white rounded-2xl shadow border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-3 text-lg">
                        Layanan Informasi
                    </h3>
                    <p className="text-sm">Call Center: <b>1500630</b> (Jam Kerja)</p>
                    <p className="text-sm mt-2">Konsultasi TEXT ONLY:</p>
                    <ul className="text-sm mt-1 text-slate-700">
                        <li>• Perusahaan: <b>0813 2064 789</b></li>
                        <li>• Peserta: <b>0813 2064 787</b></li>
                    </ul>
                </div>

                <div className="p-5 bg-white rounded-2xl shadow border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-3 text-lg">
                        Media Resmi
                    </h3>
                    <ul className="text-sm text-slate-700 space-y-2">
                        <li>• Instagram: <a className="text-indigo-600" href="#">@Kemnaker</a></li>
                        <li>• Website MagangHub Resmi:</li>
                        <li>
                            <a
                                href="https://maganghub.kemnaker.go.id/"
                                target="_blank"
                                className="text-indigo-700 font-semibold underline"
                            >
                                maganghub.kemnaker.go.id
                            </a>
                        </li>
                    </ul>
                </div>

                <div className="p-5 bg-white rounded-2xl shadow border border-slate-200 flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-slate-900 mb-3 text-lg">
                            Akses Cepat
                        </h3>
                        <div className="flex flex-col gap-2">
                            <a
                                href="#"
                                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 transition"
                            >
                                Daftar Peserta
                            </a>
                            <a
                                href="#"
                                className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition"
                            >
                                Daftar Perusahaan
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Catatan */}
            <p className="text-xs text-slate-500 mt-10 text-center">
                © 2025 Kementerian Ketenagakerjaan Republik Indonesia — Halaman ini hanya untuk simulasi.
            </p>
        </div>
    );
}
