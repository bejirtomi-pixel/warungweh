export function generateTransactionId() {
  const now = new Date();
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const randomPart = pad(Math.floor(Math.random() * 9000) + 1000, 4);
  return `TRX-${datePart}-${timePart}-${randomPart}`;
}

export function generateProductId() {
  return `PRD-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`.toUpperCase();
}
