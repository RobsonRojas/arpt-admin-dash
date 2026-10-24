import React, { useState } from 'react';
import { Alert, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { api } from '../../services/api';
import AnonimizarDialog from './AnonimizarDialog';
import { baixarBlob } from '../../utils/download';
import { nomeArquivoExportacao } from '../../utils/lgpd';

// LGPD pelo admin: exportar os dados do perfil e anonimizá-lo (dois passos).
const ROTA = (userId) => `/api/v1/admin/dropshipping/profiles/${userId}`;

export default function LgpdAdminCard({ userId, nome, onChanged }) {
  const [exportando, setExportando] = useState(false);
  const [anonimizando, setAnonimizando] = useState(false);
  const [dialogo, setDialogo] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  const exportar = async () => {
    setExportando(true);
    setErro('');
    setAviso('');
    try {
      const res = await api.get(`${ROTA(userId)}/export`, { responseType: 'blob' });
      baixarBlob(res.data, nomeArquivoExportacao(userId));
      setAviso('Exportação gerada. O arquivo foi baixado.');
    } catch (err) {
      setErro('Não foi possível exportar. ' + (err.response?.data?.message || err.message));
    } finally {
      setExportando(false);
    }
  };

  const anonimizar = async () => {
    setAnonimizando(true);
    setErro('');
    try {
      await api.post(`${ROTA(userId)}/anonymize`);
      setDialogo(false);
      setAviso('Perfil anonimizado.');
      onChanged?.();
    } catch (err) {
      setErro('Não foi possível anonimizar. ' + (err.response?.data?.message || err.message));
    } finally {
      setAnonimizando(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Dados pessoais (LGPD)</Typography>
        {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
        {aviso && <Alert severity="success" sx={{ mb: 2 }}>{aviso}</Alert>}
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={exportar} disabled={exportando}>
            {exportando ? 'Exportando…' : 'Exportar dados'}
          </Button>
          <Button variant="outlined" color="error" onClick={() => { setErro(''); setDialogo(true); }}>
            Anonimizar perfil
          </Button>
        </Stack>
      </CardContent>
      <AnonimizarDialog
        open={dialogo}
        nome={nome}
        enviando={anonimizando}
        erro={erro}
        onClose={() => setDialogo(false)}
        onConfirm={anonimizar}
      />
    </Card>
  );
}
