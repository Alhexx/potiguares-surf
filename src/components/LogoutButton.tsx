import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { auth } from '../services/firebaseconfig'; // Ajuste o caminho conforme necessário

export default function LogoutButton() {
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/');
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  return (
    <TouchableOpacity onPress={handleLogout} style={styles.button}>
      <Text style={styles.text}>Sair</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { marginRight: 15, padding: 5 },
  text: { color: '#DC2626', fontWeight: 'bold', fontSize: 16 }
});