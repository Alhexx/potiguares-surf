// Trava a matemática das notas. Rodar: npm run test:wsl
import assert from 'node:assert';
import { calculateWSL } from '../src/lib/wsl.ts';
import type { Wave } from '../src/lib/wsl.ts';

const w = (athlete: string, waveNumber: number, score: number): Wave => ({ athlete, waveNumber, score });

// 3 juízes: média simples das 3 notas
assert.equal(calculateWSL([w('A', 1, 8), w('A', 1, 6), w('A', 1, 7)], 'A', 3).onda1, '7.00');

// enquanto faltar juiz, a onda não aparece
{
  const r = calculateWSL([w('A', 1, 8), w('A', 1, 6)], 'A', 3);
  assert.equal(r.qtdOndas, 0);
  assert.equal(r.total, '0.00');
}

// total = soma das 2 melhores ondas
{
  const waves = [
    w('A', 1, 5), w('A', 1, 5), w('A', 1, 5), // 5
    w('A', 2, 9), w('A', 2, 9), w('A', 2, 9), // 9
    w('A', 3, 7), w('A', 3, 7), w('A', 3, 7), // 7
  ];
  assert.equal(calculateWSL(waves, 'A', 3).total, '16.00'); // 9 + 7
}

// 5 juízes: descarta maior e menor
{
  const waves = [w('A', 1, 1), w('A', 1, 10), w('A', 1, 6), w('A', 1, 7), w('A', 1, 8)];
  assert.equal(calculateWSL(waves, 'A', 5).onda1, '7.00'); // (6+7+8)/3
}

// --- INTERFERENCIA ---

// 1 interferencia: so a MELHOR onda conta
{
  const waves = [
    w('A', 1, 9), w('A', 1, 9), w('A', 1, 9), // 9
    w('A', 2, 7), w('A', 2, 7), w('A', 2, 7), // 7
  ];
  const normal = calculateWSL(waves, 'A', 3);
  assert.equal(normal.total, '16.00');

  const punido = calculateWSL(waves, 'A', 3, 1);
  assert.equal(punido.total, '9.00'); // descarta a de 7
  assert.equal(punido.penalized, true);
  assert.equal(punido.disqualified, false);
  assert.equal(punido.onda2, '7.00'); // continua visivel (riscada na tela)
}

// 2 interferencias: desclassificado, zera
{
  const waves = [
    w('A', 1, 10), w('A', 1, 10), w('A', 1, 10),
    w('A', 2, 8), w('A', 2, 8), w('A', 2, 8),
  ];
  const dq = calculateWSL(waves, 'A', 3, 2);
  assert.equal(dq.total, '0.00');
  assert.equal(dq.disqualified, true);
  assert.equal(dq.onda1, '10.00'); // o que surfou continua registrado
}

// 3+ interferencias tambem e' desclassificacao
assert.equal(calculateWSL([w('A', 1, 9), w('A', 1, 9), w('A', 1, 9)], 'A', 3, 3).disqualified, true);

console.log('wsl ok');
