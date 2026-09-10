/** "25/12/2026" -> "2026-12-25" (chave ordenável). Retorna '' se não parsear. */
export function brToISO(v: string): string {
  const m = v.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return '';
  const [, d, mo, y] = m;
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

/** "2026-12-25" -> "25/12/2026" */
export function isoToBR(v: string): string {
  const m = v.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return v;
  const [, y, mo, d] = m;
  return `${d}/${mo}/${y}`;
}
