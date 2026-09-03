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

/**
 * Média no formato WSL: por onda, descarta a maior e a menor nota (quando há
 * 3+ juízes) e tira a média do resto. O total do atleta é a soma das 2 melhores
 * ondas.
 *
 * Se `totalJudges` > 0, uma onda só entra na conta depois de receber nota de
 * TODOS os juízes (trava usada no placar ao vivo). Para históricos, passe 0.
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
    if (totalJudges > 0 && scores.length < totalJudges) continue;
    if (scores.length < 3) {
      waveAverages.push(scores.reduce((a, b) => a + b, 0) / scores.length);
    } else {
      const trimmed = [...scores].sort((a, b) => a - b).slice(1, -1);
      waveAverages.push(trimmed.reduce((a, b) => a + b, 0) / trimmed.length);
    }
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
