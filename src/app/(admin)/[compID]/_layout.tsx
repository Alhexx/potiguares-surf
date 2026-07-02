import { Stack } from 'expo-router';

export default function CompLayout() {
  return (
    <Stack screenOptions={{ headerTitleAlign: 'center', headerBackTitle: 'Voltar' }}>
      <Stack.Screen name="index" options={{ title: "Gerenciar Evento" }} />
      <Stack.Screen name="edit-config" options={{ title: "Cores das Lycras" }} />
      <Stack.Screen name="categories" options={{ title: "Categorias" }} />
      <Stack.Screen name="[catID]/heats" options={{ title: "Baterias" }} />
      <Stack.Screen name="[catID]/new-heat" options={{ title: "Gerenciar Baterias" }} />
      <Stack.Screen name="[catID]/[heatID]" options={{ title: "Detalhes da Bateria" }} />
    </Stack>
  );
}