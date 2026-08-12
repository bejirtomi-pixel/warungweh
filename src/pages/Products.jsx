import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../components/Toast';
import ProductTable from '../components/ProductTable';
import ProductModal from '../components/ProductModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { generateProductId } from '../utils/generateTransactionId';

const PER_PAGE = 8;

export default function Products() {
  const { products, categories, addProduct, updateProduct, deleteProduct } = useData();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchSearch =
        !keyword ||
        p.name.toLowerCase().includes(keyword) ||
        String(p.barcode || '').toLowerCase().includes(keyword);
      const matchCategory = category === 'Semua' || p.category === category;
      return matchSearch && matchCategory;
    });
  }, [products, search, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const openAdd = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleSubmit = (form) => {
    if (editingProduct) {
      updateProduct({ ...editingProduct, ...form });
      toast.show('Barang berhasil diperbarui');
    } else {
      addProduct({ ...form, id: generateProductId() });
      setPage(1);
      toast.show('Barang berhasil ditambahkan');
    }
    setModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteProduct(deleteTarget.id);
    toast.show('Barang berhasil dihapus');
    setDeleteTarget(null);
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary-light';

  return (
    <div className="px-4 py-6 lg:px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'tween', duration: 0.25 }}
          className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
        >
          <div>
            <h1 className="text-xl font-extrabold text-ink sm:text-2xl">Data Barang</h1>
            <p className="mt-1 text-sm text-slate-500">Kelola daftar produk, harga, dan stok.</p>
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-darker shadow-md shadow-primary/40 transition hover:bg-primary-dark active:scale-[0.98]"
          >
            <Plus size={17} />
            Tambah Barang
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'tween', duration: 0.25, delay: 0.05 }}
          className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
        >
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama atau barcode barang..."
              className={inputClass}
            />
          </div>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
          >
            <option value="Semua">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'tween', duration: 0.25, delay: 0.1 }}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <ProductTable
            products={paged}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
          />

          <div className="flex items-center justify-between border-t border-slate-100 bg-white px-5 py-3">
            <p className="text-xs text-slate-500">
              Menampilkan <b>{filtered.length === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1}</b>–
              <b>{Math.min(currentPage * PER_PAGE, filtered.length)}</b> dari <b>{filtered.length}</b>{' '}
              barang
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded-lg text-xs font-bold transition ${
                    currentPage === p
                      ? 'bg-primary text-primary-darker'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {modalOpen && (
        <ProductModal
          initial={editingProduct}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus Barang?"
        message={
          deleteTarget
            ? `Apakah kamu yakin ingin menghapus barang "${deleteTarget.name}"?`
            : ''
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
