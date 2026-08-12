import React, { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  User,
  Banknote,
  QrCode,
  Smartphone,
  CheckCircle2,
  ReceiptText,
  X,
  ShoppingBag,
  Printer,
} from 'lucide-react';
import Logo from '../components/common/Logo';
import LogoWatermark from '../components/common/LogoWatermark';
import { useData } from '../context/DataContext';
import { openThermalReceipt } from '../utils/receipt';

const paymentMethods = [
  { id: 'Tunai', label: 'Tunai', icon: Banknote },
  { id: 'QRIS', label: 'QRIS', icon: QrCode },
  { id: 'Transfer', label: 'Transfer', icon: Smartphone },
];

export default function Transaksi() {
  const { products, storeProfile, formatRupiah, addTransaction, printerSettings, updatePrinterSettings } = useData();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [method, setMethod] = useState('Tunai');
  const [customer, setCustomer] = useState('Umum');
  const [paid, setPaid] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);

  const paperSize = printerSettings.paperSize || '58';
  const is80 = paperSize === '80';

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.status === 'Aktif' &&
        (p.nama.toLowerCase().includes(search.toLowerCase()) ||
          p.kode.toLowerCase().includes(search.toLowerCase()))
    );
  }, [products, search]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, qty: Math.min(i.qty + 1, product.stok) } : i
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const subtotal = cart.reduce((sum, i) => sum + i.harga * i.qty, 0);
  const discount = 0;
  const tax = 0;
  const total = subtotal - discount + tax;
  const paidValue = Number(paid) || 0;
  const change = paidValue - total;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const tanggal = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const id = `TRX-${tanggal.split(' ')[0].replace(/-/g, '')}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    const trx = {
      id,
      tanggal,
      kasir: 'Admin',
      customer,
      items: cart.map((i) => ({ nama: i.nama, qty: i.qty, harga: i.harga })),
      total,
      metode: method,
      status: 'Selesai',
    };
    addTransaction(trx);
    const completed = { ...trx, paid: paidValue, change };
    setLastTransaction(completed);
    setShowReceipt(true);
    setCart([]);
    setPaid('');
    if (printerSettings.autoPrint) {
      setTimeout(() => openThermalReceipt({ transaction: completed, storeProfile, paperSize }), 300);
    }
  };

  const printReceipt = () => {
    if (!lastTransaction) return;
    openThermalReceipt({ transaction: lastTransaction, storeProfile, paperSize });
  };

  return (
    <div className="px-4 py-6 lg:px-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl font-extrabold text-slate-800 sm:text-2xl">Transaksi / Kasir</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pilih produk untuk membuat transaksi baru di Qurmacel Store.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Product grid */}
          <div className="xl:col-span-2">
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk untuk ditambahkan..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stok <= 0}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {product.foto ? (
                    <div className="h-24 w-full overflow-hidden rounded-xl bg-slate-100">
                      <img
                        src={product.foto}
                        alt={product.nama}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.closest('div').style.display = 'none';
                        }}
                        className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex h-24 w-full items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
                      <ShoppingBag size={26} />
                    </div>
                  )}
                  <p className="mt-3 line-clamp-2 text-sm font-semibold text-slate-800">
                    {product.nama}
                  </p>
                  <p className="mt-1 text-sm font-bold text-emerald-600">
                    {formatRupiah(product.harga)}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Stok: <b className={product.stok <= 10 ? 'text-red-600' : 'text-slate-600'}>{product.stok}</b>
                    </span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition group-hover:bg-emerald-600 group-hover:text-white">
                      <Plus size={13} />
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                <ShoppingCart size={32} className="text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-600">Produk tidak ditemukan</p>
              </div>
            )}
          </div>

          {/* Cart / checkout */}
          <div className="relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <LogoWatermark size="sm" />

            <div className="relative z-10 flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">Keranjang</h2>
                <p className="text-xs text-slate-500">{cart.length} item dipilih</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <ShoppingCart size={17} />
              </div>
            </div>

            {/* Cart items */}
            <div className="relative z-10 max-h-64 flex-1 overflow-y-auto px-5 py-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <ShoppingCart size={30} className="text-slate-200" />
                  <p className="mt-2 text-sm text-slate-400">Keranjang masih kosong</p>
                  <p className="text-xs text-slate-300">Pilih produk dari daftar di sebelah kiri</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {cart.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">{item.nama}</p>
                        <p className="text-xs text-slate-500">
                          {formatRupiah(item.harga)} × {item.qty}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="rounded-md bg-white p-1 text-slate-500 shadow-sm transition hover:text-red-600"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-slate-700">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="rounded-md bg-white p-1 text-slate-500 shadow-sm transition hover:text-emerald-600"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <span className="w-20 text-right text-sm font-bold text-slate-800">
                        {formatRupiah(item.harga * item.qty)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="rounded-md p-1 text-slate-300 transition hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Customer & payment */}
            <div className="relative z-10 space-y-3 border-t border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <User size={15} className="text-slate-400" />
                <input
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="Nama pelanggan"
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map((m) => {
                  const Icon = m.icon;
                  const active = method === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-semibold transition ${
                        active
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={17} />
                      {m.label}
                    </button>
                  );
                })}
              </div>

              {method !== 'Tunai' && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Pembayaran <b>{method}</b> — konfirmasi manual oleh kasir.
                </p>
              )}

              <div className="flex items-center gap-2">
                <Banknote size={15} className="text-slate-400" />
                <input
                  type="number"
                  min="0"
                  value={paid}
                  onChange={(e) => setPaid(e.target.value)}
                  placeholder="Jumlah dibayar"
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="relative z-10 space-y-1.5 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span className="font-medium text-slate-700">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>Diskon</span>
                <span className="font-medium text-emerald-600">-{formatRupiah(discount)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>Pajak</span>
                <span className="font-medium text-slate-700">{formatRupiah(tax)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-2.5">
                <span className="text-sm font-bold text-slate-800">Total</span>
                <span className="text-xl font-extrabold text-emerald-600">
                  {formatRupiah(total)}
                </span>
              </div>
              {paidValue >= total && total > 0 && (
                <div className="flex justify-between rounded-lg bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">
                  <span>Kembalian</span>
                  <span className="font-bold">{formatRupiah(change)}</span>
                </div>
              )}
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                <CheckCircle2 size={18} />
                Proses Pembayaran
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt modal */}
      {showReceipt && lastTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowReceipt(false)} />
          <div className="relative z-10 flex w-full max-w-md flex-col items-center">
            <div className="mb-3 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-emerald-600 shadow-xl no-print">
              <CheckCircle2 size={18} />
              Transaksi Berhasil!
            </div>

            {/* Paper size toggle */}
            <div className="mb-3 flex items-center gap-1 rounded-xl bg-white p-1 shadow-xl no-print">
              {['58', '80'].map((size) => (
                <button
                  key={size}
                  onClick={() => updatePrinterSettings({ paperSize: size })}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    paperSize === size
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {size} mm
                </button>
              ))}
              <span className="px-2 text-[10px] font-medium text-slate-400">ukuran kertas</span>
            </div>

            {/* Receipt paper - 58mm/80mm thermal preview */}
            <div
              id="receipt"
              className={`relative w-full rounded-t-2xl bg-white font-mono shadow-2xl ${
                is80 ? 'max-w-sm' : 'max-w-[220px]'
              }`}
            >
              <div className="flex flex-col items-center border-b border-dashed border-slate-300 px-3 pb-3 pt-5 text-center">
                <Logo size="sm" imgClassName="rounded" />
                <p className="mt-1.5 text-[13px] font-extrabold leading-tight text-slate-900">
                  {storeProfile.nama}
                </p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">
                  {storeProfile.alamat}
                  <br />
                  {storeProfile.telepon}
                </p>
              </div>

              <div className="border-b border-dashed border-slate-300 px-3 py-2.5 text-[10px] leading-relaxed text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">No</span>
                  <span className="text-right font-bold text-slate-800">{lastTransaction.id}</span>
                </div>
                <div className="mt-0.5 flex justify-between">
                  <span className="text-slate-400">Waktu</span>
                  <span>{lastTransaction.tanggal}</span>
                </div>
                <div className="mt-0.5 flex justify-between">
                  <span className="text-slate-400">Kasir</span>
                  <span>{lastTransaction.kasir}</span>
                </div>
                <div className="mt-0.5 flex justify-between">
                  <span className="text-slate-400">Pelanggan</span>
                  <span className="max-w-[70%] truncate">{lastTransaction.customer}</span>
                </div>
                <div className="mt-0.5 flex justify-between">
                  <span className="text-slate-400">Metode</span>
                  <span>{lastTransaction.metode}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-slate-300 px-3 py-2.5">
                {lastTransaction.items.map((item, i) => (
                  <div key={i} className="mb-1.5">
                    <p className="text-[10.5px] font-bold leading-tight text-slate-800">
                      {item.nama}
                    </p>
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>
                        {item.qty} x {formatRupiah(item.harga).replace('Rp', '').trim()}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {formatRupiah(item.harga * item.qty).replace('Rp', '').trim()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-3 py-2.5 text-[10.5px] leading-relaxed text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">
                    {formatRupiah(lastTransaction.items.reduce((s, i) => s + i.harga * i.qty, 0)).replace('Rp', '').trim()}
                  </span>
                </div>
                <div className="mt-1.5 flex justify-between border-t border-dashed border-slate-300 pt-1.5 text-[13px] font-extrabold text-slate-900">
                  <span>TOTAL</span>
                  <span>{formatRupiah(lastTransaction.total).replace('Rp', '').trim()}</span>
                </div>
                <div className="mt-1.5 flex justify-between">
                  <span>Bayar</span>
                  <span>{formatRupiah(lastTransaction.paid).replace('Rp', '').trim()}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-600">
                  <span>Kembali</span>
                  <span>{formatRupiah(lastTransaction.change).replace('Rp', '').trim()}</span>
                </div>
              </div>

              <div className="flex flex-col items-center border-t border-dashed border-slate-300 px-3 pb-4 pt-3 text-center">
                <p className="text-[9px] leading-relaxed text-slate-500">
                  {storeProfile.footerStruk}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[9px] text-slate-400">
                  <ReceiptText size={10} /> Qurmacel POS · {paperSize}mm
                </p>
              </div>
            </div>

            <div className="mt-3 flex w-full max-w-sm gap-3 no-print">
              <button
                onClick={printReceipt}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-xl shadow-emerald-600/30 transition hover:bg-emerald-500"
              >
                <Printer size={16} />
                Cetak Struk ({paperSize}mm)
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 rounded-xl bg-white py-3 text-sm font-bold text-slate-700 shadow-xl transition hover:bg-slate-100"
              >
                Transaksi Baru
              </button>
            </div>

            <p className="mt-3 max-w-sm rounded-xl bg-white/10 px-4 py-2 text-center text-[10px] leading-relaxed text-white no-print">
              Di dialog cetak: pilih printer POS <b>{paperSize}mm</b>, set <b>Margin: None</b> dan
              matikan <b>Header & Footer</b> untuk hasil struk yang rapi.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
