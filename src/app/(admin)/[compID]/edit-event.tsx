import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { globalStyles } from '../../../constants/styles';
import { deleteCompetition } from '../../../lib/admin';
import { confirmAction, notify } from '../../../lib/notify';
import { db } from '../../../services/firebaseconfig';

export default function EditEvent() {
  const params = useLocalSearchParams();
  const compID = Array.isArray(params.compID) ? params.compID[0] : params.compID;
  const router = useRouter();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'active' | 'finished'>('active');

  useEffect(() => {
    if (!compID) return;
    getDoc(doc(db, 'competitions', compID)).then((s) => {
      const d = s.data() as any;
      if (d) {
        setName(d.name ?? '');
        setLocation(d.location ?? '');
        setStatus(d.status === 'finished' ? 'finished' : 'active');
      }
    });
  }, [compID]);

  const save = async () => {
    if (!compID || !name.trim() || !location.trim()) {
      notify('Erro', 'Preencha nome e local.');
      return;
    }
    try {
      await updateDoc(doc(db, 'competitions', compID), {
        name: name.trim(),
        location: location.trim(),
        status,
      });
      notify('Ok', 'Evento atualizado.');
      router.back();
    } catch {
      notify('Erro', 'Não foi possível salvar.');
    }
  };

  const remove = () => {
    if (!compID) return;
    confirmAction(
      'Excluir evento',
      `Apagar "${name}" com TODAS as categorias, baterias, juízes, cronograma e notas? Não dá pra desfazer.`,
      async () => {
        try {
          await deleteCompetition(compID);
          notify('Ok', 'Evento excluído.');
          router.replace('/(admin)/dashboard');
        } catch {
          notify('Erro', 'Falha ao excluir.');
        }
      },
      'Excluir tudo',
    );
  };

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.card}>
        <Text style={globalStyles.label}>Nome</Text>
        <TextInput style={globalStyles.input} value={name} onChangeText={setName} placeholderTextColor="#9CA3AF" />

        <Text style={globalStyles.label}>Local</Text>
        <TextInput style={globalStyles.input} value={location} onChangeText={setLocation} placeholderTextColor="#9CA3AF" />

        <Text style={globalStyles.label}>Situação</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
          {(['active', 'finished'] as const).map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setStatus(s)}
              style={{
                flex: 1, padding: 12, borderRadius: 8, alignItems: 'center',
                backgroundColor: status === s ? '#0284C7' : '#E5E7EB',
              }}
            >
              <Text style={{ color: status === s ? '#FFF' : '#374151', fontWeight: 'bold' }}>
                {s === 'active' ? 'Ativo' : 'Encerrado'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 8 }}>
          Eventos encerrados somem das listas públicas de eventos ao vivo.
        </Text>

        <TouchableOpacity onPress={save} style={globalStyles.primaryButton}>
          <Text style={globalStyles.primaryButtonText}>Salvar</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={remove}
        style={[globalStyles.primaryButton, { backgroundColor: '#DC2626', marginBottom: 40 }]}
      >
        <Text style={globalStyles.primaryButtonText}>Excluir evento</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
