/**
 * Fetch a Google Font as an ArrayBuffer, suitable for passing into
 * `next/og`'s ImageResponse. We load the full weight (latin + latin-ext for
 * Turkish) rather than a text subset, OG images are cached so the size hit
 * is one-time, and subsetting fragile-breaks when a char isn't listed.
 */
export async function loadGoogleFont(
  family: string,
  _unused: string,
  weight: 400 | 500 | 600 | 700 = 700,
): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family,
  )}:wght@${weight}&display=swap`;

  // Satori (ImageResponse) only supports TTF/OTF, not woff2. We send an older
  // User-Agent so Google Fonts returns truetype instead of woff2.
  const css = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A",
    },
  }).then((r) => r.text());

  // Satori supports ttf, otf and woff (but not woff2). Match the first of those.
  const match = css.match(/src: url\(([^)]+)\) format\('(truetype|opentype|woff)'\)/);
  if (!match) {
    throw new Error(`Google Font kaynağı bulunamadı (TTF/OTF/WOFF): ${family}`);
  }

  const fontResponse = await fetch(match[1]);
  if (!fontResponse.ok) {
    throw new Error(`Google Font indirilemedi: ${family}`);
  }
  return fontResponse.arrayBuffer();
}
