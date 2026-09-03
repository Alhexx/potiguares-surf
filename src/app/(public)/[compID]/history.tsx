import { useLocalSearchParams } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { isLightColor } from '../../../lib/color';
import { calculateWSL } from '../../../lib/wsl';
import { db } from '../../../services/firebaseconfig';

interface HeatResult {
  id: string;
  catName: string;
  name: string;
  ranking: { name: string; lycra: string; lycraColor?: string; total: string; onda1: string; onda2: string }[];
}

export default function PublicHistory() {
  const { compID } = useLocalSearchParams();
  const [items, setItems] = useState<HeatResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!compID) return;
    let cancelled = false;

    // ponytail: busca sequencial (categorias -> baterias -> ondas). Ok para
    // competições com dezenas de baterias; se crescer, virar collectionGroup + índice.
    (async () => {
      try {
        const cats = await getDocs(collection(db, 'competitions', compID as string, 'categories'));
        const results: HeatResult[] = [];

        for (const cat of cats.docs) {
          const heats = await getDocs(
            query(
              collection(db, 'competitions', compID as string, 'categories', cat.id, 'heats'),
              where('status', '==', 'finished'),
            ),
          );

          for (const h of heats.docs) {
            const hd = h.data();
            const wavesSnap = await getDocs(query(collection(db, 'waves'), where('heatID', '==', h.id)));
            const waves = wavesSnap.docs.map((d) => d.data() as any);

            const ranking = (hd.athletes ?? [])
              .map((a: any) => ({ ...a, ...calculateWSL(waves, a.name) }))
              .sort((x: any, y: any) => parseFloat(y.total) - parseFloat(x.total));

            results.push({
              id: h.id,
              catName: (cat.data() as any).name ?? 'Categoria',
              name: (hd.name ?? '').trim() || 'Bateria',
              ranking,
            });
          }
        }

        if (!cancelled) setItems(results);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [compID]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Baterias Encerradas</Text>

      {items.length === 0 && (
        <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 24 }}>
          Nenhuma bateria encerrada ainda.
        </Text>
      )}

      {items.map((heat) => (
        <View key={heat.id} style={styles.card}>
          <Text style={styles.heatName}>{heat.name}</Text>
          <Text style={styles.catName}>{heat.catName}</Text>

          {heat.ranking.map((ath, i) => {
            const color = ath.lycraColor ?? '#9CA3AF';
            return (
              <View key={i} style={styles.rankRow}>
                <Text style={styles.pos}>{i + 1}º</Text>
                <View style={[styles.dot, { backgroundColor: color, borderColor: isLightColor(color) ? '#D1D5DB' : color }]} />
                <Text style={styles.athName}>{ath.name || 'Sem nome'}</Text>
                <Text style={styles.total}>{ath.total}</Text>
              </View>
            );
          })}
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 16 },
  center: { flex: 1, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginVertical: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12 },
  heatName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  catName: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  rankRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderColor: '#F3F4F6' },
  pos: { width: 34, fontWeight: 'bold', color: '#374151' },
  dot: { width: 14, height: 14, borderRadius: 4, borderWidth: 1, marginRight: 10 },
  athName: { flex: 1, fontSize: 15, color: '#111827' },
  total: { fontSize: 18, fontWeight: 'bold', color: '#0284C7' },
});
