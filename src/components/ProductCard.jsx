import React from 'react';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

function Thumb({ src }) {
  const [error, setError] = React.useState(false);
  if (!src || error) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-darker">
        <Package size={22} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt="Produk"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
      className="h-16 w-16 shrink-0 rounded-xl border border-slate-100 bg-slate-100 object-cover"
    />
  );
}

export default function ProductCard({ product, onAdd, index = 0 }) {
  const stock = Number(product.stock) || 0;
  const soldOut = stock <= 0;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'tween', duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
      onClick={() => onAdd(product)}
      disabled={soldOut}
      className={[
        'group flex flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-all duration-200',
        soldOut
          ? 'cursor-not-allowed border-slate-100 opacity-60'
          : 'border-slate-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-lg',
      ].join(' ')}
    >
      <div className="flex items-center gap-3 p-3">
        <Thumb src={product.image} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">{product.name}</p>
          <p className="mt-0.5 text-xs font-medium text-slate-400">
            {product.category} · {stock} {product.unit}
          </p>
          <p className="mt-1 text-sm font-extrabold text-primary-darker">
            {formatCurrency(product.sellingPrice)}
          </p>
        </div>
      </div>
      <div
        className={[
          'py-2 text-center text-xs font-bold uppercase tracking-wide transition',
          soldOut
            ? 'bg-red-50 text-red-500'
            : 'bg-primary-light text-primary-darker group-hover:bg-primary',
        ].join(' ')}
      >
        {soldOut ? 'Stok Habis' : 'Tambah'}
      </div>
    </motion.button>
  );
}
