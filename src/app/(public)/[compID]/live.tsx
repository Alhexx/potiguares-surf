import { useLocalSearchParams } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { db } from '../../../services/firebaseconfig';

export default function PublicLiveScore() {
  const { compID } = useLocalSearchParams();
  const [liveHeat, setLiveHeat] = useState<any>(null);
  const [waves, setWaves] = useState<any[]>([]);
  const [totalJudges, setTotalJudges] = useState<number>(0);

  useEffect(() => {
    if (!compID) return;

    // 1. Busca quantos juízes estão cadastrados nesta competição
    const judgesRef = collection(db, 'competitions', compID as string, 'judges');
    const unsubJudges = onSnapshot(judgesRef, (judgesSnap) => {
      // Se por acaso não houver juízes cadastrados no banco, usamos um fallback seguro (ex: 3 ou 4)
      setTotalJudges(judgesSnap.size > 0 ? judgesSnap.size : 1);
    });

    // 2. Caça qual bateria está "Live" nesta competição
    const catsRef = collection(db, 'competitions', compID as string, 'categories');
    const unsubscribeCats = onSnapshot(catsRef, (catsSnap) => {
      let foundLive = false;
      catsSnap.forEach(catDoc => {
        const heatsRef = collection(db, 'competitions', compID as string, 'categories', catDoc.id, 'heats');
        const q = query(heatsRef, where('status', '==', 'live'));
        
        onSnapshot(q, (heatsSnap) => {
          if (!heatsSnap.empty) {
            foundLive = true;
            const heatData = { id: heatsSnap.docs[0].id, catID: catDoc.id, ...heatsSnap.docs[0].data() };
            setLiveHeat(heatData);

            // 3. Busca as notas dessa bateria
            const wavesRef = collection(db, 'waves');
            const qWaves = query(wavesRef, where('heatID', '==', heatData.id));
            onSnapshot(qWaves, (wavesSnap) => {
              setWaves(wavesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
          }
        });
      });
      if (!foundLive) setLiveHeat(null);
    });

    return () => {
      unsubJudges();
      unsubscribeCats();
    };
  }, [compID]);

  // MOTOR WSL COM TRAVA DE TODOS OS JUIZES
  const calculateWSL = (athleteName: string) => {
    const athleteNotes = waves.filter(w => w.athlete === athleteName);
    const wavesGrouped: { [key: number]: number[] } = {};
    
    athleteNotes.forEach(w => {
      if (!wavesGrouped[w.waveNumber]) wavesGrouped[w.waveNumber] = [];
      wavesGrouped[w.waveNumber].push(w.score);
    });

    const waveAverages: number[] = [];

    // Percorre cada onda surfada pelo atleta
    for (const wNum in wavesGrouped) {
      const scores = wavesGrouped[wNum];

      // TRAVA DE SEGURANÇA: Só processa a onda se o número de notas recebidas 
      // for igual ao total de juízes cadastrados no evento!
      if (scores.length >= totalJudges) {
        if (scores.length < 3) {
          waveAverages.push(scores.reduce((a, b) => a + b, 0) / scores.length);
        } else {
          const sorted = [...scores].sort((a, b) => a - b);
          const trimmed = sorted.slice(1, -1); // Descarta maior e menor (formato WSL)
          waveAverages.push(trimmed.reduce((a, b) => a + b, 0) / trimmed.length);
        }
      }
    }

    waveAverages.sort((a, b) => b - a);
    const top2 = waveAverages.slice(0, 2); // Pega as 2 melhores ondas computadas
    const total = top2.reduce((a, b) => a + b, 0);

    return {
      total: total.toFixed(2),
      onda1: top2[0] ? top2[0].toFixed(2) : '0.00',
      onda2: top2[1] ? top2[1].toFixed(2) : '0.00',
    };
  };

  const getLycraColor = (lycra: string) => {
    const colors: any = { 'Vermelho': '#EF4444', 'Branco': '#FFFFFF', 'Amarelo': '#FBBF24', 'Azul': '#3B82F6', 'Preto': '#111827' };
    return colors[lycra] || '#9CA3AF';
  };

  if (!liveHeat) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.waitingText}>Próxima Bateria em Breve...</Text>
        <ActivityIndicator size="large" color="#0284C7" style={{ marginTop: 20 }} />
      </View>
    );
  }

  const sortedAthletes = [...(liveHeat.athletes || [])].sort((a, b) => {
    return parseFloat(calculateWSL(b.name).total) - parseFloat(calculateWSL(a.name).total);
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.liveTag}>🔴 AO VIVO</Text>
        <Text style={styles.heatTitle}>Bateria em Andamento</Text>
      </View>

      {sortedAthletes.map((ath: any, index: number) => {
        const stats = calculateWSL(ath.name);
        const bgColor = getLycraColor(ath.lycra);
        const isLight = ath.lycra === 'Branco' || ath.lycra === 'Amarelo';

        return (
          <View key={index} style={[styles.card, { backgroundColor: bgColor }]}>
            <View style={styles.row}>
              <View style={styles.positionBadge}>
                <Text style={styles.positionText}>{index + 1}º</Text>
              </View>
              
              <View style={styles.infoBox}>
                <Text style={[styles.name, { color: isLight ? '#111827' : '#FFFFFF' }]}>
                  {ath.name || 'Sem nome'}
                </Text>
                
                <View style={styles.wavesBox}>
                  <Text style={[styles.waveText, { color: isLight ? '#374151' : '#E5E7EB' }]}>
                    #1: {stats.onda1}
                  </Text>
                  <Text style={[styles.waveText, { color: isLight ? '#374151' : '#E5E7EB', marginLeft: 16 }]}>
                    #2: {stats.onda2}
                  </Text>
                </View>
              </View>

              <View style={styles.scoreBox}>
                <Text style={[styles.totalScore, { color: isLight ? '#111827' : '#FFFFFF' }]}>
                  {stats.total}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', padding: 16 },
  centerContainer: { flex: 1, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },
  waitingText: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
  header: { alignItems: 'center', marginBottom: 24, marginTop: 40 },
  liveTag: { backgroundColor: '#EF4444', color: '#FFF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, fontWeight: 'bold', marginBottom: 8 },
  heatTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '600' },
  card: { borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, elevation: 5 },
  row: { flexDirection: 'row', alignItems: 'center' },
  positionBadge: { backgroundColor: 'rgba(255,255,255,0.3)', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  positionText: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  infoBox: { flex: 1 },
  name: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  wavesBox: { flexDirection: 'row' },
  waveText: { fontSize: 16, fontWeight: '600' },
  scoreBox: { alignItems: 'flex-end', justifyContent: 'center' },
  totalScore: { fontSize: 40, fontWeight: 'bold' }
});