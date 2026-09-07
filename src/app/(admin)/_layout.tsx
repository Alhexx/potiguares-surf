import AuthGate from '@/components/AuthGate';
import LogoutButton from '@/components/LogoutButton';
import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <AuthGate role="admin">
      <Stack>
        <Stack.Screen
          name="dashboard"
          options={{ title: 'Painel Admin', headerRight: () => <LogoutButton /> }}
        />
        <Stack.Screen name="[compID]" options={{ headerShown: false }} />
      </Stack>
    </AuthGate>
  );
}
