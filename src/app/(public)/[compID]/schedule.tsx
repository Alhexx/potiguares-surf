import { useLocalSearchParams } from 'expo-router';
import { collection, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { db } from '../../../services/firebaseconfig';

interface Item {
  id: string;
  time: string;
  title: string;
}

export default function PublicSchedule() {
  const { compID } = useLocalSearchParams();
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    if (!compID) return;
    const ref = collection(db, 'competitions', compID as string, 'schedule');
    return onSnapshot(ref, (snap) => {
      const list = (snap?.docs ?? []).map((d) => ({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
      setItems(list);
    });
  }, [compID]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Cronograma</Text>

      {items.length === 0 && (
        <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 24 }}>
          Cronograma ainda não publicado.
        </Text>
      )}

      {items.map((it) => (
        <View key={it.id} style={styles.row}>
          <Text style={styles.time}>{it.time || '--:--'}</Text>
          <Text style={styles.text}>{it.title}</Text>
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginVertical: 12 },
  row: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, marginBottom: 8 },
  time: { width: 64, fontWeight: 'bold', color: '#0284C7' },
  text: { flex: 1, color: '#111827', fontSize: 15 },
});
