import type { Wave } from './wsl.ts';
import { applyInterference, waveAverage } from './wsl.ts';

export interface JudgeCol {
  id: string;
  label: string; // "Árbitro 1", "Árbitro 2"...
}

export interface AuditRow {
  waveNumber: number;
  cells: (number | null)[]; // uma por juiz, na mesma ordem de JudgeCol[]
  media: number | null; // null = ainda faltam juízes pontuarem essa onda
  /** true quando essa onda foi descartada pela penalidade de interferência */
  discarded: boolean;
}

export interface AuditTable {
  rows: AuditRow[];
  /** soma das 2 melhores notas DAQUELE juiz sozinho, SEM penalidade — serve pra achar juiz destoante */
  perJudgeTotal: (number | null)[];
  /** total oficial, já com a penalidade de interferência aplicada */
  officialTotal: string;
  interferences: number;
  disqualified: boolean;
  penalized: boolean;
}

/**
 * Monta a grade juiz×onda de um atleta numa bateria — é a auditoria de notas
 * reorganizada em tabela, sem dado novo.
 */
export function buildAuditTable(
  waves: Wave[],
  athleteName: string,
  judges: JudgeCol[],
  interferences = 0,
): AuditTable {
  const athleteWaves = waves.filter((w) => w.athlete === athleteName);
  const maxWave = athleteWaves.reduce((m, w) => Math.max(m, w.waveNumber), 0);

  const rows: AuditRow[] = [];
  for (let wn = 1; wn <= maxWave; wn++) {
    const cells = judges.map((j) => athleteWaves.find((w) => w.waveNumber === wn && w.judgeId === j.id)?.score ?? null);
    const given = cells.filter((c): c is number => c !== null);
    const media = judges.length > 0 && given.length === judges.length ? waveAverage(given) : null;
    rows.push({ waveNumber: wn, cells, media, discarded: false });
  }

  const perJudgeTotal = judges.map((j) => {
    const scores = athleteWaves.filter((w) => w.judgeId === j.id).map((w) => w.score);
    if (scores.length === 0) return null;
    const top2 = [...scores].sort((a, b) => b - a).slice(0, 2);
    return top2.reduce((a, b) => a + b, 0);
  });

  const medias = rows.map((r) => r.media).filter((m): m is number => m !== null);
  medias.sort((a, b) => b - a);
  const { counted, total, disqualified, penalized } = applyInterference(medias, interferences);

  // marca quais ondas NÃO entraram no total (pra tela riscar/apagar)
  const pool = [...counted];
  for (const r of rows) {
    if (r.media === null) continue;
    const i = pool.indexOf(r.media);
    if (i >= 0) pool.splice(i, 1); // essa onda conta
    else r.discarded = true;
  }

  return {
    rows,
    perJudgeTotal,
    officialTotal: total.toFixed(2),
    interferences,
    disqualified,
    penalized,
  };
}
