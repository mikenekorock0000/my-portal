/**
 * 4月始まり 12か月カレンダーテンプレート (上下6か月ずつ) を生成
 * SVG (ベクター) と PDF を Google Drive のマイドライブ直下に保存します。
 *
 * 使い方A: Web UI から (推奨)
 *   - GAS エディタ > 「デプロイ」> 「ウェブアプリ」として公開
 *   - 表示された URL を開き、年を選んで「生成」を押す
 *
 * 使い方B: スクリプト直実行
 *   - run() を実行 → 実行ログに SVG/PDF の URL が出る
 *
 * 仕様:
 *   - 4月始まりの 12 か月 (例: 2026/4 〜 2027/3)
 *   - 上段=4〜9月, 下段=10〜翌3月 (6か月ずつ)
 *   - 月曜始まり / 土=青, 日=赤
 *   - 1日マスは 300×260pt と大きめ → 拡大時に約400字メモ可
 *   - SVG/PDF 共にベクターなので、無限拡大しても解像度劣化なし
 */

/** Web App のエントリポイント (HTML を返す) */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('カレンダーテンプレート生成')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** クライアントから google.script.run で呼ぶ生成API */
function generate(startYear) {
  const y = parseInt(startYear, 10);
  if (!y || y < 1900 || y > 3000) {
    throw new Error('正しい西暦年(1900-3000)を指定してください');
  }
  const result = createCalendarTemplate(y);
  return result; // { svgUrl, pdfUrl, svgName, pdfName }
}

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
  COLOR_RULE: '#E8E8E8',     // 薄い罫線
  RULE_GAP: 26,              // 罫線の間隔
  RULE_TOP_OFFSET: 60,       // 日付の下から罫線開始
  FONT: 'Helvetica, Arial, "Hiragino Sans", "Yu Gothic", sans-serif'
};

/** 月ごとの色 (0=1月 ... 11=12月). main=タイトル/枠, bg=ヘッダ背景, dow=曜日行背景 */
const MONTH_COLORS = [
  { main: '#1E88E5', bg: '#BBDEFB', dow: '#E3F2FD' }, //  1月 winter blue
  { main: '#C2185B', bg: '#F8BBD0', dow: '#FCE4EC' }, //  2月 plum
  { main: '#7CB342', bg: '#DCEDC8', dow: '#F1F8E9' }, //  3月 spring green
  { main: '#EC407A', bg: '#FCE4EC', dow: '#FFF0F5' }, //  4月 sakura
  { main: '#43A047', bg: '#C8E6C9', dow: '#E8F5E9' }, //  5月 fresh green
  { main: '#5C6BC0', bg: '#C5CAE9', dow: '#E8EAF6' }, //  6月 hydrangea
  { main: '#00ACC1', bg: '#B2EBF2', dow: '#E0F7FA' }, //  7月 sea cyan
  { main: '#FBC02D', bg: '#FFF59D', dow: '#FFFDE7' }, //  8月 sunflower
  { main: '#FB8C00', bg: '#FFE0B2', dow: '#FFF3E0' }, //  9月 harvest
  { main: '#E53935', bg: '#FFCDD2', dow: '#FFEBEE' }, // 10月 maple red
  { main: '#8D6E63', bg: '#D7CCC8', dow: '#EFEBE9' }, // 11月 ginkgo brown
  { main: '#00695C', bg: '#B2DFDB', dow: '#E0F2F1' }  // 12月 deep teal
];

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

  const holidays = fetchJapaneseHolidays();

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
    body += renderMonth(months[i].year, months[i].month, x, y, holidays);
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

  return {
    svgUrl: svgFile.getUrl(),
    pdfUrl: pdfFile.getUrl(),
    svgName: svgFile.getName(),
    pdfName: pdfFile.getName()
  };
}

/**
 * 内閣府公式データに基づく日本の祝日 (2024〜2027)
 * 必要な年が増えたら下に追記してください。
 * 春分/秋分/振替/国民の休日 まで含む。
 */
const EMBEDDED_HOLIDAYS = {
  // 2024
  '2024-01-01': '元日',
  '2024-01-08': '成人の日',
  '2024-02-11': '建国記念の日',
  '2024-02-12': '休日 振替休日',
  '2024-02-23': '天皇誕生日',
  '2024-03-20': '春分の日',
  '2024-04-29': '昭和の日',
  '2024-05-03': '憲法記念日',
  '2024-05-04': 'みどりの日',
  '2024-05-05': 'こどもの日',
  '2024-05-06': '休日 振替休日',
  '2024-07-15': '海の日',
  '2024-08-11': '山の日',
  '2024-08-12': '休日 振替休日',
  '2024-09-16': '敬老の日',
  '2024-09-22': '秋分の日',
  '2024-09-23': '休日 振替休日',
  '2024-10-14': 'スポーツの日',
  '2024-11-03': '文化の日',
  '2024-11-04': '休日 振替休日',
  '2024-11-23': '勤労感謝の日',

  // 2025
  '2025-01-01': '元日',
  '2025-01-13': '成人の日',
  '2025-02-11': '建国記念の日',
  '2025-02-23': '天皇誕生日',
  '2025-02-24': '休日 振替休日',
  '2025-03-20': '春分の日',
  '2025-04-29': '昭和の日',
  '2025-05-03': '憲法記念日',
  '2025-05-04': 'みどりの日',
  '2025-05-05': 'こどもの日',
  '2025-05-06': '休日 振替休日',
  '2025-07-21': '海の日',
  '2025-08-11': '山の日',
  '2025-09-15': '敬老の日',
  '2025-09-23': '秋分の日',
  '2025-10-13': 'スポーツの日',
  '2025-11-03': '文化の日',
  '2025-11-23': '勤労感謝の日',
  '2025-11-24': '休日 振替休日',

  // 2026
  '2026-01-01': '元日',
  '2026-01-12': '成人の日',
  '2026-02-11': '建国記念の日',
  '2026-02-23': '天皇誕生日',
  '2026-03-20': '春分の日',
  '2026-04-29': '昭和の日',
  '2026-05-03': '憲法記念日',
  '2026-05-04': 'みどりの日',
  '2026-05-05': 'こどもの日',
  '2026-05-06': '休日 振替休日',
  '2026-07-20': '海の日',
  '2026-08-11': '山の日',
  '2026-09-21': '敬老の日',
  '2026-09-22': '休日 国民の休日',
  '2026-09-23': '秋分の日',
  '2026-10-12': 'スポーツの日',
  '2026-11-03': '文化の日',
  '2026-11-23': '勤労感謝の日',

  // 2027
  '2027-01-01': '元日',
  '2027-01-11': '成人の日',
  '2027-02-11': '建国記念の日',
  '2027-02-23': '天皇誕生日',
  '2027-03-21': '春分の日',
  '2027-03-22': '休日 振替休日',
  '2027-04-29': '昭和の日',
  '2027-05-03': '憲法記念日',
  '2027-05-04': 'みどりの日',
  '2027-05-05': 'こどもの日',
  '2027-07-19': '海の日',
  '2027-08-11': '山の日',
  '2027-09-20': '敬老の日',
  '2027-09-23': '秋分の日',
  '2027-10-11': 'スポーツの日',
  '2027-11-03': '文化の日',
  '2027-11-23': '勤労感謝の日'
};

/** 日本の祝日 (yyyy-MM-dd → 名前) を返す。静的データ。 */
function fetchJapaneseHolidays() {
  return EMBEDDED_HOLIDAYS;
}

/** デバッグ用: 祝日が取れているかをログに出す */
function testHolidays() {
  const h = fetchJapaneseHolidays();
  const keys = Object.keys(h).sort();
  Logger.log('total: ' + keys.length);
  ['2026','2027'].forEach(y => {
    const ks = keys.filter(k => k.startsWith(y));
    Logger.log(y + ': ' + ks.length + '件');
    ks.forEach(k => Logger.log('  ' + k + ' ' + h[k]));
  });
}

function dateKey(year, month0, day) {
  const m = String(month0 + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  }[c]));
}

function renderMonth(year, month, ox, oy, holidays) {
  const w = CONFIG.CELL_W, h = CONFIG.CELL_H;
  const monthW = w * 7;
  const monthH = CONFIG.HEADER_H + CONFIG.DOW_H + h * 6;
  const mc = MONTH_COLORS[month];

  let s = `<g transform="translate(${ox},${oy})">`;

  // タイトル帯 (月の色)
  s += `<rect x="0" y="0" width="${monthW}" height="${CONFIG.HEADER_H}" fill="${mc.bg}"/>`;
  s += `<text x="${monthW / 2}" y="${CONFIG.HEADER_H * 0.72}" font-family="${CONFIG.FONT}" font-size="56" font-weight="bold" text-anchor="middle" fill="${mc.main}">${year}年 ${MONTH_JP[month]}</text>`;

  // 曜日ヘッダ (月のうす色背景)
  for (let i = 0; i < 7; i++) {
    const dx = i * w;
    const dy = CONFIG.HEADER_H;
    const color = i === 5 ? CONFIG.COLOR_SAT : i === 6 ? CONFIG.COLOR_SUN : CONFIG.COLOR_TEXT;
    s += `<rect x="${dx}" y="${dy}" width="${w}" height="${CONFIG.DOW_H}" fill="${mc.dow}" stroke="${CONFIG.COLOR_GRID}" stroke-width="1.2"/>`;
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
      const fill = inMonth ? 'white' : '#ECECEC';

      const holidayName = inMonth ? (holidays && holidays[dateKey(year, month, dayNum)]) : null;
      let color;
      if (holidayName) color = CONFIG.COLOR_SUN;
      else if (dow === 5) color = CONFIG.COLOR_SAT;
      else if (dow === 6) color = CONFIG.COLOR_SUN;
      else color = CONFIG.COLOR_TEXT;

      s += `<rect x="${cx}" y="${cy}" width="${w}" height="${h}" fill="${fill}" stroke="${CONFIG.COLOR_GRID}" stroke-width="1.2"/>`;

      if (inMonth) {
        // 日付番号
        s += `<text x="${cx + 14}" y="${cy + 42}" font-family="${CONFIG.FONT}" font-size="36" font-weight="bold" fill="${color}">${dayNum}</text>`;

        // 祝日名 (右上に小さく赤)
        if (holidayName) {
          const name = holidayName.length > 9 ? holidayName.substring(0, 8) + '…' : holidayName;
          s += `<text x="${cx + w - 12}" y="${cy + 38}" font-family="${CONFIG.FONT}" font-size="18" font-weight="bold" text-anchor="end" fill="${CONFIG.COLOR_SUN}">${escapeXml(name)}</text>`;
        }

        // 薄い罫線 (拡大時に書きやすい)
        const lineEndY = cy + h - 12;
        const inset = 12;
        for (let ly = cy + CONFIG.RULE_TOP_OFFSET; ly <= lineEndY; ly += CONFIG.RULE_GAP) {
          s += `<line x1="${cx + inset}" y1="${ly}" x2="${cx + w - inset}" y2="${ly}" stroke="${CONFIG.COLOR_RULE}" stroke-width="0.6"/>`;
        }
      }
    }
  }

  // 月全体を月の色の枠で囲む (判別性アップ)
  s += `<rect x="0" y="0" width="${monthW}" height="${monthH}" fill="none" stroke="${mc.main}" stroke-width="3"/>`;

  s += '</g>';
  return s;
}
