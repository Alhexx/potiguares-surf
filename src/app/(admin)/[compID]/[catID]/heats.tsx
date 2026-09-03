import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { globalStyles } from '../../../../constants/styles';
import { db } from '../../../../services/firebaseconfig';

// Interfaces tipadas para maior segurança
interface Athlete {
  name: string;
  lycra: string;
}

interface Heat {
  id: string;
  status: 'waiting' | 'live' | 'finished';
  athletes?: Athlete[];
  name?: string;
  durationMinutes?: number;
  createdAt?: any;
}

export default function HeatsListScreen() {
  const params = useLocalSearchParams();
  const compID = Array.isArray(params.compID) ? params.compID[0] : params.compID;
  const catID = Array.isArray(params.catID) ? params.catID[0] : params.catID;
  
  const router = useRouter();
  const [heats, setHeats] = useState<Heat[]>([]);

  useEffect(() => {
    if (!compID || !catID) return;

    const heatsRef = collection(db, 'competitions', compID, 'categories', catID, 'heats');
    const q = query(heatsRef, orderBy('createdAt', 'asc')); 
    
    const unsubscribe = onSnapshot(q, (snap) => {
      if (!snap || !snap.docs) {
        setHeats([]);
        return;
      }

      const heatList = snap.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Heat, 'id'>)
      }));
      setHeats(heatList);
    });
    return () => unsubscribe();
  }, [compID, catID]);

  return (
    <View style={globalStyles.container}>
      <TouchableOpacity 
        onPress={() => router.push({
          pathname: '/(admin)/[compID]/[catID]/new-heat',
          params: { compID, catID }
        })} 
        style={globalStyles.primaryButton}
      >
        <Text style={globalStyles.primaryButtonText}>+ Adicionar Bateria</Text>
      </TouchableOpacity>

      <Text style={[globalStyles.title, { marginTop: 24 }]}>Baterias Programadas</Text>
      
      <FlatList
        data={heats ?? []} // Proteção contra undefined
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={globalStyles.card}
            onPress={() => router.push({
              pathname: '/(admin)/[compID]/[catID]/[heatID]',
              params: { compID, catID, heatID: item.id }
            })}
          >
            <View style={globalStyles.rowInfo}>
              <Text style={globalStyles.rowText}>{item.name?.trim() || `Bateria ${index + 1}`}</Text>
              <Text style={{
                color: item.status === 'live' ? '#EF4444' : '#0284C7',
                fontWeight: 'bold'
              }}>
                {item.status.toUpperCase()}
              </Text>
            </View>
            {item.durationMinutes ? (
              <Text style={{ marginTop: 4, color: '#9CA3AF', fontSize: 12 }}>⏱ {item.durationMinutes} min</Text>
            ) : null}
            <Text style={{ marginTop: 8, color: '#6B7280' }}>
              {/* Proteção segura contra lista de atletas vazia */}
              {(item.athletes ?? []).length > 0 
                ? item.athletes?.map((a) => a.name || `[${a.lycra}]`).join(' x ')
                : 'Sem atletas definidos'}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={{ color: '#666', textAlign: 'center', marginTop: 20 }}>
            Nenhuma bateria criada nesta categoria.
          </Text>
        }
      />
    </View>
  );
}