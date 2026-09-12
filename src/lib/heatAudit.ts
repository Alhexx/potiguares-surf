import type { Wave } from './wsl.ts';
import { waveAverage } from './wsl.ts';

export interface JudgeCol {
  id: string;
  label: string; // "Árbitro 1", "Árbitro 2"...
}

export interface AuditRow {
  waveNumber: number;
  cells: (number | null)[]; // uma por juiz, na mesma ordem de JudgeCol[]
  media: number | null; // null = ainda faltam juízes pontuarem essa onda
}

export interface AuditTable {
  rows: AuditRow[];
  /** soma das 2 melhores notas DAQUELE juiz sozinho — pra comparar com o oficial e achar destoante */
  perJudgeTotal: (number | null)[];
  /** igual ao calculateWSL: soma das 2 melhores médias oficiais (só ondas fechadas) */
  officialTotal: string;
}

/**
 * Monta a grade juiz×onda de um atleta numa bateria — é a auditoria de notas
 * reorganizada em tabela, sem dado novo.
 */
export function buildAuditTable(waves: Wave[], athleteName: string, judges: JudgeCol[]): AuditTable {
  const athleteWaves = waves.filter((w) => w.athlete === athleteName);
  const maxWave = athleteWaves.reduce((m, w) => Math.max(m, w.waveNumber), 0);

  const rows: AuditRow[] = [];
  for (let wn = 1; wn <= maxWave; wn++) {
    const cells = judges.map((j) => athleteWaves.find((w) => w.waveNumber === wn && w.judgeId === j.id)?.score ?? null);
    const given = cells.filter((c): c is number => c !== null);
    const media = judges.length > 0 && given.length === judges.length ? waveAverage(given) : null;
    rows.push({ waveNumber: wn, cells, media });
  }

  const perJudgeTotal = judges.map((j) => {
    const scores = athleteWaves.filter((w) => w.judgeId === j.id).map((w) => w.score);
    if (scores.length === 0) return null;
    const top2 = [...scores].sort((a, b) => b - a).slice(0, 2);
    return top2.reduce((a, b) => a + b, 0);
  });

  const medias = rows.map((r) => r.media).filter((m): m is number => m !== null);
  medias.sort((a, b) => b - a);
  const officialTotal = medias.slice(0, 2).reduce((a, b) => a + b, 0);

  return { rows, perJudgeTotal, officialTotal: officialTotal.toFixed(2) };
}
