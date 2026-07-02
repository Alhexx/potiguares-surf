import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { globalStyles } from '../../../constants/styles';
import { db } from '../../../services/firebaseconfig';

// Interface para garantir a tipagem das Categorias
interface Category {
  id: string;
  name: string;
}

export default function CategoriesScreen() {
  // Garantimos que compID seja tratado como uma string simples
  const params = useLocalSearchParams();
  const compID = Array.isArray(params.compID) ? params.compID[0] : params.compID;
  
  const router = useRouter();
  const [name, setName] = useState<string>('');
  const [cats, setCats] = useState<Category[]>([]);

  useEffect(() => {
    if (!compID) return;

    const colRef = collection(db, 'competitions', compID, 'categories');
    const unsubscribe = onSnapshot(colRef, (snap) => {
      // Verificação de segurança: checamos se o snap existe e tem documentos
      if (!snap || !snap.docs) {
        setCats([]);
        return;
      }

      const categoryList = snap.docs.map((doc) => {
        const data = doc.data() as Omit<Category, 'id'>;
        return {
          id: doc.id,
          // Fallback para caso o campo name esteja faltando no Firestore
          name: data.name ?? 'Categoria Sem Nome',
        };
      });
      setCats(categoryList);
    });
    return () => unsubscribe();
  }, [compID]);

  const addCat = async () => {
    if (!name.trim() || !compID) {
      Alert.alert('Erro', 'O nome da categoria não pode estar vazio.');
      return;
    }
    try {
      await addDoc(collection(db, 'competitions', compID, 'categories'), { 
        name: name.trim() 
      });
      setName('');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar a categoria.');
    }
  };

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.card}>
        <Text style={globalStyles.label}>Nova Categoria</Text>
        <TextInput 
          placeholder="Ex: Sub-18" 
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
          <TouchableOpacity 
            style={globalStyles.card}
            onPress={() => router.push({
              pathname: '/(admin)/[compID]/[catID]/heats',
              params: { compID, catID: item.id }
            })}
          >
            <View style={globalStyles.rowInfo}>
              <Text style={globalStyles.rowText}>{item.name}</Text>
              <Text style={{ color: '#0284C7' }}>Abrir →</Text>
            </View>
          </TouchableOpacity>
        )} 
      />
    </View>
  );
}