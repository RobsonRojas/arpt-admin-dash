import { useCallback, useEffect, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { api } from '../../services/api';
import { EspeciePicker } from './EspeciePicker';
import { BASE, formatarData, mensagemErro, TIPO_ORIGEM, USO_PECA } from '../../utils/wood';

const hoje = new Date().toISOString().slice(0, 10);
const CAMPOS_DE_REGRA = {
    tipo_origem: 'De onde veio a madeira', especies: 'Madeira (espécie)', local: 'Local da colheita', uso_previsto: 'Uso da peça', acabamento: 'Acabamento', embalagem: 'Embalagem',
    frete: 'Peso e medidas (frete)', autor_nome: 'Quem fez a peça', historia_pt: 'História da peça', tecnica: 'Técnica', cuidados: 'Cuidados',
};
const DOCS = {
    AUTORIZACAO_MANEJO: 'Autorização de manejo', LICENCA_ARVORE_CAIDA: 'Licença de árvore caída', DOF: 'DOF', DOF_ESPECIAL: 'DOF Especial', NOTA_FISCAL: 'Nota fiscal',
    DECLARACAO_REAPROVEITAMENTO: 'Declaração de reaproveitamento (com fotos)', CITES: 'CITES',
};
const LIMITES = { especies: 'Máximo de madeiras', municipio: 'Município', comunidade: 'Comunidade', descricao_local: 'Descrição do local', autor_nome: 'Nome de quem fez', historia: 'História', tecnica: 'Técnica', cuidados: 'Cuidados' };
const USOS_BLOQUEAVEIS = { ...USO_PECA };
const VAZIO = { vigencia: '', prazo_dias: 90, resumo: '', por_que: '', origens: [], especies: [], usos: [], destinos: '', regras: null };
const escopoTexto = (e, nomes) => {
    const partes = [];
    if (e.origens.length) partes.push(`origem: ${e.origens.map((o) => TIPO_ORIGEM[o] ?? o).join(', ')}`);
    if (e.especies.length) partes.push(`espécie: ${e.especies.map((id) => nomes[id] ?? `#${id}`).join(', ')}`);
    if (e.usos.length) partes.push(`uso: ${e.usos.map((u) => USO_PECA[u] ?? u).join(', ')}`);
    if (e.destinos.length) partes.push(`destino: ${e.destinos.join(', ')}`);
    return partes.length ? partes.join(' · ') : 'todas as declarações';
};

/**
 * Versões dos requisitos de origem (versao-requisitos-origem, 1.3): cadastrar, publicar (imutável) e ver quem ficou desatualizado.
 * Só registra e mostra: nada aqui reabre declaração nem tira peça de venda.
 */
export function WoodRequisitos() {
    const [dados, setDados] = useState(null);
    const [especies, setEspecies] = useState([]);
    const [erro, setErro] = useState(null);
    const [form, setForm] = useState(null);
    const [salvando, setSalvando] = useState(false);
    const [confirmar, setConfirmar] = useState(null);
    const [acomp, setAcomp] = useState(null);
    const [aplicar, setAplicar] = useState(null);

    const carregar = useCallback(async () => {
        setErro(null);
        try {
            const v = await api.get(`${BASE}/requirements`);
            // Só os nomes das espécies que as versões citam (a lista completa tem milhares): busca por ids.
            const ids = [...new Set((v.data.versoes ?? []).flatMap((x) => x.escopo?.especies ?? []))];
            const e = ids.length ? await api.get(`${BASE}/species`, { params: { ids: ids.join(','), por_pagina: 200 } }) : { data: { especies: [] } };
            setDados(v.data); setEspecies(e.data.especies ?? []);
        } catch (e) { setErro(mensagemErro(e, 'Não foi possível carregar as versões.')); }
    }, []);
    useEffect(() => { carregar(); }, [carregar]);

    const nomes = Object.fromEntries(especies.map((e) => [e.id, e.nome_principal_pt]));
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
    const corpo = () => ({
        vigencia: form.vigencia, prazo_dias: Number(form.prazo_dias), resumo: form.resumo, por_que: form.por_que,
        escopo: { origens: form.origens, especies: form.especies, usos: form.usos, destinos: String(form.destinos).split(/[\s,;]+/).filter(Boolean) },
        ...(form.regras ? { regras: form.regras } : {}),
    });
    const salvar = async () => {
        setSalvando(true); setErro(null);
        try {
            if (form.id) await api.put(`${BASE}/requirements/${form.id}`, corpo()); else await api.post(`${BASE}/requirements`, corpo());
            setForm(null); await carregar();
        } catch (e) { setErro(mensagemErro(e, 'Não foi possível salvar.')); } finally { setSalvando(false); }
    };
    const publicar = async () => {
        setSalvando(true); setErro(null);
        try { await api.post(`${BASE}/requirements/${confirmar.id}/publish`); setConfirmar(null); await carregar(); }
        catch (e) { setErro(mensagemErro(e, 'Não foi possível publicar.')); setConfirmar(null); } finally { setSalvando(false); }
    };
    const acompanhar = async (v) => {
        setErro(null);
        try { setAcomp(v ? (await api.get(`${BASE}/requirements/${v.id}/rollout`)).data : null); }
        catch (e) { setErro(mensagemErro(e, 'Não foi possível consultar.')); }
    };
    const abrirAplicar = async (v) => {
        setErro(null);
        try {
            const previa = (await api.get(`${BASE}/requirements/${v.id}/impact`, { params: { limite: 1 } })).data;
            setAplicar({ versao: v, previa, politica: 'AVISO_PRAZO', modo: 'TESTE', justificativa: '' });
        } catch (e) { setErro(mensagemErro(e, 'Não foi possível calcular o impacto.')); }
    };
    const confirmarAplicar = async () => {
        setSalvando(true); setErro(null);
        try {
            const corpoAplicar = { politica: aplicar.politica, modo: aplicar.modo };
            if (aplicar.justificativa.trim()) corpoAplicar.justificativa = aplicar.justificativa.trim();
            await api.post(`${BASE}/requirements/${aplicar.versao.id}/apply`, corpoAplicar);
            const v = aplicar.versao; setAplicar(null); await carregar(); await acompanhar(v);
        } catch (e) { setErro(mensagemErro(e, 'Não foi possível aplicar.')); setAplicar(null); } finally { setSalvando(false); }
    };
    const ativar = async () => {
        setSalvando(true); setErro(null);
        try { await api.post(`${BASE}/requirements/${acomp.versao.id}/activate`, {}); await acompanhar({ id: acomp.versao.id }); }
        catch (e) { setErro(mensagemErro(e, 'Não foi possível ativar.')); } finally { setSalvando(false); }
    };
    const editar = (v) => setForm({ id: v.id, vigencia: v.vigencia, prazo_dias: v.prazo_dias, resumo: v.resumo, por_que: v.por_que, origens: v.escopo.origens, especies: v.escopo.especies, usos: v.escopo.usos, destinos: v.escopo.destinos.join(', '), regras: v.regras ?? dados?.vigente?.regras ?? null });
    /** Nova versão parte das regras em vigor: o administrador só mexe no que muda. */
    const nova = () => setForm({ ...VAZIO, regras: dados?.vigente?.regras ?? null });
    const setRegra = (mudanca) => setForm((f) => ({ ...f, regras: { ...f.regras, ...mudanca } }));

    if (!dados) return erro ? <Alert severity="error" action={<Button color="inherit" size="small" onClick={carregar}>Tentar de novo</Button>}>{erro}</Alert> : <Typography role="status">Carregando…</Typography>;

    return (
        <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
                Uma versão registra o que mudou nos requisitos de origem e a quem se aplica. Depois de publicada, <b>não se edita</b>: para corrigir, crie outra.
                Publicar apenas registra. Só <b>Aplicar</b> avisa os produtores e, conforme a política, exige a atualização; o efeito na venda segue o modo geral de bloqueio.
                O que exige refazer deve vir da validação jurídica.
            </Alert>
            {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Button variant="contained" onClick={nova}>Nova versão</Button>
                <Typography variant="body2" color="text.secondary" data-testid="vigente">Vigente agora: versão {dados.vigente?.numero ?? '—'}</Typography>
            </Stack>

            <Paper variant="outlined" sx={{ mb: 3, overflowX: 'auto' }}>
                <Table size="small" aria-label="Versões dos requisitos">
                    <TableHead><TableRow><TableCell>Versão</TableCell><TableCell>Vigência</TableCell><TableCell>Prazo</TableCell><TableCell>O que mudou</TableCell><TableCell>Aplica-se a</TableCell><TableCell>Situação</TableCell><TableCell /></TableRow></TableHead>
                    <TableBody>
                        {dados.versoes.map((v) => (
                            <TableRow key={v.id} data-testid={`versao-${v.id}`}>
                                <TableCell>{v.numero ?? '—'}</TableCell>
                                <TableCell>{formatarData(v.vigencia)}</TableCell>
                                <TableCell>{v.prazo_dias} dias</TableCell>
                                <TableCell sx={{ maxWidth: 320 }}><Typography variant="body2">{v.resumo}</Typography><Typography variant="caption" color="text.secondary">{v.por_que}</Typography></TableCell>
                                <TableCell>{escopoTexto(v.escopo, nomes)}</TableCell>
                                <TableCell><Chip size="small" color={v.situacao === 'PUBLICADA' ? 'success' : 'default'} label={v.situacao === 'PUBLICADA' ? 'Publicada' : 'Rascunho'} /></TableCell>
                                <TableCell align="right">
                                    {v.situacao === 'RASCUNHO' ? (
                                        <Stack direction="row" spacing={1} justifyContent="flex-end"><Button size="small" onClick={() => editar(v)}>Editar</Button><Button size="small" variant="outlined" onClick={() => setConfirmar(v)}>Publicar</Button></Stack>
                                    ) : v.numero > 1 ? (
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <Button size="small" onClick={() => acompanhar(v)}>Acompanhar</Button>
                                            {v.vigencia <= hoje && <Button size="small" variant="outlined" onClick={() => abrirAplicar(v)}>Aplicar</Button>}
                                        </Stack>
                                    ) : null}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

            {acomp && (
                <Paper variant="outlined" sx={{ p: 2, mb: 3 }} data-testid="acompanhamento">
                    <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
                        <Typography variant="subtitle1">Versão {acomp.versao.numero}</Typography>
                        {acomp.aplicacao
                            ? <Chip size="small" color={acomp.aplicacao.modo === 'ATIVO' ? 'error' : 'warning'} data-testid="situacao-aplicacao"
                                label={`${acomp.aplicacao.politica === 'IMEDIATA' ? 'Imediata' : 'Aviso e prazo'} · ${acomp.aplicacao.modo === 'ATIVO' ? 'valendo' : 'em teste (nada é bloqueado)'}`} />
                            : <Chip size="small" label="Ainda não aplicada" data-testid="situacao-aplicacao" />}
                        {acomp.aplicacao?.prazo_fim && <Typography variant="body2" color="text.secondary">Prazo até {formatarData(acomp.aplicacao.prazo_fim)}</Typography>}
                        {acomp.aplicacao?.modo === 'TESTE' && <Button size="small" variant="contained" onClick={ativar} disabled={salvando}>Passar a valer</Button>}
                        <Button size="small" onClick={() => setAcomp(null)}>Fechar</Button>
                    </Stack>
                    <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
                        {[['pendentes', 'Aguardando atualização'], ['em_atualizacao', 'Atualizando'], ['requer_atualizacao', 'Requer atualização'], ['atualizadas', 'Já atualizaram']].map(([k, rotulo]) => (
                            <Paper key={k} variant="outlined" sx={{ p: 1.5, minWidth: 150 }} data-testid={`num-${k}`}><Typography variant="h6">{acomp[k]}</Typography><Typography variant="body2" color="text.secondary">{rotulo}</Typography></Paper>
                        ))}
                    </Stack>
                    {acomp.aplicacao?.modo === 'TESTE' && <Alert severity="warning" sx={{ mb: 1 }} data-testid="bloqueariam">Se valesse agora, <b>{acomp.bloqueariam}</b> declaração(ões) ficariam bloqueadas. Nenhuma foi bloqueada.</Alert>}
                    {acomp.lista.length === 0 && <Typography color="text.secondary">Ninguém pendente nesta versão.</Typography>}
                    {acomp.lista.map((i) => <Typography key={`${i.declaracao_id}-${i.situacao}`} variant="body2">#{i.declaracao_id} · {i.produto} · {({ PENDENTE: 'aguardando', ATUALIZANDO: 'atualizando', REQUER_ATUALIZACAO: 'requer atualização' })[i.situacao] ?? i.situacao}</Typography>)}
                    {acomp.pendentes + acomp.em_atualizacao + acomp.requer_atualizacao > acomp.lista.length && <Typography variant="caption" color="text.secondary">Mostrando as primeiras {acomp.lista.length}.</Typography>}
                </Paper>
            )}

            <Dialog open={!!aplicar} onClose={() => setAplicar(null)} fullWidth maxWidth="sm">
                <DialogTitle>Aplicar a versão {aplicar?.versao.numero}</DialogTitle>
                {aplicar && (
                    <DialogContent>
                        <Alert severity="info" sx={{ mt: 1, mb: 2 }} data-testid="previa">Isto afeta <b>{aplicar.previa.produtos}</b> produto(s) de <b>{aplicar.previa.produtores}</b> produtor(es){aplicar.previa.alocacoes_ativas ? `, com ${aplicar.previa.alocacoes_ativas} alocação(ões) ativa(s) em lojas` : ''}. Nada é alterado até você confirmar.{aplicar.previa.destinos_nao_restringem ? ' O destino não restringe quem é alcançado.' : ''}</Alert>
                        <Stack spacing={2}>
                            <TextField select label="Política" value={aplicar.politica} onChange={(e) => setAplicar((a) => ({ ...a, politica: e.target.value }))} inputProps={{ 'data-testid': 'f-politica' }}>
                                <MenuItem value="AVISO_PRAZO">Aviso e prazo: avisa e, no fim do prazo, exige a atualização</MenuItem>
                                <MenuItem value="IMEDIATA">Imediata: exige a atualização agora (só quem tem permissão, com justificativa)</MenuItem>
                            </TextField>
                            <TextField select label="Modo" value={aplicar.modo} onChange={(e) => setAplicar((a) => ({ ...a, modo: e.target.value }))} inputProps={{ 'data-testid': 'f-modo' }}>
                                <MenuItem value="TESTE">Teste: avisa e conta quantas seriam bloqueadas, sem bloquear ninguém</MenuItem>
                                <MenuItem value="ATIVO">Valer de verdade</MenuItem>
                            </TextField>
                            {aplicar.politica === 'IMEDIATA' && <TextField label="Justificativa (obrigatória)" value={aplicar.justificativa} onChange={(e) => setAplicar((a) => ({ ...a, justificativa: e.target.value }))} multiline minRows={2} inputProps={{ 'data-testid': 'f-justificativa' }} />}
                            {aplicar.modo === 'ATIVO' && <Alert severity="warning">Vai valer de verdade. Recomendamos rodar antes em teste.</Alert>}
                        </Stack>
                    </DialogContent>
                )}
                <DialogActions><Button onClick={() => setAplicar(null)}>Cancelar</Button><Button variant="contained" color={aplicar?.modo === 'ATIVO' ? 'error' : 'primary'} onClick={confirmarAplicar} disabled={salvando}>Aplicar</Button></DialogActions>
            </Dialog>

            <Dialog open={!!form} onClose={() => setForm(null)} fullWidth maxWidth="sm">
                <DialogTitle>{form?.id ? 'Editar rascunho' : 'Nova versão de requisitos'}</DialogTitle>
                {form && (
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <Stack direction="row" spacing={2}>
                                <TextField label="Vigência" type="date" value={form.vigencia} onChange={set('vigencia')} InputLabelProps={{ shrink: true }} inputProps={{ 'data-testid': 'f-vigencia' }} fullWidth />
                                <TextField label="Prazo de adequação (dias)" type="number" value={form.prazo_dias} onChange={set('prazo_dias')} inputProps={{ min: 1, max: 365 }} fullWidth />
                            </Stack>
                            <TextField label="O que mudou" value={form.resumo} onChange={set('resumo')} multiline minRows={2} inputProps={{ 'data-testid': 'f-resumo' }} />
                            <TextField label="Por quê" value={form.por_que} onChange={set('por_que')} multiline minRows={2} inputProps={{ 'data-testid': 'f-porque' }} />
                            <Typography variant="subtitle2">A quem se aplica (vazio = não restringe)</Typography>
                            <TextField select label="Origem" value={form.origens} onChange={set('origens')} SelectProps={{ multiple: true }}>{Object.entries(TIPO_ORIGEM).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}</TextField>
                            <EspeciePicker multiple size="medium" label="Espécie" value={form.especies.map((id) => especies.find((e) => e.id === id) ?? { id, nome_principal_pt: `#${id}`, nome_cientifico: '' })}
                                onChange={(v) => { setEspecies((atuais) => [...atuais.filter((e) => !v.some((x) => x.id === e.id)), ...v]); setForm((f) => ({ ...f, especies: v.map((e) => e.id) })); }} />
                            <TextField select label="Uso" value={form.usos} onChange={set('usos')} SelectProps={{ multiple: true }}>{Object.entries(USO_PECA).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}</TextField>
                            <TextField label="Países de destino (códigos de 2 letras, separados por vírgula)" value={form.destinos} onChange={set('destinos')} helperText="Fica registrado, mas não restringe quem aparece como desatualizado: a declaração não tem destino." />
                            {form.regras && (
                                <Accordion variant="outlined" data-testid="regras-da-versao">
                                    <AccordionSummary><Typography variant="subtitle2">Regras desta versão (site e app passam a seguir, sem nova publicação)</Typography></AccordionSummary>
                                    <AccordionDetails>
                                        <Stack spacing={2}>
                                            <Alert severity="info">Valem para todo mundo a partir da vigência. Quem já está aprovado só precisa refazer se a versão for <b>aplicada</b>.</Alert>
                                            <Typography variant="subtitle2">O que é obrigatório</Typography>
                                            <Box display="flex" flexWrap="wrap">
                                                {Object.entries(CAMPOS_DE_REGRA).map(([k, rotulo]) => (
                                                    <FormControlLabel key={k} sx={{ minWidth: 220 }} label={rotulo}
                                                        control={<Checkbox checked={form.regras.obrigatorios.includes(k)} inputProps={{ 'data-testid': `obrig-${k}` }}
                                                            onChange={(e) => setRegra({ obrigatorios: e.target.checked ? [...form.regras.obrigatorios, k] : form.regras.obrigatorios.filter((x) => x !== k) })} />} />
                                                ))}
                                            </Box>
                                            <Typography variant="subtitle2">Documentos aceitos como comprovante, por origem</Typography>
                                            {Object.entries(TIPO_ORIGEM).map(([o, rotulo]) => (
                                                <TextField key={o} select label={rotulo} value={form.regras.comprovantes[o]} SelectProps={{ multiple: true }} inputProps={{ 'data-testid': `comp-${o}` }}
                                                    onChange={(e) => setRegra({ comprovantes: { ...form.regras.comprovantes, [o]: e.target.value } })}>
                                                    {Object.entries(DOCS).map(([k, r]) => <MenuItem key={k} value={k}>{r}</MenuItem>)}
                                                </TextField>
                                            ))}
                                            <Typography variant="subtitle2">Tamanho máximo dos textos (só pode apertar o limite atual do sistema)</Typography>
                                            <Box display="flex" flexWrap="wrap" gap={2}>
                                                {Object.entries(LIMITES).map(([k, rotulo]) => (
                                                    <TextField key={k} size="small" type="number" label={rotulo} value={form.regras.limites[k]} sx={{ width: 150 }} inputProps={{ min: 1, 'data-testid': `lim-${k}` }}
                                                        onChange={(e) => setRegra({ limites: { ...form.regras.limites, [k]: Number(e.target.value) } })} />
                                                ))}
                                            </Box>
                                            <TextField select label="Usos que não podem ser vendidos" value={form.regras.usos_bloqueados} SelectProps={{ multiple: true }} inputProps={{ 'data-testid': 'usos-bloqueados' }}
                                                onChange={(e) => setRegra({ usos_bloqueados: e.target.value })}>
                                                {Object.entries(USOS_BLOQUEAVEIS).map(([k, r]) => <MenuItem key={k} value={k}>{r}</MenuItem>)}
                                            </TextField>
                                        </Stack>
                                    </AccordionDetails>
                                </Accordion>
                            )}
                        </Stack>
                    </DialogContent>
                )}
                <DialogActions><Button onClick={() => setForm(null)}>Cancelar</Button><Button variant="contained" onClick={salvar} disabled={salvando}>Salvar rascunho</Button></DialogActions>
            </Dialog>

            <Dialog open={!!confirmar} onClose={() => setConfirmar(null)}>
                <DialogTitle>Publicar esta versão?</DialogTitle>
                <DialogContent><Typography>Depois de publicada ela <b>não pode mais ser editada</b>. Para corrigir, será preciso criar outra versão.</Typography></DialogContent>
                <DialogActions><Button onClick={() => setConfirmar(null)}>Voltar</Button><Button variant="contained" onClick={publicar} disabled={salvando}>Publicar</Button></DialogActions>
            </Dialog>
        </Box>
    );
}
