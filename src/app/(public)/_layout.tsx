import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import HeaderBack from '@/components/HeaderBack';

export default function PublicLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: 'center',
        headerBackTitle: 'Voltar',
        headerLeft: Platform.OS === 'web' ? () => <HeaderBack /> : undefined,
      }}
    >
      <Stack.Screen name="dashboard" options={{ title: 'Eventos' }} />
      <Stack.Screen name="[compID]/live" options={{ title: 'Ao Vivo' }} />
      <Stack.Screen name="[compID]/history" options={{ title: 'Baterias Anteriores' }} />
      <Stack.Screen name="[compID]/schedule" options={{ title: 'Cronograma' }} />
    </Stack>
  );
}
