import { useLocalSearchParams } from 'expo-router';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { globalStyles } from '../../../constants/styles';
import { isLightColor } from '../../../lib/color';
import { notify } from '../../../lib/notify';
import { buildReportHtml } from '../../../lib/reportHtml';
import { CompetitionResults, fetchCompetitionResults } from '../../../lib/results';

export default function ReportScreen() {
  const params = useLocalSearchParams();
  const compID = Array.isArray(params.compID) ? params.compID[0] : params.compID;

  const [results, setResults] = useState<CompetitionResults | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!compID) return;
    fetchCompetitionResults(compID)
      .then(setResults)
      .catch(() => notify('Erro', 'Não foi possível carregar os resultados.'));
  }, [compID]);

  const generate = async () => {
    if (!results) return;
    setBusy(true);
    try {
      const html = buildReportHtml(results);
      if (Platform.OS === 'web') {
        await Print.printAsync({ html }); // navegador: "Salvar como PDF"
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        await shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      }
    } catch {
      notify('Erro', 'Falha ao gerar o PDF.');
    } finally {
      setBusy(false);
    }
  };

  if (!results) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }

  const totalHeats = results.categories.reduce((n, c) => n + c.heats.length, 0);

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.card}>
        <Text style={globalStyles.title}>{results.name}</Text>
        {results.location ? <Text style={{ color: '#6B7280' }}>📍 {results.location}</Text> : null}
        <Text style={{ color: '#6B7280', marginTop: 4 }}>
          {results.categories.length} categoria(s) • {totalHeats} bateria(s) encerrada(s)
        </Text>

        <TouchableOpacity
          onPress={generate}
          disabled={busy || totalHeats === 0}
          style={[globalStyles.primaryButton, { marginTop: 16, opacity: busy || totalHeats === 0 ? 0.5 : 1 }]}
        >
          <Text style={globalStyles.primaryButtonText}>
            {busy ? 'Gerando...' : Platform.OS === 'web' ? 'Gerar / Imprimir PDF' : 'Gerar PDF e compartilhar'}
          </Text>
        </TouchableOpacity>
        {totalHeats === 0 && (
          <Text style={{ color: '#9CA3AF', marginTop: 8, textAlign: 'center' }}>
            Nenhuma bateria encerrada ainda.
          </Text>
        )}
      </View>

      {results.categories.map((cat) => (
        <View key={cat.id} style={globalStyles.card}>
          <Text style={[globalStyles.rowText, { fontWeight: 'bold', marginBottom: 8 }]}>{cat.name}</Text>
          {cat.heats.length === 0 ? (
            <Text style={{ color: '#9CA3AF' }}>Sem baterias encerradas.</Text>
          ) : (
            cat.heats.map((h) => (
              <View key={h.id} style={{ marginBottom: 12 }}>
                <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 4 }}>{h.name}</Text>
                {h.ranking.map((a, i) => {
                  const color = a.lycraColor ?? '#9CA3AF';
                  return (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}>
                      <Text style={{ width: 30, fontWeight: 'bold', color: '#374151' }}>{i + 1}º</Text>
                      <View
                        style={{
                          width: 12, height: 12, borderRadius: 3, marginRight: 8,
                          backgroundColor: color,
                          borderWidth: 1, borderColor: isLightColor(color) ? '#D1D5DB' : color,
                        }}
                      />
                      <Text style={{ flex: 1, color: '#111827' }}>{a.name || 'Sem nome'}</Text>
                      <Text style={{ fontWeight: 'bold', color: '#0284C7' }}>{a.total}</Text>
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
