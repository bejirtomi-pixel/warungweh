import QRCode from 'qrcode';

/**
 * Generate a QR Code Data URL (PNG)
 * @param {string} text - The payload/token to encode
 * @param {object} options - QRCode options
 * @returns {Promise<string>} Data URL string
 */
export async function generateTableQrDataUrl(text, options = {}) {
  const defaultOptions = {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    quality: 0.95,
    margin: 2,
    width: options.width || 400,
    color: {
      dark: '#0f172a', // slate-900
      light: '#ffffff',
    },
    ...options,
  };

  try {
    return await QRCode.toDataURL(text, defaultOptions);
  } catch (err) {
    console.error('Gagal generate QR Code:', err);
    throw err;
  }
}

/**
 * Download a generated QR Code Data URL as PNG
 * @param {string} dataUrl - The base64 data URL
 * @param {string} filename - Target filename (without extension or with .png)
 */
export function downloadTableQr(dataUrl, filename = 'qr-meja') {
  const cleanName = filename.endsWith('.png') ? filename : `${filename}.png`;
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = cleanName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Print a table tent / stand card with store branding and QR code
 * @param {object} params
 * @param {object} params.storeProfile
 * @param {object} params.table
 * @param {string} params.qrDataUrl
 */
export function printTableStandCard({ storeProfile, table, qrDataUrl }) {
  const storeName = storeProfile?.nama || 'Qurmacel Store';
  const logoSrc = storeProfile?.logo || '/logo.jpg';
  const tableName = table?.name || 'Meja';
  const qrToken = table?.qrToken || table?.id || '';

  const html = `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Kartu Meja - ${tableName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card-container {
      width: 100%;
      max-width: 440px;
      background: #ffffff;
      border: 2px dashed #94a3b8;
      border-radius: 24px;
      padding: 36px 28px;
      text-align: center;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
      position: relative;
    }
    .fold-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #64748b;
      background: #f1f5f9;
      padding: 4px 14px;
      border-radius: 999px;
      margin-bottom: 20px;
    }
    .header-logo {
      height: 48px;
      width: auto;
      max-width: 160px;
      object-fit: contain;
      margin: 0 auto 8px;
    }
    .store-name {
      font-size: 18px;
      font-weight: 800;
      color: #047857;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .store-sub {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 20px;
    }
    .table-box {
      background: #ecfdf5;
      border: 2px solid #a7f3d0;
      border-radius: 18px;
      padding: 12px 20px;
      margin-bottom: 24px;
    }
    .table-title {
      font-size: 26px;
      font-weight: 900;
      color: #065f46;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .table-desc {
      font-size: 11px;
      color: #047857;
      font-weight: 600;
    }
    .qr-frame {
      display: inline-block;
      background: #ffffff;
      border: 3px solid #0f172a;
      border-radius: 20px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
      margin-bottom: 20px;
    }
    .qr-img {
      width: 230px;
      height: 230px;
      display: block;
    }
    .scan-title {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .scan-guide {
      font-size: 12px;
      color: #475569;
      line-height: 1.5;
      max-width: 320px;
      margin: 0 auto 20px;
    }
    .card-footer {
      border-top: 1px dashed #cbd5e1;
      padding-top: 14px;
      font-size: 10px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    @media print {
      body {
        background: none;
        padding: 0;
      }
      .card-container {
        border-color: #cbd5e1;
        box-shadow: none;
        margin: 20px auto;
      }
    }
  </style>
</head>
<body>
  <div class="card-container">
    <div class="fold-badge">STAND KARTU MEJA</div>
    <div>
      <img src="${logoSrc}" alt="${storeName}" class="header-logo" onerror="this.style.display='none'" />
      <div class="store-name">${storeName}</div>
      <div class="store-sub">${storeProfile?.alamat || 'Qurmacel POS Point of Sale'}</div>
    </div>

    <div class="table-box">
      <div class="table-title">${tableName}</div>
      <div class="table-desc">IDENTIFIKASI MEJA DINE-IN</div>
    </div>

    <div class="qr-frame">
      <img src="${qrDataUrl}" alt="QR ${tableName}" class="qr-img" />
    </div>

    <div class="scan-title">Scan Untuk Pesan / Konfirmasi Meja</div>
    <div class="scan-guide">Arahkan kamera ponsel Anda untuk memesan atau sebutkan nama meja ini kepada kasir.</div>

    <div class="card-footer">
      <span>Token: ${qrToken}</span>
      <span>Qurmacel POS</span>
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 250);
    });
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=560,height=750');
  if (!win) {
    alert('Browser memblokir pop-up.\nIzinkan pop-up untuk mencetak kartu meja.');
    return;
  }
  win.document.write(html);
  win.document.close();
}
