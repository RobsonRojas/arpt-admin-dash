import React, { useState } from 'react';
import { Alert, Button, Card, CardContent, Checkbox, FormControlLabel, Stack, TextField, Typography } from '@mui/material';
import { api } from '../../services/api';
import { validarEvidencia } from '../../utils/lgpd';

// Aceite dos termos vigentes registrado pelo administrador em nome do dropshipper. Fica marcado como
// ADMIN_EM_NOME, com o administrador e a evidência de como o consentimento foi obtido.
export default function TermosEmNomeCard({ userId, onChanged }) {
  const [evidencia, setEvidencia] = useState('');
  const [confirma, setConfirma] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  const ev = validarEvidencia(evidencia);

  const registrar = async () => {
    if (ev.error || !confirma) return;
    setEnviando(true);
    setErro('');
    try {
      await api.post(`/api/v1/admin/dropshipping/profiles/${userId}/terms/accept-on-behalf`, { evidencia: ev.value });
      setAviso('Aceite registrado em nome do dropshipper.');
      setEvidencia('');
      setConfirma(false);
      onChanged?.();
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível registrar o aceite.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Aceite de termos em nome do dropshipper</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Use somente quando o dropshipper aceitou a versão vigente por outro meio. O registro leva o seu nome e a evidência abaixo.
          Se o dropshipper já aceitou, a ação é recusada.
        </Typography>
        {erro && <Alert severity="error" sx={{ my: 2 }}>{erro}</Alert>}
        {aviso && <Alert severity="success" sx={{ my: 2 }}>{aviso}</Alert>}
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField
            label="Evidência do consentimento"
            multiline
            minRows={2}
            value={evidencia}
            onChange={(e) => setEvidencia(e.target.value)}
            error={Boolean(evidencia) && Boolean(ev.error)}
            helperText={evidencia && ev.error ? ev.error : 'Como o consentimento foi obtido (ex.: termo assinado, data e canal).'}
          />
          <FormControlLabel
            control={<Checkbox checked={confirma} onChange={(e) => setConfirma(e.target.checked)} />}
            label="Confirmo que o dropshipper aceitou os termos vigentes e que a evidência acima é verdadeira."
          />
          <Button variant="contained" onClick={registrar} disabled={enviando || Boolean(ev.error) || !confirma} sx={{ alignSelf: 'flex-start' }}>
            Registrar aceite
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
