import { collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../services/firebaseconfig';

// ponytail: exclusão recursiva sequencial no cliente (Firestore não cascateia).
// Ok pro tamanho de uma competição local; se crescer muito, virar Cloud Function.

async function deleteWavesForHeat(heatID: string) {
  const snap = await getDocs(query(collection(db, 'waves'), where('heatID', '==', heatID)));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

export async function deleteHeat(compID: string, catID: string, heatID: string) {
  await deleteWavesForHeat(heatID);
  await deleteDoc(doc(db, 'competitions', compID, 'categories', catID, 'heats', heatID));
}

export async function deleteCategory(compID: string, catID: string) {
  const heats = await getDocs(collection(db, 'competitions', compID, 'categories', catID, 'heats'));
  for (const h of heats.docs) await deleteHeat(compID, catID, h.id);
  await deleteDoc(doc(db, 'competitions', compID, 'categories', catID));
}

export async function deleteJudge(compID: string, judgeUid: string) {
  await deleteDoc(doc(db, 'competitions', compID, 'judges', judgeUid)).catch(() => {});
  await deleteDoc(doc(db, 'users', judgeUid)).catch(() => {});
  // A conta de login (Firebase Auth) não pode ser apagada pelo cliente — fica órfã,
  // mas sem o doc em users/ o login recusa o acesso.
}

/**
 * Aplica uma troca de nome/cor de lycra em todas as baterias já criadas
 * (qualquer status — inclusive encerradas, o histórico também deve refletir).
 * `renameMap` é indexado pelo nome ANTIGO; o valor é o nome/cor NOVOS.
 * Um único mapa calculado antes de mexer em qualquer bateria evita que uma
 * troca em cadeia (ex: Vermelho->Azul e Azul->Verde ao mesmo tempo) se propague errado.
 * Retorna quantas baterias foram atualizadas.
 */
export async function applyLycraRenames(
  compID: string,
  renameMap: Record<string, { name: string; color: string }>,
): Promise<number> {
  if (Object.keys(renameMap).length === 0) return 0;

  const cats = await getDocs(collection(db, 'competitions', compID, 'categories'));
  let updated = 0;

  for (const cat of cats.docs) {
    const heats = await getDocs(collection(db, 'competitions', compID, 'categories', cat.id, 'heats'));
    for (const h of heats.docs) {
      const athletes: any[] = (h.data() as any).athletes ?? [];
      let changed = false;
      const next = athletes.map((a) => {
        const rn = renameMap[a.lycra];
        if (!rn) return a;
        changed = true;
        return { ...a, lycra: rn.name, lycraColor: rn.color };
      });
      if (changed) {
        await updateDoc(h.ref, { athletes: next });
        updated++;
      }
    }
  }

  return updated;
}

export async function deleteCompetition(compID: string) {
  const cats = await getDocs(collection(db, 'competitions', compID, 'categories'));
  for (const c of cats.docs) await deleteCategory(compID, c.id);

  const judges = await getDocs(collection(db, 'competitions', compID, 'judges'));
  for (const j of judges.docs) await deleteJudge(compID, j.id);

  const sched = await getDocs(collection(db, 'competitions', compID, 'schedule'));
  await Promise.all(sched.docs.map((d) => deleteDoc(d.ref)));

  const waves = await getDocs(query(collection(db, 'waves'), where('compID', '==', compID)));
  await Promise.all(waves.docs.map((d) => deleteDoc(d.ref)));

  await deleteDoc(doc(db, 'competitions', compID));
}
