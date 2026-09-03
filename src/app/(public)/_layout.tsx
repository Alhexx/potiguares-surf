import { Stack } from 'expo-router';

export default function PublicLayout() {
  return (
    <Stack screenOptions={{ headerTitleAlign: 'center', headerBackTitle: 'Voltar' }}>
      <Stack.Screen name="dashboard" options={{ title: "Eventos" }} />
      <Stack.Screen name="[compID]/live" options={{ title: "Ao Vivo" }} />
      <Stack.Screen name="[compID]/history" options={{ title: "Baterias Anteriores" }} />
      <Stack.Screen name="[compID]/schedule" options={{ title: "Cronograma" }} />
    </Stack>
  );
}