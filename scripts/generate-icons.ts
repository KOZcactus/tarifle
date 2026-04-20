/**
 * Generate PWA icons (192/512) and apple-touch-icon (180) from a single SVG.
 * Run once via: npx tsx scripts/generate-icons.ts
 */
import sharp from "sharp";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const PUBLIC_DIR = join(process.cwd(), "public");

function makeSvg(size: number): string {
  const radius = size * 0.22;
  const fontSize = size * 0.62;
  const letterY = size * 0.72;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff6b35"/>
      <stop offset="100%" stop-color="#e85d2c"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#g)"/>
  <text x="50%" y="${letterY}" font-family="Georgia, 'Times New Roman', serif"
        font-weight="700" font-size="${fontSize}" fill="#ffffff"
        text-anchor="middle" letter-spacing="-4">T</text>
</svg>`;
}

async function main(): Promise<void> {
  await mkdir(PUBLIC_DIR, { recursive: true });

  const targets = [
    { size: 192, name: "icon-192.png" },
    { size: 512, name: "icon-512.png" },
    { size: 180, name: "apple-touch-icon.png" },
    { size: 32, name: "favicon-32.png" },
  ];

  for (const { size, name } of targets) {
    const svg = makeSvg(size);
    const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
    const outPath = join(PUBLIC_DIR, name);
    await writeFile(outPath, buffer);
    console.log(`✓ ${name} (${size}x${size})`);
  }

  // Maskable variant (safe-zone-aware, centered "T" with extra padding)
  const maskableSvg = (() => {
    const size = 512;
    const radius = 0; // maskable icons are cropped by the OS
    const fontSize = size * 0.48;
    const letterY = size * 0.66;
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#e85d2c"/>
  <text x="50%" y="${letterY}" font-family="Georgia, 'Times New Roman', serif"
        font-weight="700" font-size="${fontSize}" fill="#ffffff"
        text-anchor="middle" letter-spacing="-3">T</text>
</svg>`;
  })();

  const maskableBuffer = await sharp(Buffer.from(maskableSvg)).png().toBuffer();
  await writeFile(join(PUBLIC_DIR, "icon-maskable-512.png"), maskableBuffer);
  console.log(`✓ icon-maskable-512.png (512x512)`);

  console.log("\nDone. Icons in /public/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
