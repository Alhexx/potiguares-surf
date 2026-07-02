import { useRouter } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { globalStyles } from '../../constants/styles';
import { db } from '../../services/firebaseconfig';

// Interface tipada para a competição
interface Competition {
  id: string;
  name: string;
  location: string;
  status: string;
}

export default function JudgeDashboard() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Busca apenas competições ativas
    const q = query(collection(db, 'competitions'), where('status', '==', 'active'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Mapeia e tipa os dados retornados do Firestore
      const comps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Competition, 'id'>)
      }));
      setCompetitions(comps);
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Eventos Ativos</Text>
      <Text style={{ marginBottom: 20, color: '#6B7280' }}>
        Selecione o campeonato para entrar no painel de julgamento.
      </Text>

      <FlatList
        // Uso do operador de coalescência nula para garantir segurança
        data={competitions ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={globalStyles.card} 
            onPress={() => router.push({
              pathname: '/(judge)/scoring',
              params: { compID: item.id }
            })}
          >
            <Text style={globalStyles.rowText}>{item.name}</Text>
            <Text style={{ color: '#0284C7', marginTop: 8 }}>Entrar como Juiz →</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#9CA3AF' }}>
            Nenhum evento ativo no momento.
          </Text>
        }
      />
    </View>
  );
}