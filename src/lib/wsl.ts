export interface Wave {
  id?: string;
  athlete: string;
  score: number;
  waveNumber: number;
  judgeId?: string;
  timestamp?: string;
}

export interface WSLResult {
  total: string;
  onda1: string;
  onda2: string;
  qtdOndas: number;
}

/** Valor de uma onda: média simples das notas; só descarta maior/menor com 5+ juízes. */
function waveValue(scores: number[]): number {
  if (scores.length >= 5) {
    const trimmed = [...scores].sort((a, b) => a - b).slice(1, -1);
    return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  }
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Resultado do atleta = soma das 2 melhores ondas.
 *
 * `totalJudges` (nº de juízes cadastrados): uma onda só entra na conta depois de
 * receber nota de TODOS os juízes. Enquanto faltar alguém, a onda não aparece.
 * Passe 0 só quando não há juízes cadastrados (sem trava).
 */
export function calculateWSL(
  waves: Wave[],
  athleteName: string,
  totalJudges = 0,
): WSLResult {
  const byWave: Record<number, number[]> = {};
  for (const w of waves) {
    if (w.athlete !== athleteName) continue;
    (byWave[w.waveNumber] ??= []).push(w.score);
  }

  const waveAverages: number[] = [];
  for (const scores of Object.values(byWave)) {
    if (totalJudges > 0 && scores.length < totalJudges) continue; // aguarda todos os juízes
    waveAverages.push(waveValue(scores));
  }

  waveAverages.sort((a, b) => b - a);
  const top2 = waveAverages.slice(0, 2);
  const total = top2.reduce((a, b) => a + b, 0);

  return {
    total: total.toFixed(2),
    onda1: top2[0]?.toFixed(2) ?? '0.00',
    onda2: top2[1]?.toFixed(2) ?? '0.00',
    qtdOndas: waveAverages.length,
  };
}
