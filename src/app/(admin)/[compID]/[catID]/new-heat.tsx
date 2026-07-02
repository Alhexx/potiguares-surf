import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { globalStyles } from '../../../../constants/styles';
import { db } from '../../../../services/firebaseconfig';

interface AthleteInput {
  name: string;
  lycra: string;
}

export default function NewHeatScreen() {
  const params = useLocalSearchParams();
  const compID = Array.isArray(params.compID) ? params.compID[0] : params.compID;
  const catID = Array.isArray(params.catID) ? params.catID[0] : params.catID;
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [athletes, setAthletes] = useState<AthleteInput[]>([]);

  useEffect(() => {
    if (!compID) return;

    const fetchLycras = async () => {
      try {
        const compDoc = await getDoc(doc(db, 'competitions', compID));
        let loadedLycras = ['Vermelho', 'Branco', 'Amarelo', 'Azul']; 
        
        if (compDoc.exists()) {
          const data = compDoc.data();
          if (data.lycraColors && Array.isArray(data.lycraColors)) {
            loadedLycras = data.lycraColors;
          }
        }

        const initialAthletes: AthleteInput[] = loadedLycras.map(lycra => ({ 
          name: '', 
          lycra: lycra 
        }));
        setAthletes(initialAthletes);
      } catch (error) {
        console.error("Erro ao buscar lycras", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLycras();
  }, [compID]);

  const saveHeat = async () => {
    if (!compID || !catID) return;
    
    try {
      const heatRef = collection(db, 'competitions', compID, 'categories', catID, 'heats');
      await addDoc(heatRef, { 
        athletes, 
        status: 'waiting', 
        createdAt: new Date() 
      });
      Alert.alert('Sucesso', 'Bateria criada!');
      router.back();
    } catch (e) {
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
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Atletas da Bateria</Text>
      
      <View style={globalStyles.card}>
        {(athletes ?? []).map((ath, i) => (
          <View key={i} style={{ marginBottom: 12 }}>
            <Text style={[globalStyles.label, { fontSize: 14 }]}>Lycra {ath.lycra}</Text>
            <TextInput 
              style={globalStyles.input}
              placeholder={`Nome do atleta (${ath.lycra})`} 
              value={ath.name}
              onChangeText={(text) => {
                // Imutabilidade: cria nova cópia do array
                const newAthletes = [...athletes];
                newAthletes[i] = { ...newAthletes[i], name: text };
                setAthletes(newAthletes);
              }} 
            />
          </View>
        ))}
        
        <TouchableOpacity onPress={saveHeat} style={globalStyles.primaryButton}>
          <Text style={globalStyles.primaryButtonText}>Criar Bateria</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}