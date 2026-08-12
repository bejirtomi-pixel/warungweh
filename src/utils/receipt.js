function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(Number(value) || 0);
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildStyle(paperSize) {
  const is80 = paperSize === '80';
  const pageWidth = is80 ? '80mm' : '58mm';
  const bodyWidth = is80 ? '72mm' : '48mm';
  const imgWidth = is80 ? '190' : '130';
  const storeSize = is80 ? '15px' : '13px';
  const bodySize = is80 ? '11px' : '10.5px';

  return `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { height: auto; }
  body { width: ${bodyWidth}; margin: 0 auto; font-family: 'Consolas','Courier New','Lucida Console',monospace; font-size: ${bodySize}; line-height: 1.3; color: #000; page-break-inside: avoid; }
  .sheet { page-break-inside: avoid; page-break-after: avoid; }
  .logo-box { width: 100%; height: ${is80 ? '64px' : '58px'}; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  img.logo { max-width: ${imgWidth}px; max-height: 100%; width: auto; height: auto; object-fit: contain; }
  .center { text-align: center; }
  .store { font-size: ${storeSize}; font-weight: bold; letter-spacing: 0.5px; }
  .muted { font-size: 9.5px; }
  .sep { border-top: 1px dashed #000; margin: 2px 0; }
  .row { display: flex; justify-content: space-between; width: 100%; }
  .row > span:last-child { text-align: right; white-space: nowrap; }
  .item-name { font-weight: bold; white-space: normal; overflow-wrap: anywhere; padding-top: 1.5px; }
  .item-line { font-size: 10px; }
  .total-line { font-size: 13px; font-weight: bold; border-top: 1px dashed #000; padding-top: 2px; margin-top: 2px; }
  .notice { font-size: 9px; text-align: center; }
  .qr { margin-top: 3px; text-align: center; }
`;
}

export function openThermalReceipt({ transaction, storeProfile, paperSize = '58' }) {
  const fmt = formatNumber;
  const line = (left, right, cls = '') =>
    `<div class="row ${cls}"><span>${left}</span><span>${right}</span></div>`;
  const center = (txt, cls = '') => `<div class="center ${cls}">${txt}</div>`;
  const sep = '<div class="sep"></div>';

  const itemsHTML = transaction.items
    .map((it) => {
      const total = it.harga * it.qty;
      return (
        `<div class="item-name">${escapeHtml(it.nama)}</div>` +
        `<div class="row item-line"><span>${it.qty} x ${fmt(it.harga)}</span><span>${fmt(total)}</span></div>`
      );
    })
    .join('');

  const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>Struk ${escapeHtml(transaction.id)}</title>
<style>
@page { size: ${paperSize === '80' ? '80mm' : '58mm'} auto; margin: 0; }
${buildStyle(paperSize)}
</style>
</head>
<body>
<div class="sheet">
  <div class="logo-box center"><img class="logo" src="/logo.jpg" alt="Logo" /></div>
  <div class="center store">${escapeHtml(storeProfile.nama)}</div>
  <div class="center muted">${escapeHtml(storeProfile.alamat)}</div>
  <div class="center muted">Telp/WA: ${escapeHtml(storeProfile.telepon)}</div>
  ${sep}
  ${line('No', escapeHtml(transaction.id), 'muted')}
  ${line('Waktu', escapeHtml(transaction.tanggal), 'muted')}
  ${line('Kasir', escapeHtml(transaction.kasir), 'muted')}
  ${line('Pelanggan', escapeHtml(transaction.customer), 'muted')}
  ${line('Metode', escapeHtml(transaction.metode), 'muted')}
  ${sep}
  ${itemsHTML}
  ${sep}
  ${line('Subtotal', fmt(transaction.items.reduce((s, i) => s + i.harga * i.qty, 0)))}
  ${line('Total', fmt(transaction.total), 'total-line')}
  ${line('Bayar', fmt(transaction.paid))}
  ${line('Kembali', fmt(transaction.change))}
  ${sep}
  <div class="center notice">${escapeHtml(storeProfile.footerStruk)}</div>
  <div class="center notice">~ ${escapeHtml(transaction.id)} ~</div>
  <div class="center muted">Dicetak oleh Qurmacel POS</div>
</div>
<script>
  function printReceipt() {
    var img = document.querySelector('img.logo');
    var ready = Promise.resolve();
    if (img && !img.complete) {
      ready = img.decode ? img.decode() : new Promise(function (resolve) { img.onload = resolve; img.onerror = resolve; });
    }
    ready.then(function () {
      setTimeout(function () { window.focus(); window.print(); }, 150);
    });
  }
  window.addEventListener('load', printReceipt);
  window.addEventListener('afterprint', function () {
    setTimeout(function () { window.close(); }, 200);
  });
<\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=420,height=640');
  if (!win) {
    alert('Browser memblokir pop-up.\nIzinkan pop-up agar struk dapat dicetak.');
    return null;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  return win;
}

export function openTestReceipt({ storeProfile, paperSize = '58' }) {
  const fmt = formatNumber;
  const line = (left, right, cls = '') =>
    `<div class="row ${cls}"><span>${left}</span><span>${right}</span></div>`;
  const center = (txt, cls = '') => `<div class="center ${cls}">${txt}</div>`;
  const sep = '<div class="sep"></div>';

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const tanggal = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>Uji Cetak Qurmacel POS</title>
<style>
@page { size: ${paperSize === '80' ? '80mm' : '58mm'} auto; margin: 0; }
${buildStyle(paperSize)}
</style>
</head>
<body>
<div class="sheet">
  <div class="logo-box center"><img class="logo" src="/logo.jpg" alt="Logo" /></div>
  <div class="center store">${escapeHtml(storeProfile.nama)}</div>
  <div class="center muted">${escapeHtml(storeProfile.alamat)}</div>
  <div class="center muted">Telp/WA: ${escapeHtml(storeProfile.telepon)}</div>
  ${sep}
  <div class="center" style="font-weight:bold;">TEST CETAK STRUK ${paperSize === '80' ? '80mm' : '58mm'}</div>
  ${center('Printer termal POS - 58mm / 80mm')}
  ${sep}
  ${line('Waktu', tanggal)}
  ${line('Alamat IP', 'localhost')}
  ${sep}
  ${line('Es Teh Manis', '6.000')}
  ${line('  2 x 6.000', '12.000')}
  ${line('Kopi Susu Gula Aren', '18.000')}
  ${line('Nasi Goreng Kampung', '20.000')}
  ${sep}
  ${line('Total', '50.000', 'total-line')}
  ${line('Bayar', '50.000')}
  ${line('Kembali', '0')}
  ${sep}
  <div class="center notice">Jika struk ini tercetak, printer Anda sudah berjalan dengan benar.</div>
  <div class="center notice">~ TEST CETAK ~</div>
  <div class="center muted">Dicetak oleh Qurmacel POS</div>
</div>
<script>
  function printReceipt() {
    var img = document.querySelector('img.logo');
    var ready = Promise.resolve();
    if (img && !img.complete) {
      ready = img.decode ? img.decode() : new Promise(function (resolve) { img.onload = resolve; img.onerror = resolve; });
    }
    ready.then(function () {
      setTimeout(function () { window.focus(); window.print(); }, 150);
    });
  }
  window.addEventListener('load', printReceipt);
  window.addEventListener('afterprint', function () {
    setTimeout(function () { window.close(); }, 200);
  });
<\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=420,height=640');
  if (!win) {
    alert('Browser memblokir pop-up.\nIzinkan pop-up agar struk dapat dicetak.');
    return null;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  return win;
}
