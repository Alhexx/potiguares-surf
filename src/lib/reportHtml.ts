import { CompetitionResults } from './results';

const esc = (s: string) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

/** HTML de uma página A4 para virar PDF (expo-print) ou impressão no navegador. */
export function buildReportHtml(r: CompetitionResults): string {
  const date = r.generatedAt.toLocaleString('pt-BR');

  const categories = r.categories
    .map((cat) => {
      if (cat.heats.length === 0) {
        return `<h2>${esc(cat.name)}</h2><p class="muted">Nenhuma bateria encerrada.</p>`;
      }
      const heats = cat.heats
        .map((h) => {
          const rows = h.ranking
            .map(
              (a, i) => `
              <tr>
                <td class="pos">${i + 1}º</td>
                <td>${esc(a.name || 'Sem nome')}</td>
                <td>${esc(a.lycra || '-')}</td>
                <td class="num">${a.onda1}</td>
                <td class="num">${a.onda2}</td>
                <td class="num total">${a.total}</td>
              </tr>`,
            )
            .join('');
          return `
            <h3>${esc(h.name)}</h3>
            <table>
              <thead>
                <tr><th>#</th><th>Atleta</th><th>Lycra</th><th>Onda 1</th><th>Onda 2</th><th>Total</th></tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>`;
        })
        .join('');
      return `<h2>${esc(cat.name)}</h2>${heats}`;
    })
    .join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<style>
  * { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; }
  body { color: #111827; padding: 24px; }
  h1 { font-size: 22px; margin: 0 0 4px; color: #0284C7; }
  h2 { font-size: 17px; margin: 28px 0 8px; border-bottom: 2px solid #0284C7; padding-bottom: 4px; }
  h3 { font-size: 14px; margin: 16px 0 6px; color: #374151; }
  .sub { color: #6B7280; font-size: 12px; margin-bottom: 4px; }
  .muted { color: #9CA3AF; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #E5E7EB; padding: 6px 8px; text-align: left; }
  th { background: #F3F4F6; }
  td.pos { width: 34px; font-weight: bold; }
  td.num { text-align: right; width: 60px; }
  td.total { font-weight: bold; color: #0284C7; }
  tr:first-child td { background: #FEF9C3; }
</style></head>
<body>
  <h1>${esc(r.name)}</h1>
  ${r.location ? `<div class="sub">📍 ${esc(r.location)}</div>` : ''}
  <div class="sub">Relatório gerado em ${esc(date)}</div>
  ${categories || '<p class="muted">Sem categorias.</p>'}
</body></html>`;
}
