
import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext.jsx';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const { signIn, isFirebaseConfigured } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signIn(email, pass);
    } catch (err) {
      setError('Erro ao logar: ' + (err?.message || err));
    }
  };

  return (
    <Container maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper sx={{ p: 4, width: '100%', textAlign: 'center' }}>
        <Typography variant="h5" mb={2}>ARPT Admin</Typography>
        {!isFirebaseConfigured && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Firebase não configurado. Defina variáveis em <strong>.env</strong>.
          </Alert>
        )}
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
