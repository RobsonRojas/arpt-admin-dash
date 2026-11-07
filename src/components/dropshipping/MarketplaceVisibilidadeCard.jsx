import React, { useEffect, useState } from 'react';
import { Alert, CircularProgress, FormControlLabel, Paper, Switch, Typography } from '@mui/material';
import { api } from '../../services/api';

const URL = '/api/v1/admin/marketplace/visibility';

/**
 * Visibilidade do marketplace (add-marketplace-login-visibility): ligado, só usuários logados no manejo-app veem o
 * item do menu, a página e a API pública do marketplace. As lojas individuais continuam públicas.
 */
export default function MarketplaceVisibilidadeCard() {
  const [somenteLogados, setSomenteLogados] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => {
    let vivo = true;
    api.get(URL)
      .then((res) => vivo && setSomenteLogados(res.data.visibilidade === 'logados'))
      .catch(() => vivo && setMensagem({ severity: 'error', text: 'Não foi possível carregar a visibilidade do marketplace.' }));
    return () => { vivo = false; };
  }, []);

  const alterar = async (event) => {
    const novo = event.target.checked;
    const anterior = somenteLogados;
    setSomenteLogados(novo);
    setSalvando(true);
    setMensagem(null);
    try {
      await api.put(URL, { visibilidade: novo ? 'logados' : 'publico' });
      setMensagem({
        severity: 'success',
        text: novo
          ? 'Salvo. O marketplace passa a ser visível só para usuários logados em até 1 minuto.'
          : 'Salvo. O marketplace volta a ser público em até 1 minuto.',
      });
    } catch (err) {
      setSomenteLogados(anterior);
      setMensagem({ severity: 'error', text: err.response?.data?.error || 'Não foi possível salvar. Tente de novo.' });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }} data-testid="marketplace-visibilidade">
      <Typography variant="subtitle1" fontWeight="bold">Marketplace</Typography>
      <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1 }}>
        Com a opção ligada, visitantes sem login deixam de ver o item Marketplace no menu e a página, e a API pública do
        marketplace passa a exigir login. As lojas individuais dos dropshippers continuam públicas. A mudança leva até 1 minuto
        para valer.
      </Typography>
      {somenteLogados === null && !mensagem ? (
        <CircularProgress size={20} />
      ) : (
        somenteLogados !== null && (
          <FormControlLabel
            control={<Switch checked={somenteLogados} onChange={alterar} disabled={salvando} inputProps={{ 'aria-label': 'Visível somente para usuários logados' }} />}
            label="Visível somente para usuários logados"
          />
        )
      )}
      {mensagem && <Alert severity={mensagem.severity} sx={{ mt: 2, borderRadius: 2 }}>{mensagem.text}</Alert>}
    </Paper>
  );
}
