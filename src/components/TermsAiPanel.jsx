import React, { useState } from 'react';
import { Alert, Box, Button, Chip, Divider, Paper, Typography } from '@mui/material';
import { AVISO_IA, GRAVIDADE_COR, GRAVIDADE_LABEL, TIPO_LABEL, aplicarObservacao } from '../utils/termsAi';

/**
 * Painel de observações do assistente jurídico (add-ai-terms-legal-assistant-and-translation).
 * Só mostra e dispara ações: quem altera o editor é o administrador, e nada é salvo aqui.
 */
export const TermsAiPanel = ({ revisao, textoAtual, aplicadas, podeDesfazer, onAplicar, onUsarSugerido, onDesfazer, onFechar }) => {
    const [comparando, setComparando] = useState(false);
    if (!revisao) return null;
    const observacoes = revisao.observacoes ?? [];

    return (
        <Paper variant="outlined" sx={{ p: 2, mb: 2, maxHeight: '40vh', overflowY: 'auto' }} aria-label="Observações do assistente jurídico">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Assistente jurídico</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" onClick={onDesfazer} disabled={!podeDesfazer}>Desfazer</Button>
                    <Button size="small" variant="outlined" onClick={onFechar}>Fechar sem aplicar</Button>
                </Box>
            </Box>
            <Alert severity="info" sx={{ my: 1 }}>{AVISO_IA}</Alert>
            <Typography variant="body2" sx={{ mb: 1 }}>{revisao.resumo}</Typography>

            {observacoes.length === 0 && <Typography variant="body2" color="textSecondary">Nenhuma observação: o assistente não encontrou pontos a ajustar.</Typography>}
            {observacoes.map((obs, i) => {
                const jaAplicada = aplicadas.includes(i);
                const aplicavel = aplicarObservacao(textoAtual, obs).ok;
                return (
                    <Box key={i} sx={{ mb: 1.5 }} data-testid={`observacao-${i}`}>
                        <Divider sx={{ mb: 1 }} />
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}>
                            <Chip size="small" label={TIPO_LABEL[obs.tipo] ?? obs.tipo} />
                            <Chip size="small" color={GRAVIDADE_COR[obs.gravidade] ?? 'default'} label={`Gravidade ${GRAVIDADE_LABEL[obs.gravidade] ?? obs.gravidade}`} />
                        </Box>
                        {obs.trecho && <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 0.5 }}>“{obs.trecho}”</Typography>}
                        <Typography variant="body2" sx={{ mb: 0.5 }}>{obs.explicacao}</Typography>
                        {obs.sugestao && <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Sugestão:</strong> {obs.sugestao}</Typography>}
                        <Button size="small" variant="outlined" disabled={jaAplicada || !aplicavel} onClick={() => onAplicar(i)}>
                            {jaAplicada ? 'Aplicada' : 'Aplicar'}
                        </Button>
                        {!jaAplicada && !aplicavel && <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>Trecho não encontrado no texto atual: ajuste à mão.</Typography>}
                    </Box>
                );
            })}

            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button size="small" variant="outlined" onClick={() => setComparando((v) => !v)}>{comparando ? 'Ocultar comparação' : 'Comparar texto sugerido com o atual'}</Button>
                <Button size="small" variant="contained" onClick={onUsarSugerido}>Usar texto sugerido</Button>
            </Box>
            {comparando && (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
                    <Box>
                        <Typography variant="caption" color="textSecondary">Atual</Typography>
                        <Box component="pre" data-testid="comparacao-atual" sx={{ whiteSpace: 'pre-wrap', fontSize: 12, m: 0 }}>{textoAtual}</Box>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="textSecondary">Sugerido</Typography>
                        <Box component="pre" data-testid="comparacao-sugerido" sx={{ whiteSpace: 'pre-wrap', fontSize: 12, m: 0 }}>{revisao.texto_sugerido}</Box>
                    </Box>
                </Box>
            )}
        </Paper>
    );
};
