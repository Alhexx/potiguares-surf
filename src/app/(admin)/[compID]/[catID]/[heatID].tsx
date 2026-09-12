import { useLocalSearchParams } from 'expo-router';
import { collection, doc, getDoc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import HeatTimer from '../../../../components/HeatTimer';
import { globalStyles } from '../../../../constants/styles';
import { buildAuditTable, JudgeCol } from '../../../../lib/heatAudit';
import { notify } from '../../../../lib/notify';
import { buildHeatReportHtml } from '../../../../lib/reportHtml';
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
  const [judges, setJudges] = useState<JudgeCol[]>([]);
  const [durationInput, setDurationInput] = useState('');
  const [editNames, setEditNames] = useState<string[] | null>(null);
  const [editingWaveId, setEditingWaveId] = useState<string | null>(null);
  const [editScore, setEditScore] = useState('');
  const [names, setNames] = useState({ comp: '', cat: '' });
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const totalJudges = judges.length;

  const heatRef = () =>
    doc(db, 'competitions', compID as string, 'categories', catID as string, 'heats', heatID as string);

  useEffect(() => {
    if (!compID || !catID || !heatID) return;

    const ref = doc(db, 'competitions', compID as string, 'categories', catID as string, 'heats', heatID as string);
    const unsubHeat = onSnapshot(ref, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Heat;
        setHeat(data);
        setDurationInput((prev) => prev || String(data.durationMinutes ?? 20));
      }
    });

    const unsubJudges = onSnapshot(
      collection(db, 'competitions', compID as string, 'judges'),
      (s) => {
        // ordem estável (por id do doc) pra coluna de cada juiz não pular de lugar
        const sorted = s.docs.map((d) => d.id).sort();
        setJudges(sorted.map((id, i) => ({ id, label: `Árbitro ${i + 1}` })));
      },
    );

    Promise.all([
      getDoc(doc(db, 'competitions', compID as string)),
      getDoc(doc(db, 'competitions', compID as string, 'categories', catID as string)),
    ]).then(([compSnap, catSnap]) => {
      setNames({
        comp: compSnap.exists() ? (compSnap.data() as any).name ?? '' : '',
        cat: catSnap.exists() ? (catSnap.data() as any).name ?? '' : '',
      });
    });

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

  const startEditScore = (w: Wave) => {
    setEditingWaveId(w.id ?? null);
    setEditScore(w.score.toFixed(1));
  };

  const saveScore = async (waveId: string) => {
    // mesma normalização vírgula->ponto do teclado do juiz
    const value = parseFloat(editScore.replace(',', '.'));
    if (isNaN(value) || value < 0 || value > 10) {
      notify('Erro', 'Nota inválida (0 a 10).');
      return;
    }
    try {
      await updateDoc(doc(db, 'waves', waveId), { score: value });
      setEditingWaveId(null);
    } catch {
      notify('Erro', 'Não foi possível salvar a nota. Só o admin pode editar.');
    }
  };

  const generateHeatReport = async () => {
    if (!heat) return;
    const namedAthletes = heat.athletes.filter((a) => a.name?.trim());
    setGeneratingPdf(true);
    try {
      const html = buildHeatReportHtml({
        compName: names.comp,
        catName: names.cat,
        heatName: heat.name?.trim() || 'Bateria',
        judges,
        athletes: namedAthletes,
        waves,
      });
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        await shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      }
    } catch {
      notify('Erro', 'Falha ao gerar o PDF.');
    } finally {
      setGeneratingPdf(false);
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

        {heat.athletes.map((a, i) => {
          // Lycra configurada mas não usada nesta bateria (nome vazio) — não exibe.
          if (!a.name?.trim()) return null;
          return (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
              <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: a.lycraColor ?? '#9CA3AF', borderWidth: 1, borderColor: '#D1D5DB', marginRight: 10 }} />
              {editNames === null ? (
                <Text style={{ color: '#111827', fontSize: 15 }}>{a.name} <Text style={{ color: '#9CA3AF' }}>({a.lycra})</Text></Text>
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
          );
        })}
      </View>

      <Text style={globalStyles.title}>Placar Oficial (Top 2 Ondas)</Text>
      {totalJudges > 0 && (
        <Text style={{ color: '#6B7280', marginBottom: 8 }}>
          Cada onda só entra no placar com as {totalJudges} notas.
        </Text>
      )}

      {(heat.athletes ?? []).filter((a) => a.name?.trim()).map((ath, i) => {
        const stats = calculateWSL(waves, ath.name, totalJudges);
        return (
          <View key={i} style={[globalStyles.card, { borderLeftWidth: 6, borderLeftColor: ath.lycraColor ?? '#9CA3AF' }]}>
            <View style={globalStyles.rowInfo}>
              <View>
                <Text style={globalStyles.rowText}>{ath.name}</Text>
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

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
        <Text style={globalStyles.title}>Relatório Detalhado</Text>
        <TouchableOpacity
          onPress={generateHeatReport}
          disabled={generatingPdf || judges.length === 0}
          style={{ opacity: generatingPdf || judges.length === 0 ? 0.5 : 1 }}
        >
          <Text style={{ color: '#0284C7', fontWeight: 'bold' }}>{generatingPdf ? 'Gerando...' : '📄 Gerar PDF'}</Text>
        </TouchableOpacity>
      </View>

      {judges.length === 0 ? (
        <Text style={{ color: '#9CA3AF', marginBottom: 16 }}>Nenhum juiz cadastrado nesta competição ainda.</Text>
      ) : (
        (heat.athletes ?? []).filter((a) => a.name?.trim()).map((ath, i) => {
          const t = buildAuditTable(waves, ath.name, judges);
          return (
            <View key={i} style={[globalStyles.card, { paddingHorizontal: 0 }]}>
              <Text style={{ fontWeight: 'bold', color: '#111827', paddingHorizontal: 16, marginBottom: 8 }}>
                {ath.name} <Text style={{ color: '#9CA3AF', fontWeight: 'normal' }}>({ath.lycra})</Text>
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ paddingHorizontal: 16 }}>
                  <View style={{ flexDirection: 'row' }}>
                    <Text style={[styles.cell, styles.headCell, { width: 70 }]}></Text>
                    {judges.map((j) => (
                      <Text key={j.id} style={[styles.cell, styles.headCell]}>{j.label}</Text>
                    ))}
                    <Text style={[styles.cell, styles.headCell, styles.mediaCell]}>Média</Text>
                  </View>
                  {t.rows.length === 0 ? (
                    <Text style={{ color: '#9CA3AF', paddingVertical: 8 }}>Nenhuma nota ainda.</Text>
                  ) : (
                    t.rows.map((r) => (
                      <View key={r.waveNumber} style={{ flexDirection: 'row' }}>
                        <Text style={[styles.cell, { width: 70, textAlign: 'left' }]}>Onda {r.waveNumber}</Text>
                        {r.cells.map((c, ci) => (
                          <Text key={ci} style={styles.cell}>{c === null ? '—' : c.toFixed(1)}</Text>
                        ))}
                        <Text style={[styles.cell, styles.mediaCell, { fontWeight: 'bold' }]}>
                          {r.media === null ? '—' : r.media.toFixed(1)}
                        </Text>
                      </View>
                    ))
                  )}
                  {t.rows.length > 0 && (
                    <View style={{ flexDirection: 'row', backgroundColor: '#FEF9C3' }}>
                      <Text style={[styles.cell, { width: 70, textAlign: 'left', fontWeight: 'bold' }]}>Nota Final</Text>
                      {t.perJudgeTotal.map((v, vi) => (
                        <Text key={vi} style={[styles.cell, { fontWeight: 'bold' }]}>{v === null ? '—' : v.toFixed(1)}</Text>
                      ))}
                      <Text style={[styles.cell, styles.mediaCell, { fontWeight: 'bold' }]}>{t.officialTotal}</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>
          );
        })
      )}

      <Text style={[globalStyles.title, { marginTop: 20 }]}>Auditoria de Notas</Text>
      <Text style={{ color: '#9CA3AF', marginTop: -12, marginBottom: 8 }}>Toque numa nota pra corrigir (erro de digitação, penalidade...).</Text>
      <View style={[globalStyles.card, { marginBottom: 40 }]}>
        {waves.length === 0 ? (
          <Text style={{ color: '#9CA3AF', textAlign: 'center' }}>Nenhuma nota computada.</Text>
        ) : (
          waves.map((item) => (
            <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F3F4F6' }}>
              <Text style={{ color: '#374151', fontSize: 16 }}>
                {item.athlete} <Text style={{ fontWeight: 'bold' }}>{'Onda ' + item.waveNumber}</Text>
              </Text>

              {editingWaveId === item.id ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TextInput
                    autoFocus
                    style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, padding: 6, width: 60, textAlign: 'center', color: '#111827', fontSize: 16 }}
                    keyboardType="decimal-pad"
                    value={editScore}
                    onChangeText={(t) => setEditScore(t.replace(',', '.').replace(/[^0-9.]/g, ''))}
                  />
                  <TouchableOpacity onPress={() => item.id && saveScore(item.id)} hitSlop={8}>
                    <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 18 }}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditingWaveId(null)} hitSlop={8}>
                    <Text style={{ color: '#DC2626', fontWeight: 'bold', fontSize: 18 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => startEditScore(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: '#0284C7', fontWeight: 'bold', fontSize: 16 }}>{item.score.toFixed(1)}</Text>
                  <Text style={{ fontSize: 12 }}>✏️</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = {
  cell: {
    width: 64,
    textAlign: 'center' as const,
    paddingVertical: 8,
    color: '#111827',
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  headCell: { fontWeight: 'bold' as const, color: '#374151', fontSize: 12 },
  mediaCell: { color: '#0284C7', backgroundColor: '#F0F9FF' },
};
