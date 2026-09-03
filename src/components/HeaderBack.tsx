import { useRouter } from 'expo-router';
import { Text, TouchableOpacity } from 'react-native';

/** Botão "voltar" para o header no web (o native-stack não desenha um por lá). */
export default function HeaderBack() {
  const router = useRouter();
  if (!router.canGoBack()) return null;
  return (
    <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 16, paddingVertical: 4 }}>
      <Text style={{ color: '#0284C7', fontSize: 16, fontWeight: '600' }}>‹ Voltar</Text>
    </TouchableOpacity>
  );
}
