/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = __dirname;
const outDir = path.join(root, "shape-variants");

const iconSvg = fs.readFileSync(path.join(root, "icon.svg"), "utf8");
const wordmarkSvg = fs.readFileSync(path.join(root, "wordmark.svg"), "utf8");

const iconInner = iconSvg
  .replace(/^<svg[^>]*>/, "")
  .replace(/<\/svg>\s*$/, "");

const wordmarkPathMatch = wordmarkSvg.match(/<path\s+([^>]+?)\/>/);

if (!wordmarkPathMatch) {
  throw new Error("wordmark.svg path could not be read");
}

const wordmarkDMatch = wordmarkPathMatch[1].match(/d="([^"]+)"/);

if (!wordmarkDMatch) {
  throw new Error("wordmark.svg path data could not be read");
}

const wordmarkD = wordmarkDMatch[1];

const originalT =
  "M83.5 27.03L53.54 27.03L53.54 112.79L29.81 112.79L29.81 27.03L0 27.03L0 7.76L83.5 7.76Z";
const shortT =
  "M83.5 27.03L53.54 27.03L53.54 104.5L29.81 104.5L29.81 27.03L0 27.03L0 7.76L83.5 7.76Z";
const compactT =
  "M78.6 27.03L52.12 27.03L52.12 104.5L31.24 104.5L31.24 27.03L4.9 27.03L4.9 7.76L78.6 7.76Z";

const originalRibbon =
  '<path d="M466.2 826.8L520.5 821.5L516.8 902.4L501.2 888.7L490.3 905.4L478.3 889.6L461.4 902.6Z" fill="#2E8B3C" fill-rule="evenodd"/>';
const cleanerRibbon =
  '<path d="M466.3 826.4L520.8 821.1L517.1 900.8L501.1 887.8L490.1 904.8L478.5 888.9L462 901.6Z" fill="#2E8B3C" fill-rule="evenodd"/>';
const softerRibbon =
  '<path d="M466.4 825.2L521.4 819.9L517.5 896.6C511.2 893 505.8 889 501.2 884.5C497.2 891.4 493.2 898 489.2 904.2C485.4 898.2 481.6 892.5 477.8 887.2C473 892.5 467.8 897.3 462.1 901.5Z" fill="#2E8B3C" fill-rule="evenodd"/>';

const variants = [
  {
    slug: "t-short",
    name: "T short",
    note: "Capital T stem is shorter, original icon preserved.",
    tPath: shortT,
    ribbonPath: originalRibbon,
  },
  {
    slug: "t-compact",
    name: "T compact",
    note: "Capital T is narrower and its stem is shorter.",
    tPath: compactT,
    ribbonPath: originalRibbon,
  },
  {
    slug: "ribbon-clean",
    name: "Ribbon clean",
    note: "Green bookmark is tighter and more balanced.",
    tPath: originalT,
    ribbonPath: cleanerRibbon,
  },
  {
    slug: "ribbon-soft",
    name: "Ribbon soft",
    note: "Green bookmark is slightly more organic.",
    tPath: originalT,
    ribbonPath: softerRibbon,
  },
  {
    slug: "t-short-ribbon-clean",
    name: "T short ribbon clean",
    note: "Shorter T plus the cleaner green bookmark.",
    tPath: shortT,
    ribbonPath: cleanerRibbon,
  },
  {
    slug: "t-compact-ribbon-soft",
    name: "T compact ribbon soft",
    note: "Narrower T plus the softer green bookmark.",
    tPath: compactT,
    ribbonPath: softerRibbon,
  },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function iconInnerFor(variant) {
  return iconInner.replace(originalRibbon, variant.ribbonPath);
}

function wordmarkDFor(variant) {
  return wordmarkD.replace(originalT, variant.tPath);
}

function iconSvgFor(variant) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${iconInnerFor(variant)}</svg>`;
}

function wordmarkPathFor(variant, transform = "") {
  const transformAttr = transform ? ` transform="${transform}"` : "";
  return `<path d="${wordmarkDFor(variant)}" fill="#EC1C24"${transformAttr}/>`;
}

function wordmarkSvgFor(variant) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="892" height="230" viewBox="0 0 446 115">${wordmarkPathFor(variant)}</svg>`;
}

function primarySvgFor(variant) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="512" viewBox="0 0 1400 512"><g transform="scale(.5)">${iconInnerFor(variant)}</g>${wordmarkPathFor(variant, "translate(610 198)")}</svg>`;
}

function dataUri(svg) {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function previewSvgFor(rendered) {
  const width = 1600;
  const height = 1200;
  const marginX = 90;
  const marginY = 112;
  const gapX = 70;
  const gapY = 80;
  const tileW = 680;
  const tileH = 250;
  const imageW = 590;
  const imageH = 216;
  const rows = rendered
    .map((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = marginX + col * (tileW + gapX);
      const y = marginY + row * (tileH + gapY);
      const imageX = x + 45;
      const imageY = y + 28;
      const labelY = y + tileH + 34;
      return `
  <g>
    <rect x="${x}" y="${y}" width="${tileW}" height="${tileH}" rx="24" fill="#FFF8F0" stroke="#E2D6C9" stroke-width="2"/>
    <image href="${dataUri(item.primarySvg)}" x="${imageX}" y="${imageY}" width="${imageW}" height="${imageH}" preserveAspectRatio="xMidYMid meet"/>
    <text x="${x}" y="${labelY}" fill="#191919" font-family="Arial, sans-serif" font-size="28" font-weight="700">${item.variant.name}</text>
    <text x="${x}" y="${labelY + 34}" fill="#7A7169" font-family="Arial, sans-serif" font-size="18">${item.variant.slug}</text>
  </g>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#FFF8F0"/>
  <text x="90" y="68" fill="#191919" font-family="Arial, sans-serif" font-size="42" font-weight="800">Tarifle shape variants</text>
  <text x="90" y="100" fill="#7A7169" font-family="Arial, sans-serif" font-size="20">T stem and green bookmark edits</text>
${rows}
</svg>`;
}

async function renderPng(svg, file, options = {}) {
  const image = sharp(Buffer.from(svg));

  if (options.resize) {
    image.resize(options.resize);
  }

  await image.png().toFile(file);
}

async function main() {
  ensureDir(outDir);

  const manifest = [];
  const rendered = [];

  for (const variant of variants) {
    const icon = iconSvgFor(variant);
    const wordmark = wordmarkSvgFor(variant);
    const primary = primarySvgFor(variant);

    const files = {
      iconSvg: `${variant.slug}-icon.svg`,
      iconPng: `${variant.slug}-icon.png`,
      wordmarkSvg: `${variant.slug}-wordmark.svg`,
      wordmarkPng: `${variant.slug}-wordmark.png`,
      primarySvg: `${variant.slug}-primary.svg`,
      primaryPng: `${variant.slug}-primary.png`,
    };

    fs.writeFileSync(path.join(outDir, files.iconSvg), icon);
    fs.writeFileSync(path.join(outDir, files.wordmarkSvg), wordmark);
    fs.writeFileSync(path.join(outDir, files.primarySvg), primary);

    await renderPng(icon, path.join(outDir, files.iconPng), {
      resize: { width: 512, height: 512 },
    });
    await renderPng(wordmark, path.join(outDir, files.wordmarkPng));
    await renderPng(primary, path.join(outDir, files.primaryPng));

    manifest.push({
      slug: variant.slug,
      name: variant.name,
      note: variant.note,
      files,
    });
    rendered.push({ variant, primarySvg: primary });
  }

  const preview = previewSvgFor(rendered);
  fs.writeFileSync(path.join(outDir, "preview.svg"), preview);
  await renderPng(preview, path.join(outDir, "preview.png"));
  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    JSON.stringify({ source: "tarifle-logo-21", variants: manifest }, null, 2)
  );

  console.log(`Generated ${variants.length} shape variants in ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
