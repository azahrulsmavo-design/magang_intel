"use client";

import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { motion } from 'framer-motion';

interface ChartsProps {
    data: any[];
}

export function Charts({ data }: ChartsProps) {
    // Prepare data for "Top Provinces by Unique Companies"
    const companiesByProv = React.useMemo(() => {
        const counts: Record<string, Set<string>> = {};
        data.forEach(item => {
            if (!item.nama_provinsi) return;
            if (!counts[item.nama_provinsi]) counts[item.nama_provinsi] = new Set();
            counts[item.nama_provinsi].add(item.nama_perusahaan);
        });

        return Object.entries(counts)
            .map(([name, set]) => ({ name, value: set.size }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [data]);

    // Prepare data for "Top Positions by Applicants"
    const applicantsByPos = React.useMemo(() => {
        const counts: Record<string, number> = {};
        data.forEach(item => {
            if (!item.posisi) return;
            counts[item.posisi] = (counts[item.posisi] || 0) + (item.jumlah_terdaftar || 0);
        });

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [data]);

    if (data.length === 0) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.96, filter: 'blur(10px)' }}
                whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0)' }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[500px]"
            >
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-900">Provinsi dengan Perusahaan Terbanyak</h3>
                    <p className="text-sm text-slate-500">Top 10 provinsi berdasarkan jumlah perusahaan unik</p>
                </div>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={companiesByProv} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={120}
                                tick={{ fontSize: 12, fill: '#64748b' }}
                                interval={0}
                            />
                            <Tooltip
                                cursor={{ fill: '#f1f5f9' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24}>
                                {companiesByProv.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill="#3b82f6" />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500 italic">
                        Insight: Konsentrasi perusahaan tertinggi biasanya berpusat di pulau Jawa.
                    </p>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.96, filter: 'blur(10px)' }}
                whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0)' }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.1 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[500px]"
            >
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-900">Posisi Paling Diminati</h3>
                    <p className="text-sm text-slate-500">Top 10 posisi berdasarkan jumlah pendaftar</p>
                </div>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={applicantsByPos} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={180}
                                tick={{ fontSize: 12, fill: '#64748b' }}
                                interval={0}
                            />
                            <Tooltip
                                cursor={{ fill: '#f1f5f9' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24}>
                                {applicantsByPos.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill="#10b981" />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500 italic">
                        Insight: Posisi administratif dan data entry cenderung memiliki persaingan ketat.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
