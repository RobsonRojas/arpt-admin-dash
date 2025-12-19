import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../services/firebase';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    }, (err) => {
      setError(err);
      setLoading(false);
    });
    return () => unsub && unsub();
  }, []);

  const signIn = async (email, password) => {
    if (!auth || !isFirebaseConfigured) {
      throw new Error('Firebase não configurado. Defina variáveis em .env');
    }
    setError(null);
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    if (!auth || !isFirebaseConfigured) {
      setUser(null);
      return;
    }
    return firebaseSignOut(auth);
  };

  const value = { user, loading, error, signIn, signOut, isFirebaseConfigured };
  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
