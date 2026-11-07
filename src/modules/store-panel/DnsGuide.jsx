import React, { useState } from 'react';
import { Alert, Box, IconButton, MenuItem, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import { ContentCopy } from '@mui/icons-material';
import { useLang } from './LangContext';
import { usePanel } from './PanelContext';
import { DNS_PROVIDERS, nomeRelativoDoDominio, providerById } from './dnsProviders';

/** Copia um texto. Sem área de transferência (contexto sem HTTPS, permissão negada), devolve `false` e o campo continua selecionável. */
async function copiar(texto) {
  try { await navigator.clipboard.writeText(texto); return true; } catch { return false; }
}

/** Texto selecionável com o botão de copiar ao lado. */
function CampoCopiavel({ valor, rotulo, testId }) {
  const { t } = useLang();
  const { notify } = usePanel();
  const onCopy = async () => {
    const ok = await copiar(valor);
    notify(ok ? 'success' : 'warning', t(ok ? 'dnsg_copied' : 'dnsg_copy_failed'));
  };
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Typography component="code" variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', userSelect: 'all' }} data-testid={testId}>{valor}</Typography>
      <Tooltip title={t('dnsg_copy')}>
        <IconButton size="small" aria-label={t('dnsg_copy_aria', { campo: rotulo })} onClick={onCopy} data-testid={testId ? `${testId}-copiar` : undefined}><ContentCopy fontSize="inherit" /></IconButton>
      </Tooltip>
    </Box>
  );
}

const fmtData = (iso) => { try { return new Date(iso).toLocaleDateString(); } catch { return iso; } };

/** Orientações do provedor escolhido: o que vale para ele e o que fazer onde a tela varia. */
function NotasDoProvedor({ provedor, raiz }) {
  const { t } = useLang();
  const nota = `dnsg_prov_${provedor.id}_nota`;
  const tem = (k) => t(k) !== k;
  return (
    <Box sx={{ display: 'grid', gap: 0.75 }} data-testid="dns-provider-notes">
      <Typography variant="body2">{tem(nota) ? t(nota) : t('dnsg_prov_generico_nota')}</Typography>
      {provedor.proxy && <Alert severity="warning" data-testid="dns-cloudflare-proxy">{t('dnsg_cf_proxy')}</Alert>}
      <Typography variant="body2" color="text.secondary">{t(provedor.txtAspas ? 'dnsg_quotes_yes' : 'dnsg_quotes_no')}</Typography>
      {raiz && <Typography variant="body2" color="text.secondary">{t(provedor.nomeRaiz === '@' ? 'dnsg_root_name_at' : provedor.nomeRaiz === 'vazio' ? 'dnsg_root_name_blank' : 'dnsg_root_name_varies')}</Typography>}
      <Typography variant="caption" color="text.secondary">
        {provedor.conferido ? t('dnsg_checked', { data: fmtData(provedor.conferido) }) : t('dnsg_unverified')}
      </Typography>
    </Box>
  );
}

/**
 * Guia de DNS de um domínio próprio ainda pendente (store-domain-dns-guide): os registros prontos para copiar, o nome do TXT nas duas
 * formas, a orientação por provedor e o que fazer na raiz. Aceita a resposta de uma API antiga (sem `zona`, `raiz`...) sem quebrar.
 */
export default function DnsGuide({ x }) {
  const { t } = useLang();
  const [provedorId, setProvedorId] = useState('');
  const ins = x.instrucoes ?? {};
  const txt = ins.txt ?? {};
  const ap = ins.apontamento ?? {};
  const zona = ins.zona ?? '';
  const raiz = ins.raiz === true;
  const destino = ap.cname ?? '';
  const ips = Array.isArray(ap.ips) ? ap.ips : [];
  const semSuporteRaiz = raiz && ap.recomendado === null;
  const provedor = provedorId ? providerById(provedorId) : null;
  const relCname = nomeRelativoDoDominio(x.dominio, zona);

  const cabecalho = (
    <TableHead><TableRow>
      <TableCell>{t('dnsg_col_type')}</TableCell><TableCell>{t('dnsg_col_name')}</TableCell><TableCell>{t('dnsg_col_value')}</TableCell>
    </TableRow></TableHead>
  );

  return (
    <Paper variant="outlined" sx={{ p: 2, display: 'grid', gap: 1.5 }} data-testid="dns-instructions">
      <Typography variant="subtitle2">{t('dnsg_title')}</Typography>
      <Typography variant="body2">{t('dnsg_intro')}</Typography>

      <Typography variant="subtitle2">{t('dnsg_step_txt')}</Typography>
      <Table size="small" data-testid="dns-table-txt">
        {cabecalho}
        <TableBody><TableRow>
          <TableCell>{txt.tipo ?? 'TXT'}</TableCell>
          <TableCell>
            <Typography variant="caption" color="text.secondary">{t('dnsg_name_full')}</Typography>
            <CampoCopiavel valor={txt.nome ?? ''} rotulo={t('dnsg_name_full')} testId="dns-txt-nome" />
            {txt.nome_relativo && (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>{t('dnsg_name_rel', { zona })}</Typography>
                <CampoCopiavel valor={txt.nome_relativo} rotulo={t('dnsg_name_rel', { zona })} testId="dns-txt-nome-relativo" />
              </>
            )}
          </TableCell>
          <TableCell><CampoCopiavel valor={txt.valor ?? ''} rotulo={t('dnsg_col_value')} testId="dns-txt-valor" /></TableCell>
        </TableRow></TableBody>
      </Table>
      {txt.nome_relativo && <Typography variant="caption" color="text.secondary" data-testid="dns-name-help">{t('dnsg_name_help', { zona })}</Typography>}

      <Typography variant="subtitle2">{t('dnsg_step_point')}</Typography>
      {semSuporteRaiz ? (
        <Alert severity="warning" data-testid="dns-root-unsupported">{t('dnsg_root_unsupported', { zona })}</Alert>
      ) : raiz ? (
        <>
          <Typography variant="body2" data-testid="dns-point-a">{t('dnsg_point_a', { zona, destino })}</Typography>
          <Table size="small" data-testid="dns-table-point">
            {cabecalho}
            <TableBody><TableRow>
              <TableCell>A</TableCell>
              <TableCell><CampoCopiavel valor="@" rotulo={t('dnsg_col_name')} testId="dns-point-nome" /></TableCell>
              <TableCell>{ips.map((ip) => <CampoCopiavel key={ip} valor={ip} rotulo={t('dnsg_point_a_ips')} testId="dns-point-ip" />)}</TableCell>
            </TableRow></TableBody>
          </Table>
        </>
      ) : (
        <>
          <Typography variant="body2" data-testid="dns-point-cname">{t('dnsg_point_cname')}</Typography>
          <Table size="small" data-testid="dns-table-point">
            {cabecalho}
            <TableBody><TableRow>
              <TableCell>CNAME</TableCell>
              <TableCell>
                <Typography variant="caption" color="text.secondary">{t('dnsg_name_full')}</Typography>
                <CampoCopiavel valor={x.dominio} rotulo={t('dnsg_name_full')} testId="dns-point-nome" />
                {relCname && (
                  <>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>{t('dnsg_name_rel', { zona })}</Typography>
                    <CampoCopiavel valor={relCname} rotulo={t('dnsg_name_rel', { zona })} testId="dns-point-nome-relativo" />
                  </>
                )}
              </TableCell>
              <TableCell>{destino ? <CampoCopiavel valor={destino} rotulo={t('dnsg_col_value')} testId="dns-point-destino" /> : null}</TableCell>
            </TableRow></TableBody>
          </Table>
        </>
      )}
      <Typography variant="caption" color="text.secondary">{t('dnsg_ttl')}</Typography>

      <TextField select size="small" label={t('dnsg_provider')} value={provedorId} onChange={(e) => setProvedorId(e.target.value)} sx={{ maxWidth: 360 }} inputProps={{ 'data-testid': 'dns-provider-select' }} SelectProps={{ displayEmpty: true }} InputLabelProps={{ shrink: true }}>
        <MenuItem value=""><em>{t('dnsg_provider_none')}</em></MenuItem>
        {DNS_PROVIDERS.map((p) => <MenuItem key={p.id} value={p.id} data-testid={`dns-provider-${p.id}`}>{t(`dnsg_prov_${p.id}`)}</MenuItem>)}
      </TextField>
      {provedor && <NotasDoProvedor provedor={provedor} raiz={raiz} />}

      <Typography variant="caption" color="text.secondary">{t('dnsg_propagation')}</Typography>
      {x.expira_em && <Typography variant="caption" color="text.secondary" data-testid="dns-expires">{t('dnsg_expires', { data: fmtData(x.expira_em) })}</Typography>}
    </Paper>
  );
}

/**
 * O que falta depois de "Verificar", com a causa mais provável de cada item. Consulta inconclusiva não acusa o dono. `faltando` vem da
 * API como `['TXT', 'APONTAMENTO']`. Sem nenhum dos dois, vale também o aviso de propagação.
 */
export function DiagnosticoDaVerificacao({ resultado, instrucoes }) {
  const { t } = useLang();
  if (!resultado || resultado.verificado !== false) return null;
  const destino = instrucoes?.apontamento?.cname ?? '';
  const faltando = Array.isArray(resultado.faltando) ? resultado.faltando : [];
  return (
    <Alert severity="warning" data-testid="verify-pending" sx={{ display: 'grid', gap: 0.5 }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>{t('dnsg_diag_title')}</Typography>
      {resultado.inconclusivo && <Typography variant="body2" data-testid="diag-inconclusive">{t('dnsg_diag_inconclusive')}</Typography>}
      {!resultado.inconclusivo && faltando.includes('TXT') && <Typography variant="body2" data-testid="diag-txt">{t('dnsg_diag_txt')}</Typography>}
      {!resultado.inconclusivo && faltando.includes('APONTAMENTO') && <Typography variant="body2" data-testid="diag-point">{t('dnsg_diag_point', { destino })}</Typography>}
      {!resultado.inconclusivo && faltando.includes('TXT') && faltando.includes('APONTAMENTO') && <Typography variant="body2" data-testid="diag-propagation">{t('dnsg_propagation')}</Typography>}
    </Alert>
  );
}
