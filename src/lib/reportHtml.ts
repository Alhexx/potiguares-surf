import { buildAuditTable, JudgeCol } from './heatAudit';
import { CompetitionResults } from './results';
import { Wave } from './wsl';

const esc = (s: string) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

const fmt = (n: number | null) => (n === null ? '—' : n.toFixed(1));

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

export interface HeatReportInput {
  compName: string;
  catName: string;
  heatName: string;
  judges: JudgeCol[];
  athletes: { name: string; lycra: string }[];
  waves: Wave[];
}

/** Relatório de UMA bateria: grade juiz×onda por atleta (auditoria organizada em tabela). */
export function buildHeatReportHtml(input: HeatReportInput): string {
  const { compName, catName, heatName, judges, athletes, waves } = input;
  const date = new Date().toLocaleString('pt-BR');

  const tables = athletes
    .map((a) => {
      const t = buildAuditTable(waves, a.name, judges);
      const judgeHeaders = judges.map((j) => `<th>${esc(j.label)}</th>`).join('');

      const rows = t.rows
        .map(
          (r) => `
          <tr>
            <td class="wave">Onda ${r.waveNumber}</td>
            ${r.cells.map((c) => `<td class="num">${fmt(c)}</td>`).join('')}
            <td class="num media">${fmt(r.media)}</td>
          </tr>`,
        )
        .join('');

      const finalRow = `
        <tr class="final">
          <td>Nota Final</td>
          ${t.perJudgeTotal.map((v) => `<td class="num">${fmt(v)}</td>`).join('')}
          <td class="num media">${t.officialTotal}</td>
        </tr>`;

      const body = t.rows.length > 0
        ? `${rows}${finalRow}`
        : `<tr><td colspan="${judges.length + 2}" class="muted">Nenhuma nota ainda.</td></tr>`;

      return `
        <h3>${esc(a.name)} <span class="muted">(${esc(a.lycra)})</span></h3>
        <table>
          <thead><tr><th></th>${judgeHeaders}<th>Média</th></tr></thead>
          <tbody>${body}</tbody>
        </table>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<style>
  * { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; }
  body { color: #111827; padding: 24px; }
  h1 { font-size: 22px; margin: 0 0 4px; color: #0284C7; }
  h2 { font-size: 15px; margin: 4px 0 16px; color: #374151; font-weight: normal; }
  h3 { font-size: 14px; margin: 20px 0 6px; color: #111827; }
  .sub { color: #6B7280; font-size: 12px; margin-bottom: 4px; }
  .muted { color: #9CA3AF; font-weight: normal; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 8px; }
  th, td { border: 1px solid #E5E7EB; padding: 6px 8px; text-align: center; }
  th { background: #F3F4F6; }
  td.wave { text-align: left; font-weight: 600; }
  td.media { font-weight: bold; color: #0284C7; background: #F0F9FF; }
  tr.final { background: #FEF9C3; font-weight: bold; }
</style></head>
<body>
  <h1>${esc(heatName)}</h1>
  <h2>${esc(compName)} — ${esc(catName)}</h2>
  <div class="sub">Relatório gerado em ${esc(date)}</div>
  ${tables || '<p class="muted">Sem atletas.</p>'}
</body></html>`;
}
