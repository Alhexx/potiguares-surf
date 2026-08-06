import { useLocalSearchParams } from 'expo-router';
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { globalStyles } from '../../../../constants/styles';
import { db } from '../../../../services/firebaseconfig';

interface Athlete {
  name: string;
  lycra: string;
}

interface Heat {
  id: string;
  status: 'waiting' | 'live' | 'finished';
  athletes: Athlete[];
}

interface Wave {
  id: string;
  athlete: string;
  score: number;
  waveNumber: number;
  timestamp: string;
}

export default function HeatControlScreen() {
  const { compID, catID, heatID } = useLocalSearchParams();
  const [heat, setHeat] = useState<Heat | null>(null);
  const [waves, setWaves] = useState<Wave[]>([]);

  useEffect(() => {
    if (!compID || !catID || !heatID) return;

    const heatRef = doc(db, 'competitions', compID as string, 'categories', catID as string, 'heats', heatID as string);
    const unsubscribeHeat = onSnapshot(heatRef, (docSnap) => {
      if (docSnap.exists()) {
        setHeat({ id: docSnap.id, ...docSnap.data() } as Heat);
      }
    });

    const wavesRef = collection(db, 'waves');
    const q = query(wavesRef, where('heatID', '==', heatID as string));
    const unsubscribeWaves = onSnapshot(q, (snap) => {
      if (!snap || !snap.docs) {
        setWaves([]);
        return;
      }
      const receivedNotes = snap.docs.map(d => ({ id: d.id, ...d.data() } as Wave));
      receivedNotes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setWaves(receivedNotes);
    });

    return () => {
      unsubscribeHeat();
      unsubscribeWaves();
    };
  }, [compID, catID, heatID]);

  const changeStatus = async (newStatus: 'waiting' | 'live' | 'finished') => {
    try {
      const heatRef = doc(db, 'competitions', compID as string, 'categories', catID as string, 'heats', heatID as string);
      await updateDoc(heatRef, { status: newStatus });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível alterar o status.');
    }
  };

  const calculateWSL = (athleteName: string) => {
    const athleteNotes = waves.filter(w => w.athlete === athleteName);
    const wavesGrouped: Record<number, number[]> = {};
    athleteNotes.forEach(w => {
      if (!wavesGrouped[w.waveNumber]) wavesGrouped[w.waveNumber] = [];
      wavesGrouped[w.waveNumber].push(w.score);
    });

    const waveAverages: number[] = [];
    Object.values(wavesGrouped).forEach(scores => {
      let avg = 0;
      if (scores.length < 3) {
        avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      } else {
        const sorted = [...scores].sort((a, b) => a - b);
        const trimmed = sorted.slice(1, -1);
        avg = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
      }
      waveAverages.push(avg);
    });

    waveAverages.sort((a, b) => b - a);
    const top2 = waveAverages.slice(0, 2);
    const total = top2.reduce((a, b) => a + b, 0);

    return {
      total: total.toFixed(2),
      onda1: top2[0] ? top2[0].toFixed(2) : '0.00',
      onda2: top2[1] ? top2[1].toFixed(2) : '0.00',
      qtdOndas: waveAverages.length,
    };
  };

  const getBorderColor = (lycra: string) => {
    const colors: Record<string, string> = { 'Vermelho': '#EF4444', 'Branco': '#E5E7EB', 'Amarelo': '#FBBF24', 'Azul': '#3B82F6', 'Preto': '#111827' };
    return colors[lycra] || '#9CA3AF';
  };

  if (!heat) {
    return <View style={globalStyles.container}><Text style={{textAlign: 'center', marginTop: 20}}>Carregando bateria...</Text></View>;
  }

  return (
    <ScrollView style={globalStyles.container} showsVerticalScrollIndicator={false}>
      <View style={globalStyles.card}>
        <Text style={[globalStyles.title, { textAlign: 'center', marginBottom: 16 }]}>Status: {heat.status.toUpperCase()}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity style={[globalStyles.primaryButton, { backgroundColor: '#10B981', flex: 1, marginRight: 5 }]} onPress={() => changeStatus('live')}><Text style={globalStyles.primaryButtonText}>▶ INICIAR</Text></TouchableOpacity>
          <TouchableOpacity style={[globalStyles.primaryButton, { backgroundColor: '#F59E0B', flex: 1, marginHorizontal: 5 }]} onPress={() => changeStatus('waiting')}><Text style={globalStyles.primaryButtonText}>⏸ PAUSAR</Text></TouchableOpacity>
          <TouchableOpacity style={[globalStyles.primaryButton, { backgroundColor: '#EF4444', flex: 1, marginLeft: 5 }]} onPress={() => changeStatus('finished')}><Text style={globalStyles.primaryButtonText}>⏹ FIM</Text></TouchableOpacity>
        </View>
      </View>

      <Text style={globalStyles.title}>Placar Oficial (Top 2 Ondas)</Text>
      
      {(heat.athletes ?? []).map((ath, i) => {
        const stats = calculateWSL(ath.name);
        return (
          <View key={i} style={[globalStyles.card, { borderLeftWidth: 6, borderLeftColor: getBorderColor(ath.lycra) }]}>
            <View style={globalStyles.rowInfo}>
              <View>
                <Text style={globalStyles.rowText}>{ath.name || 'Sem nome'}</Text>
                <Text style={{ color: '#6B7280' }}>Lycra {ath.lycra} • {stats.qtdOndas} ondas surfadas</Text>
                <View style={{ flexDirection: 'row', marginTop: 8 }}>
                  <View style={{ backgroundColor: '#F3F4F6', padding: 6, borderRadius: 6, marginRight: 8 }}><Text style={{ fontSize: 12 }}>Top 1: <Text style={{ fontWeight: 'bold' }}>{stats.onda1}</Text></Text></View>
                  <View style={{ backgroundColor: '#F3F4F6', padding: 6, borderRadius: 6 }}><Text style={{ fontSize: 12 }}>Top 2: <Text style={{ fontWeight: 'bold' }}>{stats.onda2}</Text></Text></View>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#111827' }}>{stats.total}</Text>
                <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 'bold' }}>SOMA (MAX 20)</Text>
              </View>
            </View>
          </View>
        );
      })}

      <Text style={[globalStyles.title, { marginTop: 20 }]}>Auditoria de Notas</Text>
      <View style={[globalStyles.card, { marginBottom: 40 }]}>
        {waves.length === 0 ? (
          <Text style={{ color: '#9CA3AF', textAlign: 'center' }}>Nenhuma nota computada.</Text>
        ) : (
          waves.map((item) => (
            <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F3F4F6' }}>
              <Text style={{ color: '#374151', fontSize: 16 }}>
                {item.athlete} <Text style={{ fontWeight: 'bold' }}>{'Onda ' + item.waveNumber}</Text>
              </Text>
              <Text style={{ color: '#0284C7', fontWeight: 'bold', fontSize: 16 }}>{item.score.toFixed(1)}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}