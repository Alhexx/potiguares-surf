import { useLocalSearchParams } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { globalStyles } from '../../../constants/styles';
import { db } from '../../../services/firebaseconfig';

interface Item {
  id: string;
  time: string;
  title: string;
}

export default function AdminSchedule() {
  const params = useLocalSearchParams();
  const compID = Array.isArray(params.compID) ? params.compID[0] : params.compID;

  const [items, setItems] = useState<Item[]>([]);
  const [time, setTime] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (!compID) return;
    const ref = collection(db, 'competitions', compID, 'schedule');
    return onSnapshot(ref, (snap) => {
      const list = (snap?.docs ?? []).map((d) => ({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
      setItems(list);
    });
  }, [compID]);

  const add = async () => {
    if (!compID) return;
    if (!title.trim()) {
      Alert.alert('Erro', 'Descreva o item do cronograma.');
      return;
    }
    try {
      await addDoc(collection(db, 'competitions', compID, 'schedule'), {
        time: time.trim(),
        title: title.trim(),
      });
      setTime('');
      setTitle('');
    } catch {
      Alert.alert('Erro', 'Não foi possível adicionar.');
    }
  };

  const remove = (id: string) => {
    if (!compID) return;
    Alert.alert('Remover', 'Apagar este item?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: () => deleteDoc(doc(db, 'competitions', compID, 'schedule', id)).catch(() => {}),
      },
    ]);
  };

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.card}>
        <Text style={globalStyles.label}>Novo item</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={[globalStyles.input, { width: 90 }]}
            placeholder="08:00"
            placeholderTextColor="#9CA3AF"
            value={time}
            onChangeText={setTime}
          />
          <TextInput
            style={[globalStyles.input, { flex: 1 }]}
            placeholder="Ex: Abertura / Sub-18 Bateria 1"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
          />
        </View>
        <TouchableOpacity onPress={add} style={globalStyles.primaryButton}>
          <Text style={globalStyles.primaryButtonText}>+ Adicionar</Text>
        </TouchableOpacity>
      </View>

      <Text style={globalStyles.title}>Cronograma</Text>
      {items.length === 0 && (
        <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 12 }}>Nada no cronograma ainda.</Text>
      )}
      {items.map((it) => (
        <View key={it.id} style={styles.row}>
          <Text style={styles.time}>{it.time || '--:--'}</Text>
          <Text style={styles.text}>{it.title}</Text>
          <TouchableOpacity onPress={() => remove(it.id)} style={{ padding: 6 }}>
            <Text style={{ color: '#DC2626', fontWeight: 'bold', fontSize: 18 }}>×</Text>
          </TouchableOpacity>
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, marginBottom: 8 },
  time: { width: 60, fontWeight: 'bold', color: '#0284C7' },
  text: { flex: 1, color: '#111827', fontSize: 15 },
});
