import React, { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { validarMotivo, MOTIVO_MAX } from '../../utils/motivo';

// Diálogo de ação com motivo obrigatório. O envio só acontece com motivo válido (utils/motivo.js).
export default function MotivoDialog({ open, titulo, descricao, textoConfirmar, onConfirm, onClose, enviando = false }) {
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState('');

  const confirmar = () => {
    const r = validarMotivo(texto);
    if (r.error) return setErro(r.error);
    setErro('');
    onConfirm(r.value);
  };

  const fechar = () => {
    if (enviando) return;
    setTexto('');
    setErro('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={fechar} fullWidth maxWidth="sm">
      <DialogTitle>{titulo}</DialogTitle>
      <DialogContent>
        {descricao && <p style={{ marginTop: 0 }}>{descricao}</p>}
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={3}
          label="Motivo"
          required
          value={texto}
          onChange={(e) => { setTexto(e.target.value); if (erro) setErro(''); }}
          error={Boolean(erro)}
          helperText={erro || `Obrigatório. Até ${MOTIVO_MAX} caracteres.`}
          inputProps={{ maxLength: MOTIVO_MAX }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={fechar} disabled={enviando}>Cancelar</Button>
        <Button variant="contained" color="error" onClick={confirmar} disabled={enviando}>
          {textoConfirmar}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
