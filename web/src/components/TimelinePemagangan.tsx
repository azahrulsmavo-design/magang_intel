import React from 'react';
import { motion } from 'framer-motion';

const PHASES = [
    {
        title: "[UPDATE] Perpanjangan Pendaftaran Perusahaan & Usulan Program",
        range: "24 Nov 2025 – 03 Des 2025",
        description:
            "Perusahaan mendaftarkan diri dan mengusulkan program pemagangan yang akan dibuka untuk lulusan perguruan tinggi.",
    },
    {
        title: "Pendaftaran Peserta Pemagangan",
        range: "04 Des 2025 – 07 Des 2025",
        description:
            "Lulusan perguruan tinggi mendaftar dan memilih program pemagangan yang sesuai minat dan kompetensi.",
    },
    {
        title: "Seleksi & Pengumuman Peserta",
        range: "08 Des 2025 – 11 Des 2025",
        description:
            "Perusahaan melakukan seleksi administrasi dan wawancara. Hasil akhir diumumkan sebelum pelaksanaan dimulai.",
    },
    {
        title: "Pelaksanaan Magang",
        range: "16 Des 2025 – 15 Jun 2026",
        description:
            "Peserta mengikuti program pemagangan di perusahaan sesuai jadwal, kurikulum pelatihan, dan pendampingan mentor.",
    },
];

export default function TimelinePemagangan() {
    return (
        <section className="mt-8 mb-10">
            <h2 className="text-lg font-bold text-slate-900 mb-4 uppercase tracking-tight">
                Jadwal Pelaksanaan
            </h2>

            <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                variants={{
                    hidden: { opacity: 0 },
                    show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.1 }
                    }
                }}
                className="grid grid-cols-1 md:grid-cols-4 gap-4"
            >
                {PHASES.map((phase, idx) => (
                    <motion.div
                        key={idx}
                        variants={{
                            hidden: { opacity: 0, y: 20, scale: 0.96, filter: 'blur(10px)' },
                            show: {
                                opacity: 1,
                                y: 0,
                                scale: 1,
                                filter: 'blur(0)',
                                transition: {
                                    type: "spring",
                                    stiffness: 260,
                                    damping: 20
                                }
                            }
                        }}
                        className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Tahap {idx + 1}
                            </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-500 mb-1">
                            {phase.range}
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight mb-2">
                            {phase.title}
                        </h3>
                        <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">
                            {phase.description}
                        </p>
                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
}
