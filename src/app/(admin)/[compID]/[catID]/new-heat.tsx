import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { globalStyles } from '../../../../constants/styles';
import { DEFAULT_LYCRAS, normalizeLycras } from '../../../../lib/lycra';
import { db } from '../../../../services/firebaseconfig';

interface AthleteInput {
  name: string;
  lycra: string;
  lycraColor: string;
}

const DEFAULT_DURATION = '20';

export default function NewHeatScreen() {
  const params = useLocalSearchParams();
  const compID = Array.isArray(params.compID) ? params.compID[0] : params.compID;
  const catID = Array.isArray(params.catID) ? params.catID[0] : params.catID;

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [athletes, setAthletes] = useState<AthleteInput[]>([]);

  useEffect(() => {
    if (!compID) return;

    const fetchLycras = async () => {
      try {
        const compDoc = await getDoc(doc(db, 'competitions', compID));
        const lycras = compDoc.exists()
          ? normalizeLycras(compDoc.data().lycraColors)
          : DEFAULT_LYCRAS;

        setAthletes(lycras.map((l) => ({ name: '', lycra: l.name, lycraColor: l.color })));
      } catch (error) {
        console.error('Erro ao buscar lycras', error);
        setAthletes(DEFAULT_LYCRAS.map((l) => ({ name: '', lycra: l.name, lycraColor: l.color })));
      } finally {
        setLoading(false);
      }
    };

    fetchLycras();
  }, [compID]);

  const saveHeat = async () => {
    if (!compID || !catID) return;

    const minutes = parseInt(duration, 10);
    if (isNaN(minutes) || minutes <= 0) {
      Alert.alert('Erro', 'Informe o tempo da bateria em minutos.');
      return;
    }

    try {
      const heatRef = collection(db, 'competitions', compID, 'categories', catID, 'heats');
      await addDoc(heatRef, {
        name: name.trim(),
        durationMinutes: minutes,
        athletes,
        status: 'waiting',
        endsAtMs: null,
        remainingMs: null,
        createdAt: new Date(),
      });
      Alert.alert('Sucesso', 'Bateria criada!');
      router.back();
    } catch {
      Alert.alert('Erro', 'Falha ao salvar bateria.');
    }
  };

  if (loading) {
    return (
      <View style={globalStyles.container}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.card}>
        <Text style={globalStyles.label}>Nome da bateria</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="Ex: Final, Bateria 1..."
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
        />

        <Text style={globalStyles.label}>Tempo da bateria (minutos)</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="20"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          value={duration}
          onChangeText={setDuration}
        />
      </View>

      <Text style={globalStyles.title}>Atletas da Bateria</Text>
      <View style={[globalStyles.card, { marginBottom: 40 }]}>
        {athletes.map((ath, i) => (
          <View key={i} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  backgroundColor: ath.lycraColor,
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  marginRight: 8,
                }}
              />
              <Text style={[globalStyles.label, { fontSize: 14, marginBottom: 0 }]}>Lycra {ath.lycra}</Text>
            </View>
            <TextInput
              style={globalStyles.input}
              placeholder={`Nome do atleta (${ath.lycra})`}
              placeholderTextColor="#9CA3AF"
              value={ath.name}
              onChangeText={(text) => {
                const next = [...athletes];
                next[i] = { ...next[i], name: text };
                setAthletes(next);
              }}
            />
          </View>
        ))}

        <TouchableOpacity onPress={saveHeat} style={globalStyles.primaryButton}>
          <Text style={globalStyles.primaryButtonText}>Criar Bateria</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
