/**
 * Firebase client — chat e futura migração de dados (Fase 0+).
 * Configure via .env.local (veja .env.example).
 */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

function env(name) {
  return import.meta.env[name] || '';
}

const firebaseConfig = {
  apiKey: env('VITE_FIREBASE_API_KEY'),
  authDomain: env('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: env('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: env('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: env('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: env('VITE_FIREBASE_APP_ID'),
};

let app = null;
let firebaseAuth = null;
let firestoreDb = null;

export const isFirebaseConfigured =
  Boolean(firebaseConfig.projectId && firebaseConfig.apiKey);

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  firebaseAuth = getAuth(app);
  const databaseId = env('VITE_FIREBASE_DATABASE_ID');
  firestoreDb = databaseId
    ? getFirestore(app, databaseId)
    : getFirestore(app);
}

/** Alias usado pelo chat (JotaAIChat) */
export const db = firestoreDb;

export { firebaseAuth, firestoreDb };