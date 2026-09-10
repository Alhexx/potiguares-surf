import { useLocalSearchParams } from 'expo-router';
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import HeatTimer from '../../../../components/HeatTimer';
import { globalStyles } from '../../../../constants/styles';
import { notify } from '../../../../lib/notify';
import { calculateWSL, Wave } from '../../../../lib/wsl';
import { db } from '../../../../services/firebaseconfig';

interface Athlete {
  name: string;
  lycra: string;
  lycraColor?: string;
}

interface Heat {
  id: string;
  status: 'waiting' | 'live' | 'finished';
  athletes: Athlete[];
  name?: string;
  durationMinutes?: number;
  endsAtMs?: number | null;
  remainingMs?: number | null;
}

export default function HeatControlScreen() {
  const { compID, catID, heatID } = useLocalSearchParams();
  const [heat, setHeat] = useState<Heat | null>(null);
  const [waves, setWaves] = useState<Wave[]>([]);
  const [totalJudges, setTotalJudges] = useState(0);
  const [durationInput, setDurationInput] = useState('');
  const [editNames, setEditNames] = useState<string[] | null>(null);

  const heatRef = () =>
    doc(db, 'competitions', compID as string, 'categories', catID as string, 'heats', heatID as string);

  useEffect(() => {
    if (!compID || !catID || !heatID) return;

    const unsubHeat = onSnapshot(heatRef(), (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Heat;
        setHeat(data);
        setDurationInput((prev) => prev || String(data.durationMinutes ?? 20));
      }
    });

    const unsubJudges = onSnapshot(
      collection(db, 'competitions', compID as string, 'judges'),
      (s) => setTotalJudges(s.size),
    );

    const q = query(collection(db, 'waves'), where('heatID', '==', heatID as string));
    const unsubWaves = onSnapshot(q, (snap) => {
      const received = (snap?.docs ?? []).map((d) => ({ id: d.id, ...d.data() } as Wave));
      received.sort((a, b) => new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime());
      setWaves(received);
    });

    return () => {
      unsubHeat();
      unsubJudges();
      unsubWaves();
    };
  }, [compID, catID, heatID]);

  const startHeat = async () => {
    if (!heat) return;
    const minutes = heat.durationMinutes ?? 20;
    const ms = heat.remainingMs && heat.remainingMs > 0 ? heat.remainingMs : minutes * 60000;
    try {
      await updateDoc(heatRef(), { status: 'live', endsAtMs: Date.now() + ms, remainingMs: null });
    } catch {
      notify('Erro', 'Não foi possível iniciar.');
    }
  };

  const pauseHeat = async () => {
    if (!heat) return;
    const left = Math.max(0, (heat.endsAtMs ?? 0) - Date.now());
    try {
      await updateDoc(heatRef(), { status: 'waiting', remainingMs: left, endsAtMs: null });
    } catch {
      notify('Erro', 'Não foi possível pausar.');
    }
  };

  const finishHeat = async () => {
    try {
      await updateDoc(heatRef(), { status: 'finished', endsAtMs: null, remainingMs: null });
    } catch {
      notify('Erro', 'Não foi possível encerrar.');
    }
  };

  const saveDuration = async () => {
    const minutes = parseInt(durationInput, 10);
    if (isNaN(minutes) || minutes <= 0) {
      notify('Erro', 'Tempo inválido.');
      return;
    }
    try {
      await updateDoc(heatRef(), { durationMinutes: minutes });
      notify('Ok', 'Tempo da bateria atualizado.');
    } catch {
      notify('Erro', 'Não foi possível salvar o tempo.');
    }
  };

  const saveNames = async () => {
    if (!heat || !editNames) return;
    const athletes = heat.athletes.map((a, i) => ({ ...a, name: (editNames[i] ?? '').trim() }));
    try {
      await updateDoc(heatRef(), { athletes });
      setEditNames(null);
      notify('Ok', 'Atletas atualizados.');
    } catch {
      notify('Erro', 'Não foi possível salvar os atletas.');
    }
  };

  if (!heat) {
    return (
      <View style={globalStyles.container}>
        <Text style={{ textAlign: 'center', marginTop: 20 }}>Carregando bateria...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={globalStyles.container} showsVerticalScrollIndicator={false}>
      <View style={globalStyles.card}>
        <Text style={[globalStyles.title, { textAlign: 'center', marginBottom: 4 }]}>
          {heat.name?.trim() || 'Bateria'}
        </Text>
        <Text style={{ textAlign: 'center', color: '#6B7280', marginBottom: 8 }}>
          Status: {heat.status.toUpperCase()}
        </Text>

        <HeatTimer
          style={{
            textAlign: 'center',
            fontSize: 48,
            fontWeight: 'bold',
            color: heat.status === 'live' ? '#EF4444' : '#111827',
            marginBottom: 16,
          }}
          status={heat.status}
          endsAtMs={heat.endsAtMs}
          durationMinutes={heat.durationMinutes}
          remainingMs={heat.remainingMs}
          onExpire={finishHeat}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity style={[globalStyles.primaryButton, { backgroundColor: '#10B981', flex: 1, marginRight: 5 }]} onPress={startHeat}>
            <Text style={globalStyles.primaryButtonText}>▶ {heat.remainingMs ? 'RETOMAR' : 'INICIAR'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[globalStyles.primaryButton, { backgroundColor: '#F59E0B', flex: 1, marginHorizontal: 5 }]} onPress={pauseHeat}>
            <Text style={globalStyles.primaryButtonText}>⏸ PAUSAR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[globalStyles.primaryButton, { backgroundColor: '#EF4444', flex: 1, marginLeft: 5 }]} onPress={finishHeat}>
            <Text style={globalStyles.primaryButtonText}>⏹ FIM</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
          <Text style={{ color: '#374151', marginRight: 8 }}>Tempo (min):</Text>
          <TextInput
            style={[globalStyles.input, { flex: 1, marginBottom: 0 }]}
            keyboardType="number-pad"
            value={durationInput}
            onChangeText={setDurationInput}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity onPress={saveDuration} style={{ padding: 12, marginLeft: 4 }}>
            <Text style={{ color: '#0284C7', fontWeight: 'bold' }}>Salvar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* editar nomes dos atletas */}
      <View style={globalStyles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[globalStyles.label, { marginBottom: 0 }]}>Atletas</Text>
          {editNames === null ? (
            <TouchableOpacity onPress={() => setEditNames(heat.athletes.map((a) => a.name))}>
              <Text style={{ color: '#0284C7', fontWeight: 'bold' }}>Editar</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <TouchableOpacity onPress={() => setEditNames(null)}>
                <Text style={{ color: '#6B7280' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveNames}>
                <Text style={{ color: '#0284C7', fontWeight: 'bold' }}>Salvar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {heat.athletes.map((a, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
            <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: a.lycraColor ?? '#9CA3AF', borderWidth: 1, borderColor: '#D1D5DB', marginRight: 10 }} />
            {editNames === null ? (
              <Text style={{ color: '#111827', fontSize: 15 }}>{a.name || 'Sem nome'} <Text style={{ color: '#9CA3AF' }}>({a.lycra})</Text></Text>
            ) : (
              <TextInput
                style={[globalStyles.input, { flex: 1, marginBottom: 0 }]}
                value={editNames[i]}
                placeholder={`Atleta (${a.lycra})`}
                placeholderTextColor="#9CA3AF"
                onChangeText={(t) => setEditNames((prev) => prev!.map((v, idx) => (idx === i ? t : v)))}
              />
            )}
          </View>
        ))}
      </View>

      <Text style={globalStyles.title}>Placar Oficial (Top 2 Ondas)</Text>
      {totalJudges > 0 && (
        <Text style={{ color: '#6B7280', marginBottom: 8 }}>
          Cada onda só entra no placar com as {totalJudges} notas.
        </Text>
      )}

      {(heat.athletes ?? []).map((ath, i) => {
        const stats = calculateWSL(waves, ath.name, totalJudges);
        return (
          <View key={i} style={[globalStyles.card, { borderLeftWidth: 6, borderLeftColor: ath.lycraColor ?? '#9CA3AF' }]}>
            <View style={globalStyles.rowInfo}>
              <View>
                <Text style={globalStyles.rowText}>{ath.name || 'Sem nome'}</Text>
                <Text style={{ color: '#6B7280' }}>Lycra {ath.lycra} • {stats.qtdOndas} ondas completas</Text>
                <View style={{ flexDirection: 'row', marginTop: 8 }}>
                  <View style={{ backgroundColor: '#F3F4F6', padding: 6, borderRadius: 6, marginRight: 8 }}>
                    <Text style={{ fontSize: 12 }}>Top 1: <Text style={{ fontWeight: 'bold' }}>{stats.onda1}</Text></Text>
                  </View>
                  <View style={{ backgroundColor: '#F3F4F6', padding: 6, borderRadius: 6 }}>
                    <Text style={{ fontSize: 12 }}>Top 2: <Text style={{ fontWeight: 'bold' }}>{stats.onda2}</Text></Text>
                  </View>
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
