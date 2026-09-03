/** true se a cor for clara o bastante para exigir texto escuro por cima. */
export function isLightColor(hex?: string): boolean {
  if (!hex) return false;
  const c = hex.replace('#', '');
  const full = c.length === 3 ? c.split('').map((x) => x + x).join('') : c;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return false;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6;
}

export const textOn = (hex?: string) => (isLightColor(hex) ? '#111827' : '#FFFFFF');
export const subTextOn = (hex?: string) => (isLightColor(hex) ? '#374151' : '#E5E7EB');
