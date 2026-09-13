import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import InterferenceBadge from '../../../components/InterferenceBadge';
import { isLightColor } from '../../../lib/color';
import { CompetitionResults, fetchCompetitionResults } from '../../../lib/results';

export default function PublicHistory() {
  const { compID } = useLocalSearchParams();
  const [data, setData] = useState<CompetitionResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!compID) return;
    let cancelled = false;
    fetchCompetitionResults(compID as string)
      .then((r) => !cancelled && setData(r))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [compID]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }

  const heats = (data?.categories ?? []).flatMap((cat) =>
    cat.heats.map((h) => ({ ...h, catName: cat.name })),
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Baterias Encerradas</Text>

      {heats.length === 0 && (
        <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 24 }}>
          Nenhuma bateria encerrada ainda.
        </Text>
      )}

      {heats.map((heat) => (
        <View key={heat.id} style={styles.card}>
          <Text style={styles.heatName}>{heat.name}</Text>
          <Text style={styles.catName}>{heat.catName}</Text>

          {heat.ranking.map((ath, i) => {
            const color = ath.lycraColor ?? '#9CA3AF';
            return (
              <View key={i} style={styles.rankRow}>
                <Text style={styles.pos}>{ath.disqualified ? '-' : `${i + 1}º`}</Text>
                <View style={[styles.dot, { backgroundColor: color, borderColor: isLightColor(color) ? '#D1D5DB' : color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.athName}>{ath.name || 'Sem nome'}</Text>
                  {ath.interferences > 0 && (
                    <View style={{ marginTop: 2 }}>
                      <InterferenceBadge interferences={ath.interferences} compact />
                    </View>
                  )}
                </View>
                <Text style={[styles.total, ath.disqualified && { color: '#DC2626' }]}>
                  {ath.disqualified ? 'DQ' : ath.total}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 16 },
  center: { flex: 1, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginVertical: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12 },
  heatName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  catName: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  rankRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderColor: '#F3F4F6' },
  pos: { width: 34, fontWeight: 'bold', color: '#374151' },
  dot: { width: 14, height: 14, borderRadius: 4, borderWidth: 1, marginRight: 10 },
  athName: { fontSize: 15, color: '#111827' },
  total: { fontSize: 18, fontWeight: 'bold', color: '#0284C7' },
});
