import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// 1. Importações do Firebase
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../services/firebaseconfig'; // Seu caminho correto!

export default function LoginScreen() {
 const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Erro', 'Preencha todos os campos.');
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (userDoc.exists() && userDoc.data().role === 'judge') {
        router.replace('/(judge)/dashboard');
      } else {
        router.replace('/(admin)/dashboard');
      }
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  };

  const goToLiveScore = () => {
    // Leva o usuário comum direto para a tela de visualização
    router.push('/(public)/dashboard');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Potiguares Surf 🏄‍♂️</Text>
      <Text style={styles.subtitle}>Eventos</Text>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="E-mail (ex: admin@surf.com)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={handleLogin}
          disabled={loading} // Desativa o botão enquanto carrega
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Entrar no Sistema</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <Text style={styles.fanText}>É apenas um fã ou atleta?</Text>
      <TouchableOpacity style={styles.secondaryButton} onPress={goToLiveScore}>
        <Text style={styles.secondaryButtonText}>Acessar Placar ao Vivo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#0284C7',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 48,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#0284C7',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: '#E5E7EB',
    marginVertical: 32,
  },
  fanText: {
    color: '#4B5563',
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#E0F2FE',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  secondaryButtonText: {
    color: '#0369A1',
    fontSize: 16,
    fontWeight: 'bold',
  },
});