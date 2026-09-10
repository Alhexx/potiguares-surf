import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { globalStyles } from '../../../constants/styles';
import { deleteCategory } from '../../../lib/admin';
import { confirmAction, notify } from '../../../lib/notify';
import { db } from '../../../services/firebaseconfig';

interface Category {
  id: string;
  name: string;
}

export default function CategoriesScreen() {
  const params = useLocalSearchParams();
  const compID = Array.isArray(params.compID) ? params.compID[0] : params.compID;

  const router = useRouter();
  const [name, setName] = useState('');
  const [cats, setCats] = useState<Category[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (!compID) return;
    const colRef = collection(db, 'competitions', compID, 'categories');
    return onSnapshot(colRef, (snap) => {
      setCats((snap?.docs ?? []).map((d) => ({ id: d.id, name: (d.data() as any).name ?? 'Categoria Sem Nome' })));
    });
  }, [compID]);

  const addCat = async () => {
    if (!name.trim() || !compID) {
      notify('Erro', 'O nome da categoria não pode estar vazio.');
      return;
    }
    try {
      await addDoc(collection(db, 'competitions', compID, 'categories'), { name: name.trim() });
      setName('');
    } catch {
      notify('Erro', 'Não foi possível adicionar a categoria.');
    }
  };

  const saveRename = async (id: string) => {
    if (!compID || !editName.trim()) return;
    try {
      await updateDoc(doc(db, 'competitions', compID, 'categories', id), { name: editName.trim() });
      setEditId(null);
    } catch {
      notify('Erro', 'Não foi possível renomear.');
    }
  };

  const removeCat = (cat: Category) => {
    if (!compID) return;
    confirmAction('Excluir categoria', `Apagar "${cat.name}" com todas as baterias e notas dela?`, () => {
      deleteCategory(compID, cat.id).catch(() => notify('Erro', 'Falha ao excluir.'));
    }, 'Excluir');
  };

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.card}>
        <Text style={globalStyles.label}>Nova Categoria</Text>
        <TextInput
          placeholder="Ex: Sub-18"
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
          style={globalStyles.input}
        />
        <TouchableOpacity onPress={addCat} style={globalStyles.primaryButton}>
          <Text style={globalStyles.primaryButtonText}>+ Adicionar</Text>
        </TouchableOpacity>
      </View>

      <Text style={globalStyles.title}>Categorias Criadas</Text>
      <FlatList
        data={cats ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={globalStyles.card}>
            {editId === item.id ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput
                  style={[globalStyles.input, { flex: 1, marginBottom: 0 }]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity onPress={() => saveRename(item.id)}>
                  <Text style={{ color: '#0284C7', fontWeight: 'bold' }}>OK</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditId(null)}>
                  <Text style={{ color: '#6B7280' }}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={globalStyles.rowInfo}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => router.push({ pathname: '/(admin)/[compID]/[catID]/heats', params: { compID, catID: item.id } })}
                >
                  <Text style={globalStyles.rowText}>{item.name}</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <TouchableOpacity onPress={() => { setEditId(item.id); setEditName(item.name); }} hitSlop={8}>
                    <Text style={{ color: '#0284C7' }}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeCat(item)} hitSlop={8}>
                    <Text style={{ color: '#DC2626', fontSize: 16 }}>🗑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push({ pathname: '/(admin)/[compID]/[catID]/heats', params: { compID, catID: item.id } })}>
                    <Text style={{ color: '#0284C7' }}>→</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 20 }}>Nenhuma categoria criada.</Text>
        }
      />
    </View>
  );
}
