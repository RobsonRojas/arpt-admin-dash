import React, { useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import { confirmacaoAnonimizacaoOk, PALAVRA_ANONIMIZAR } from '../../utils/lgpd';

// Segundo passo da anonimização: o usuário digita a palavra para liberar o botão.
export default function AnonimizarDialog({ open, nome, onConfirm, onClose, enviando = false, erro = '' }) {
  const [texto, setTexto] = useState('');
  const pronto = confirmacaoAnonimizacaoOk(texto);

  const fechar = () => {
    if (enviando) return;
    setTexto('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={fechar} fullWidth maxWidth="sm">
      <DialogTitle>Anonimizar perfil</DialogTitle>
      <DialogContent>
        <Typography variant="body2" gutterBottom>
          Os dados pessoais de {nome || 'este dropshipper'} são apagados de forma irreversível. Os registros de auditoria
          são mantidos. O acesso de dropshipper é removido.
        </Typography>
        {erro && <Alert severity="error" sx={{ my: 2 }}>{erro}</Alert>}
        <TextField
          fullWidth
          sx={{ mt: 2 }}
          label={`Digite ${PALAVRA_ANONIMIZAR} para confirmar`}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          autoComplete="off"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={fechar} disabled={enviando}>Cancelar</Button>
        <Button variant="contained" color="error" disabled={!pronto || enviando} onClick={() => { setTexto(''); onConfirm(); }}>
          Anonimizar perfil
        </Button>
      </DialogActions>
    </Dialog>
  );
}
