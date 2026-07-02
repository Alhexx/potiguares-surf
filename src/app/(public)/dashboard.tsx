import { useRouter } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { globalStyles } from '../../constants/styles';
import { db } from '../../services/firebaseconfig';

// Interface tipada para garantir consistência
interface Competition {
  id: string;
  name: string;
  location: string;
  status: string;
}

export default function PublicDashboard() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Busca apenas competições ativas para o público
    const q = query(collection(db, 'competitions'), where('status', '==', 'active'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
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
      <Text style={globalStyles.title}>Eventos ao Vivo</Text>
      <Text style={{ marginBottom: 24, color: '#6B7280' }}>
        Selecione um campeonato para acompanhar as baterias e notas em tempo real.
      </Text>

      <FlatList
        // Uso do ?? [] para garantir que o map nunca rode em undefined
        data={competitions ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={globalStyles.card} 
            onPress={() => router.push({
              pathname: '/(public)/[compID]/live',
              params: { compID: item.id }
            })}
          >
            <View style={globalStyles.rowInfo}>
              <View>
                <Text style={[globalStyles.rowText, { fontSize: 18 }]}>{item.name}</Text>
                <Text style={{ color: '#6B7280', marginTop: 4 }}>📍 {item.location}</Text>
              </View>
              <Text style={{ fontSize: 24 }}>🏄‍♂️</Text>
            </View>
            <View style={{ backgroundColor: '#F0F9FF', padding: 12, borderRadius: 8, marginTop: 16, alignItems: 'center' }}>
               <Text style={{ color: '#0284C7', fontWeight: 'bold' }}>Acompanhar Placar Oficial</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ color: '#9CA3AF', fontSize: 16 }}>Nenhum evento acontecendo agora.</Text>
          </View>
        }
      />
    </View>
  );
}