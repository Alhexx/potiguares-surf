import { useLocalSearchParams } from 'expo-router';
import { addDoc, collection, doc, getDoc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import HeatTimer from '../../components/HeatTimer';
import { globalStyles } from '../../constants/styles';
import { subTextOn, textOn } from '../../lib/color';
import { auth, db } from '../../services/firebaseconfig';

export default function ScoringScreen() {
  const { compID } = useLocalSearchParams();
  const [liveHeat, setLiveHeat] = useState<any>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<any>(null);
  const [score, setScore] = useState('');
  
  const [JUDGE_ID, setJUDGE_ID] = useState<string>('juiz_teste_1');
  const [waveCountMap, setWaveCountMap] = useState<Record<string, number>>({});
  const [access, setAccess] = useState<'checking' | 'ok' | 'denied'>('checking');

  // 1. Identifica o usuário logado
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user?.uid) {
        setJUDGE_ID(user.uid);
      }
    });
    return unsub;
  }, []);

  // 1b. Confere se este juiz pertence a esta competição
  useEffect(() => {
    if (!compID || !JUDGE_ID || JUDGE_ID === 'juiz_teste_1') return;
    getDoc(doc(db, 'competitions', compID as string, 'judges', JUDGE_ID))
      .then((snap) => setAccess(snap.exists() ? 'ok' : 'denied'))
      .catch(() => setAccess('denied'));
  }, [compID, JUDGE_ID]);

  // 2. Busca a Bateria Ao Vivo (Live)
  useEffect(() => {
    if (!compID) return;
    const catsRef = collection(db, 'competitions', compID as string, 'categories');
    
    const unsubscribeCats = onSnapshot(catsRef, (catsSnap) => {
      let foundActiveHeat = false;
      
      catsSnap.forEach(catDoc => {
        const heatsRef = collection(db, 'competitions', compID as string, 'categories', catDoc.id, 'heats');
        const q = query(heatsRef, where('status', '==', 'live'));
        
        onSnapshot(q, (heatsSnap) => {
          if (!heatsSnap.empty) {
            const heatData = { id: heatsSnap.docs[0].id, catID: catDoc.id, ...heatsSnap.docs[0].data() };
            setLiveHeat(heatData);
            foundActiveHeat = true;
          } else {
            setLiveHeat((prev: any) => (prev?.catID === catDoc.id ? null : prev));
          }
        });
      });
    });

    return () => unsubscribeCats();
  }, [compID]);

  // 3. Escuta em TEMPO REAL as ondas dadas ESPECIFICAMENTE por este juiz nesta bateria
  useEffect(() => {
    if (!liveHeat?.id || !JUDGE_ID) {
      setWaveCountMap({});
      return;
    }

    const wavesRef = collection(db, 'waves');
    const qWaves = query(
      wavesRef, 
      where('heatID', '==', liveHeat.id), 
      where('judgeId', '==', JUDGE_ID)
    );

    const unsubscribeWaves = onSnapshot(qWaves, (wavesSnap) => {
      const countMap: Record<string, number> = {};

      wavesSnap.docs.forEach(doc => {
        const data = doc.data();
        const athleteName = data.athlete;
        const waveNum = data.waveNumber || 1;

        // Armazena sempre o maior número de onda registrado para cada atleta por este juiz
        if (!countMap[athleteName] || waveNum > countMap[athleteName]) {
          countMap[athleteName] = waveNum;
        }
      });

      setWaveCountMap(countMap);
    });

    return () => unsubscribeWaves();
  }, [liveHeat?.id, JUDGE_ID]);

  // Retorna a próxima onda que o juiz deve dar para o atleta
  const getNextWaveNumberForAthlete = (athleteName: string) => {
    const lastWaveGiven = waveCountMap[athleteName] || 0;
    return lastWaveGiven + 1;
  };

  const submitScore = async () => {
    if (!score || isNaN(Number(score)) || Number(score) < 0 || Number(score) > 10) {
      Alert.alert('Nota Inválida', 'Digite um valor entre 0 e 10.');
      return;
    }

    const waveNumber = getNextWaveNumberForAthlete(selectedAthlete.name);

    try {
      await addDoc(collection(db, 'waves'), {
        compID: compID,
        heatID: liveHeat.id,
        athlete: selectedAthlete.name,
        lycra: selectedAthlete.lycra,
        score: parseFloat(score),
        judgeId: JUDGE_ID,
        waveNumber: waveNumber,
        timestamp: new Date().toISOString()
      });

      Alert.alert('Sucesso', `Nota ${score} computada para a ONDA ${waveNumber}!`);
      setScore('');
      setSelectedAthlete(null);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao enviar a nota.');
    }
  };

  if (access === 'denied') {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={globalStyles.title}>Sem acesso</Text>
        <Text style={{ color: '#6B7280', textAlign: 'center', marginTop: 8 }}>
          Você não está cadastrado como juiz nesta competição.
        </Text>
      </View>
    );
  }

  if (!liveHeat) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={globalStyles.title}>Aguardando Direção...</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <Text style={[globalStyles.title, { textAlign: 'center', color: '#EF4444', marginBottom: 4 }]}>● BATERIA AO VIVO</Text>
      <HeatTimer
        style={{ textAlign: 'center', fontSize: 32, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}
        status={liveHeat.status ?? 'live'}
        endsAtMs={liveHeat.endsAtMs}
        durationMinutes={liveHeat.durationMinutes}
        remainingMs={liveHeat.remainingMs}
        onExpire={() => {
          // fallback: se o tempo zera e a direção não encerrou, encerra daqui
          if (liveHeat?.id && liveHeat?.catID) {
            updateDoc(
              doc(db, 'competitions', compID as string, 'categories', liveHeat.catID, 'heats', liveHeat.id),
              { status: 'finished', endsAtMs: null, remainingMs: null },
            ).catch(() => {});
          }
        }}
      />

      {!selectedAthlete ? (
        <>
          <Text style={{ fontSize: 18, marginBottom: 16, textAlign: 'center' }}>De quem foi a onda?</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {(liveHeat?.athletes ?? []).map((ath: any, i: number) => {
              const waveNum = ath?.name ? getNextWaveNumberForAthlete(ath.name) : 1;
              const color = ath?.lycraColor ?? '#9CA3AF';

              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.lycraBtn, { backgroundColor: color }]}
                  onPress={() => setSelectedAthlete(ath)}
                >
                  <Text style={{ color: textOn(color), fontWeight: 'bold', fontSize: 18 }}>
                    {ath?.lycra ?? 'N/A'}
                  </Text>

                  <Text style={{ color: subTextOn(color) }}>
                    {ath?.name || 'Sem nome'}
                  </Text>

                  <View style={{ backgroundColor: 'rgba(0,0,0,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginTop: 8 }}>
                    <Text style={{ color: textOn(color), fontSize: 12 }}>
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
            ONDA {getNextWaveNumberForAthlete(selectedAthlete.name)}
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