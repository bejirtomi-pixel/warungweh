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
  const bodyWidth = is80 ? '72mm' : '48mm';
  const imgWidth = is80 ? '190' : '130';
  const storeSize = is80 ? '15px' : '13px';
  const bodySize = is80 ? '11px' : '10.5px';

  return `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { height: auto; }
  body { width: ${bodyWidth}; margin: 0 auto; font-family: 'Consolas','Courier New','Lucida Console',monospace; font-size: ${bodySize}; line-height: 1.3; color: #000; page-break-inside: avoid; }
  .sheet { position: relative; overflow: hidden; page-break-inside: avoid; page-break-after: avoid; }
  .watermark-container { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 0; }
  .watermark-img { width: 75%; max-width: ${is80 ? '220px' : '150px'}; opacity: 0.10; object-fit: contain; filter: grayscale(100%); }
  .content-wrap { position: relative; z-index: 1; }
  .logo-box { width: 100%; height: ${is80 ? '60px' : '52px'}; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 2px; }
  img.logo { max-width: ${imgWidth}px; max-height: 100%; width: auto; height: auto; object-fit: contain; }
  .center { text-align: center; }
  .store { font-size: ${storeSize}; font-weight: bold; letter-spacing: 0.5px; }
  .muted { font-size: 9.5px; color: #222; }
  .sep { border-top: 1px dashed #000; margin: 3px 0; }
  .row { display: flex; justify-content: space-between; width: 100%; }
  .row > span:last-child { text-align: right; white-space: nowrap; }
  .item-name { font-weight: bold; white-space: normal; overflow-wrap: anywhere; padding-top: 2px; }
  .item-line { font-size: 10px; }
  .total-line { font-size: 13px; font-weight: bold; border-top: 1px dashed #000; padding-top: 3px; margin-top: 3px; }
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

  const items = Array.isArray(transaction.items) ? transaction.items : [];
  const itemsHTML = items
    .map((it) => {
      const total = (Number(it.harga) || 0) * (Number(it.qty) || 0);
      const taxBadge = it.pajakAktif ? ` <span style="font-size:8.5px;font-weight:normal;">[${escapeHtml(it.pajakJenis || 'PPN')} ${it.pajakPersen || 0}%]</span>` : '';
      return (
        `<div class="item-name">${escapeHtml(it.nama)}${taxBadge}</div>` +
        `<div class="row item-line"><span>${it.qty} x ${fmt(it.harga)}</span><span>${fmt(total)}</span></div>`
      );
    })
    .join('');

  const calcSubtotal = items.reduce((s, i) => s + (Number(i.harga) || 0) * (Number(i.qty) || 0), 0);
  const subtotal = transaction.subtotal !== undefined ? transaction.subtotal : calcSubtotal;
  const discount = Number(transaction.discount) || 0;
  const shippingCost = Number(transaction.shippingCost) || 0;
  const pajakBarang = Number(transaction.pajakBarang) || 0;
  const pajakTransaksi = Number(transaction.pajakTransaksi) || 0;
  const totalPajak = Number(transaction.totalPajak ?? transaction.tax) || (pajakBarang + pajakTransaksi);

  let taxRows = '';
  if (pajakBarang > 0 && pajakTransaksi > 0) {
    taxRows += line('Pajak Barang', fmt(pajakBarang));
    taxRows += line(`Pajak Transaksi (${transaction.pajakTransaksiPersen || 0}%)`, fmt(pajakTransaksi));
  } else if (pajakBarang > 0) {
    taxRows += line('Pajak Barang', fmt(pajakBarang));
  } else if (pajakTransaksi > 0) {
    taxRows += line(`Pajak Transaksi (${transaction.pajakTransaksiPersen || 0}%)`, fmt(pajakTransaksi));
  } else if (totalPajak > 0) {
    taxRows += line('Pajak', fmt(totalPajak));
  }

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
  <div class="watermark-container">
    <img class="watermark-img" src="${escapeHtml(storeProfile?.logo || '/logo.jpg')}" alt="" />
  </div>
  <div class="content-wrap">
    <div class="logo-box center"><img class="logo" src="${escapeHtml(storeProfile?.logo || '/logo.jpg')}" alt="Logo" /></div>
    <div class="center store">${escapeHtml(storeProfile?.nama || 'WarungKu')}</div>
    <div class="center muted">${escapeHtml(storeProfile?.alamat || '')}</div>
    ${storeProfile?.telepon ? `<div class="center muted">Telp/WA: ${escapeHtml(storeProfile.telepon)}</div>` : ''}
    ${storeProfile?.npwp ? `<div class="center muted">NPWP: ${escapeHtml(storeProfile.npwp)}</div>` : ''}
    ${sep}
    ${(() => {
      const type = transaction.orderType;
      let label = '';
      if (type === 'dine_in' || (type === 'Diambil' && transaction.tableId)) {
        label = `[ DINE IN - ${escapeHtml(transaction.tableName || 'MEJA')} ]`;
      } else if (type === 'delivery' || type === 'Dikirim' || transaction.isDelivery) {
        label = '[ DELIVERY / PESAN ANTAR ]';
      } else if (type === 'pickup' || type === 'Diambil') {
        label = '[ PICKUP / AMBIL SENDIRI ]';
      }
      return label ? `<div class="center" style="font-weight:bold;font-size:11px;margin:2px 0;">${label}</div>` : '';
    })()}
    ${line('No', escapeHtml(transaction.id), 'muted')}
    ${line('Waktu', escapeHtml(transaction.tanggal || transaction.date || ''), 'muted')}
    ${line('Kasir', escapeHtml(transaction.kasir || 'Admin'), 'muted')}
    ${transaction.customer ? line('Pelanggan', escapeHtml(transaction.customer), 'muted') : ''}
    ${transaction.tableName ? line('Meja', escapeHtml(transaction.tableName), 'muted') : ''}
    ${transaction.sessionId ? line('Sesi', escapeHtml(transaction.sessionId.slice(-8)), 'muted') : ''}
    ${transaction.pickupCode ? line('Kode Ambil', escapeHtml(transaction.pickupCode), 'muted') : ''}
    ${transaction.pickupTime ? line('Waktu Ambil', escapeHtml(transaction.pickupTime), 'muted') : ''}
    ${transaction.deliveryAddress ? line('Alamat Kirim', escapeHtml(transaction.deliveryAddress), 'muted') : ''}
    ${transaction.deliveryCourier ? line('Kurir', escapeHtml(transaction.deliveryCourier), 'muted') : ''}
    ${line('Metode', escapeHtml(transaction.metode || transaction.paymentMethod || 'Tunai'), 'muted')}
    ${transaction.paymentStatus ? line('Status', transaction.paymentStatus === 'Lunas' ? 'LUNAS' : transaction.paymentStatus === 'Hutang' ? 'HUTANG' : 'BELUM LUNAS', 'muted') : ''}
    ${sep}
    ${itemsHTML}
    ${sep}
    ${line('Subtotal', fmt(subtotal))}
    ${discount > 0 ? line('Diskon', `-${fmt(discount)}`) : ''}
    ${taxRows}
    ${shippingCost > 0 ? line('Ongkir', `+${fmt(shippingCost)}`) : ''}
    ${line('Total', fmt(transaction.total), 'total-line')}
    ${line('Bayar', fmt(transaction.paid))}
    ${Number(transaction.change) > 0 ? line('Kembali', fmt(transaction.change)) : ''}
    ${sep}
    <div class="center notice">${escapeHtml(storeProfile?.footerStruk || 'Terima kasih telah berbelanja.')}</div>
    <div class="center notice">~ ${escapeHtml(transaction.id)} ~</div>
    <div class="center muted">Dicetak oleh Qurmacel POS</div>
  </div>
</div>
<script>
  function printReceipt() {
    var imgs = document.querySelectorAll('img');
    var promises = Array.from(imgs).map(function(img) {
      if (img.complete) return Promise.resolve();
      return img.decode ? img.decode() : new Promise(function(resolve) { img.onload = resolve; img.onerror = resolve; });
    });
    Promise.all(promises).then(function() {
      setTimeout(function () { window.focus(); window.print(); }, 150);
    });
  }
  window.addEventListener('load', printReceipt);
  window.addEventListener('afterprint', function () {
    setTimeout(function () { window.close(); }, 250);
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
  <div class="watermark-container">
    <img class="watermark-img" src="/logo.jpg" alt="" />
  </div>
  <div class="content-wrap">
    <div class="logo-box center"><img class="logo" src="/logo.jpg" alt="Logo" /></div>
    <div class="center store">${escapeHtml(storeProfile?.nama || 'WarungKu')}</div>
    <div class="center muted">${escapeHtml(storeProfile?.alamat || 'Jl. Raya Warung No. 1')}</div>
    <div class="center muted">Telp/WA: ${escapeHtml(storeProfile?.telepon || '0812-3456-7890')}</div>
    ${sep}
    <div class="center" style="font-weight:bold;">TEST CETAK STRUK ${paperSize === '80' ? '80mm' : '58mm'}</div>
    ${center('Printer termal POS - 58mm / 80mm')}
    ${sep}
    ${line('Waktu', tanggal)}
    ${line('Kasir', 'Admin')}
    ${line('Metode', 'Tunai')}
    ${sep}
    <div class="item-name">Es Teh Manis</div>
    ${line('  2 x 6.000', '12.000', 'item-line')}
    <div class="item-name">Kopi Susu Gula Aren <span style="font-size:8.5px;font-weight:normal;">[PPN 10%]</span></div>
    ${line('  1 x 18.000', '18.000', 'item-line')}
    <div class="item-name">Nasi Goreng Spesial</div>
    ${line('  1 x 20.000', '20.000', 'item-line')}
    ${sep}
    ${line('Subtotal', '50.000')}
    ${line('Pajak Barang', '1.800')}
    ${line('Total', '51.800', 'total-line')}
    ${line('Bayar', '60.000')}
    ${line('Kembali', '8.200')}
    ${sep}
    <div class="center notice">Jika struk ini tercetak dengan watermark logo, printer Anda sudah siap digunakan.</div>
    <div class="center notice">~ TEST CETAK ~</div>
    <div class="center muted">Dicetak oleh Qurmacel POS</div>
  </div>
</div>
<script>
  function printReceipt() {
    var imgs = document.querySelectorAll('img');
    var promises = Array.from(imgs).map(function(img) {
      if (img.complete) return Promise.resolve();
      return img.decode ? img.decode() : new Promise(function(resolve) { img.onload = resolve; img.onerror = resolve; });
    });
    Promise.all(promises).then(function() {
      setTimeout(function () { window.focus(); window.print(); }, 150);
    });
  }
  window.addEventListener('load', printReceipt);
  window.addEventListener('afterprint', function () {
    setTimeout(function () {
      try {
        window.close();
      } catch (error) {
        console.warn('Gagal menutup jendela struk:', error);
      }
    }, 250);
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

/**
 * openOrderSlipReceipt - Cetak Slip Pesanan Dapur / Antrean Kasir
 */
export function openOrderSlipReceipt({ order, storeProfile, paperSize = '58' }) {
  if (!order) return null;
  const fmt = formatNumber;
  const line = (left, right, cls = '') =>
    `<div class="row ${cls}"><span>${left}</span><span>${right}</span></div>`;
  const center = (txt, cls = '') => `<div class="center ${cls}">${txt}</div>`;
  const sep = '<div class="sep"></div>';

  const orderType = order.orderType || 'dine_in';
  let typeBadge = '';
  if (orderType === 'dine_in') {
    typeBadge = `*** DINE IN - ${escapeHtml(order.tableName || 'MEJA')} ***`;
  } else if (orderType === 'delivery') {
    typeBadge = '*** PESANAN DELIVERY ***';
  } else {
    typeBadge = `*** PICKUP - ${escapeHtml(order.pickupCode || 'AMBIL')} ***`;
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const itemsHTML = items
    .map((it) => {
      const notesHtml = it.notes
        ? `<div style="font-size: 9.5px; font-weight: bold; padding-left: 6px; color: #111;">&bull; Catatan: ${escapeHtml(it.notes)}</div>`
        : '';
      return (
        `<div class="row item-name" style="font-size: 11px;"><span>${it.qty} x ${escapeHtml(it.nama)}</span><span>${fmt((Number(it.harga) || 0) * (Number(it.qty) || 1))}</span></div>` +
        notesHtml
      );
    })
    .join('');

  const timeFormatted = order.createdAt
    ? new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : '';
  const dateFormatted = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' })
    : '';

  const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>Slip Pesanan ${escapeHtml(order.orderNumber || order.id)}</title>
<style>
@page { size: ${paperSize === '80' ? '80mm' : '58mm'} auto; margin: 0; }
${buildStyle(paperSize)}
.kitchen-header { font-size: 13px; font-weight: bold; text-align: center; margin-bottom: 2px; }
.type-badge { font-size: 12px; font-weight: bold; text-align: center; padding: 2px 0; border: 1px dashed #000; margin: 3px 0; }
</style>
</head>
<body>
<div class="sheet">
  <div class="content-wrap">
    <div class="kitchen-header">SLIP PESANAN / DAPUR</div>
    <div class="center muted">${escapeHtml(storeProfile?.nama || 'Qurmacel POS')}</div>
    <div class="type-badge">${typeBadge}</div>
    ${sep}
    ${line('No. Order', escapeHtml(order.orderNumber || order.id), 'muted')}
    ${line('Waktu', `${dateFormatted} ${timeFormatted}`, 'muted')}
    ${order.tableName ? line('Meja', escapeHtml(order.tableName), 'muted') : ''}
    ${order.sessionId ? line('Sesi Meja', escapeHtml(order.sessionId.slice(-8)), 'muted') : ''}
    ${line('Pelanggan', escapeHtml(order.customerName || 'Umum'), 'muted')}
    ${order.customerPhone ? line('No. HP', escapeHtml(order.customerPhone), 'muted') : ''}
    ${order.pickupCode ? line('Kode Ambil', escapeHtml(order.pickupCode), 'muted') : ''}
    ${order.pickupTime ? line('Waktu Ambil', escapeHtml(order.pickupTime), 'muted') : ''}
    ${order.deliveryAddress ? line('Alamat Kirim', escapeHtml(order.deliveryAddress), 'muted') : ''}
    ${order.courier ? line('Kurir', escapeHtml(order.courier), 'muted') : ''}
    ${order.source ? line('Sumber', order.source === 'qr_menu' ? 'QR Menu Meja' : 'Kasir POS', 'muted') : ''}
    ${sep}
    <div style="font-weight: bold; font-size: 10px; margin-bottom: 3px;">DAFTAR MENU:</div>
    ${itemsHTML}
    ${sep}
    ${order.notes ? `<div style="font-size: 10px; margin: 3px 0;"><b>Catatan Pesanan:</b><br/>${escapeHtml(order.notes)}</div>${sep}` : ''}
    ${line('Total Item', `${items.reduce((s, it) => s + (Number(it.qty) || 1), 0)} pcs`)}
    ${line('Estimasi Total', fmt(order.total), 'total-line')}
    ${line('Status Bayar', order.paymentStatus === 'paid' ? 'LUNAS' : 'BELUM DIBAYAR', 'muted')}
    ${sep}
    <div class="center notice">~ Harap proses pesanan sesuai urutan ~</div>
    <div class="center muted">Qurmacel POS Unified Order</div>
  </div>
</div>
<script>
  function printSlip() {
    window.focus();
    window.print();
  }
  window.addEventListener('load', function() {
    setTimeout(printSlip, 150);
  });
  window.addEventListener('afterprint', function () {
    setTimeout(function () {
      try { window.close(); } catch (e) {}
    }, 250);
  });
<\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=420,height=640');
  if (!win) {
    alert('Browser memblokir pop-up.\nIzinkan pop-up agar slip pesanan dapat dicetak.');
    return null;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  return win;
}
