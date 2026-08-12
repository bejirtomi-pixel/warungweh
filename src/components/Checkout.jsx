import React, { useEffect, useState } from 'react';
import { Banknote, QrCode, ArrowRightLeft, CreditCard } from 'lucide-react';
import { formatCurrency, parseNumber } from '../utils/formatCurrency';

const PAYMENT_METHODS = [
  { id: 'Cash', label: 'Cash', icon: Banknote },
  { id: 'QRIS', label: 'QRIS', icon: QrCode },
  { id: 'Transfer', label: 'Transfer', icon: ArrowRightLeft },
];

export default function Checkout({ items, subtotal, resetToken, onComplete }) {
  const [discount, setDiscount] = useState('');
  const [paid, setPaid] = useState('');
  const [method, setMethod] = useState('Cash');
  const [paidError, setPaidError] = useState('');

  useEffect(() => {
    setDiscount('');
    setPaid('');
    setMethod('Cash');
    setPaidError('');
  }, [resetToken]);

  const discountValue = Math.min(parseNumber(discount), subtotal);
  const discountTooHigh = parseNumber(discount) > subtotal;
  const total = subtotal - discountValue;
  const paidValue = parseNumber(paid);
  const change = paidValue - total;
  const enough = paidValue >= total;

  const canPay = items.length > 0 && total > 0 && enough && !discountTooHigh;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (discountTooHigh) return;
    if (paid === '') {
      setPaidError('Masukkan uang dibayar.');
      return;
    }
    if (paidValue < total) {
      setPaidError('Pembayaran belum cukup.');
      return;
    }
    setPaidError('');
    onComplete({ discount: discountValue, total, paid: paidValue, change, method });
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary-light';

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2 className="text-base font-extrabold text-ink">Pembayaran</h2>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Subtotal</span>
          <span className="font-bold text-ink">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-slate-500">Diskon (Rp)</span>
          <input
            type="number"
            min="0"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="0"
            className={`${inputClass} w-32 text-right`}
          />
        </div>
        {discountTooHigh && (
          <p className="text-right text-[11px] font-semibold text-red-500">
            Diskon tidak boleh melebihi subtotal.
          </p>
        )}
        <div className="flex items-center justify-between rounded-xl bg-primary-light px-4 py-3">
          <span className="text-sm font-bold text-primary-darker">Total</span>
          <span className="text-lg font-extrabold text-primary-darker">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-xs font-bold text-slate-600">Uang Dibayar (Rp)</label>
        <input
          type="number"
          min="0"
          value={paid}
          onChange={(e) => {
            setPaid(e.target.value);
            setPaidError('');
          }}
          placeholder="0"
          className={`${inputClass} ${paidError ? 'border-red-300 ring-2 ring-red-100' : ''}`}
        />
        {paidError && <p className="mt-1 text-[11px] font-semibold text-red-500">{paidError}</p>}

        <div className="mt-3 flex items-center justify-between rounded-xl bg-surface px-4 py-3 text-sm">
          <span className="font-semibold text-slate-500">Kembalian</span>
          <span className={`font-extrabold ${change >= 0 ? 'text-ink' : 'text-red-500'}`}>
            {change >= 0 ? formatCurrency(change) : '-Rp' + formatCurrency(Math.abs(change))}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-xs font-bold text-slate-600">Metode Pembayaran</label>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMethod(id)}
              className={[
                'flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-bold transition',
                method === id
                  ? 'border-primary bg-primary-light text-primary-darker'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50',
              ].join(' ')}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={!canPay}
        className={[
          'mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-extrabold transition active:scale-[0.99]',
          canPay
            ? 'bg-primary text-primary-darker shadow-md shadow-primary/40 hover:bg-primary-dark'
            : 'cursor-not-allowed bg-slate-100 text-slate-400',
        ].join(' ')}
      >
        <CreditCard size={18} />
        Bayar Sekarang
      </button>

      {items.length > 0 && paid !== '' && !enough && (
        <p className="mt-2 text-center text-[11px] font-semibold text-red-500">
          Pembayaran belum cukup.
        </p>
      )}
    </form>
  );
}
