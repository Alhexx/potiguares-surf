import { useRouter } from 'expo-router';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { globalStyles } from '../../constants/styles';
import { auth, db } from '../../services/firebaseconfig';

interface Competition {
  id: string;
  name: string;
  location: string;
  status: string;
}

export default function JudgeDashboard() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  // Se o juiz está vinculado a uma competição, vai direto para ela.
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setChecking(false);
      return;
    }
    getDoc(doc(db, 'users', uid))
      .then((snap) => {
        const compID = snap.exists() ? snap.data().compID : null;
        if (compID) {
          router.replace({ pathname: '/(judge)/scoring', params: { compID } });
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  useEffect(() => {
    if (checking) return;
    const q = query(collection(db, 'competitions'), where('status', '==', 'active'));
    return onSnapshot(q, (snapshot) => {
      setCompetitions(
        snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Competition, 'id'>) })),
      );
    });
  }, [checking]);

  if (checking) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Eventos Ativos</Text>
      <Text style={{ marginBottom: 20, color: '#6B7280' }}>
        Selecione o campeonato para entrar no painel de julgamento.
      </Text>

      <FlatList
        data={competitions ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={globalStyles.card}
            onPress={() => router.push({ pathname: '/(judge)/scoring', params: { compID: item.id } })}
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
