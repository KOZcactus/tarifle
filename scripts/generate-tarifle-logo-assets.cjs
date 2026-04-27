/* eslint-disable @typescript-eslint/no-require-imports -- .cjs dosyası, CommonJS require zorunlu */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "logo");
const DIRS = {
  png: path.join(OUT, "png"),
  jpg: path.join(OUT, "jpg"),
  all: path.join(OUT, "all"),
};

const RED = "#EC1C24";
const RED_DARK = "#B81218";
const CREAM = "#FFF8F0";
const DARK = "#1A1A1A";
const WHITE = "#FFFFFF";

for (const dir of Object.values(DIRS)) {
  fs.mkdirSync(dir, { recursive: true });
}

const esc = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function svgRoot(width, height, label, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title>${body}</svg>`;
}

function wordText(x, y, size, accent = RED, text = DARK, suffix = "") {
  const restX = x + size * 0.61;
  return `<text x="${x}" y="${y}" fill="${accent}" font-family="Inter, Geist, Arial, sans-serif" font-size="${size}" font-weight="820" letter-spacing="0">T</text><text x="${restX}" y="${y}" fill="${text}" font-family="Inter, Geist, Arial, sans-serif" font-size="${size}" font-weight="760" letter-spacing="0">arifle${suffix}</text>`;
}

function tagline(x, y, color = RED) {
  return `<text x="${x}" y="${y}" fill="${color}" font-family="Inter, Geist, Arial, sans-serif" font-size="24" font-weight="680" letter-spacing="0">Make Eat</text>`;
}

function c01Mark(id, color = RED) {
  return `<g><defs><mask id="${id}" maskUnits="userSpaceOnUse"><rect width="160" height="160" fill="white"/><circle cx="56" cy="48" r="18" fill="black"/><circle cx="80" cy="39" r="24" fill="black"/><circle cx="104" cy="48" r="18" fill="black"/><rect x="49" y="49" width="62" height="25" rx="12" fill="black"/><rect x="43" y="64" width="74" height="22" rx="10" fill="black"/><rect x="68" y="75" width="24" height="56" rx="9" fill="black"/></mask></defs><rect x="8" y="8" width="144" height="144" rx="34" fill="${color}" mask="url(#${id})"/></g>`;
}

function c02Mark(id, color = RED) {
  return `<g><circle cx="56" cy="49" r="18" fill="${color}"/><circle cx="80" cy="39" r="24" fill="${color}"/><circle cx="104" cy="49" r="18" fill="${color}"/><rect x="36" y="56" width="88" height="25" rx="12.5" fill="${color}"/><path d="M63 70c0-6 5-11 11-11h12c6 0 11 5 11 11v66c0 8-9 12-15 7l-2-2-2 2c-6 5-15 1-15-7V70z" fill="${color}"/><rect x="63" y="66" width="34" height="14" rx="7" fill="${color}"/></g>`;
}

function c03Mark(id, color = RED, accent = CREAM) {
  const fold = accent
    ? `<path d="M107 18v22c0 6 5 11 11 11h22l-33-33z" fill="${accent}" opacity="0.92"/><path d="M108 18v21c0 7 6 13 13 13h19" fill="none" stroke="${RED_DARK}" stroke-width="4" stroke-linecap="round" opacity="0.22"/>`
    : "";
  return `<g><defs><mask id="${id}" maskUnits="userSpaceOnUse"><rect width="160" height="160" fill="white"/><circle cx="56" cy="55" r="15" fill="black"/><circle cx="80" cy="48" r="20" fill="black"/><circle cx="104" cy="55" r="15" fill="black"/><rect x="50" y="56" width="60" height="20" rx="10" fill="black"/><rect x="47" y="71" width="66" height="20" rx="9" fill="black"/><rect x="69" y="86" width="22" height="45" rx="8" fill="black"/></mask></defs><path d="M36 18h71l33 33v73c0 11-9 20-20 20H36c-11 0-20-9-20-20V38c0-11 9-20 20-20z" fill="${color}" mask="url(#${id})"/>${fold}</g>`;
}

function c04Mark(id, color = RED) {
  return `<g><path d="M42 71h76c8 0 14-6 14-14s-6-14-14-14c-4 0-7 1-10 4-4-15-15-25-28-25S56 32 52 47c-3-3-6-4-10-4-8 0-14 6-14 14s6 14 14 14z" fill="${color}"/><path d="M50 66h60c6 0 11 5 11 11s-5 11-11 11H94v47c0 7-5 12-12 12h-4c-7 0-12-5-12-12V88H50c-6 0-11-5-11-11s5-11 11-11z" fill="${color}"/><rect x="72" y="83" width="16" height="48" rx="8" fill="${color}"/></g>`;
}

const concepts = [
  {
    key: "c01",
    slug: "toque-tile",
    title: "Toque Tile",
    mark: c01Mark,
    note: "Chef sapkasi negatif alandaki T ust formuna donusur.",
  },
  {
    key: "c02",
    slug: "recipe-tab",
    title: "Recipe Tab",
    mark: c02Mark,
    note: "T govdesi tarif kaydetme sekmesi gibi davranir.",
  },
  {
    key: "c03",
    slug: "folded-card",
    title: "Folded Card",
    mark: c03Mark,
    note: "Tarif karti ve gizli T tek geometrik blokta birlesir.",
  },
  {
    key: "c04",
    slug: "capline-t",
    title: "Capline T",
    mark: c04Mark,
    note: "Chef sapkasi T'nin ust cizgisini olusturur.",
  },
];

function makePrimary(concept, monoColor = null) {
  const color = monoColor || RED;
  const textColor = monoColor || DARK;
  const tagColor = monoColor || RED;
  const accent = monoColor ? null : CREAM;
  const body = `<g transform="translate(40 40)">${concept.mark(`${concept.key}-primary`, color, accent)}</g>${wordText(232, 122, 78, color, textColor)}${tagline(235, 162, tagColor)}`;
  return svgRoot(780, 240, `Tarifle ${concept.title} primary`, body);
}

function makeIcon(concept, color = RED, accent = CREAM) {
  const body = `<g transform="translate(32 32) scale(1.2)">${concept.mark(`${concept.key}-icon`, color, accent)}</g>`;
  return svgRoot(256, 256, `Tarifle ${concept.title} icon`, body);
}

function makeWordmark(concept, monoColor = null) {
  const color = monoColor || RED;
  const textColor = monoColor || DARK;
  const body = `${wordText(62, 122, 84, color, textColor)}${tagline(66, 163, color)}`;
  return svgRoot(560, 220, `Tarifle ${concept.title} wordmark`, body);
}

function makeFavicon(concept) {
  const body = `<g transform="translate(2 2) scale(0.375)">${concept.mark(`${concept.key}-favicon`, RED, CREAM)}</g>`;
  return svgRoot(64, 64, `Tarifle ${concept.title} favicon`, body);
}

function pdfFromJpeg(jpeg, width, height) {
  const objects = [];
  const add = (s) => {
    objects.push(Buffer.isBuffer(s) ? s : Buffer.from(s, "binary"));
  };
  add("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  add("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  add(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);
  add(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
  add(jpeg);
  add("\nendstream\nendobj\n");
  const content = `q\n${width} 0 0 ${height} 0 0 cm\n/Im0 Do\nQ\n`;
  add(`5 0 obj\n<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}endstream\nendobj\n`);
  const header = Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "binary");
  let offset = header.length;
  const offsets = [0];
  const body = [];
  for (const obj of objects) {
    offsets.push(offset);
    body.push(obj);
    offset += obj.length;
  }
  const xrefStart = offset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.concat([header, ...body, Buffer.from(xref, "binary"), Buffer.from(trailer, "binary")]);
}

function icoFromPngs(pngs) {
  const count = pngs.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  const entries = [];
  let offset = 6 + count * 16;
  for (const item of pngs) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(item.size >= 256 ? 0 : item.size, 0);
    entry.writeUInt8(item.size >= 256 ? 0 : item.size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(item.buffer.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += item.buffer.length;
  }
  return Buffer.concat([header, ...entries, ...pngs.map((item) => item.buffer)]);
}

async function rasterize(baseName, svg, kind) {
  fs.writeFileSync(path.join(DIRS.all, `${baseName}.svg`), svg, "utf8");
  const input = Buffer.from(svg);
  const sizes = kind === "favicon" ? [16, 32] : [512, 1024, 2048];
  for (const size of sizes) {
    const png = await sharp(input, { density: 384 })
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
    fs.writeFileSync(path.join(DIRS.png, `${baseName}-${size}.png`), png);
  }
  if (kind !== "favicon") {
    for (const size of [1024, 2048]) {
      const jpg = await sharp(input, { density: 384 })
        .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .flatten({ background: WHITE })
        .jpeg({ quality: 92, mozjpeg: true })
        .toBuffer();
      fs.writeFileSync(path.join(DIRS.jpg, `${baseName}-${size}.jpg`), jpg);
    }
    const webp = await sharp(input, { density: 384 })
      .resize(1024, 1024, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 92 })
      .toBuffer();
    fs.writeFileSync(path.join(DIRS.all, `${baseName}.webp`), webp);
    const jpegForPdf = await sharp(input, { density: 384 })
      .resize(1024, 1024, { fit: "contain", background: WHITE })
      .flatten({ background: WHITE })
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();
    fs.writeFileSync(path.join(DIRS.all, `${baseName}.pdf`), pdfFromJpeg(jpegForPdf, 1024, 1024));
  } else {
    const frames = [];
    for (const size of [16, 32, 48]) {
      const buffer = await sharp(input, { density: 384 })
        .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 9 })
        .toBuffer();
      frames.push({ size, buffer });
      if (size === 48) {
        fs.writeFileSync(path.join(DIRS.png, `${baseName}-${size}.png`), buffer);
      }
    }
    fs.writeFileSync(path.join(DIRS.all, `${baseName}.ico`), icoFromPngs(frames));
  }
}

function assetSet(concept) {
  return [
    { base: `tarifle-${concept.key}-logo-primary`, kind: "primary", svg: makePrimary(concept) },
    { base: `tarifle-${concept.key}-logo-icon`, kind: "icon", svg: makeIcon(concept) },
    { base: `tarifle-${concept.key}-logo-wordmark`, kind: "wordmark", svg: makeWordmark(concept) },
    { base: `tarifle-${concept.key}-logo-mono-dark`, kind: "mono-dark", svg: makePrimary(concept, WHITE) },
    { base: `tarifle-${concept.key}-logo-mono-light`, kind: "mono-light", svg: makePrimary(concept, DARK) },
    { base: `tarifle-${concept.key}-favicon`, kind: "favicon", svg: makeFavicon(concept) },
  ];
}

function previewSheet() {
  const cards = concepts
    .map((concept, index) => {
      const y = 70 + index * 340;
      const mark = `<g transform="translate(94 ${y + 74}) scale(0.9)">${concept.mark(`${concept.key}-sheet-mark`, RED, CREAM)}</g>`;
      const primary = `<g transform="translate(280 ${y + 64}) scale(0.72)"><g transform="translate(40 40)">${concept.mark(`${concept.key}-sheet-primary`, RED, CREAM)}</g>${wordText(232, 122, 78, RED, DARK)}${tagline(235, 162, RED)}</g>`;
      const darkPreview = `<rect x="1150" y="${y + 46}" width="430" height="210" rx="22" fill="#1A1A1A"/><g transform="translate(1188 ${y + 50}) scale(0.48)"><g transform="translate(40 40)">${concept.mark(`${concept.key}-sheet-dark`, WHITE, null)}</g>${wordText(232, 122, 78, WHITE, WHITE)}${tagline(235, 162, WHITE)}</g>`;
      return `<rect x="48" y="${y}" width="1544" height="290" rx="28" fill="#FFFFFF"/><text x="88" y="${y + 48}" fill="${DARK}" font-family="Inter, Geist, Arial, sans-serif" font-size="34" font-weight="780" letter-spacing="0">${concept.key.toUpperCase()} ${concept.title}</text><text x="88" y="${y + 248}" fill="#555555" font-family="Inter, Geist, Arial, sans-serif" font-size="22" font-weight="520" letter-spacing="0">${concept.note}</text>${mark}${primary}${darkPreview}`;
    })
    .join("");
  return svgRoot(1640, 1480, "Tarifle logo concept previews", `<rect width="1640" height="1480" fill="#F6F3EF"/>${cards}`);
}

async function main() {
  const written = [];
  for (const concept of concepts) {
    for (const asset of assetSet(concept)) {
      await rasterize(asset.base, asset.svg, asset.kind);
      written.push(asset.base);
    }
  }
  const sheetSvg = previewSheet();
  const sheetBase = "tarifle-logo-concepts-preview";
  fs.writeFileSync(path.join(DIRS.all, `${sheetBase}.svg`), sheetSvg, "utf8");
  const sheetPng = await sharp(Buffer.from(sheetSvg), { density: 192 })
    .resize(1640, 1480)
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(DIRS.all, `${sheetBase}.png`), sheetPng);
  const sheetJpg = await sharp(Buffer.from(sheetSvg), { density: 192 })
    .resize(1640, 1480)
    .flatten({ background: WHITE })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
  fs.writeFileSync(path.join(DIRS.all, `${sheetBase}.jpg`), sheetJpg);
  console.log(`Generated ${written.length} logo asset groups plus preview sheet.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
