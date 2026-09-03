import { useLocalSearchParams, useRouter } from 'expo-router';
import { deleteApp, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { globalStyles } from '../../../../constants/styles';
import { db, firebaseConfig } from '../../../../services/firebaseconfig';

const DEFAULT_PASSWORD = '123456';

export default function CreateJudge() {
  const { compID } = useLocalSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const createJudge = async () => {
    if (!email.trim()) {
      Alert.alert('Erro', 'Informe o e-mail do juiz.');
      return;
    }
    setLoading(true);

    // App secundário: cria o usuário sem deslogar o admin que está usando o app.
    const tmpApp = initializeApp(firebaseConfig, `judge-creator-${Date.now()}`);
    const tmpAuth = getAuth(tmpApp);

    try {
      const cred = await createUserWithEmailAndPassword(tmpAuth, email.trim().toLowerCase(), DEFAULT_PASSWORD);

      await setDoc(doc(db, 'competitions', compID as string, 'judges', cred.user.uid), {
        email: email.trim().toLowerCase(),
        role: 'judge',
      });
      // Vínculo global: o login usa isto para mandar o juiz direto para a competição dele.
      await setDoc(doc(db, 'users', cred.user.uid), {
        role: 'judge',
        compID: compID as string,
      });

      await signOut(tmpAuth);
      Alert.alert('Sucesso', `Juiz criado!\nSenha inicial: ${DEFAULT_PASSWORD}`);
      router.back();
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      await deleteApp(tmpApp).catch(() => {});
      setLoading(false);
    }
  };

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.card}>
        <Text style={globalStyles.label}>E-mail do Juiz</Text>
        <TextInput
          style={globalStyles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="juiz@exemplo.com"
          placeholderTextColor="#9CA3AF"
        />
        <Text style={{ color: '#6B7280', marginBottom: 12 }}>
          Senha inicial: {DEFAULT_PASSWORD} (o juiz pode trocar depois)
        </Text>
        <TouchableOpacity
          style={[globalStyles.primaryButton, loading && { opacity: 0.6 }]}
          onPress={createJudge}
          disabled={loading}
        >
          <Text style={globalStyles.primaryButtonText}>{loading ? 'Criando...' : 'Criar Juiz'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
