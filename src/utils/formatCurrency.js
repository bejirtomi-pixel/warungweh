export function formatNumber(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('id-ID');
}

export function formatCurrency(value) {
  return `Rp${formatNumber(value)}`;
}

export function parseNumber(value) {
  const cleaned = String(value ?? '').replace(/[^0-9.-]/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}
