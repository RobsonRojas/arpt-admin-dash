import { useState } from 'react';
import { Alert, Box, Button, Tab, Tabs, TextField, Typography } from '@mui/material';
import { api } from '../services/api';
import { BASE, formatarData, mensagemErro } from '../utils/wood';
import { WoodQueue } from './wood/WoodQueue';
import { WoodDeclaration } from './wood/WoodDeclaration';
import { WoodSpecies } from './wood/WoodSpecies';
import { WoodHelp } from './wood/WoodHelp';
import { WoodNcm } from './wood/WoodNcm';
import { WoodAdequacao } from './wood/WoodAdequacao';
import { WoodFunil } from './wood/WoodFunil';
import { DocumentDecision } from './wood/DocumentDecision';

function AuditoriaProduto() {
    const [produto, setProduto] = useState('');
    const [itens, setItens] = useState(null);
    const [erro, setErro] = useState(null);
    const buscar = async () => {
        setErro(null); setItens(null);
        try { setItens((await api.get(`${BASE}/products/${Number(produto)}/audit`)).data.historico); } catch (e) { setErro(mensagemErro(e, 'Não foi possível buscar.')); }
    };
    return (
        <Box>
            <Box display="flex" gap={1} mb={2}>
                <TextField size="small" label="Código do produto" value={produto} onChange={(e) => setProduto(e.target.value)} />
                <Button variant="contained" disabled={!Number(produto)} onClick={buscar}>Buscar</Button>
            </Box>
            {erro && <Alert severity="error">{erro}</Alert>}
            {itens && itens.length === 0 && <Typography color="text.secondary">Sem histórico para este produto.</Typography>}
            {(itens ?? []).map((h) => (
                <Typography key={h.id} variant="body2">{formatarData(h.created_at)} · {h.entidade} #{h.entidade_id} · {h.acao} · {h.papel ?? ''}{h.motivo ? ` — ${h.motivo}` : ''}</Typography>
            ))}
        </Box>
    );
}

/** Origem da madeira (add-wood-product-origin-compliance): fila de análise, espécies, ajuda, NCM por peça, adequação, auditoria e funil do formulário. */
export const WoodOrigin = () => {
    const [aba, setAba] = useState(0);
    const [aberto, setAberto] = useState(null);
    const [atualiza, setAtualiza] = useState(0);
    return (
        <Box p={3}>
            <Typography variant="h5" gutterBottom>Origem da madeira</Typography>
            <Tabs value={aba} onChange={(_, v) => { setAba(v); setAberto(null); }} sx={{ mb: 2 }} variant="scrollable">
                <Tab label="Fila de análise" /><Tab label="Espécies" /><Tab label="Ajuda" /><Tab label="NCM por peça" /><Tab label="Adequação" /><Tab label="Auditoria por produto" /><Tab label="Funil" />
            </Tabs>
            {aba === 0 && (aberto?.tipo === 'DECLARACAO'
                ? <WoodDeclaration id={aberto.id} onBack={() => { setAberto(null); setAtualiza((n) => n + 1); }} />
                : aberto?.tipo === 'DOCUMENTO'
                    ? (
                        <Box>
                            <Button onClick={() => { setAberto(null); setAtualiza((n) => n + 1); }}>Voltar à fila</Button>
                            <Typography variant="subtitle1">Documento {aberto.tipo_documento} {aberto.numero ? `nº ${aberto.numero}` : ''} · versão {aberto.versao} · {aberto.produtor}</Typography>
                            <DocumentDecision documentoId={aberto.id} versao={aberto.versao} />
                        </Box>
                    )
                    : <WoodQueue key={atualiza} onOpen={setAberto} />)}
            {aba === 1 && <WoodSpecies />}
            {aba === 2 && <WoodHelp />}
            {aba === 3 && <WoodNcm />}
            {aba === 4 && <WoodAdequacao />}
            {aba === 5 && <AuditoriaProduto />}
            {aba === 6 && <WoodFunil />}
        </Box>
    );
};
