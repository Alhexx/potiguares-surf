export interface Lycra {
  name: string;
  color: string;
}

export const DEFAULT_LYCRAS: Lycra[] = [
  { name: 'Vermelho', color: '#EF4444' },
  { name: 'Branco', color: '#F9FAFB' },
  { name: 'Amarelo', color: '#FBBF24' },
  { name: 'Azul', color: '#3B82F6' },
];

// Cores dos nomes usados antes de existir o seletor (formato antigo: string[]).
const LEGACY_COLORS: Record<string, string> = {
  Vermelho: '#EF4444',
  Branco: '#F9FAFB',
  Amarelo: '#FBBF24',
  Azul: '#3B82F6',
  Preto: '#111827',
  Preta: '#111827',
  Verde: '#10B981',
  Rosa: '#EC4899',
  Laranja: '#F97316',
  Roxo: '#8B5CF6',
};

/** Aceita o formato antigo (string[]) e o novo ({name,color}[]). */
export function normalizeLycras(raw: unknown): Lycra[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_LYCRAS;
  return raw.map((item: any) =>
    typeof item === 'string'
      ? { name: item, color: LEGACY_COLORS[item] ?? '#9CA3AF' }
      : { name: item?.name ?? '', color: item?.color ?? '#9CA3AF' },
  );
}

export const lycraColorOf = (lycras: Lycra[], name: string) =>
  lycras.find((l) => l.name === name)?.color ?? '#9CA3AF';
