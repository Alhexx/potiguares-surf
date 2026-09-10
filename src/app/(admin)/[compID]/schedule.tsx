import { useLocalSearchParams } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { globalStyles } from '../../../constants/styles';
import { brToISO, isoToBR } from '../../../lib/dateBR';
import { confirmAction, notify } from '../../../lib/notify';
import { db } from '../../../services/firebaseconfig';

interface Item {
  id: string;
  date: string; // ISO YYYY-MM-DD ('' se sem data)
  time: string;
  title: string;
}

const sortItems = (a: Item, b: Item) =>
  (a.date || '9999').localeCompare(b.date || '9999') || (a.time || '99:99').localeCompare(b.time || '99:99');

export default function AdminSchedule() {
  const params = useLocalSearchParams();
  const compID = Array.isArray(params.compID) ? params.compID[0] : params.compID;

  const [items, setItems] = useState<Item[]>([]);
  const [dateBR, setDateBR] = useState('');
  const [time, setTime] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (!compID) return;
    const ref = collection(db, 'competitions', compID, 'schedule');
    return onSnapshot(ref, (snap) => {
      const list = (snap?.docs ?? []).map((d) => ({ id: d.id, date: '', time: '', title: '', ...(d.data() as any) }));
      list.sort(sortItems);
      setItems(list);
    });
  }, [compID]);

  const add = async () => {
    if (!compID) return;
    if (!title.trim()) {
      notify('Erro', 'Descreva o item do cronograma.');
      return;
    }
    const iso = dateBR.trim() ? brToISO(dateBR) : '';
    if (dateBR.trim() && !iso) {
      notify('Erro', 'Data inválida. Use DD/MM/AAAA.');
      return;
    }
    try {
      await addDoc(collection(db, 'competitions', compID, 'schedule'), {
        date: iso,
        time: time.trim(),
        title: title.trim(),
      });
      setDateBR('');
      setTime('');
      setTitle('');
    } catch {
      notify('Erro', 'Não foi possível adicionar.');
    }
  };

  const remove = (id: string) => {
    if (!compID) return;
    confirmAction('Remover', 'Apagar este item?', () => {
      deleteDoc(doc(db, 'competitions', compID, 'schedule', id)).catch(() => {});
    }, 'Apagar');
  };

  // agrupa por data para exibir
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
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.card}>
        <Text style={globalStyles.label}>Novo item</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={[globalStyles.input, { width: 130 }]}
            placeholder="DD/MM/AAAA"
            placeholderTextColor="#9CA3AF"
            value={dateBR}
            onChangeText={setDateBR}
            keyboardType="numbers-and-punctuation"
          />
          <TextInput
            style={[globalStyles.input, { width: 80 }]}
            placeholder="08:00"
            placeholderTextColor="#9CA3AF"
            value={time}
            onChangeText={setTime}
          />
        </View>
        <TextInput
          style={globalStyles.input}
          placeholder="Ex: Abertura / Sub-18 Bateria 1"
          placeholderTextColor="#9CA3AF"
          value={title}
          onChangeText={setTitle}
        />
        <TouchableOpacity onPress={add} style={globalStyles.primaryButton}>
          <Text style={globalStyles.primaryButtonText}>+ Adicionar</Text>
        </TouchableOpacity>
      </View>

      <Text style={globalStyles.title}>Cronograma</Text>
      {items.length === 0 && (
        <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 12 }}>Nada no cronograma ainda.</Text>
      )}

      {groups.map((g) => (
        <View key={g.date || 'sem-data'}>
          <Text style={styles.dayHeader}>{g.date ? isoToBR(g.date) : 'Sem data'}</Text>
          {g.items.map((it) => (
            <View key={it.id} style={styles.row}>
              <Text style={styles.time}>{it.time || '--:--'}</Text>
              <Text style={styles.text}>{it.title}</Text>
              <TouchableOpacity onPress={() => remove(it.id)} style={{ padding: 6 }}>
                <Text style={{ color: '#DC2626', fontWeight: 'bold', fontSize: 18 }}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  dayHeader: { fontSize: 15, fontWeight: 'bold', color: '#0284C7', marginTop: 16, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, marginBottom: 8 },
  time: { width: 60, fontWeight: 'bold', color: '#0284C7' },
  text: { flex: 1, color: '#111827', fontSize: 15 },
});
