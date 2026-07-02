import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(public)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        {/* Adicione esta linha abaixo para limpar o header duplo do juiz! */}
        <Stack.Screen name="(judge)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}