export interface Lycra {
  id: string;
  name: string;
  color: string;
}

let seq = 0;
export const newLycraId = () => `l${Date.now().toString(36)}${(seq++).toString(36)}`;
const genId = newLycraId;

export const DEFAULT_LYCRAS: Lycra[] = [
  { id: 'l1', name: 'Vermelho', color: '#EF4444' },
  { id: 'l2', name: 'Branco', color: '#F9FAFB' },
  { id: 'l3', name: 'Amarelo', color: '#FBBF24' },
  { id: 'l4', name: 'Azul', color: '#3B82F6' },
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

/**
 * Aceita o formato antigo (string[]) e o novo ({name,color}[] ou {id,name,color}[]).
 * Dados sem `id` (legado, ou lidos antes da 1ª vez que forem salvos com id) ganham
 * um id novo aqui — só precisa ser estável durante UMA sessão de edição.
 */
export function normalizeLycras(raw: unknown): Lycra[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_LYCRAS.map((l) => ({ ...l }));
  return raw.map((item: any) =>
    typeof item === 'string'
      ? { id: genId(), name: item, color: LEGACY_COLORS[item] ?? '#9CA3AF' }
      : { id: item?.id ?? genId(), name: item?.name ?? '', color: item?.color ?? '#9CA3AF' },
  );
}

export const lycraColorOf = (lycras: Lycra[], name: string) =>
  lycras.find((l) => l.name === name)?.color ?? '#9CA3AF';
