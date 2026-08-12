import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

export default function Cart({ items, onIncrease, onDecrease, onRemove }) {
  const empty = items.length === 0;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <ShoppingCart size={18} className="text-primary-darker" />
        <h2 className="text-base font-extrabold text-ink">Keranjang</h2>
        {!empty && (
          <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-bold text-primary-darker">
            {items.reduce((sum, i) => sum + i.qty, 0)} item
          </span>
        )}
      </div>

      <div className="max-h-[420px] flex-1 overflow-y-auto px-3 py-2">
        {empty && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
              <ShoppingCart size={26} />
            </div>
            <p className="mt-3 text-sm font-bold text-slate-500">Keranjang kosong</p>
            <p className="mt-1 text-xs text-slate-400">
              Klik produk untuk menambahkan ke keranjang.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 24 }}
              className="mb-2 flex items-center gap-3 rounded-xl border border-slate-100 bg-surface p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{item.name}</p>
                <p className="text-xs font-semibold text-slate-400">
                  {formatCurrency(item.price)} / {item.unit}
                </p>
                <p className="mt-0.5 text-sm font-extrabold text-primary-darker">
                  {formatCurrency(item.price * item.qty)}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onDecrease(item.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100"
                    aria-label="Kurangi"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="w-7 text-center text-sm font-extrabold text-ink">{item.qty}</span>
                  <button
                    onClick={() => onIncrease(item.id)}
                    disabled={item.qty >= item.stock}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary bg-primary-light text-primary-darker transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Tambah"
                  >
                    <Plus size={13} />
                  </button>
                </div>
                <button
                  onClick={() => onRemove(item.id)}
                  className="flex items-center gap-1 text-xs font-semibold text-red-400 transition hover:text-red-600"
                >
                  <Trash2 size={12} />
                  Hapus
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
