import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LycraColorPicker from '../../../components/LycraColorPicker';
import { globalStyles } from '../../../constants/styles';
import { applyLycraRenames } from '../../../lib/admin';
import { DEFAULT_LYCRAS, Lycra, newLycraId, normalizeLycras } from '../../../lib/lycra';
import { notify } from '../../../lib/notify';
import { db } from '../../../services/firebaseconfig';

const MAX_LYCRAS = 6;

export default function EditConfig() {
  const { compID } = useLocalSearchParams();
  const [lycras, setLycras] = useState<Lycra[]>(DEFAULT_LYCRAS);
  // snapshot do que estava salvo, pra saber o que mudou de nome/cor ao salvar
  const [original, setOriginal] = useState<Lycra[]>(DEFAULT_LYCRAS);
  const [picking, setPicking] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      const compDoc = await getDoc(doc(db, 'competitions', compID as string));
      const normalized = compDoc.exists() && compDoc.data().lycraColors
        ? normalizeLycras(compDoc.data().lycraColors)
        : DEFAULT_LYCRAS.map((l) => ({ ...l }));
      setLycras(normalized);
      setOriginal(normalized);
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
    setLycras((prev) => [...prev, { id: newLycraId(), name: '', color: '#9CA3AF' }]);
  };

  const removeLycra = (i: number) => {
    setLycras((prev) => prev.filter((_, idx) => idx !== i));
  };

  const saveConfig = async () => {
    const cleaned = lycras
      .map((l) => ({ id: l.id, name: l.name.trim(), color: l.color }))
      .filter((l) => l.name.length > 0);

    if (cleaned.length === 0) {
      notify('Erro', 'Defina pelo menos uma lycra com nome.');
      return;
    }

    // O que mudou de nome e/ou cor nesta edição, indexado pelo nome ANTIGO —
    // é isso que propaga pras baterias já criadas (passadas e atuais).
    const renameMap: Record<string, { name: string; color: string }> = {};
    for (const orig of original) {
      const now = cleaned.find((l) => l.id === orig.id);
      if (!now) continue; // lycra removida — histórico fica como está
      if (now.name !== orig.name || now.color !== orig.color) {
        renameMap[orig.name] = { name: now.name, color: now.color };
      }
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, 'competitions', compID as string), { lycraColors: cleaned });
      const updatedHeats = await applyLycraRenames(compID as string, renameMap);
      setOriginal(cleaned.map((l) => ({ ...l })));
      notify(
        'Sucesso',
        updatedHeats > 0 ? `Cores atualizadas! ${updatedHeats} bateria(s) sincronizada(s).` : 'Cores atualizadas!',
      );
    } catch {
      notify('Erro', 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.card}>
        <Text style={globalStyles.label}>Cores de Lycra da competição</Text>
        <Text style={{ color: '#6B7280', marginBottom: 16 }}>
          Escreva o nome e toque no quadrado para escolher a cor exata. Mudar nome ou cor aqui
          atualiza todas as baterias que já usam essa lycra.
        </Text>

        {lycras.map((l, i) => (
          <View key={l.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
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

        <TouchableOpacity
          onPress={saveConfig}
          disabled={saving}
          style={[globalStyles.primaryButton, { marginTop: 12, opacity: saving ? 0.6 : 1 }]}
        >
          <Text style={globalStyles.primaryButtonText}>{saving ? 'Salvando...' : 'Salvar Cores'}</Text>
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
