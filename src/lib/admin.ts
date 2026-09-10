import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
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
