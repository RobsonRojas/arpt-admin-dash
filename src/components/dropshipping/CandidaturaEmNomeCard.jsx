import React, { useState } from 'react';
import { Alert, Button, Card, CardContent, Checkbox, FormControlLabel, Stack, TextField, Typography } from '@mui/material';
import { api } from '../../services/api';
import { uuidValido, validarEvidencia } from '../../utils/lgpd';

// Candidatura de dropshipper registrada pelo administrador em nome de um usuário já cadastrado.
// Fica marcada como ADMIN_EM_NOME, com o administrador, a evidência e o aceite dos termos vigentes.
export default function CandidaturaEmNomeCard({ onRegistrada }) {
  const [userId, setUserId] = useState('');
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [contato, setContato] = useState('');
  const [evidencia, setEvidencia] = useState('');
  const [confirma, setConfirma] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  const ev = validarEvidencia(evidencia);
  const pronto = uuidValido(userId) && nome.trim().length >= 2 && documento.trim() && contato.includes('@') && !ev.error && confirma;

  const registrar = async () => {
    if (!pronto) return;
    setEnviando(true);
    setErro('');
    try {
      await api.post(`/api/v1/admin/dropshipping/profiles/${userId.trim()}/apply-on-behalf`, {
        nome_comercial: nome.trim(), documento: documento.trim(), contato: contato.trim(), aceite_termos: true, evidencia: ev.value,
      });
      setAviso('Candidatura registrada em nome do usuário. Ela aparece na lista de pendentes.');
      setUserId(''); setNome(''); setDocumento(''); setContato(''); setEvidencia(''); setConfirma(false);
      onRegistrada?.();
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível registrar a candidatura.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 3, borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Registrar candidatura em nome de um usuário</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Para candidaturas recebidas por outro canal. O usuário precisa já estar cadastrado (id da tabela de usuários).
        </Typography>
        {erro && <Alert severity="error" sx={{ my: 2 }}>{erro}</Alert>}
        {aviso && <Alert severity="success" sx={{ my: 2 }}>{aviso}</Alert>}
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField label="Id do usuário (UUID)" value={userId} onChange={(e) => setUserId(e.target.value)}
            error={Boolean(userId) && !uuidValido(userId)} helperText={userId && !uuidValido(userId) ? 'Use o UUID do usuário.' : ' '} />
          <TextField label="Nome comercial" value={nome} onChange={(e) => setNome(e.target.value)} />
          <TextField label="CPF ou CNPJ" value={documento} onChange={(e) => setDocumento(e.target.value)} />
          <TextField label="E-mail de contato" value={contato} onChange={(e) => setContato(e.target.value)} />
          <TextField label="Evidência do consentimento" multiline minRows={2} value={evidencia} onChange={(e) => setEvidencia(e.target.value)}
            error={Boolean(evidencia) && Boolean(ev.error)}
            helperText={evidencia && ev.error ? ev.error : 'Como a candidatura e o aceite dos termos foram obtidos.'} />
          <FormControlLabel control={<Checkbox checked={confirma} onChange={(e) => setConfirma(e.target.checked)} />}
            label="Confirmo que o usuário aceitou os termos vigentes e que a evidência acima é verdadeira." />
          <Button variant="contained" onClick={registrar} disabled={enviando || !pronto} sx={{ alignSelf: 'flex-start' }}>
            Registrar candidatura
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
