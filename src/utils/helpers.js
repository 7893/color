export const LIGHT_TEXT_HEX = '#FFFFFF';
export const DARK_TEXT_HEX = '#2C2C2E';

function parseHexRgb(hex) {
  const clean = hex.replace('#', '');
  const expanded = clean.length === 3
    ? clean.split('').map((ch) => ch + ch).join('')
    : clean;

  return [
    parseInt(expanded.slice(0, 2), 16),
    parseInt(expanded.slice(2, 4), 16),
    parseInt(expanded.slice(4, 6), 16),
  ];
}

function linearizeChannel(channel8Bit) {
  const srgb = channel8Bit / 255;
  return srgb <= 0.04045
    ? srgb / 12.92
    : ((srgb + 0.055) / 1.055) ** 2.4;
}

export function getRelativeLuminance(hex) {
  const [r, g, b] = parseHexRgb(hex);
  return (
    0.2126 * linearizeChannel(r) +
    0.7152 * linearizeChannel(g) +
    0.0722 * linearizeChannel(b)
  );
}

export function getContrastRatio(hexA, hexB) {
  const l1 = getRelativeLuminance(hexA);
  const l2 = getRelativeLuminance(hexB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getTextColorClass(hex) {
  const lightContrast = getContrastRatio(hex, LIGHT_TEXT_HEX);
  const darkContrast = getContrastRatio(hex, DARK_TEXT_HEX);
  return darkContrast > lightContrast ? 'text-dark' : 'text-light';
}

export function pickRandomColors(list, count) {
  const pool = [...list];
  const limit = Math.min(count, pool.length);

  for (let i = pool.length - 1; i > 0; i--) {
    const swapIndex = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[swapIndex]] = [pool[swapIndex], pool[i]];
  }

  return pool.slice(0, limit);
}
