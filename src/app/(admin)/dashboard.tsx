import { useRouter } from 'expo-router';
import { addDoc, collection, onSnapshot, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../../services/firebaseconfig';

// Interface para garantir a tipagem dos dados da competição
interface Competition {
  id: string;
  name: string;
  location: string;
  status: string;
}

export default function AdminDashboard() {
  const [name, setName] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, 'competitions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // 1. Verificamos se há documentos para evitar processar snap vazio
      if (!snapshot.docs) {
        setCompetitions([]);
        return;
      }

      const comps: Competition[] = snapshot.docs.map((doc) => {
        const data = doc.data() as Omit<Competition, 'id'>;
        return {
          id: doc.id,
          // 2. Garantimos que os campos esperados existam (fallback para string vazia)
          name: data.name ?? 'Sem nome',
          location: data.location ?? 'Sem local',
          status: data.status ?? 'active',
        };
      });
      setCompetitions(comps);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateCompetition = async () => {
    if (name.trim() === '' || location.trim() === '') {
      Alert.alert('Erro', 'Preencha o nome e o local do evento.');
      return;
    }
    try {
      await addDoc(collection(db, 'competitions'), {
        name,
        location,
        status: 'active',
      });
      Alert.alert('Sucesso!', 'Competição criada com sucesso.');
      setName('');
      setLocation('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Erro ao salvar', message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Painel do Organizador</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Criar Nova Competição</Text>
        <TextInput style={styles.input} placeholder="Nome" placeholderTextColor="#9CA3AF" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Local" placeholderTextColor="#9CA3AF" value={location} onChangeText={setLocation} />
        <TouchableOpacity style={styles.button} onPress={handleCreateCompetition}>
          <Text style={styles.buttonText}>Salvar Competição</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.listTitle}>Competições Criadas</Text>
      
      <FlatList
        data={competitions ?? []} // Garante que o array nunca seja undefined
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => router.push(`/(admin)/${item.id}`)}
          >
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardLocation}>📍 {item.location}</Text>
            <Text style={styles.hintText}>Toque para gerenciar</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma competição criada ainda.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 24, paddingTop: 60 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 24 },
  form: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, marginBottom: 32 },
  label: { fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#374151' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16, color: '#111827' },
  button: { backgroundColor: '#0284C7', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  listTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#0284C7' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  cardLocation: { fontSize: 14, color: '#6B7280' },
  hintText: { fontSize: 10, color: '#0284C7', marginTop: 8, fontStyle: 'italic' },
  emptyText: { color: '#6B7280', textAlign: 'center', marginTop: 20 }
});