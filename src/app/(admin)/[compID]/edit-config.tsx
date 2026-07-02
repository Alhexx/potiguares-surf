import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { globalStyles } from '../../../constants/styles';
import { db } from '../../../services/firebaseconfig';

export default function EditConfig() {
  const { compID } = useLocalSearchParams();
  const [lycras, setLycras] = useState(['Vermelho', 'Branco', 'Amarelo', 'Azul']);

  // Busca as lycras se já existirem no banco
  useEffect(() => {
    const fetchConfig = async () => {
      const compDoc = await getDoc(doc(db, 'competitions', compID as string));
      if (compDoc.exists() && compDoc.data().lycraColors) {
        setLycras(compDoc.data().lycraColors);
      }
    };
    fetchConfig();
  }, [compID]);

  const saveConfig = async () => {
    try {
      const compRef = doc(db, 'competitions', compID as string);
      await updateDoc(compRef, { lycraColors: lycras });
      Alert.alert('Sucesso', 'Cores atualizadas!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar.');
    }
  };

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.card}>
        <Text style={globalStyles.label}>Defina até 4 cores de Lycra</Text>

        {(lycras ?? []).map((cor, i) => (
          <TextInput 
            key={i} 
            value={cor ?? ''} // Garantimos que o valor nunca seja undefined
            placeholder={`Lycra ${i + 1}`}
            onChangeText={(text) => {
              const newLycras = [...(lycras ?? [])];
              newLycras[i] = text;
              setLycras(newLycras);
            }} 
            style={globalStyles.input} 
          />
        ))}
        <TouchableOpacity onPress={saveConfig} style={globalStyles.primaryButton}>
          <Text style={globalStyles.primaryButtonText}>Salvar Cores</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}