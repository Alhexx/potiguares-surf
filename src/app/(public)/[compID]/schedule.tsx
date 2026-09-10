import { useLocalSearchParams } from 'expo-router';
import { collection, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { isoToBR } from '../../../lib/dateBR';
import { db } from '../../../services/firebaseconfig';

interface Item {
  id: string;
  date: string;
  time: string;
  title: string;
}

const sortItems = (a: Item, b: Item) =>
  (a.date || '9999').localeCompare(b.date || '9999') || (a.time || '99:99').localeCompare(b.time || '99:99');

export default function PublicSchedule() {
  const { compID } = useLocalSearchParams();
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    if (!compID) return;
    const ref = collection(db, 'competitions', compID as string, 'schedule');
    return onSnapshot(ref, (snap) => {
      const list = (snap?.docs ?? []).map((d) => ({ id: d.id, date: '', time: '', title: '', ...(d.data() as any) }));
      list.sort(sortItems);
      setItems(list);
    });
  }, [compID]);

  const groups: { date: string; items: Item[] }[] = [];
  for (const it of items) {
    const key = it.date || '';
    let g = groups.find((x) => x.date === key);
    if (!g) {
      g = { date: key, items: [] };
      groups.push(g);
    }
    g.items.push(it);
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Cronograma</Text>

      {items.length === 0 && (
        <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 24 }}>
          Cronograma ainda não publicado.
        </Text>
      )}

      {groups.map((g) => (
        <View key={g.date || 'sem-data'}>
          <Text style={styles.dayHeader}>{g.date ? isoToBR(g.date) : 'Sem data'}</Text>
          {g.items.map((it) => (
            <View key={it.id} style={styles.row}>
              <Text style={styles.time}>{it.time || '--:--'}</Text>
              <Text style={styles.text}>{it.title}</Text>
            </View>
          ))}
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginVertical: 12 },
  dayHeader: { fontSize: 15, fontWeight: 'bold', color: '#0284C7', marginTop: 16, marginBottom: 6 },
  row: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, marginBottom: 8 },
  time: { width: 64, fontWeight: 'bold', color: '#0284C7' },
  text: { flex: 1, color: '#111827', fontSize: 15 },
});
