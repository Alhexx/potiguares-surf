import { useLocalSearchParams, useRouter } from 'expo-router';
import { deleteApp, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { notify } from '../../../../lib/notify';
import { globalStyles } from '../../../../constants/styles';
import { db, firebaseConfig } from '../../../../services/firebaseconfig';

// Senha padrão = parte do e-mail antes do @ + "123!"  (ex: joao.silva123!)
const defaultPasswordFor = (email: string) => {
  const prefix = email.trim().toLowerCase().split('@')[0];
  return prefix ? `${prefix}123!` : '';
};

export default function CreateJudge() {
  const { compID } = useLocalSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const cleanEmail = email.trim().toLowerCase();
  const password = defaultPasswordFor(cleanEmail);

  const createJudge = async () => {
    if (!cleanEmail.includes('@') || !password) {
      notify('Erro', 'Informe um e-mail válido.');
      return;
    }
    setLoading(true);

    // App secundário: cria o usuário sem deslogar o admin que está usando o app.
    const tmpApp = initializeApp(firebaseConfig, `judge-creator-${Date.now()}`);
    const tmpAuth = getAuth(tmpApp);

    try {
      const cred = await createUserWithEmailAndPassword(tmpAuth, cleanEmail, password);

      await setDoc(doc(db, 'competitions', compID as string, 'judges', cred.user.uid), {
        email: cleanEmail,
        role: 'judge',
      });
      // Vínculo global: o login usa isto para mandar o juiz direto para a competição dele.
      await setDoc(doc(db, 'users', cred.user.uid), {
        role: 'judge',
        compID: compID as string,
      });

      await signOut(tmpAuth);
      notify('Sucesso', `Juiz criado!\nSenha: ${password}`);
      router.back();
    } catch (e: any) {
      notify('Erro', e.message);
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
          Senha: <Text style={{ fontWeight: 'bold', color: '#111827' }}>{password || '—'}</Text>
          {'  '}(o juiz pode trocar depois)
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
