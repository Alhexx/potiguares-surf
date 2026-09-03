import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { globalStyles } from '../../../constants/styles';

export default function CompetitionHub() {
  const { compID } = useLocalSearchParams();
  const router = useRouter();

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Gerenciar Evento</Text>
      <TouchableOpacity style={styles.btn} onPress={() => router.push(`/(admin)/${compID}/edit-config`)}>
        <Text style={styles.btnText}>⚙️ Configurar Lycras</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={() => router.push(`/(admin)/${compID}/schedule`)}>
        <Text style={styles.btnText}>🗓️ Cronograma</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={() => router.push(`/(admin)/${compID}/categories`)}>
        <Text style={styles.btnText}>🏆 Ver Categorias</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, { backgroundColor: '#059669' }]} onPress={() => router.push(`/(admin)/${compID}/judges/list`)}>
        <Text style={styles.btnText}>👥 Equipe de Juízes</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 20, borderRadius: 12, backgroundColor: '#0284C7', marginBottom: 15 },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }
});