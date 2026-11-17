import React, { useEffect, useState } from 'react';
import {
  Alert, Autocomplete, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputLabel, MenuItem, Select, Checkbox, FormControlLabel, TextField, Typography, Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material';
import { api } from '../../services/api';
import { montarCorpoTransferencia, mensagemErroTransferencia } from '../../utils/transfer';

const COLUNAS = {
  lojas: [['nome', 'Loja'], ['status', 'Estado'], ['produtos', 'Produtos'], ['pedidos_em_aberto', 'Pedidos em aberto'], ['repasses_pendentes', 'Repasses pendentes']],
  produtos: [['nome', 'Produto'], ['lojas_alocadas', 'Lojas'], ['subpedidos_em_aberto', 'Sub-pedidos em aberto']],
};

/**
 * Transferência com prévia: escolhe o destino e o motivo, mostra o que será afetado (`simular`) e só então aplica.
 * `modo`: 'lojas' (dropshipper → dropshipper) ou 'produtos' (produtor → produtor). `itemIds` vazio = todos.
 */
export default function TransferDialog({ open, modo, titulo, endpoint, itemIds, resumoItens, carregarDestinos, onClose, onDone }) {
  const [destinos, setDestinos] = useState([]);
  const [destino, setDestino] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [antigoComo, setAntigoComo] = useState('editor');
  const [manterAlternativa, setManterAlternativa] = useState(false);
  const [previa, setPrevia] = useState(null);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    let vivo = true;
    setDestino(null); setMotivo(''); setPrevia(null); setErro('');
    Promise.resolve(carregarDestinos()).then((d) => { if (vivo) setDestinos(d); }).catch(() => { if (vivo) setErro('Não foi possível carregar os destinos.'); });
    return () => { vivo = false; };
  }, [open]);

  const enviar = async (simular) => {
    const r = montarCorpoTransferencia(modo, { destinoId: destino?.id, motivo, itemIds, extra: { antigoComo: modo === 'lojas' ? antigoComo : undefined, manterAlternativa }, simular });
    if (r.error) return setErro(r.error);
    setEnviando(true);
    setErro('');
    try {
      const { data } = await api.post(endpoint, r.body);
      if (simular) setPrevia(data);
      else onDone(data);
    } catch (err) {
      setErro(mensagemErroTransferencia(err));
    } finally {
      setEnviando(false);
    }
  };

  const fechar = () => { if (!enviando) onClose(); };
  const itens = modo === 'lojas' ? previa?.lojas : previa?.produtos;

  return (
    <Dialog open={open} onClose={fechar} fullWidth maxWidth="md">
      <DialogTitle>{titulo}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>{resumoItens}</Typography>
        {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
        <Autocomplete
          options={destinos}
          value={destino}
          onChange={(_e, v) => { setDestino(v); setPrevia(null); }}
          getOptionLabel={(o) => o.label}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          renderInput={(params) => <TextField {...params} label="Destino" required margin="dense" />}
          disabled={enviando || Boolean(previa)}
        />
        <TextField
          label="Motivo" required fullWidth multiline minRows={2} margin="dense" value={motivo} inputProps={{ maxLength: 500 }}
          onChange={(e) => { setMotivo(e.target.value); setPrevia(null); }} disabled={enviando || Boolean(previa)}
        />
        {modo === 'lojas' && (
          <FormControl fullWidth margin="dense" disabled={enviando || Boolean(previa)}>
            <InputLabel id="antigo-como">Dono anterior</InputLabel>
            <Select labelId="antigo-como" label="Dono anterior" value={antigoComo} onChange={(e) => setAntigoComo(e.target.value)}>
              <MenuItem value="editor">Continua na loja como editor</MenuItem>
              <MenuItem value="remover">Sai da loja</MenuItem>
            </Select>
          </FormControl>
        )}
        {modo === 'produtos' && (
          <FormControlLabel
            control={<Checkbox checked={manterAlternativa} onChange={(e) => setManterAlternativa(e.target.checked)} disabled={enviando || Boolean(previa)} />}
            label="Manter o produtor de origem como alternativa de reoferta"
          />
        )}
        {previa && (
          <>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>Prévia: nada foi alterado ainda</Typography>
            <Table size="small">
              <TableHead><TableRow>{COLUNAS[modo].map(([, rotulo]) => <TableCell key={rotulo}>{rotulo}</TableCell>)}</TableRow></TableHead>
              <TableBody>
                {itens.map((i) => (
                  <TableRow key={i.loja_id ?? i.produto_id}>{COLUNAS[modo].map(([chave]) => <TableCell key={chave}>{String(i[chave])}</TableCell>)}</TableRow>
                ))}
              </TableBody>
            </Table>
            {previa.avisos?.map((a) => <Alert key={a} severity="warning" sx={{ mt: 1 }}>{a}</Alert>)}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={fechar} disabled={enviando}>Cancelar</Button>
        {previa
          ? (
            <>
              <Button onClick={() => setPrevia(null)} disabled={enviando}>Voltar</Button>
              <Button variant="contained" color="warning" onClick={() => enviar(false)} disabled={enviando}>
                {enviando ? <CircularProgress size={18} color="inherit" /> : 'Confirmar transferência'}
              </Button>
            </>
          )
          : (
            <Button variant="contained" onClick={() => enviar(true)} disabled={enviando}>
              {enviando ? <CircularProgress size={18} color="inherit" /> : 'Ver prévia'}
            </Button>
          )}
      </DialogActions>
    </Dialog>
  );
}
