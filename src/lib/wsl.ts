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
  interferences: number;
  /** 2+ interferências = desclassificado (não pontua) */
  disqualified: boolean;
  /** 1 interferência = só a melhor onda conta (a 2ª foi descartada) */
  penalized: boolean;
}

/** Valor de uma onda: média simples das notas; só descarta maior/menor com 5+ juízes. */
export function waveAverage(scores: number[]): number {
  if (scores.length >= 5) {
    const trimmed = [...scores].sort((a, b) => a - b).slice(1, -1);
    return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  }
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Regra da interferência (fonte única — usada pelo placar e pela auditoria):
 *  - 0 interferências: somam as 2 melhores ondas (normal)
 *  - 1 interferência: só a MELHOR onda conta, o resto é descartado
 *  - 2+ interferências: desclassificado, não pontua
 *
 * `sortedDesc` são as médias das ondas já ordenadas da maior pra menor.
 */
export function applyInterference(sortedDesc: number[], interferences = 0) {
  const disqualified = interferences >= 2;
  const penalized = interferences === 1;
  const counted = disqualified ? [] : sortedDesc.slice(0, penalized ? 1 : 2);
  return {
    counted,
    total: counted.reduce((a, b) => a + b, 0),
    disqualified,
    penalized,
  };
}

/**
 * Resultado do atleta = soma das 2 melhores ondas (salvo penalidade de interferência).
 *
 * `totalJudges` (nº de juízes cadastrados): uma onda só entra na conta depois de
 * receber nota de TODOS os juízes. Enquanto faltar alguém, a onda não aparece.
 * Passe 0 só quando não há juízes cadastrados (sem trava).
 *
 * `interferences`: quantas interferências o admin marcou pro atleta nesta bateria.
 *
 * onda1/onda2 continuam mostrando o que o atleta REALMENTE surfou — quem aplica o
 * corte é o `total`, pra tela conseguir exibir a onda descartada riscada.
 */
export function calculateWSL(
  waves: Wave[],
  athleteName: string,
  totalJudges = 0,
  interferences = 0,
): WSLResult {
  const byWave: Record<number, number[]> = {};
  for (const w of waves) {
    if (w.athlete !== athleteName) continue;
    (byWave[w.waveNumber] ??= []).push(w.score);
  }

  const waveAverages: number[] = [];
  for (const scores of Object.values(byWave)) {
    if (totalJudges > 0 && scores.length < totalJudges) continue; // aguarda todos os juízes
    waveAverages.push(waveAverage(scores));
  }

  waveAverages.sort((a, b) => b - a);
  const top2 = waveAverages.slice(0, 2);
  const { total, disqualified, penalized } = applyInterference(waveAverages, interferences);

  return {
    total: total.toFixed(2),
    onda1: top2[0]?.toFixed(2) ?? '0.00',
    onda2: top2[1]?.toFixed(2) ?? '0.00',
    qtdOndas: waveAverages.length,
    interferences,
    disqualified,
    penalized,
  };
}
