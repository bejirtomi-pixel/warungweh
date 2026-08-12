import React, { useState } from 'react';
import { Pencil, Trash2, Package, PackageX } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

function ProductThumb({ src }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-gradient-to-br from-primary-light to-slate-100 text-primary-darker">
        <Package size={18} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt="Foto produk"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
      className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 bg-slate-100 object-cover shadow-sm"
    />
  );
}

export function getStockStatus(stock) {
  if (stock <= 0) return { label: 'Habis', className: 'bg-red-50 text-red-600' };
  if (stock <= 10) return { label: 'Menipis', className: 'bg-accent-light text-accent-dark' };
  return { label: 'Aman', className: 'bg-emerald-50 text-emerald-600' };
}

export default function ProductTable({ products, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
            <th className="px-5 py-3.5 font-bold">Produk</th>
            <th className="px-5 py-3.5 font-bold">Barcode</th>
            <th className="px-5 py-3.5 font-bold">Kategori</th>
            <th className="px-5 py-3.5 text-right font-bold">Harga Beli</th>
            <th className="px-5 py-3.5 text-right font-bold">Harga Jual</th>
            <th className="px-5 py-3.5 text-center font-bold">Stok</th>
            <th className="px-5 py-3.5 text-center font-bold">Status</th>
            <th className="px-5 py-3.5 text-right font-bold">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {products.map((product) => {
            const status = getStockStatus(Number(product.stock) || 0);
            return (
              <tr key={product.id} className="bg-white transition hover:bg-primary-light/50">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <ProductThumb src={product.image} />
                    <span className="font-bold text-ink">{product.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-500">
                  {product.barcode || '-'}
                </td>
                <td className="px-5 py-3.5">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    {product.category}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right font-medium text-slate-500">
                  {formatCurrency(product.purchasePrice || 0)}
                </td>
                <td className="px-5 py-3.5 text-right font-extrabold text-primary-darker">
                  {formatCurrency(product.sellingPrice || 0)}
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span className={`font-bold ${Number(product.stock) <= 10 ? 'text-red-500' : 'text-ink'}`}>
                    {Number(product.stock) || 0}
                  </span>
                  <span className="ml-1 text-xs text-slate-400">{product.unit}</span>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}>
                    {status.label}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => onEdit(product)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-primary-light hover:text-primary-darker"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(product)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <PackageX size={26} />
          </div>
          <p className="mt-3 text-sm font-bold text-slate-600">Tidak ada barang ditemukan</p>
          <p className="text-xs text-slate-400">Coba ubah kata kunci atau filter pencarian.</p>
        </div>
      )}
    </div>
  );
}
