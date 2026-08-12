import React, { useState } from 'react';
import { Upload, X, ImageOff, Package } from 'lucide-react';
import Modal from './Modal';
import { useData } from '../context/DataContext';
import { DEFAULT_UNITS } from '../data/dummyProducts';
import { fileToDataUrl } from '../utils/image';

const emptyForm = {
  name: '',
  barcode: '',
  category: '',
  purchasePrice: '',
  sellingPrice: '',
  stock: '',
  unit: 'pcs',
  image: '',
};

function buildEmptyForm(categories) {
  return { ...emptyForm, category: categories[0] || 'Lainnya' };
}

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Nama barang wajib diisi.';
  if (!form.barcode.trim()) errors.barcode = 'Barcode wajib diisi.';
  const purchase = Number(form.purchasePrice);
  const selling = Number(form.sellingPrice);
  const stock = Number(form.stock);
  if (form.purchasePrice === '' || Number.isNaN(purchase) || purchase < 0)
    errors.purchasePrice = 'Harga beli harus angka dan tidak negatif.';
  if (form.sellingPrice === '' || Number.isNaN(selling) || selling < 0)
    errors.sellingPrice = 'Harga jual harus angka dan tidak negatif.';
  if (form.stock === '' || Number.isNaN(stock) || stock < 0)
    errors.stock = 'Stok harus angka dan tidak negatif.';
  return errors;
}

export default function ProductModal({ initial, onClose, onSubmit }) {
  const { categories } = useData();
  const [form, setForm] = useState(() => {
    if (initial) {
      return {
        name: initial.name || '',
        barcode: initial.barcode || '',
        category: initial.category || categories[0] || 'Lainnya',
        purchasePrice: initial.purchasePrice ?? '',
        sellingPrice: initial.sellingPrice ?? '',
        stock: initial.stock ?? '',
        unit: initial.unit || 'pcs',
        image: initial.image || '',
      };
    }
    return buildEmptyForm(categories);
  });
  const [errors, setErrors] = useState({});
  const [previewError, setPreviewError] = useState(false);

  const isEdit = Boolean(initial);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      set('image', dataUrl);
      setPreviewError(false);
    } catch {
      setPreviewError(true);
    } finally {
      e.target.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      name: form.name.trim(),
      barcode: form.barcode.trim(),
      category: form.category,
      purchasePrice: Number(form.purchasePrice) || 0,
      sellingPrice: Number(form.sellingPrice) || 0,
      stock: Number(form.stock) || 0,
      unit: form.unit,
      image: form.image,
    });
  };

  const inputClass = (hasError) =>
    [
      'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:ring-2',
      hasError
        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
        : 'border-slate-200 focus:border-primary focus:ring-primary-light',
    ].join(' ');

  return (
    <Modal
      title={isEdit ? 'Edit Barang' : 'Tambah Barang'}
      subtitle={isEdit ? 'Perbarui informasi produk' : 'Isi data produk baru'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">Nama Barang *</label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className={inputClass(errors.name)}
              placeholder="cth: Indomie Goreng"
            />
            {errors.name && <p className="mt-1 text-[11px] text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">Barcode *</label>
            <input
              value={form.barcode}
              onChange={(e) => set('barcode', e.target.value)}
              className={inputClass(errors.barcode)}
              placeholder="cth: 8997019300998"
            />
            {errors.barcode && <p className="mt-1 text-[11px] text-red-500">{errors.barcode}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">Kategori</label>
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className={inputClass(false)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">Satuan</label>
            <select
              value={form.unit}
              onChange={(e) => set('unit', e.target.value)}
              className={inputClass(false)}
            >
              {DEFAULT_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">Harga Beli (Rp) *</label>
            <input
              type="number"
              min="0"
              value={form.purchasePrice}
              onChange={(e) => set('purchasePrice', e.target.value)}
              className={inputClass(errors.purchasePrice)}
              placeholder="0"
            />
            {errors.purchasePrice && (
              <p className="mt-1 text-[11px] text-red-500">{errors.purchasePrice}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">Harga Jual (Rp) *</label>
            <input
              type="number"
              min="0"
              value={form.sellingPrice}
              onChange={(e) => set('sellingPrice', e.target.value)}
              className={inputClass(errors.sellingPrice)}
              placeholder="0"
            />
            {errors.sellingPrice && (
              <p className="mt-1 text-[11px] text-red-500">{errors.sellingPrice}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">Stok *</label>
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => set('stock', e.target.value)}
              className={inputClass(errors.stock)}
              placeholder="0"
            />
            {errors.stock && <p className="mt-1 text-[11px] text-red-500">{errors.stock}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-bold text-slate-600">Gambar Produk</label>
            <div className="flex items-start gap-3">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-surface">
                {form.image && !previewError ? (
                  <>
                    <img
                      src={form.image}
                      alt="Preview produk"
                      onError={() => setPreviewError(true)}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        set('image', '');
                        setPreviewError(false);
                      }}
                      className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white shadow transition hover:bg-red-600"
                      title="Hapus foto"
                    >
                      <X size={11} />
                    </button>
                  </>
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-surface text-slate-300">
                    {previewError ? <ImageOff size={20} /> : <Package size={24} />}
                    <span className="mt-1 text-[9px] text-slate-400">
                      {previewError ? 'Gagal dimuat' : 'No image'}
                    </span>
                  </div>
                )}
              </div>
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary bg-primary-light px-4 py-5 text-sm font-semibold text-primary-darker transition hover:bg-primary/20">
                <Upload size={16} />
                Pilih Gambar dari Komputer
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              Gambar dikompres otomatis dan disimpan di perangkat.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Batal
          </button>
          <button
            type="submit"
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-extrabold text-primary-darker shadow-md shadow-primary/40 transition hover:bg-primary-dark active:scale-[0.98]"
          >
            {isEdit ? 'Simpan Perubahan' : 'Simpan Barang'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
