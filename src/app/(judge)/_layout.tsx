import LogoutButton from '@/components/LogoutButton';
import { Stack } from 'expo-router';

export default function JudgeLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="dashboard"
        options={{
          title: 'Selecione a Competição',
          headerTitleAlign: 'left',
          headerRight: () => <LogoutButton />,
        }}
      />
      <Stack.Screen
        name="scoring"
        options={{
          title: 'Painel de Notas',
          headerTitleAlign: 'center',
          headerRight: () => <LogoutButton />,
        }}
      />
    </Stack>
  );
}
