import LogoutButton from '@/components/LogoutButton';
import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack>
      {/* Esconde o header feio do Dashboard, pois você já fez um título bonito na própria tela */}
      <Stack.Screen name="dashboard" options={{ 
          title: 'Painel Admin',
          headerRight: () => (
            <LogoutButton/>
          )
        }} />
      <Stack.Screen name="[compID]" options={{ headerShown: false }} />
    </Stack>
  );
}