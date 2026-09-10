import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import HeaderBack from '@/components/HeaderBack';

export default function CompLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: 'center',
        headerBackTitle: 'Voltar',
        headerLeft: Platform.OS === 'web' ? () => <HeaderBack /> : undefined,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Gerenciar Evento" }} />
      <Stack.Screen name="edit-event" options={{ title: "Editar Evento" }} />
      <Stack.Screen name="edit-config" options={{ title: "Cores das Lycras" }} />
      <Stack.Screen name="schedule" options={{ title: "Cronograma" }} />
      <Stack.Screen name="report" options={{ title: "Relatório" }} />
      <Stack.Screen name="categories" options={{ title: "Categorias" }} />
      <Stack.Screen name="[catID]/heats" options={{ title: "Baterias" }} />
      <Stack.Screen name="[catID]/new-heat" options={{ title: "Gerenciar Baterias" }} />
      <Stack.Screen name="[catID]/[heatID]" options={{ title: "Detalhes da Bateria" }} />
    </Stack>
  );
}