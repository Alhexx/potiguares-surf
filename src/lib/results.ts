import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebaseconfig';
import { calculateWSL } from './wsl';

export interface RankedAthlete {
  name: string;
  lycra: string;
  lycraColor?: string;
  total: string;
  onda1: string;
  onda2: string;
}

export interface HeatResult {
  id: string;
  name: string;
  ranking: RankedAthlete[];
}

export interface CategoryResult {
  id: string;
  name: string;
  heats: HeatResult[];
}

export interface CompetitionResults {
  name: string;
  location: string;
  categories: CategoryResult[];
  generatedAt: Date;
}

/**
 * Junta os resultados de todas as baterias ENCERRADAS de uma competição.
 * ponytail: busca sequencial (categorias -> baterias -> ondas). Ok até dezenas de baterias.
 */
export async function fetchCompetitionResults(compID: string): Promise<CompetitionResults> {
  const compSnap = await getDoc(doc(db, 'competitions', compID));
  const comp = compSnap.data() ?? {};

  const catsSnap = await getDocs(collection(db, 'competitions', compID, 'categories'));
  const categories: CategoryResult[] = [];

  for (const cat of catsSnap.docs) {
    const heatsSnap = await getDocs(
      query(
        collection(db, 'competitions', compID, 'categories', cat.id, 'heats'),
        where('status', '==', 'finished'),
      ),
    );

    const heats: HeatResult[] = [];
    for (const h of heatsSnap.docs) {
      const hd = h.data() as any;
      const wavesSnap = await getDocs(query(collection(db, 'waves'), where('heatID', '==', h.id)));
      const waves = wavesSnap.docs.map((d) => d.data() as any);

      const ranking: RankedAthlete[] = (hd.athletes ?? [])
        .map((a: any) => ({ ...a, ...calculateWSL(waves, a.name) }))
        .sort((x: RankedAthlete, y: RankedAthlete) => parseFloat(y.total) - parseFloat(x.total));

      heats.push({ id: h.id, name: (hd.name ?? '').trim() || 'Bateria', ranking });
    }

    categories.push({ id: cat.id, name: (cat.data() as any).name ?? 'Categoria', heats });
  }

  return {
    name: comp.name ?? 'Competição',
    location: comp.location ?? '',
    categories,
    generatedAt: new Date(),
  };
}
