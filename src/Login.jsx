
import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Alert } from '@mui/material';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const auth = getAuth();
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      // Se não houver config, simula login para teste
      if (err.code === 'auth/configuration-not-found' || !auth.options) {
         console.warn("Modo Demo: Login simulado (Firebase não configurado)");
         // Force reload or state change logic if creating a robust demo without firebase
         alert("Firebase não configurado no código. Verifique README.");
      }
      setError("Erro ao logar: " + err.message);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper sx={{ p: 4, width: '100%', textAlign: 'center' }}>
        <Typography variant="h5" mb={2}>ARPT Admin</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <form onSubmit={handleLogin}>
          <TextField fullWidth margin="normal" label="Email" onChange={e=>setEmail(e.target.value)} />
          <TextField fullWidth margin="normal" label="Senha" type="password" onChange={e=>setPass(e.target.value)} />
          <Button fullWidth variant="contained" type="submit" sx={{ mt: 2 }}>Entrar</Button>
        </form>
      </Paper>
    </Container>
  );
}
