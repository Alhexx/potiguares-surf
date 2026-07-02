import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { globalStyles } from '../../../../constants/styles';
import { db } from '../../../../services/firebaseconfig';

// Interface para garantir a segurança dos dados do juiz
interface Judge {
  id: string;
  email: string;
  role: string;
}

export default function ListJudgesForComp() {
  const params = useLocalSearchParams();
  const compID = Array.isArray(params.compID) ? params.compID[0] : params.compID;
  const router = useRouter();
  
  const [judges, setJudges] = useState<Judge[]>([]);

  useEffect(() => {
    if (!compID) return;

    // Busca juízes específicos desta competição
    const judgesRef = collection(db, 'competitions', compID, 'judges');
    
    const unsubscribe = onSnapshot(judgesRef, (snap) => {
      if (!snap || !snap.docs) {
        setJudges([]);
        return;
      }

      const judgeList = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Judge, 'id'>),
      }));
      setJudges(judgeList);
    });

    return () => unsubscribe();
  }, [compID]);

  return (
    <View style={globalStyles.container}>
      <TouchableOpacity 
        style={globalStyles.primaryButton} 
        onPress={() => router.push({
          pathname: '/(admin)/[compID]/judges/create',
          params: { compID }
        })}
      >
        <Text style={globalStyles.primaryButtonText}>+ Adicionar Juiz ao Evento</Text>
      </TouchableOpacity>

      <FlatList 
        // Coalescência nula para proteger contra undefined durante o carregamento
        data={judges ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={globalStyles.card}>
            <Text style={globalStyles.rowText}>{item.email}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#9CA3AF' }}>
            Nenhum juiz adicionado a este evento.
          </Text>
        }
      />
    </View>
  );
}