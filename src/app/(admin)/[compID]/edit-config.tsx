import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LycraColorPicker from '../../../components/LycraColorPicker';
import { globalStyles } from '../../../constants/styles';
import { DEFAULT_LYCRAS, Lycra, normalizeLycras } from '../../../lib/lycra';
import { db } from '../../../services/firebaseconfig';

const MAX_LYCRAS = 6;

export default function EditConfig() {
  const { compID } = useLocalSearchParams();
  const [lycras, setLycras] = useState<Lycra[]>(DEFAULT_LYCRAS);
  const [picking, setPicking] = useState<number | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      const compDoc = await getDoc(doc(db, 'competitions', compID as string));
      if (compDoc.exists() && compDoc.data().lycraColors) {
        setLycras(normalizeLycras(compDoc.data().lycraColors));
      }
    };
    fetchConfig();
  }, [compID]);

  const setName = (i: number, name: string) => {
    setLycras((prev) => prev.map((l, idx) => (idx === i ? { ...l, name } : l)));
  };

  const setColor = (i: number, color: string) => {
    setLycras((prev) => prev.map((l, idx) => (idx === i ? { ...l, color } : l)));
    setPicking(null);
  };

  const addLycra = () => {
    if (lycras.length >= MAX_LYCRAS) return;
    setLycras((prev) => [...prev, { name: '', color: '#9CA3AF' }]);
  };

  const removeLycra = (i: number) => {
    setLycras((prev) => prev.filter((_, idx) => idx !== i));
  };

  const saveConfig = async () => {
    const cleaned = lycras
      .map((l) => ({ name: l.name.trim(), color: l.color }))
      .filter((l) => l.name.length > 0);

    if (cleaned.length === 0) {
      Alert.alert('Erro', 'Defina pelo menos uma lycra com nome.');
      return;
    }

    try {
      await updateDoc(doc(db, 'competitions', compID as string), { lycraColors: cleaned });
      Alert.alert('Sucesso', 'Cores atualizadas!');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar.');
    }
  };

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.card}>
        <Text style={globalStyles.label}>Cores de Lycra da competição</Text>
        <Text style={{ color: '#6B7280', marginBottom: 16 }}>
          Escreva o nome e toque no quadrado para escolher a cor exata.
        </Text>

        {lycras.map((l, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <TouchableOpacity
              onPress={() => setPicking(i)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                backgroundColor: l.color,
                borderWidth: 1,
                borderColor: '#D1D5DB',
                marginRight: 12,
              }}
            />
            <TextInput
              value={l.name}
              placeholder={`Lycra ${i + 1}`}
              placeholderTextColor="#9CA3AF"
              onChangeText={(t) => setName(i, t)}
              style={[globalStyles.input, { flex: 1, marginBottom: 0 }]}
            />
            {lycras.length > 1 && (
              <TouchableOpacity onPress={() => removeLycra(i)} style={{ padding: 10, marginLeft: 4 }}>
                <Text style={{ color: '#DC2626', fontSize: 20, fontWeight: 'bold' }}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {lycras.length < MAX_LYCRAS && (
          <TouchableOpacity onPress={addLycra} style={{ paddingVertical: 10 }}>
            <Text style={{ color: '#0284C7', fontWeight: 'bold' }}>+ Adicionar lycra</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={saveConfig} style={[globalStyles.primaryButton, { marginTop: 12 }]}>
          <Text style={globalStyles.primaryButtonText}>Salvar Cores</Text>
        </TouchableOpacity>
      </View>

      <LycraColorPicker
        visible={picking !== null}
        initialColor={picking !== null ? lycras[picking].color : '#9CA3AF'}
        onCancel={() => setPicking(null)}
        onSelect={(hex) => picking !== null && setColor(picking, hex)}
      />
    </ScrollView>
  );
}
