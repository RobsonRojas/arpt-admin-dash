import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, Button, Card, CardContent, Checkbox, Chip, FormControlLabel, Stack, TextField, Typography,
} from '@mui/material';
import { api } from '../../services/api';
import AnonimizarDialog from './AnonimizarDialog';
import { baixarBlob } from '../../utils/download';
import { nomeArquivoExportacao } from '../../utils/lgpd';

// Perfil de dropshipper do próprio usuário: candidatura, aceite dos termos vigentes e LGPD (exportar e excluir).
// Todas as rotas são do próprio usuário; o backend confere cada uma.
const BASE = '/api/v1/dropshipping/profile';

const STATUS_LABEL = { PENDENTE: 'Em análise', APROVADA: 'Aprovado', REJEITADA: 'Recusado', SUSPENSA: 'Suspenso' };

const mensagemErro = (err) => err.response?.data?.message || err.message;

export default function MeuPerfilDropshipper() {
  const [perfil, setPerfil] = useState(undefined); // undefined = carregando; null = sem candidatura
  const [termo, setTermo] = useState(null);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);

  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [contato, setContato] = useState('');
  const [aceite, setAceite] = useState(false);
  const [dialogoExclusao, setDialogoExclusao] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const { data } = await api.get(BASE);
      setPerfil(data);
    } catch (err) {
      if (err.response?.status === 404) setPerfil(null);
      else setErro('Não foi possível carregar seu perfil. ' + mensagemErro(err));
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  // O texto dos termos de dropshipper é o que o usuário aceita: buscado sempre que o aceite for necessário.
  const precisaAceitar = perfil && perfil.termos_versao_vigente && perfil.termos_versao !== perfil.termos_versao_vigente;
  const precisaCandidatura = perfil === null || perfil?.status === 'REJEITADA';
  useEffect(() => {
    if (!precisaAceitar && !precisaCandidatura) return;
    api.get('/terms/latest', { params: { audience: 'DROPSHIPPER' } })
      .then((r) => setTermo(r.data?.term ?? null))
      .catch(() => setTermo(null));
  }, [precisaAceitar, precisaCandidatura]);

  const enviarCandidatura = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErro('');
    try {
      await api.post(`${BASE}/apply`, { nome_comercial: nome, documento, contato, aceite_termos: true });
      setAviso('Candidatura enviada. Você será avisado por e-mail quando houver decisão.');
      await carregar();
    } catch (err) {
      setErro('Não foi possível enviar a candidatura. ' + mensagemErro(err));
    } finally {
      setEnviando(false);
    }
  };

  const aceitarTermos = async () => {
    setEnviando(true);
    setErro('');
    try {
      await api.post(`${BASE}/terms/accept`, { versao: perfil.termos_versao_vigente });
      setAviso('Termos aceitos.');
      await carregar();
    } catch (err) {
      setErro('Não foi possível registrar o aceite. ' + mensagemErro(err));
    } finally {
      setEnviando(false);
    }
  };

  const exportar = async () => {
    setErro('');
    try {
      const res = await api.get(`${BASE}/export`, { responseType: 'blob' });
      baixarBlob(res.data, nomeArquivoExportacao('meus-dados'));
    } catch (err) {
      setErro('Não foi possível exportar seus dados. ' + mensagemErro(err));
    }
  };

  const excluir = async () => {
    setEnviando(true);
    setErro('');
    try {
      await api.delete(BASE);
      setDialogoExclusao(false);
      setAviso('Seus dados pessoais foram anonimizados.');
      await carregar();
    } catch (err) {
      setErro('Não foi possível excluir sua conta de dropshipper. ' + mensagemErro(err));
    } finally {
      setEnviando(false);
    }
  };

  if (perfil === undefined) return null;

  return (
    <Card variant="outlined" sx={{ mb: 3, borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Typography variant="h6">Minha conta de dropshipper</Typography>
          {perfil && <Chip size="small" label={STATUS_LABEL[perfil.status] ?? perfil.status} />}
        </Stack>

        {erro && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>{erro}</Alert>}
        {aviso && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setAviso('')}>{aviso}</Alert>}

        {precisaCandidatura && (
          <form onSubmit={enviarCandidatura}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {perfil?.status === 'REJEITADA'
                ? `Sua candidatura anterior foi recusada${perfil.motivo ? `: ${perfil.motivo}` : ''}. Você pode enviar de novo.`
                : 'Candidate-se para vender produtos por meio de uma loja de dropshipping.'}
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField label="Nome comercial" required value={nome} onChange={(e) => setNome(e.target.value)} inputProps={{ minLength: 2, maxLength: 160 }} />
              <TextField label="CPF ou CNPJ" required value={documento} onChange={(e) => setDocumento(e.target.value)} />
              <TextField label="E-mail de contato" type="email" required value={contato} onChange={(e) => setContato(e.target.value)} />
              {termo && (
                <Card variant="outlined" sx={{ p: 2, maxHeight: 240, overflow: 'auto' }}>
                  <Typography variant="subtitle2" gutterBottom>{termo.title ?? 'Termos de dropshipper'}</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{termo.content_md}</Typography>
                </Card>
              )}
              <FormControlLabel
                control={<Checkbox checked={aceite} onChange={(e) => setAceite(e.target.checked)} />}
                label="Li e aceito os termos de dropshipper"
              />
              <Button type="submit" variant="contained" disabled={!aceite || enviando}>
                Enviar candidatura
              </Button>
            </Stack>
          </form>
        )}

        {precisaAceitar && (
          <Stack spacing={2}>
            <Alert severity="warning">Há uma nova versão dos termos de dropshipper. Leia e aceite para continuar.</Alert>
            {termo && (
              <Card variant="outlined" sx={{ p: 2, maxHeight: 240, overflow: 'auto' }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{termo.content_md}</Typography>
              </Card>
            )}
            <Button variant="contained" onClick={aceitarTermos} disabled={enviando}>Aceitar os termos</Button>
          </Stack>
        )}

        {perfil && (
          <Stack direction="row" spacing={1} sx={{ mt: 3 }} flexWrap="wrap">
            <Button variant="outlined" onClick={exportar}>Exportar meus dados</Button>
            <Button variant="outlined" color="error" onClick={() => setDialogoExclusao(true)}>
              Excluir minha conta de dropshipper
            </Button>
          </Stack>
        )}
      </CardContent>

      <AnonimizarDialog
        open={dialogoExclusao}
        nome={perfil?.nome_comercial}
        enviando={enviando}
        onClose={() => setDialogoExclusao(false)}
        onConfirm={excluir}
      />
    </Card>
  );
}
