import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItemButton, ListItemText, TextField, Typography,
  Table, TableBody, TableCell, TableHead, TableRow, Chip,
} from '@mui/material';
import { api } from '../../services/api';
import { mensagemDeErro } from '../../utils/adminProducers';

const BASE = '/api/v1/admin/producers';
const brl = (n) => Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Importar (copiar) produtos de recompensa de um projeto de financiamento coletivo para o catálogo do produtor.
 * Passos: projeto → produtos → prévia (`simular`) → confirmação. A cópia nasce com estoque zero e fora do catálogo dos dropshippers.
 */
export default function ImportFromProjectDialog({ open, produtorId, onClose, onImported }) {
  const [busca, setBusca] = useState('');
  const [projetos, setProjetos] = useState(null);
  const [projeto, setProjeto] = useState(null);
  const [produtos, setProdutos] = useState(null);
  const [sel, setSel] = useState([]);
  const [previa, setPrevia] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const reset = () => { setBusca(''); setProjetos(null); setProjeto(null); setProdutos(null); setSel([]); setPrevia(null); setResultado(null); setErro(''); };

  const carregarProjetos = useCallback(async (q) => {
    setErro('');
    try {
      const { data } = await api.get(`${BASE}/import-sources/projects`, { params: { q: q || undefined, limit: 50 } });
      setProjetos(data.data);
    } catch (err) { setErro(mensagemDeErro(err, 'Não foi possível carregar os projetos.')); }
  }, []);

  useEffect(() => { if (open) { reset(); carregarProjetos(''); } }, [open, carregarProjetos]);

  const escolher = async (p) => {
    setProjeto(p); setProdutos(null); setSel([]); setPrevia(null); setErro('');
    try {
      const { data } = await api.get(`${BASE}/import-sources/projects/${p.id}/products`, { params: { destino: produtorId } });
      // Um produto em duas recompensas do projeto pode vir repetido: a chave e a seleção são por produto.
      setProdutos(data.data.filter((x, i, a) => a.findIndex((y) => y.id === x.id) === i));
    } catch (err) { setErro(mensagemDeErro(err, 'Não foi possível carregar os produtos do projeto.')); }
  };

  const alternar = (id) => { setPrevia(null); setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])); };

  const chamar = async (simular) => {
    setOcupado(true); setErro('');
    try {
      const { data } = await api.post(`${BASE}/${produtorId}/import-products`, { id_manejo: projeto.id, produto_ids: sel, simular });
      if (simular) setPrevia(data.produtos); else { setResultado(data.produtos); onImported?.(data.produtos); }
    } catch (err) { setErro(mensagemDeErro(err, 'Não foi possível importar os produtos.')); } finally { setOcupado(false); }
  };

  return (
    <Dialog open={open} onClose={ocupado ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>Importar produtos de um projeto</DialogTitle>
      <DialogContent dividers>
        {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

        {resultado ? (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>
              {resultado.length} produto(s) importado(s). Eles estão sem estoque e fora do catálogo dos dropshippers: o produtor precisa revisar,
              informar o estoque e habilitá-los.
            </Alert>
            <List dense>{resultado.map((r) => <ListItemText key={r.id} primary={r.nome} secondary={`Novo produto #${r.id} (cópia do #${r.origem_produto_id})`} />)}</List>
          </>
        ) : (
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 2fr' }} gap={2}>
            <Box>
              <Box component="form" onSubmit={(e) => { e.preventDefault(); carregarProjetos(busca.trim()); }} display="flex" gap={1} mb={1}>
                <TextField size="small" label="Buscar projeto" value={busca} onChange={(e) => setBusca(e.target.value)} fullWidth />
                <Button type="submit" variant="outlined">Buscar</Button>
              </Box>
              {!projetos && <CircularProgress size={22} aria-label="Carregando projetos" />}
              {projetos && projetos.length === 0 && <Typography variant="body2" color="textSecondary">Nenhum projeto com produtos de recompensa.</Typography>}
              <List dense sx={{ maxHeight: 320, overflow: 'auto' }}>
                {(projetos ?? []).map((p) => (
                  <ListItemButton key={p.id} selected={projeto?.id === p.id} onClick={() => escolher(p)}>
                    <ListItemText primary={p.nome || `Projeto #${p.id}`} secondary={[p.municipio, p.estado].filter(Boolean).join(' - ')} />
                  </ListItemButton>
                ))}
              </List>
            </Box>
            <Box>
              {!projeto && <Typography variant="body2" color="textSecondary">Escolha um projeto para ver os produtos de recompensa.</Typography>}
              {projeto && !produtos && !erro && <CircularProgress size={22} aria-label="Carregando produtos" />}
              {projeto && produtos && produtos.length === 0 && <Alert severity="info">Este projeto não tem produtos para importar.</Alert>}
              {produtos && produtos.length > 0 && (
                <Table size="small">
                  <TableHead><TableRow><TableCell /><TableCell>Produto</TableCell><TableCell>Preço</TableCell><TableCell /></TableRow></TableHead>
                  <TableBody>
                    {produtos.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell padding="checkbox">
                          <Checkbox checked={sel.includes(p.id)} disabled={p.ja_importado} onChange={() => alternar(p.id)} inputProps={{ 'aria-label': `Selecionar ${p.nome}` }} />
                        </TableCell>
                        <TableCell>{p.nome}</TableCell>
                        <TableCell>{brl(p.preco)}</TableCell>
                        <TableCell>{p.ja_importado ? <Chip size="small" label="Já importado" /> : p.is_madeira ? <Chip size="small" color="warning" label="Madeira" /> : null}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {previa && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Serão criados {previa.length} produto(s) novo(s) para o produtor, cada um sem estoque e fora do catálogo dos dropshippers. Os originais e as
                  recompensas do projeto não mudam.
                  {previa.some((p) => p.is_madeira) && ' Produtos de madeira ficam com a origem pendente até nova declaração e aprovação.'}
                </Alert>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={ocupado}>{resultado ? 'Fechar' : 'Cancelar'}</Button>
        {!resultado && !previa && <Button variant="contained" disabled={sel.length === 0 || ocupado} onClick={() => chamar(true)}>Ver prévia ({sel.length})</Button>}
        {!resultado && previa && <Button variant="contained" color="primary" disabled={ocupado} onClick={() => chamar(false)}>Confirmar importação</Button>}
      </DialogActions>
    </Dialog>
  );
}
