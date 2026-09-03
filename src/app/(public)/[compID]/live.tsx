import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import HeatTimer from '../../../components/HeatTimer';
import { isLightColor } from '../../../lib/color';
import { calculateWSL } from '../../../lib/wsl';
import { db } from '../../../services/firebaseconfig';

export default function PublicLiveScore() {
  const { compID } = useLocalSearchParams();
  const router = useRouter();
  const [liveHeat, setLiveHeat] = useState<any>(null);
  const [waves, setWaves] = useState<any[]>([]);
  const [totalJudges, setTotalJudges] = useState<number>(0);

  useEffect(() => {
    if (!compID) return;

    const judgesRef = collection(db, 'competitions', compID as string, 'judges');
    const unsubJudges = onSnapshot(judgesRef, (judgesSnap) => {
      setTotalJudges(judgesSnap.size > 0 ? judgesSnap.size : 1);
    });

    const catsRef = collection(db, 'competitions', compID as string, 'categories');
    const unsubscribeCats = onSnapshot(catsRef, (catsSnap) => {
      let foundLive = false;
      catsSnap.forEach((catDoc) => {
        const heatsRef = collection(db, 'competitions', compID as string, 'categories', catDoc.id, 'heats');
        const q = query(heatsRef, where('status', '==', 'live'));

        onSnapshot(q, (heatsSnap) => {
          if (!heatsSnap.empty) {
            foundLive = true;
            const heatData = { id: heatsSnap.docs[0].id, catID: catDoc.id, ...heatsSnap.docs[0].data() };
            setLiveHeat(heatData);

            const wavesRef = collection(db, 'waves');
            const qWaves = query(wavesRef, where('heatID', '==', heatData.id));
            onSnapshot(qWaves, (wavesSnap) => {
              setWaves(wavesSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
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

  const Nav = () => (
    <View style={styles.nav}>
      <TouchableOpacity style={styles.navBtn} onPress={() => router.push(`/(public)/${compID}/history`)}>
        <Text style={styles.navText}>Baterias anteriores</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.navBtn} onPress={() => router.push(`/(public)/${compID}/schedule`)}>
        <Text style={styles.navText}>Cronograma</Text>
      </TouchableOpacity>
    </View>
  );

  if (!liveHeat) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.waitingText}>Próxima Bateria em Breve...</Text>
        <ActivityIndicator size="large" color="#0284C7" style={{ marginTop: 20 }} />
        <View style={{ marginTop: 32, width: '100%', paddingHorizontal: 16 }}>
          <Nav />
        </View>
      </View>
    );
  }

  const sortedAthletes = [...(liveHeat.athletes || [])].sort(
    (a, b) =>
      parseFloat(calculateWSL(waves, b.name, totalJudges).total) -
      parseFloat(calculateWSL(waves, a.name, totalJudges).total),
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.liveTag}>🔴 AO VIVO</Text>
        <Text style={styles.heatTitle}>{liveHeat.name?.trim() || 'Bateria em Andamento'}</Text>
        <HeatTimer
          style={styles.timer}
          status={liveHeat.status ?? 'live'}
          endsAtMs={liveHeat.endsAtMs}
          durationMinutes={liveHeat.durationMinutes}
          remainingMs={liveHeat.remainingMs}
        />
      </View>

      {sortedAthletes.map((ath: any, index: number) => {
        const stats = calculateWSL(waves, ath.name, totalJudges);
        const bgColor = ath.lycraColor ?? '#9CA3AF';
        const isLight = isLightColor(bgColor);

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

      <View style={{ marginTop: 8, marginBottom: 40 }}>
        <Nav />
      </View>
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
  timer: { color: '#FBBF24', fontSize: 36, fontWeight: 'bold', marginTop: 6 },
  card: { borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, elevation: 5 },
  row: { flexDirection: 'row', alignItems: 'center' },
  positionBadge: { backgroundColor: 'rgba(255,255,255,0.3)', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  positionText: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  infoBox: { flex: 1 },
  name: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  wavesBox: { flexDirection: 'row' },
  waveText: { fontSize: 16, fontWeight: '600' },
  scoreBox: { alignItems: 'flex-end', justifyContent: 'center' },
  totalScore: { fontSize: 40, fontWeight: 'bold' },
  nav: { flexDirection: 'row', gap: 12 },
  navBtn: { flex: 1, backgroundColor: '#1F2937', borderWidth: 1, borderColor: '#374151', padding: 14, borderRadius: 10, alignItems: 'center' },
  navText: { color: '#E5E7EB', fontWeight: '600' },
});
