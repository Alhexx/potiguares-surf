import { useLocalSearchParams } from 'expo-router';
import { addDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { globalStyles } from '../../constants/styles';
import { db } from '../../services/firebaseconfig';


export default function ScoringScreen() {
  const { compID } = useLocalSearchParams();
  const [liveHeat, setLiveHeat] = useState<any>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<any>(null);
  const [score, setScore] = useState('');
  
  // Novo estado para guardar as notas que ESTE juiz já deu
  const [myPastScores, setMyPastScores] = useState<any[]>([]);
  const JUDGE_ID = 'juiz_teste_1'; // Fixo por enquanto, depois pegaremos do login

  useEffect(() => {
    if (!compID) return;
    const catsRef = collection(db, 'competitions', compID as string, 'categories');
    
    const unsubscribeCats = onSnapshot(catsRef, (catsSnap) => {
      catsSnap.forEach(catDoc => {
        const heatsRef = collection(db, 'competitions', compID as string, 'categories', catDoc.id, 'heats');
        const q = query(heatsRef, where('status', '==', 'live'));
        
        onSnapshot(q, (heatsSnap) => {
          if (!heatsSnap.empty) {
            const heatData = { id: heatsSnap.docs[0].id, catID: catDoc.id, ...heatsSnap.docs[0].data() };
            setLiveHeat(heatData);

            // Assim que acha a bateria ao vivo, busca as notas desse juiz para saber a contagem de ondas
            const wavesRef = collection(db, 'waves');
            const qWaves = query(wavesRef, where('heatID', '==', heatData.id), where('judgeId', '==', JUDGE_ID));
            onSnapshot(qWaves, (wavesSnap) => {
              if (!wavesSnap || !wavesSnap.docs) {
                setMyPastScores([]);
                return;
              }

              setMyPastScores(wavesSnap.docs.map(d => d.data()));
            });

          } else {
            setLiveHeat((prev: any) => (prev?.catID === catDoc.id ? null : prev));
          }
        });
      });
    });

    return () => unsubscribeCats();
  }, [compID]);

  // Calcula qual onda o atleta está pegando baseado em quantas notas o juiz já deu pra ele
  const getCurrentWaveNumber = (athleteName: string) => {
    const scoresForThisAthlete = myPastScores.filter(w => w.athlete === athleteName);
    return scoresForThisAthlete.length + 1; // Se deu 0 notas, é a onda 1. Se deu 1, é a onda 2.
  };

  const submitScore = async () => {
    if (!score || isNaN(Number(score)) || Number(score) < 0 || Number(score) > 10) {
      Alert.alert('Nota Inválida', 'Digite um valor entre 0 e 10.');
      return;
    }

    const waveNumber = getCurrentWaveNumber(selectedAthlete.name);

    try {
      await addDoc(collection(db, 'waves'), {
        compID: compID,
        heatID: liveHeat.id,
        athlete: selectedAthlete.name,
        lycra: selectedAthlete.lycra,
        score: parseFloat(score),
        judgeId: JUDGE_ID,
        waveNumber: waveNumber, // SALVANDO O NÚMERO DA ONDA!
        timestamp: new Date().toISOString()
      });

      Alert.alert('Sucesso', `Nota ${score} computada para a ONDA ${waveNumber}!`);
      setScore('');
      setSelectedAthlete(null);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao enviar a nota.');
    }
  };

  const getLycraColor = (lycra: string) => {
    const colors: any = { 'Vermelho': '#EF4444', 'Branco': '#F9FAFB', 'Amarelo': '#FBBF24', 'Azul': '#3B82F6', 'Preto': '#111827' };
    return colors[lycra] || '#9CA3AF';
  };

  if (!liveHeat) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={globalStyles.title}>Aguardando Direção...</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <Text style={[globalStyles.title, { textAlign: 'center', color: '#EF4444' }]}>● BATERIA AO VIVO</Text>

      {!selectedAthlete ? (
        <>
          <Text style={{ fontSize: 18, marginBottom: 16, textAlign: 'center' }}>De quem foi a onda?</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {/* 1. Verificação dupla: liveHeat existe? athletes existe? */}
            {(liveHeat?.athletes ?? []).map((ath: any, i: number) => {
              // 2. Segurança extra para o cálculo da onda, caso 'ath' ou 'ath.name' sejam nulos
              const waveNum = ath?.name ? getCurrentWaveNumber(ath.name) : 0;
              
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.lycraBtn, { backgroundColor: getLycraColor(ath?.lycra ?? 'Desconhecida') }]}
                  onPress={() => setSelectedAthlete(ath)}
                >
                  <Text style={{ 
                    color: (ath?.lycra === 'Branco' || ath?.lycra === 'Amarelo') ? '#000' : '#FFF', 
                    fontWeight: 'bold', 
                    fontSize: 18 
                  }}>
                    {ath?.lycra ?? 'N/A'}
                  </Text>
                  
                  <Text style={{ 
                    color: (ath?.lycra === 'Branco' || ath?.lycra === 'Amarelo') ? '#333' : '#E5E7EB' 
                  }}>
                    {ath?.name || 'Sem nome'}
                  </Text>

                  <View style={{ backgroundColor: 'rgba(0,0,0,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginTop: 8 }}>
                    <Text style={{ 
                      color: (ath?.lycra === 'Branco' || ath?.lycra === 'Amarelo') ? '#000' : '#FFF', 
                      fontSize: 12 
                    }}>
                      Julgar Onda {waveNum}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      ) : (
        <View style={globalStyles.card}>
          <Text style={[globalStyles.title, { textAlign: 'center', color: '#0284C7' }]}>
            ONDA {getCurrentWaveNumber(selectedAthlete.name)}
          </Text>
          <Text style={[globalStyles.label, { textAlign: 'center' }]}>{selectedAthlete.name} ({selectedAthlete.lycra})</Text>
          
          <TextInput
            style={[globalStyles.input, { fontSize: 40, textAlign: 'center', padding: 20, marginTop: 20 }]}
            placeholder="0.0"
            keyboardType="decimal-pad"
            value={score}
            onChangeText={setScore}
            maxLength={4}
          />
          <TouchableOpacity style={[globalStyles.primaryButton, { backgroundColor: '#10B981', marginTop: 20 }]} onPress={submitScore}>
            <Text style={globalStyles.primaryButtonText}>Enviar Nota Oficial</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 24, alignItems: 'center', padding: 10 }} onPress={() => setSelectedAthlete(null)}>
            <Text style={{ color: '#6B7280', fontSize: 16 }}>Cancelar / Voltar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  lycraBtn: { width: '48%', padding: 20, borderRadius: 12, marginBottom: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, elevation: 3 }
});