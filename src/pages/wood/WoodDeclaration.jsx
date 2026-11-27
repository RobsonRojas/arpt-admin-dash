import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, Divider, Link, Paper, Stack, TextField, Typography } from '@mui/material';
import { api } from '../../services/api';
import { BASE, TIPO_ORIGEM, formatarData, linhasDeProveniencia, linkMapa, mensagemErro, naoDigitados } from '../../utils/wood';
import { DocumentDecision } from './DocumentDecision';
import { FileViewer } from './FileViewer';
import { ReasonDialog } from './ReasonDialog';
import { EspeciePicker } from './EspeciePicker';

const Historico = ({ itens }) => (
    <Box>
        {itens.length === 0 && <Typography variant="body2" color="text.secondary">Sem histórico.</Typography>}
        {itens.map((h) => (
            <Typography key={h.id} variant="body2">{formatarData(h.created_at)} · {h.entidade} · {h.acao} · {h.papel ?? ''}{h.motivo ? ` — ${h.motivo}` : ''}</Typography>
        ))}
    </Box>
);

/** Detalhe da declaração: dados, ponto exato, espécies, documentos/fotos, pendências, histórico e decisões. */
/** Como cada dado foi preenchido (digitado, copiado, padrão do perfil, lido ou sugerido por IA, lote) e se o produtor confirmou. */
export function OrigemDosDados({ proveniencia }) {
    const linhas = linhasDeProveniencia(proveniencia);
    if (linhas.length === 0) return null;
    const extras = naoDigitados(proveniencia);
    const semConfirmar = extras.filter((l) => !l.confirmado);
    return (
        <Paper sx={{ p: 2, mb: 2 }} data-testid="origem-dos-dados">
            <Typography variant="subtitle1">Origem dos dados</Typography>
            {extras.length > 0 && (
                <Alert severity={semConfirmar.length ? 'warning' : 'info'} sx={{ my: 1 }}>
                    {extras.length} campo(s) não foram digitados pelo produtor (copiados, de perfil, lidos ou sugeridos por IA, ou em lote).
                    {semConfirmar.length ? ` ${semConfirmar.length} ainda NÃO foram confirmados por ele.` : ' Todos foram confirmados por ele.'} Confira estes com atenção.
                </Alert>
            )}
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {linhas.map((l) => (
                    <Chip key={l.campo} size="small" variant={l.fonte === 'digitado' ? 'outlined' : 'filled'} color={l.cor} data-testid={`fonte-${l.campo}`}
                        label={`${l.rotulo}: ${l.texto}${l.fonte !== 'digitado' ? (l.confirmado ? ' · confirmado' : ' · a confirmar') : ''}`} />
                ))}
            </Stack>
        </Paper>
    );
}

export function WoodDeclaration({ id, onBack }) {
    const [d, setD] = useState(null);
    const [erro, setErro] = useState(null);
    const [aviso, setAviso] = useState(null);
    const [escolhidas, setEscolhidas] = useState([]);
    const [justificativa, setJustificativa] = useState('');
    const [motivoDe, setMotivoDe] = useState(null);
    const [foto, setFoto] = useState(null);
    const [historicoProduto, setHistoricoProduto] = useState(null);
    const [erroDialogo, setErroDialogo] = useState(null);

    const carregar = useCallback(async () => {
        try { setD((await api.get(`${BASE}/declarations/${id}`)).data); } catch (e) { setErro(mensagemErro(e, 'Não foi possível abrir a declaração.')); }
    }, [id]);
    useEffect(() => { carregar(); }, [carregar]);

    const decl = d?.declaracao;
    const aConfirmar = !!decl && (decl.especie_a_confirmar || d.especies.some((e) => !e.especie_id));
    if (erro && !d) return <Alert severity="error">{erro}</Alert>;
    if (!d) return <CircularProgress size={22} />;

    const enviar = async (corpo, sucesso) => {
        setErro(null); setErroDialogo(null);
        try { await api.post(`${BASE}/declarations/${id}/${corpo.reabrir ? 'reopen' : 'decision'}`, corpo.reabrir ? { motivo: corpo.motivo } : corpo); setAviso(sucesso); setMotivoDe(null); await carregar(); }
        catch (e) { const m = mensagemErro(e); if (motivoDe) setErroDialogo(m); else setErro(m); }
    };
    const aprovar = () => {
        setAviso(null);
        if (aConfirmar && escolhidas.length === 0) { setErro('Escolha a espécie antes de aprovar: o produtor marcou "não tenho certeza".'); return; }
        if (decl.sem_comprovante_fiscal && justificativa.trim().length < 10) { setErro('Reaproveitamento sem comprovante fiscal exige a justificativa da aprovação (mínimo 10 caracteres).'); return; }
        enviar({ decisao: 'APROVAR', ...(aConfirmar ? { especie_ids: escolhidas.map((e) => e.id) } : {}), ...(decl.sem_comprovante_fiscal ? { justificativa: justificativa.trim() } : {}) }, 'Declaração aprovada. O produtor foi avisado.');
    };
    const verHistorico = async () => {
        try { setHistoricoProduto((await api.get(`${BASE}/products/${decl.produto_id}/audit`)).data.historico); } catch (e) { setErro(mensagemErro(e)); }
    };
    const emAnalise = decl.situacao === 'EM_ANALISE';
    const ehFoto = (v) => String(v.mime ?? '').startsWith('image/');

    return (
        <Box>
            <Button onClick={onBack} sx={{ mb: 1 }}>Voltar à fila</Button>
            <Typography variant="h6">{d.produto?.nome} <Chip size="small" label={decl.situacao} sx={{ ml: 1 }} /></Typography>
            <Stack direction="row" spacing={1} sx={{ my: 1 }}>
                {decl.sem_comprovante_fiscal && <Chip color="warning" label="Sem comprovante fiscal" />}
                {aConfirmar && <Chip color="error" label="Espécie a confirmar" />}
            </Stack>
            {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
            {aviso && <Alert severity="success" sx={{ mb: 2 }}>{aviso}</Alert>}

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1">Declaração</Typography>
                <Typography variant="body2">Produtor: {[d.produtor?.first_name, d.produtor?.last_name].filter(Boolean).join(' ')} {d.produtor?.email ? `(${d.produtor.email})` : ''}</Typography>
                <Typography variant="body2">Origem: {TIPO_ORIGEM[decl.tipo_origem] ?? '—'}</Typography>
                <Typography variant="body2">Local: {[decl.comunidade, decl.municipio].filter(Boolean).join(', ') || '—'} {decl.descricao_local ? `· ${decl.descricao_local}` : ''}</Typography>
                {decl.ponto_lat != null && decl.ponto_lng != null && (
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="body2">Ponto exato: {decl.ponto_lat}, {decl.ponto_lng} · <Link href={linkMapa(decl.ponto_lat, decl.ponto_lng)} target="_blank" rel="noreferrer">abrir no mapa</Link></Typography>
                        <Box component="iframe" title="Mapa do ponto" loading="lazy" sx={{ width: '100%', maxWidth: 480, height: 200, border: 0, mt: 1 }}
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${decl.ponto_lng - 0.01}%2C${decl.ponto_lat - 0.01}%2C${decl.ponto_lng + 0.01}%2C${decl.ponto_lat + 0.01}&marker=${decl.ponto_lat}%2C${decl.ponto_lng}`} />
                    </Box>
                )}
                <Typography variant="body2" sx={{ mt: 1 }}>Uso: {decl.uso_previsto ?? '—'} · Acabamento: {decl.acabamento ?? '—'} · Embalagem: {decl.embalagem ?? '—'}</Typography>
                {decl.historia_pt && <Typography variant="body2" sx={{ mt: 1 }}>História: {decl.historia_pt}</Typography>}
                {decl.motivo && <Typography variant="body2" color="text.secondary">Último motivo: {decl.motivo}</Typography>}
            </Paper>

            <OrigemDosDados proveniencia={decl.proveniencia} />

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1">Espécies</Typography>
                {d.especies.map((e, i) => (
                    <Typography key={i} variant="body2">{e.especie_id ? <>{e.nome} (<i>{e.nome_cientifico}</i>) · {e.situacao}</> : 'Não sei a espécie (a confirmar)'}</Typography>
                ))}
                {aConfirmar && emAnalise && (
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="error">Defina a espécie antes de aprovar:</Typography>
                        <EspeciePicker multiple semBloqueadas label="Espécie" value={escolhidas} onChange={setEscolhidas} sx={{ mt: 1, maxWidth: 520 }} />
                    </Box>
                )}
            </Paper>

            {(d.arvores ?? []).length > 0 && (
                <Paper sx={{ p: 2, mb: 2 }} data-testid="arvores-da-declaracao">
                    <Typography variant="subtitle1">Árvores ligadas ({d.arvores.length})</Typography>
                    {d.arvores.map((a) => (
                        <Box key={a.id} sx={{ mb: 1 }}>
                            <Typography variant="body2">
                                <b>Árvore nº {a.numero}</b> · {a.especie}{a.nome_cientifico ? <> (<i>{a.nome_cientifico}</i>)</> : null} · projeto {a.projeto ?? '—'}
                                {a.classificacao ? ` · ${a.classificacao}` : ''}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Licença: {a.licenca?.licenciado ? `nº ${a.licenca.numero ?? '—'}, validade ${a.licenca.validade ?? 'sem validade'}` : 'projeto sem o selo Licenciado'}
                                {a.ponto ? <> · ponto exato: {a.ponto.lat}, {a.ponto.lng} · <Link href={linkMapa(a.ponto.lat, a.ponto.lng)} target="_blank" rel="noreferrer">abrir no mapa</Link></> : ''}
                            </Typography>
                            {(a.inelegivel || a.excluida) && (
                                <Chip size="small" color="warning" sx={{ mt: 0.5 }} data-testid={`arvore-inelegivel-${a.id}`}
                                    label={a.excluida ? 'Árvore excluída do inventário' : 'Deixou de ser elegível (licença vencida ou tipo incompatível)'} />
                            )}
                        </Box>
                    ))}
                </Paper>
            )}

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1">Documentos e fotos</Typography>
                {d.documentos.length === 0 && <Typography variant="body2" color="text.secondary">Nenhum documento vinculado.</Typography>}
                {d.documentos.map((doc) => (
                    <Box key={doc.id} sx={{ mb: 1.5 }}>
                        <Typography variant="body2"><b>{doc.tipo}</b>{doc.numero ? ` nº ${doc.numero}` : ''} · {doc.orgao_emissor ?? ''} · validade {doc.validade ? String(doc.validade).slice(0, 10) : '—'} · <Chip size="small" label={doc.situacao} /></Typography>
                        {Object.entries(doc.proveniencia ?? {}).some(([, m]) => m?.fonte === 'ia_leitura') && (
                            <Chip size="small" color="warning" data-testid={`doc-ia-${doc.id}`} sx={{ mr: 1 }}
                                label={`Lido por IA e confirmado pelo produtor: ${Object.entries(doc.proveniencia).filter(([, m]) => m?.fonte === 'ia_leitura').map(([k]) => ({ numero: 'número', orgao_emissor: 'órgão', emitido_em: 'emissão', validade: 'validade' }[k] ?? k)).join(', ')}`} />
                        )}
                        {doc.versoes.map((v) => (
                            <Stack key={v.versao} direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                <Typography variant="caption">v{v.versao} · {v.situacao} · {ehFoto(v) ? 'foto' : v.mime}{v.motivo ? ` · ${v.motivo}` : ''}</Typography>
                                <Button size="small" onClick={() => setFoto({ id: doc.id, versao: v.versao })}>Ver</Button>
                                {v.situacao === 'EM_ANALISE' && <DocumentDecision documentoId={doc.id} versao={v.versao} onDone={carregar} />}
                            </Stack>
                        ))}
                    </Box>
                ))}
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1">Pendências</Typography>
                {d.pendencias.length === 0 ? <Typography variant="body2" color="success.main">Nenhuma pendência.</Typography> : d.pendencias.map((p) => <Typography key={p.campo} variant="body2">• {p.mensagem}</Typography>)}
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1">Histórico da declaração</Typography>
                <Historico itens={d.historico} />
                <Button size="small" onClick={verHistorico} sx={{ mt: 1 }}>Auditoria completa do produto</Button>
                {historicoProduto && <Box sx={{ mt: 1 }}><Divider sx={{ mb: 1 }} /><Historico itens={historicoProduto} /></Box>}
            </Paper>

            {emAnalise && (
                <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1">Decisão</Typography>
                    {decl.sem_comprovante_fiscal && (
                        <TextField fullWidth multiline minRows={2} sx={{ my: 1 }} label="Justificativa da aprovação (reaproveitamento sem comprovante fiscal)" value={justificativa} onChange={(e) => setJustificativa(e.target.value)} inputProps={{ maxLength: 1000 }} />
                    )}
                    <Stack direction="row" spacing={1}>
                        <Button variant="contained" color="success" onClick={aprovar}>Aprovar</Button>
                        <Button color="warning" onClick={() => { setErroDialogo(null); setMotivoDe('PEDIR_CORRECAO'); }}>Pedir correção</Button>
                        <Button color="error" onClick={() => { setErroDialogo(null); setMotivoDe('RECUSAR'); }}>Recusar</Button>
                    </Stack>
                </Paper>
            )}
            {decl.situacao === 'APROVADA' && (
                <Button color="warning" variant="outlined" onClick={() => { setErroDialogo(null); setMotivoDe('REABRIR'); }}>Reabrir (pedir nova comprovação)</Button>
            )}

            {foto && <FileViewer documentoId={foto.id} versao={foto.versao} onClose={() => setFoto(null)} />}
            {motivoDe && (
                <ReasonDialog erro={erroDialogo} onClose={() => setMotivoDe(null)}
                    titulo={{ RECUSAR: 'Recusar declaração', PEDIR_CORRECAO: 'Pedir correção', REABRIR: 'Reabrir declaração aprovada' }[motivoDe]}
                    descricao={motivoDe === 'REABRIR' ? 'O produto sai de venda até a nova decisão e o produtor é avisado com este motivo.' : 'O motivo é obrigatório e vai para o produtor.'}
                    confirmar={motivoDe === 'REABRIR' ? 'Reabrir' : motivoDe === 'RECUSAR' ? 'Recusar' : 'Pedir correção'}
                    onConfirm={(m) => (motivoDe === 'REABRIR' ? enviar({ reabrir: true, motivo: m }, 'Declaração reaberta; o produto saiu de venda.') : enviar({ decisao: motivoDe, motivo: m }, 'Decisão registrada. O produtor foi avisado.'))} />
            )}
        </Box>
    );
}
