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

console.log('wsl ok');
