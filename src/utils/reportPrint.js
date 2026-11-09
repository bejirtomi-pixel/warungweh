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

/**
 * openReportPrint - Membuka jendela cetak formal A4 untuk Laporan Penjualan & Pengiriman
 */
export function openReportPrint({
  title = 'Laporan Penjualan',
  subtitle = 'Rekapitulasi Transaksi QurmacelPOS',
  periodLabel = 'Semua Periode',
  storeProfile = {},
  summaryCards = [],
  columns = [],
  rows = [],
  footerTotals = null,
}) {
  const storeName = storeProfile?.nama || storeProfile?.storeName || 'Qurmacel POS';
  const storeAddress = storeProfile?.alamat || storeProfile?.address || 'Jl. Toko Qurmacel';
  const storePhone = storeProfile?.telepon || storeProfile?.phone || '';
  const printDate = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const cardsHtml = summaryCards
    .map(
      (c) => `
      <div class="summary-card">
        <div class="card-label">${escapeHtml(c.label)}</div>
        <div class="card-value">${escapeHtml(c.value)}</div>
        ${c.subtext ? `<div class="card-subtext">${escapeHtml(c.subtext)}</div>` : ''}
      </div>
    `
    )
    .join('');

  const tableHeaderHtml = columns
    .map(
      (col) => `
      <th style="text-align: ${col.align || 'left'}; width: ${col.width || 'auto'};">
        ${escapeHtml(col.header)}
      </th>
    `
    )
    .join('');

  const tableBodyHtml = rows
    .map(
      (row, idx) => `
      <tr class="${idx % 2 === 0 ? 'even' : 'odd'}">
        ${columns
          .map((col) => {
            const val = col.accessor(row, idx);
            return `<td style="text-align: ${col.align || 'left'};">${val}</td>`;
          })
          .join('')}
      </tr>
    `
    )
    .join('');

  let tableFooterHtml = '';
  if (footerTotals) {
    tableFooterHtml = `
      <tfoot>
        <tr class="footer-row">
          ${columns
            .map((col, idx) => {
              const val = footerTotals[col.key] || (idx === 0 ? 'TOTAL' : '');
              return `<td style="text-align: ${col.align || 'left'}; font-weight: bold;">${val}</td>`;
            })
            .join('')}
        </tr>
      </tfoot>
    `;
  }

  const html = `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)} - ${escapeHtml(storeName)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm 12mm 10mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      color: #1e293b;
      line-height: 1.4;
      background: #fff;
      padding: 10px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #059669;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .store-info h1 {
      font-size: 18px;
      color: #065f46;
      font-weight: 800;
      letter-spacing: -0.3px;
    }
    .store-info p {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
    }
    .report-meta {
      text-align: right;
    }
    .report-meta h2 {
      font-size: 14px;
      font-weight: 800;
      color: #1e293b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .report-meta .period {
      font-size: 10.5px;
      font-weight: 600;
      color: #059669;
      margin-top: 2px;
    }
    .report-meta .date {
      font-size: 9.5px;
      color: #94a3b8;
      margin-top: 1px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .summary-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #f8fafc;
      padding: 8px 12px;
    }
    .card-label {
      font-size: 9.5px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
    }
    .card-value {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 2px;
    }
    .card-subtext {
      font-size: 8.5px;
      color: #64748b;
      margin-top: 1px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      margin-bottom: 16px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      padding: 7px 8px;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    td {
      padding: 6px 8px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: middle;
    }
    tr.even { background: #ffffff; }
    tr.odd { background: #f8fafc; }
    tr.footer-row td {
      background: #f1f5f9;
      border-top: 2px solid #cbd5e1;
      border-bottom: 2px solid #cbd5e1;
      font-size: 10.5px;
      font-weight: 800;
      color: #0f172a;
      padding: 8px;
    }
    .badge {
      display: inline-block;
      padding: 1.5px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 600;
    }
    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-warning { background: #fef3c7; color: #b45309; }
    .badge-danger { background: #fee2e2; color: #b91c1c; }
    .badge-info { background: #e0f2fe; color: #0369a1; }
    .badge-neutral { background: #f1f5f9; color: #475569; }
    .print-footer {
      border-top: 1px dashed #cbd5e1;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="store-info">
      <h1>${escapeHtml(storeName)}</h1>
      <p>${escapeHtml(storeAddress)}${storePhone ? ` · Telp: ${escapeHtml(storePhone)}` : ''}</p>
      <p>${escapeHtml(subtitle)}</p>
    </div>
    <div class="report-meta">
      <h2>${escapeHtml(title)}</h2>
      <div class="period">Periode: ${escapeHtml(periodLabel)}</div>
      <div class="date">Dicetak pada: ${printDate}</div>
    </div>
  </div>

  ${cardsHtml ? `<div class="summary-grid">${cardsHtml}</div>` : ''}

  <table>
    <thead>
      <tr>${tableHeaderHtml}</tr>
    </thead>
    <tbody>
      ${tableBodyHtml || '<tr><td colspan="10" style="text-align: center; padding: 20px; color: #94a3b8;">Tidak ada data pada periode ini</td></tr>'}
    </tbody>
    ${tableFooterHtml}
  </table>

  <div class="print-footer">
    <span>Dicetak secara otomatis oleh QurmacelPOS</span>
    <span>Halaman 1 / Dokumen Resmi Toko</span>
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.focus();
        window.print();
      }, 350);
    });
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=1000,height=750');
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
  } else {
    // Fallback if popup blocked
    window.print();
  }
}
