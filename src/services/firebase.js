import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app = null;
let auth = null;
let isFirebaseConfigured = true;

try {
  // Basic validation to avoid initializing with undefined values
  const values = Object.values(firebaseConfig);
  if (values.some(v => typeof v !== 'string' || v.length === 0)) {
    throw new Error('Missing Firebase env configuration');
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (err) {
  console.warn('[Firebase] Configuração ausente ou inválida:', err?.message || err);
  isFirebaseConfigured = false;
}

export { auth, isFirebaseConfigured };
