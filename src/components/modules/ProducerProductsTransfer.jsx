import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Checkbox, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { api } from '../../services/api';
import TransferDialog from '../dropshipping/TransferDialog';

/**
 * Produtos de um produtor e a transferência para outro produtor. Só deve ser exibido para usuário com a função `produtor`
 * (quem decide é a tela de usuários, que já lê os papéis no Keycloak).
 */
export const ProducerProductsTransfer = ({ userId, getToken }) => {
  const [produtos, setProdutos] = useState(null);
  const [erro, setErro] = useState('');
  const [selecionados, setSelecionados] = useState([]);
  const [aberto, setAberto] = useState(false);
  const [feito, setFeito] = useState('');

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const { data } = await api.get(`/api/v1/admin/producers/${userId}/products`, { headers: { Authorization: `Bearer ${await getToken()}` } });
      setProdutos(data.data);
      setSelecionados([]);
    } catch {
      setErro('Não foi possível carregar os produtos do produtor.');
    }
  }, [userId]);

  useEffect(() => { setProdutos(null); setFeito(''); carregar(); }, [carregar]);

  // Destinos: usuários cadastrados; a API recusa (422) quem não tem a função de produtor.
  const carregarDestinos = async () => {
    const { data } = await api.get('/admin/users', { params: { page: 1, pageSize: 200 }, headers: { Authorization: `Bearer ${await getToken()}` } });
    return (data.users || []).filter((u) => String(u.id) !== String(userId))
      .map((u) => ({ id: u.id, label: `${u.first_name ? `${u.first_name} ${u.last_name ?? ''}` : u.name ?? u.email} (${u.email})` }));
  };

  const alternar = (id) => setSelecionados((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <Box mt={3} mb={4} p={2} sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }} data-producer-products>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Produtos do produtor</Typography>
      {erro && <Alert severity="error">{erro}</Alert>}
      {feito && <Alert severity="success" sx={{ mb: 1 }}>{feito}</Alert>}
      {!produtos && !erro && <CircularProgress size={22} aria-label="Carregando produtos" />}
      {produtos && produtos.length === 0 && <Typography variant="body2" color="textSecondary">Este produtor não tem produtos.</Typography>}
      {produtos && produtos.length > 0 && (
        <>
          <Table size="small">
            <TableHead><TableRow><TableCell /><TableCell>Produto</TableCell><TableCell>Lojas</TableCell><TableCell>Sub-pedidos em aberto</TableCell></TableRow></TableHead>
            <TableBody>
              {produtos.map((p) => (
                <TableRow key={p.produto_id}>
                  <TableCell padding="checkbox"><Checkbox checked={selecionados.includes(p.produto_id)} onChange={() => alternar(p.produto_id)} inputProps={{ 'aria-label': `Selecionar ${p.nome}` }} /></TableCell>
                  <TableCell>{p.nome}{!p.is_ativo && ' (inativo)'}</TableCell>
                  <TableCell>{p.lojas_alocadas}</TableCell>
                  <TableCell>{p.subpedidos_em_aberto}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Box mt={1} display="flex" gap={1}>
            <Button variant="outlined" disabled={selecionados.length === 0} onClick={() => setAberto(true)}>Transferir selecionados ({selecionados.length})</Button>
            <Button variant="outlined" color="warning" onClick={() => { setSelecionados([]); setAberto(true); }}>Transferir todos os produtos</Button>
          </Box>
        </>
      )}
      <TransferDialog
        open={aberto} modo="produtos" titulo="Transferir produtos para outro produtor"
        endpoint={`/api/v1/admin/producers/${userId}/transfer-products`}
        itemIds={selecionados}
        resumoItens={selecionados.length ? `${selecionados.length} produto(s) selecionado(s).` : 'Todos os produtos deste produtor.'}
        carregarDestinos={carregarDestinos}
        onClose={() => setAberto(false)}
        onDone={(r) => { setAberto(false); setFeito(`${r.produtos.length} produto(s) transferido(s).`); carregar(); }}
      />
    </Box>
  );
};
