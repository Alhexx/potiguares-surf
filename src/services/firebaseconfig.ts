import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
// getReactNativePersistence não está nos tipos do pacote guarda-chuva, mas existe no build React Native.
// @ts-expect-error
import { Auth, getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  auth =
    Platform.OS === 'web'
      ? getAuth(app) // web usa a persistência do navegador
      : initializeAuth(app, {
          persistence: getReactNativePersistence(ReactNativeAsyncStorage),
        });
} catch (e) {
  console.error('Firebase init error:', e);
  app = getApp();
  db = getFirestore(app);
  auth = getAuth(app);
}

export { auth, db };
