import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Paper, Snackbar, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ProducerProductsTransfer } from '../components/modules/ProducerProductsTransfer';
import ProducerProductDialog from '../components/dropshipping/ProducerProductDialog';
import ImportFromProjectDialog from '../components/dropshipping/ImportFromProjectDialog';
import { mensagemDeErro, nomeCompleto } from '../utils/adminProducers';

const brl = (n) => Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Detalhes do produtor: dados do cadastro (editáveis), produtos, cadastro e importação de produtos e transferência. */
export function ProducerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [produtor, setProdutor] = useState(null);
  const [erro, setErro] = useState('');
  const [aba, setAba] = useState(0);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '' });
  const [salvando, setSalvando] = useState(false);
  const [erroEdicao, setErroEdicao] = useState('');
  const [aviso, setAviso] = useState('');
  const [cadastrando, setCadastrando] = useState(false);
  const [importando, setImportando] = useState(false);

  const aplicar = (d) => { setProdutor(d); setForm({ first_name: d.first_name ?? '', last_name: d.last_name ?? '', email: d.email ?? '' }); };

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const { data } = await api.get(`/api/v1/admin/producers/${id}`);
      aplicar(data);
    } catch (err) {
      setProdutor(null);
      setErro(mensagemDeErro(err, 'Não foi possível carregar o produtor.'));
    }
  }, [id]);

  useEffect(() => { setProdutor(null); carregar(); }, [carregar]);

  const salvar = async (e) => {
    e.preventDefault();
    setSalvando(true); setErroEdicao('');
    try {
      const { data } = await api.put(`/api/v1/admin/producers/${id}`, { first_name: form.first_name.trim(), last_name: form.last_name.trim(), email: form.email.trim() });
      aplicar(data);
      setAviso('Dados do produtor atualizados.');
    } catch (err) { setErroEdicao(mensagemDeErro(err, 'Não foi possível salvar os dados.')); } finally { setSalvando(false); }
  };

  if (erro) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={carregar}>Tentar de novo</Button>}>{erro}</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/dropshipping-admin/produtores')}>Voltar para produtores</Button>
      </Box>
    );
  }
  if (!produtor) return <Box display="flex" justifyContent="center" py={8}><CircularProgress aria-label="Carregando produtor" /></Box>;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Button size="small" onClick={() => navigate('/dropshipping-admin/produtores')} sx={{ mb: 1 }}>← Produtores</Button>
      <Typography variant="h4" fontWeight="bold">{nomeCompleto(produtor)}</Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>{produtor.email}</Typography>

      <Tabs value={aba} onChange={(_, v) => setAba(v)} sx={{ mb: 2 }}>
        <Tab label="Dados" /><Tab label={`Produtos (${produtor.produtos.length})`} /><Tab label="Transferir produtos" />
      </Tabs>

      {aba === 0 && (
        <Paper variant="outlined" sx={{ p: 2, maxWidth: 520 }}>
          <Box component="form" onSubmit={salvar} display="grid" gap={2}>
            {erroEdicao && <Alert severity="error">{erroEdicao}</Alert>}
            <TextField label="Nome" size="small" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
            <TextField label="Sobrenome" size="small" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
            <TextField label="E-mail" type="email" size="small" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Box><Button type="submit" variant="contained" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar dados'}</Button></Box>
          </Box>
        </Paper>
      )}

      {aba === 1 && (
        <>
          <Box display="flex" gap={1} mb={2} flexWrap="wrap">
            <Button variant="contained" onClick={() => setCadastrando(true)}>Cadastrar produto</Button>
            <Button variant="outlined" onClick={() => setImportando(true)}>Importar de projeto</Button>
          </Box>
          {produtor.produtos.length === 0 ? (
            <Typography variant="body2" color="textSecondary">Este produtor ainda não tem produtos.</Typography>
          ) : (
            <Paper variant="outlined">
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Produto</TableCell><TableCell>Preço</TableCell><TableCell>Estoque</TableCell><TableCell>Catálogo</TableCell><TableCell>Lojas</TableCell><TableCell>Situação</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {produtor.produtos.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.nome}{!p.is_ativo && ' (inativo)'}</TableCell>
                      <TableCell>{brl(p.preco)}</TableCell>
                      <TableCell>{p.estoque ?? '—'}</TableCell>
                      <TableCell>{p.catalogo_dropshipper ? 'Habilitado' : 'Fora do catálogo'}</TableCell>
                      <TableCell>{p.lojas_alocadas}</TableCell>
                      <TableCell>
                        {p.sem_dados_de_frete && <Chip size="small" color="warning" label="Sem dados de frete" sx={{ mr: 0.5 }} />}
                        {p.importado_de && <Chip size="small" label={`Importado do #${p.importado_de}`} sx={{ mr: 0.5 }} />}
                        {p.is_madeira && <Chip size="small" label="Madeira" />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </>
      )}

      {aba === 2 && <ProducerProductsTransfer userId={id} getToken={() => user.getIdToken()} />}

      <ProducerProductDialog
        open={cadastrando} produtorId={id} onClose={() => setCadastrando(false)}
        onCreated={() => { setCadastrando(false); setAviso('Produto cadastrado.'); carregar(); }}
      />
      <ImportFromProjectDialog
        open={importando} produtorId={id} onClose={() => setImportando(false)} onImported={() => carregar()}
      />
      <Snackbar open={!!aviso} autoHideDuration={4000} onClose={() => setAviso('')} message={aviso} />
    </Box>
  );
}

export default ProducerDetails;
