import React, { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { confirmarProposta, conversarComAgente, estadoDoAgente, rejeitarProposta } from '../services/agente';
import { PropostaCard } from '../components/PropostaCard';

const MENSAGENS_ERRO = {
  AGENT_DISABLED: 'O agente de IA está desativado.',
  RATE_LIMIT: 'Muitas mensagens em pouco tempo. Aguarde um instante.',
  TETO_SESSAO: 'O teto desta conversa foi atingido. Comece uma nova conversa.',
  TETO_DIA: 'O teto diário de uso foi atingido. Tente amanhã.',
};

export function AgenteIA() {
  const [itens, setItens] = useState([]); // {tipo:'usuario'|'agente'|'proposta'|'erro', ...}
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [desligado, setDesligado] = useState(false);
  const sessao = useRef(undefined);
  const fim = useRef(null);

  useEffect(() => { estadoDoAgente().then((e) => setDesligado(!e.habilitado)); }, []);
  useEffect(() => { fim.current?.scrollIntoView?.({ behavior: 'smooth' }); }, [itens]);

  const aoEvento = (e) => {
    if (e.tipo === 'sessao') sessao.current = e.sessaoId;
    else if (e.tipo === 'texto') {
      setItens((l) => {
        const ult = l[l.length - 1];
        return ult?.tipo === 'agente' ? [...l.slice(0, -1), { ...ult, texto: ult.texto + e.delta }] : [...l, { tipo: 'agente', texto: e.delta }];
      });
    } else if (e.tipo === 'proposta') setItens((l) => [...l, { tipo: 'proposta', proposta: e.proposta }]);
    else if (e.tipo === 'erro') {
      if (e.codigo === 'AGENT_DISABLED' || e.status === 503) setDesligado(true);
      setItens((l) => [...l, { tipo: 'erro', texto: MENSAGENS_ERRO[e.codigo] ?? e.mensagem }]);
    }
  };

  const enviar = async () => {
    const mensagem = texto.trim();
    if (!mensagem || enviando) return;
    setTexto(''); setEnviando(true);
    setItens((l) => [...l, { tipo: 'usuario', texto: mensagem }]);
    try { await conversarComAgente({ mensagem, sessaoId: sessao.current, aoEvento }); }
    catch { aoEvento({ tipo: 'erro', codigo: 'REDE', mensagem: 'Falha de conexão com o agente.' }); }
    finally { setEnviando(false); }
  };

  return (
    <Box sx={{ p: 2, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>Agente de IA</Typography>
      <Alert severity="info" sx={{ mb: 2 }}>Consulta o sistema e propõe ações. Dados pessoais são trocados por códigos antes de ir ao provedor de IA. Qualquer alteração só acontece depois do seu “Confirmar”.</Alert>
      {desligado && <Alert severity="warning" sx={{ mb: 2 }}>O agente está desativado no momento.</Alert>}
      <Paper variant="outlined" sx={{ p: 2, minHeight: 320, maxHeight: '60vh', overflow: 'auto' }}>
        {itens.map((i, k) => {
          if (i.tipo === 'proposta') return <PropostaCard key={k} proposta={i.proposta} onConfirmar={confirmarProposta} onRejeitar={rejeitarProposta} />;
          if (i.tipo === 'erro') return <Alert key={k} severity="error" sx={{ my: 1 }}>{i.texto}</Alert>;
          return (
            <Box key={k} sx={{ my: 1, textAlign: i.tipo === 'usuario' ? 'right' : 'left' }}>
              <Typography component="span" sx={{ display: 'inline-block', px: 1.5, py: 1, borderRadius: 2, whiteSpace: 'pre-wrap', bgcolor: i.tipo === 'usuario' ? 'primary.main' : 'action.hover', color: i.tipo === 'usuario' ? 'primary.contrastText' : 'text.primary' }}>{i.texto}</Typography>
            </Box>
          );
        })}
        <div ref={fim} />
      </Paper>
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <TextField fullWidth size="small" placeholder="Pergunte algo sobre o sistema…" value={texto} disabled={desligado} inputProps={{ maxLength: 4000 }}
          onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }} />
        <Button variant="contained" onClick={enviar} disabled={enviando || desligado || !texto.trim()}>{enviando ? 'Enviando…' : 'Enviar'}</Button>
      </Stack>
    </Box>
  );
}
