import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, TrendingUp, BarChart3, Building2, AlertCircle } from 'lucide-react';

interface StatsProps {
    totalVacancies: number;
    medianRatio: number;
    avgRatio: number;
    uniqueCompanies: number;
}

export function Stats({ totalVacancies, medianRatio, avgRatio, uniqueCompanies }: StatsProps) {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    const formatRatio = (val: number) => {
        if (isNaN(val) || !isFinite(val)) {
            return (
                <div className="flex items-center gap-1.5 mt-1">
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-100">
                        Perlu filter lain
                    </span>
                </div>
            );
        }
        return <p className="text-3xl font-bold text-blue-600 mt-1">{val.toFixed(2)}</p>;
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
            <motion.div variants={item} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:scale-[1.01] transition-all duration-200 group">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Lowongan</p>
                    <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                    </div>
                </div>
                <p className="text-3xl font-bold text-slate-900 mt-1">{totalVacancies.toLocaleString()}</p>
            </motion.div>

            <motion.div variants={item} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:scale-[1.01] transition-all duration-200 group">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Median Rasio</p>
                    <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                </div>
                {formatRatio(medianRatio)}
            </motion.div>

            <motion.div variants={item} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:scale-[1.01] transition-all duration-200 group">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rata-rata Rasio</p>
                    <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                        <BarChart3 className="w-5 h-5 text-indigo-600" />
                    </div>
                </div>
                {formatRatio(avgRatio)}
            </motion.div>

            <motion.div variants={item} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:scale-[1.01] transition-all duration-200 group">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Perusahaan Unik</p>
                    <div className="p-2 bg-violet-50 rounded-lg group-hover:bg-violet-100 transition-colors">
                        <Building2 className="w-5 h-5 text-violet-600" />
                    </div>
                </div>
                <p className="text-3xl font-bold text-slate-900 mt-1">{uniqueCompanies.toLocaleString()}</p>
            </motion.div>
        </motion.div>
    );
}
