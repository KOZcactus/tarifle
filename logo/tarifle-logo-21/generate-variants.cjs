/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = __dirname;
const outDir = path.join(root, "variants");

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

const variants = [
  {
    slug: "classic-red",
    name: "Classic red",
    note: "Current brand energy, preserved as a named baseline.",
    bg: "#EC1C24",
    main: "#FFF8F0",
    accent: "#FFC326",
    green: "#2E8B3C",
    word: "#EC1C24",
    tileBg: "#FFF8F0",
  },
  {
    slug: "cream-red",
    name: "Cream red",
    note: "Light app surfaces, softer and more editorial.",
    bg: "#FFF8F0",
    main: "#EC1C24",
    accent: "#F2B705",
    green: "#2E8B3C",
    word: "#151515",
    tileBg: "#FFF8F0",
  },
  {
    slug: "charcoal-cream",
    name: "Charcoal cream",
    note: "Dark mode and premium placements.",
    bg: "#20262B",
    main: "#FFF8F0",
    accent: "#F2B705",
    green: "#49A35B",
    word: "#FFF8F0",
    tileBg: "#20262B",
  },
  {
    slug: "basil-green",
    name: "Basil green",
    note: "Fresh food tone for seasonal or healthy contexts.",
    bg: "#247A42",
    main: "#FFF8F0",
    accent: "#FFC326",
    green: "#BFE8C5",
    word: "#247A42",
    tileBg: "#FFF8F0",
  },
  {
    slug: "tomato-warm",
    name: "Tomato warm",
    note: "Warmer red with less visual sharpness.",
    bg: "#D93025",
    main: "#FFF8F0",
    accent: "#F4B942",
    green: "#2E8B3C",
    word: "#D93025",
    tileBg: "#FFF8F0",
  },
  {
    slug: "transparent-mark",
    name: "Transparent mark",
    note: "No square background, useful for headers and badges.",
    bg: null,
    main: "#EC1C24",
    accent: "#F2B705",
    green: "#2E8B3C",
    word: "#151515",
    tileBg: "#FFF8F0",
  },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function recolorIconInner(variant) {
  let inner = iconInner;
  inner = inner.replaceAll('fill="#FFF8F0"', `fill="${variant.main}"`);
  inner = inner.replaceAll('stroke="#FFC326"', `stroke="${variant.accent}"`);
  inner = inner.replaceAll('fill="#2E8B3C"', `fill="${variant.green}"`);
  inner = inner.replace(
    '<rect width="1024" height="1024" fill="#EC1C24"/>',
    variant.bg
      ? `<rect width="1024" height="1024" fill="${variant.bg}"/>`
      : ""
  );
  return inner;
}

function iconSvgFor(variant) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${recolorIconInner(variant)}</svg>`;
}

function wordmarkPathFor(variant, transform = "") {
  const transformAttr = transform ? ` transform="${transform}"` : "";
  return `<path d="${wordmarkD}" fill="${variant.word}"${transformAttr}/>`;
}

function wordmarkSvgFor(variant) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="892" height="230" viewBox="0 0 446 115">${wordmarkPathFor(variant)}</svg>`;
}

function primarySvgFor(variant) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="512" viewBox="0 0 1400 512"><g transform="scale(.5)">${recolorIconInner(variant)}</g>${wordmarkPathFor(variant, "translate(610 198)")}</svg>`;
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
    <rect x="${x}" y="${y}" width="${tileW}" height="${tileH}" rx="24" fill="${item.variant.tileBg}" stroke="#E2D6C9" stroke-width="2"/>
    <image href="${dataUri(item.primarySvg)}" x="${imageX}" y="${imageY}" width="${imageW}" height="${imageH}" preserveAspectRatio="xMidYMid meet"/>
    <text x="${x}" y="${labelY}" fill="#191919" font-family="Arial, sans-serif" font-size="28" font-weight="700">${item.variant.name}</text>
    <text x="${x}" y="${labelY + 34}" fill="#7A7169" font-family="Arial, sans-serif" font-size="18">${item.variant.slug}</text>
  </g>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#FFF8F0"/>
  <text x="90" y="68" fill="#191919" font-family="Arial, sans-serif" font-size="42" font-weight="800">Tarifle logo variants</text>
  <text x="90" y="100" fill="#7A7169" font-family="Arial, sans-serif" font-size="20">SVG and PNG export pack</text>
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
      colors: {
        background: variant.bg,
        main: variant.main,
        accent: variant.accent,
        green: variant.green,
        wordmark: variant.word,
      },
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

  console.log(`Generated ${variants.length} logo variants in ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
