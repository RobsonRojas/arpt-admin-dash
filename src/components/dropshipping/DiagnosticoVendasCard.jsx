import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, Stack, Typography } from '@mui/material';
import { api } from '../../services/api';

// Por que a loja vende ou não (add-admin-store-availability-diagnostics). Só leitura: as regras são as do checkout, no servidor.
const RESPONSAVEL = { ADMIN: 'ARPT', DROPSHIPPER: 'Dropshipper', PRODUTOR: 'Produtor' };

function Acao({ acao }) {
  if (!acao) return null;
  if (acao.tipo === 'ABRIR_TERMOS') {
    return <Button size="small" component={RouterLink} to="/terms-of-use">Abrir Termos de Uso e publicar nova versão</Button>;
  }
  if (acao.tipo === 'ACEITE_EM_NOME') return <Typography variant="caption" color="text.secondary">Use o cartão "Aceite de termos em nome do dropshipper", abaixo.</Typography>;
  if (acao.tipo === 'LIGAR_PEDIDOS') return <Typography variant="caption" color="text.secondary">Ligar ORDERS_ENABLED no .env do servidor e reiniciar a API.</Typography>;
  if (acao.tipo === 'AVISAR') return <Typography variant="caption" color="text.secondary">Avisar: {RESPONSAVEL[acao.quem] ?? acao.quem}.</Typography>;
  return null;
}

function Linha({ titulo, mensagem, responsavel, acao, aviso }) {
  return (
    <Box sx={{ py: 1.25 }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        {titulo && <Typography variant="body2" fontWeight="bold">{titulo}</Typography>}
        <Chip size="small" label={`Quem resolve: ${RESPONSAVEL[responsavel] ?? responsavel}`} />
        {aviso && <Chip size="small" color="info" variant="outlined" label="Não impede a venda" />}
      </Stack>
      <Typography variant="body2" sx={{ mt: 0.5 }}>{mensagem}</Typography>
      <Box sx={{ mt: 0.5 }}><Acao acao={acao} /></Box>
    </Box>
  );
}

/**
 * `aposAceite`: o administrador acabou de registrar o aceite em nome do dropshipper. O aceite só destrava o painel do dono;
 * quem decide se a loja vende são as outras condições, e é isso que a mensagem diz.
 */
export default function DiagnosticoVendasCard({ storeId, nome, recarregarChave = 0, aposAceite = false }) {
  const [diag, setDiag] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const { data } = await api.get(`/api/v1/admin/dropshipping/stores/${storeId}/availability`);
      setDiag(data);
    } catch (err) {
      setErro(err.response?.data?.error || 'Não foi possível carregar o diagnóstico de vendas.');
    } finally {
      setCarregando(false);
    }
  }, [storeId]);

  useEffect(() => { carregar(); }, [carregar, recarregarChave]);

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap spacing={1}>
          <Typography variant="h6">Diagnóstico de vendas{nome ? `: ${nome}` : ''}</Typography>
          <Button size="small" onClick={carregar} disabled={carregando}>Atualizar</Button>
        </Stack>
        {carregando && !diag && <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={24} /></Box>}
        {erro && <Alert severity="error" sx={{ mt: 2 }}>{erro}</Alert>}
        {diag && (
          <>
            {aposAceite && (
              <Alert severity={diag.vende ? 'success' : 'warning'} sx={{ mt: 2 }}>
                {diag.vende
                  ? 'Aceite registrado. Pelo diagnóstico, a loja está apta a vender.'
                  : 'Aceite registrado, mas o aceite não garante a venda: a loja ainda tem motivos abaixo que impedem as compras.'}
              </Alert>
            )}
            <Alert severity={diag.vende ? 'success' : 'warning'} sx={{ mt: 2 }}>
              {diag.vende
                ? `Loja apta a vender (${diag.produtos_disponiveis} produto(s) disponível(is)).`
                : 'A loja não está vendendo agora.'}
            </Alert>
            {diag.motivos_loja.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Motivos da loja</Typography>
                <Divider />
                {diag.motivos_loja.map((m) => (
                  <Linha key={m.code} mensagem={m.mensagem} responsavel={m.responsavel} acao={m.acao} aviso={!m.bloqueia_venda} />
                ))}
              </Box>
            )}
            {diag.produtos_indisponiveis.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Produtos indisponíveis ({diag.produtos_indisponiveis.length})</Typography>
                <Divider />
                {diag.produtos_indisponiveis.map((p) => (
                  <Linha key={p.produto_id} titulo={p.nome} mensagem={p.mensagem} responsavel={p.responsavel} acao={p.acao} />
                ))}
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
