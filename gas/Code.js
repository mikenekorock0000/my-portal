/**
 * 4月始まり 12か月カレンダーテンプレート (上下6か月ずつ) を生成
 * SVG (ベクター) と PDF を Google Drive のマイドライブ直下に保存します。
 *
 * 使い方:
 *   1. run() を実行 (初回はDrive権限の承認ダイアログが出ます)
 *   2. 実行ログ (表示 > ログ) に SVG/PDF の URL が出る
 *   3. PDF を iPad の GoodNotes に読み込み or テンプレート登録
 *
 * 仕様:
 *   - 4月始まりの 12 か月 (例: 2026/4 〜 2027/3)
 *   - 上段=4〜9月, 下段=10〜翌3月 (6か月ずつ)
 *   - 月曜始まり / 土=青, 日=赤
 *   - 1日マスは 300×260pt と大きめ → 拡大時に約400字メモ可
 *   - SVG/PDF 共にベクターなので、無限拡大しても解像度劣化なし
 */

const CONFIG = {
  CELL_W: 300,
  CELL_H: 260,
  HEADER_H: 90,
  DOW_H: 56,
  MONTH_GAP: 60,
  PAGE_PAD: 80,
  COLOR_SAT: '#1565C0',
  COLOR_SUN: '#C62828',
  COLOR_TEXT: '#222',
  COLOR_GRID: '#888',
  COLOR_HEAD_BG: '#F2F2F2',
  FONT: 'Helvetica, Arial, "Hiragino Sans", "Yu Gothic", sans-serif'
};

const MONTH_JP = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
const DOW_JP   = ['月','火','水','木','金','土','日'];

/** ここの数字を変えるだけで出力年を切り替え */
function run() {
  createCalendarTemplate(2026);
}

/**
 * @param {number} startYear 4月始まりの開始年 (例: 2026 → 2026/4〜2027/3)
 */
function createCalendarTemplate(startYear) {
  const months = [];
  for (let i = 0; i < 12; i++) {
    const m = (3 + i) % 12;
    const y = startYear + (i >= 9 ? 1 : 0);
    months.push({ year: y, month: m });
  }

  const monthW = CONFIG.CELL_W * 7;
  const monthH = CONFIG.HEADER_H + CONFIG.DOW_H + CONFIG.CELL_H * 6;
  const cols = 6, rows = 2;
  const totalW = CONFIG.PAGE_PAD * 2 + monthW * cols + CONFIG.MONTH_GAP * (cols - 1);
  const totalH = CONFIG.PAGE_PAD * 2 + monthH * rows + CONFIG.MONTH_GAP * (rows - 1);

  let body = '';
  for (let i = 0; i < 12; i++) {
    const r = Math.floor(i / 6);
    const c = i % 6;
    const x = CONFIG.PAGE_PAD + c * (monthW + CONFIG.MONTH_GAP);
    const y = CONFIG.PAGE_PAD + r * (monthH + CONFIG.MONTH_GAP);
    body += renderMonth(months[i].year, months[i].month, x, y);
  }

  const title = `${startYear}年度 (${startYear}.4 - ${startYear + 1}.3)`;
  const svg =
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}">
  <rect width="100%" height="100%" fill="white"/>
  <text x="${CONFIG.PAGE_PAD}" y="${CONFIG.PAGE_PAD * 0.7}" font-family="${CONFIG.FONT}" font-size="42" font-weight="bold" fill="${CONFIG.COLOR_TEXT}">${title}</text>
  ${body}
</svg>`;

  const baseName = `calendar_${startYear}_apr_start`;

  const svgBlob = Utilities.newBlob(svg, 'image/svg+xml', `${baseName}.svg`);
  const svgFile = DriveApp.createFile(svgBlob);

  const html =
`<!DOCTYPE html><html><head><meta charset="utf-8">
<style>@page { size: ${totalW}px ${totalH}px; margin: 0; } html,body{margin:0;padding:0;}</style>
</head><body>${svg}</body></html>`;
  const pdfBlob = Utilities.newBlob(html, 'text/html', `${baseName}.html`).getAs('application/pdf');
  pdfBlob.setName(`${baseName}.pdf`);
  const pdfFile = DriveApp.createFile(pdfBlob);

  Logger.log('SVG: ' + svgFile.getUrl());
  Logger.log('PDF: ' + pdfFile.getUrl());
}

function renderMonth(year, month, ox, oy) {
  const w = CONFIG.CELL_W, h = CONFIG.CELL_H;
  const monthW = w * 7;

  let s = `<g transform="translate(${ox},${oy})">`;
  s += `<text x="${monthW / 2}" y="${CONFIG.HEADER_H * 0.72}" font-family="${CONFIG.FONT}" font-size="56" font-weight="bold" text-anchor="middle" fill="${CONFIG.COLOR_TEXT}">${year}年 ${MONTH_JP[month]}</text>`;

  for (let i = 0; i < 7; i++) {
    const dx = i * w;
    const dy = CONFIG.HEADER_H;
    const color = i === 5 ? CONFIG.COLOR_SAT : i === 6 ? CONFIG.COLOR_SUN : CONFIG.COLOR_TEXT;
    s += `<rect x="${dx}" y="${dy}" width="${w}" height="${CONFIG.DOW_H}" fill="${CONFIG.COLOR_HEAD_BG}" stroke="${CONFIG.COLOR_GRID}" stroke-width="1.2"/>`;
    s += `<text x="${dx + w / 2}" y="${dy + CONFIG.DOW_H * 0.72}" font-family="${CONFIG.FONT}" font-size="30" font-weight="bold" text-anchor="middle" fill="${color}">${DOW_JP[i]}</text>`;
  }

  const first = new Date(year, month, 1);
  const startCol = (first.getDay() + 6) % 7;
  const lastDay = new Date(year, month + 1, 0).getDate();

  for (let week = 0; week < 6; week++) {
    for (let dow = 0; dow < 7; dow++) {
      const cx = dow * w;
      const cy = CONFIG.HEADER_H + CONFIG.DOW_H + week * h;
      const dayNum = week * 7 + dow - startCol + 1;
      const inMonth = dayNum >= 1 && dayNum <= lastDay;
      const fill = inMonth ? 'white' : '#FAFAFA';
      const color = dow === 5 ? CONFIG.COLOR_SAT : dow === 6 ? CONFIG.COLOR_SUN : CONFIG.COLOR_TEXT;

      s += `<rect x="${cx}" y="${cy}" width="${w}" height="${h}" fill="${fill}" stroke="${CONFIG.COLOR_GRID}" stroke-width="1.2"/>`;
      if (inMonth) {
        s += `<text x="${cx + 14}" y="${cy + 42}" font-family="${CONFIG.FONT}" font-size="36" font-weight="bold" fill="${color}">${dayNum}</text>`;
      }
    }
  }

  s += '</g>';
  return s;
}
