// Confirma que a sincronização de lycra funciona com dado JÁ EXISTENTE no banco
// (formatos antigos, sem `id`). Rodar: npm run test:lycra
import assert from 'node:assert';
import { normalizeLycras } from '../src/lib/lycra.ts';

// Reproduz o diff feito em edit-config.tsx ao salvar.
function diff(original: ReturnType<typeof normalizeLycras>, edited: ReturnType<typeof normalizeLycras>) {
  const renameMap: Record<string, { name: string; color: string }> = {};
  for (const orig of original) {
    const now = edited.find((l) => l.id === orig.id);
    if (!now) continue;
    if (now.name !== orig.name || now.color !== orig.color) {
      renameMap[orig.name] = { name: now.name, color: now.color };
    }
  }
  return renameMap;
}

// --- Cenário 1: formato mais antigo (string[]) já salvo no Firestore ---
{
  const original = normalizeLycras(['Vermelho', 'Branco', 'Amarelo', 'Azul']);
  // admin abre a tela, renomeia "Vermelho" -> "Laranja" e muda a cor
  const edited = original.map((l) => (l.name === 'Vermelho' ? { ...l, name: 'Laranja', color: '#F97316' } : l));

  const renameMap = diff(original, edited);
  assert.deepEqual(Object.keys(renameMap), ['Vermelho']);
  assert.equal(renameMap['Vermelho'].name, 'Laranja');
  assert.equal(renameMap['Vermelho'].color, '#F97316');
}

// --- Cenário 2: formato {name,color} já salvo, sem id (antes de hoje) ---
{
  const original = normalizeLycras([
    { name: 'Vermelho', color: '#EF4444' },
    { name: 'Azul', color: '#3B82F6' },
  ]);
  // só muda a cor, mantém o nome
  const edited = original.map((l) => (l.name === 'Azul' ? { ...l, color: '#1E3A8A' } : l));

  const renameMap = diff(original, edited);
  assert.deepEqual(Object.keys(renameMap), ['Azul']);
  assert.equal(renameMap['Azul'].name, 'Azul');
  assert.equal(renameMap['Azul'].color, '#1E3A8A');
}

// --- Cenário 3: adicionar uma lycra nova não gera propagação nenhuma ---
{
  const original = normalizeLycras(['Vermelho', 'Branco']);
  const edited = [...original, { id: 'novo', name: 'Verde', color: '#10B981' }];

  const renameMap = diff(original, edited);
  assert.deepEqual(renameMap, {});
}

// --- Cenário 4: troca dupla (swap) não vira corrente ---
{
  const original = normalizeLycras(['Vermelho', 'Azul']);
  const vermelho = original.find((l) => l.name === 'Vermelho')!;
  const azul = original.find((l) => l.name === 'Azul')!;
  const edited = original.map((l) =>
    l.id === vermelho.id ? { ...l, name: 'Azul' } : l.id === azul.id ? { ...l, name: 'Vermelho' } : l,
  );

  const renameMap = diff(original, edited);
  assert.equal(renameMap['Vermelho'].name, 'Azul');
  assert.equal(renameMap['Azul'].name, 'Vermelho');
}

console.log('lycra rename ok');
