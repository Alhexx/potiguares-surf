import { Redirect } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { auth, db } from '../services/firebaseconfig';

type Status = 'loading' | 'ok' | 'denied';

/**
 * Bloqueia o acesso a um grupo de telas: exige usuário logado com o `role` certo
 * em users/{uid}. Sem isso, redireciona para o login.
 * (a proteção "de verdade" são as regras do Firestore — isto é a barreira de UI)
 */
export default function AuthGate({ role, children }: { role: 'admin' | 'judge'; children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setStatus('denied');
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const userRole = snap.exists() ? snap.data().role : null;
        setStatus(userRole === role ? 'ok' : 'denied');
      } catch {
        setStatus('denied');
      }
    });
  }, [role]);

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }
  if (status === 'denied') return <Redirect href="/" />;
  return <>{children}</>;
}
