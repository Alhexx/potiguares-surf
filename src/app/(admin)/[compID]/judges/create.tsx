import { useLocalSearchParams, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { globalStyles } from '../../../../constants/styles';
import { auth, db } from '../../../../services/firebaseconfig';

export default function CreateJudge() {
  const { compID } = useLocalSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password] = useState('123456');

  const createJudge = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Vincula na coleção da competição
      await setDoc(doc(db, 'competitions', compID as string, 'judges', userCredential.user.uid), { email, role: 'judge' });
      // Registra globalmente para o login identificar
      await setDoc(doc(db, 'users', userCredential.user.uid), { role: 'judge' });
      
      Alert.alert('Sucesso', 'Juiz criado!');
      router.back();
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    }
  };

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.card}>
        <Text style={globalStyles.label}>E-mail do Juiz</Text>
        <TextInput style={globalStyles.input} value={email} onChangeText={setEmail} autoCapitalize="none" />
        <TouchableOpacity style={globalStyles.primaryButton} onPress={createJudge}>
          <Text style={globalStyles.primaryButtonText}>Criar Juiz</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}