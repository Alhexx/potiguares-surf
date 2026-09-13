// Trava a montagem da grade juiz×onda do relatório por bateria. Rodar: npm run test:audit
import assert from 'node:assert';
import { buildAuditTable } from '../src/lib/heatAudit.ts';
import type { Wave } from '../src/lib/wsl.ts';

const judges = [
  { id: 'j1', label: 'Árbitro 1' },
  { id: 'j2', label: 'Árbitro 2' },
  { id: 'j3', label: 'Árbitro 3' },
];

const w = (judgeId: string, waveNumber: number, score: number): Wave => ({
  athlete: 'A', judgeId, waveNumber, score,
});

// onda incompleta (só 2 de 3 juízes) não fecha média
{
  const t = buildAuditTable([w('j1', 1, 8), w('j2', 1, 6)], 'A', judges);
  assert.equal(t.rows.length, 1);
  assert.deepEqual(t.rows[0].cells, [8, 6, null]);
  assert.equal(t.rows[0].media, null);
}

// onda completa -> média simples (3 juízes, sem descarte)
{
  const t = buildAuditTable([w('j1', 1, 8), w('j2', 1, 6), w('j3', 1, 7)], 'A', judges);
  assert.equal(t.rows[0].media, 7);
}

// total oficial = soma das 2 melhores médias fechadas; onda aberta não conta
{
  const waves = [
    w('j1', 1, 5), w('j2', 1, 5), w('j3', 1, 5), // media 5
    w('j1', 2, 9), w('j2', 2, 9), w('j3', 2, 9), // media 9
    w('j1', 3, 10), // onda 3 aberta, não conta
  ];
  const t = buildAuditTable(waves, 'A', judges);
  assert.equal(t.officialTotal, '14.00'); // 9 + 5
}

// total por juiz é isolado (não espera os outros) — soma das 2 melhores DELE
{
  const waves = [
    w('j1', 1, 10), w('j1', 2, 2), w('j1', 3, 8), // top2 = 10+8 = 18
  ];
  const t = buildAuditTable(waves, 'A', judges);
  assert.equal(t.perJudgeTotal[0], 18);
  assert.equal(t.perJudgeTotal[1], null); // j2 não deu nenhuma nota
}

// interferencia: so a melhor onda conta, as outras ficam marcadas como descartadas
{
  const waves = [
    w('j1', 1, 6), w('j2', 1, 6), w('j3', 1, 6), // media 6
    w('j1', 2, 9), w('j2', 2, 9), w('j3', 2, 9), // media 9 (melhor)
    w('j1', 3, 8), w('j2', 3, 8), w('j3', 3, 8), // media 8
  ];
  const t = buildAuditTable(waves, 'A', judges, 1);
  assert.equal(t.officialTotal, '9.00');
  assert.equal(t.penalized, true);
  assert.deepEqual(t.rows.map((r) => r.discarded), [true, false, true]);
}

// desclassificado: zera e descarta tudo
{
  const waves = [w('j1', 1, 9), w('j2', 1, 9), w('j3', 1, 9)];
  const t = buildAuditTable(waves, 'A', judges, 2);
  assert.equal(t.officialTotal, '0.00');
  assert.equal(t.disqualified, true);
  assert.deepEqual(t.rows.map((r) => r.discarded), [true]);
}

// sem interferencia: as 2 melhores contam, a 3a e' descartada normalmente
{
  const waves = [
    w('j1', 1, 6), w('j2', 1, 6), w('j3', 1, 6),
    w('j1', 2, 9), w('j2', 2, 9), w('j3', 2, 9),
    w('j1', 3, 8), w('j2', 3, 8), w('j3', 3, 8),
  ];
  const t = buildAuditTable(waves, 'A', judges);
  assert.equal(t.officialTotal, '17.00'); // 9 + 8
  assert.deepEqual(t.rows.map((r) => r.discarded), [true, false, false]);
}

console.log('heat audit ok');
