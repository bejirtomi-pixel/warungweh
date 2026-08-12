import React from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ label, value, icon: Icon, iconClass, hint, onClick, delay = 0 }) {
  const content = (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass} shadow-md`}>
          <Icon size={22} className="text-ink" />
        </div>
        {hint && <span className="text-xs font-medium text-slate-400">{hint}</span>}
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-extrabold tracking-tight text-ink sm:text-2xl">{value}</p>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'tween', duration: 0.25, delay }}
    >
      {onClick ? (
        <button onClick={onClick} className="w-full text-left">
          {content}
        </button>
      ) : (
        content
      )}
    </motion.div>
  );
}
