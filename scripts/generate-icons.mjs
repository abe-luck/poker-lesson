// アプリアイコン (PWA / ホーム画面用) を SVG から作る。
// 使い方: node scripts/generate-icons.mjs  (手元の Chrome を使って PNG に書き出す)
import { writeFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const FELT = "#2f5d50";
const RIM = "#284f44";
const RED = "#b4443c";
const INK = "#1f2328";

/** カード2枚のイラスト。scale で余白を調整する (マスカブル用は小さめ) */
function cards(scale) {
  return `
  <g transform="translate(256 262) scale(${scale}) translate(-256 -262)">
    <g transform="rotate(-12 200 270)">
      <rect x="112" y="118" width="190" height="266" rx="22" fill="#ffffff" stroke="#d9d9d4" stroke-width="4"/>
      <text x="138" y="182" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="58" fill="${RED}">K</text>
      <path transform="translate(-86 -30) scale(0.9) translate(28 36)" d="M252 332c-28-22-48-40-48-62 0-16 12-28 27-28 9 0 17 5 21 12 4-7 12-12 21-12 15 0 27 12 27 28 0 22-20 40-48 62z" fill="${RED}"/>
    </g>
    <g transform="rotate(10 312 262)">
      <rect x="214" y="128" width="190" height="266" rx="22" fill="#ffffff" stroke="#d9d9d4" stroke-width="4"/>
      <text x="240" y="192" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="58" fill="${INK}">A</text>
      <path d="M352 268c-30 22-52 40-52 62 0 16 12 28 27 28 10 0 18-5 22-12-2 14-7 24-15 32h36c-8-8-13-18-15-32 4 7 12 12 22 12 15 0 27-12 27-28 0-22-22-40-52-62z" fill="${INK}"/>
    </g>
  </g>`;
}

/** rounded: 角丸の背景 (通常アイコン) / 全面の背景 (マスカブル) */
function svg({ rounded, scale }) {
  const bg = rounded
    ? `<rect width="512" height="512" rx="112" fill="${FELT}"/><rect x="16" y="16" width="480" height="480" rx="98" fill="none" stroke="${RIM}" stroke-width="16"/>`
    : `<rect width="512" height="512" fill="${FELT}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${bg}${cards(scale)}</svg>`;
}

const outputs = [
  { file: "public/icons/icon-192.png", size: 192, rounded: true, scale: 1 },
  { file: "public/icons/icon-512.png", size: 512, rounded: true, scale: 1 },
  // マスカブル: 端末ごとに円や角丸に切り抜かれるので、絵を中央 80% に収める
  { file: "public/icons/maskable-512.png", size: 512, rounded: false, scale: 0.72 },
  { file: "src/app/apple-icon.png", size: 180, rounded: false, scale: 0.86 },
];

mkdirSync("public/icons", { recursive: true });
writeFileSync("src/app/icon.svg", svg({ rounded: true, scale: 1 }));

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
for (const o of outputs) {
  await page.setViewportSize({ width: o.size, height: o.size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${svg(o).replace("<svg ", `<svg width="${o.size}" height="${o.size}" `)}</body></html>`,
  );
  await page.screenshot({ path: o.file, omitBackground: true, clip: { x: 0, y: 0, width: o.size, height: o.size } });
  console.log("wrote", o.file);
}
await browser.close();
