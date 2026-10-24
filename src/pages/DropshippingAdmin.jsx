import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  Chip, IconButton, Tooltip, Alert, InputAdornment
} from '@mui/material';
import {
  Search, Edit, Inventory2, TrendingUp, Store, People, SwapHoriz, MailOutline, Visibility, OpenInNew
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip, Legend
} from 'recharts';
import { api } from '../services/api';
import { parseBrNumber } from '../utils/numbers';
import { rotaDetalheDropshipper } from '../utils/dropshipper';
import AnalyticsSection from '../components/dropshipping/AnalyticsSection';
import CandidaturaEmNomeCard from '../components/dropshipping/CandidaturaEmNomeCard';

const fmt = (val) =>
  Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const getStoreUrl = (store) => {
  const isLocal = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');
  if (isLocal) {
    return `http://localhost:3000/store/${store.slug}`;
  }
  if (store.custom_domain) {
    return `https://${store.custom_domain}`;
  }
  return `https://${store.slug}.arpt.site`;
};

// ─── Transfer Owner Modal ───────────────────────────────────────────────────
function TransferOwnerModal({ store, onClose, onSuccess }) {
  const [newUserId, setNewUserId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!newUserId.trim()) return alert('Informe o UID do novo dono.');
    setLoading(true);
    try {
      await api.put(`/api/v1/admin/dropshipping/stores/${store.id}/owner`, {
        new_user_id: newUserId.trim(),
      });
      alert('Dono da loja atualizado com sucesso!');
      onSuccess();
      onClose();
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        Transferir Proprietário — {store.name}
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          Esta ação transferirá o controle total da loja para outro usuário. O usuário atual perderá o acesso de dono.
        </Alert>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
          Dono atual: <strong>{store.user_id}</strong>
        </Typography>
        <TextField
          label="UID do Novo Proprietário"
          value={newUserId}
          onChange={e => setNewUserId(e.target.value)}
          fullWidth
          variant="outlined"
          placeholder="firebase_uid_do_novo_dono"
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button variant="contained" color="warning" onClick={handleSave} disabled={loading}>
          {loading ? <CircularProgress size={18} color="inherit" /> : 'Confirmar Transferência'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Catalog Allocation Modal ───────────────────────────────────────────────
function CatalogModal({ store, allProducts, onClose, onSuccess }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [precoVenda, setPrecoVenda] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  const filtered = allProducts.filter(p =>
    p.nome?.toLowerCase().includes(searchQ.toLowerCase())
  );

  const toggle = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) return alert('Selecione pelo menos um produto.');
    const preco = parseBrNumber(precoVenda, { min: 0.01, mensagemCampo: 'o preço de venda' });
    if (preco.error) return alert(preco.error);
    setLoading(true);
    try {
      const results = await Promise.allSettled(selectedIds.map((produtoId) =>
        api.post(`/api/v1/admin/dropshipping/stores/${store.id}/products`, { produto_id: produtoId, preco_venda: preco.value })
      ));
      const ok = results.filter((r) => r.status === 'fulfilled').length;
      const falhas = results
        .filter((r) => r.status === 'rejected')
        .map((r) => r.reason.response?.data?.error || r.reason.message);
      alert(`${ok} produto(s) adicionado(s) ao catálogo.` + (falhas.length ? `\nFalhas: ${falhas.join('; ')}` : ''));
      if (ok > 0) onSuccess();
      if (!falhas.length) onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        Alocação de Catálogo — {store.name}
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Pesquisar produto..."
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          sx={{ mb: 2 }}
        />
        <Box sx={{ maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {filtered.map(prod => {
            const selected = selectedIds.includes(prod.id);
            return (
              <Card
                key={prod.id}
                variant="outlined"
                onClick={() => toggle(prod.id)}
                sx={{
                  borderRadius: 2,
                  cursor: 'pointer',
                  borderColor: selected ? 'primary.main' : 'divider',
                  bgcolor: selected ? 'primary.50' : 'inherit',
                  transition: 'all 0.15s ease',
                }}
              >
                <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">{prod.nome}</Typography>
                    <Typography variant="caption" color="textSecondary">R$ {prod.preco}</Typography>
                  </Box>
                  {selected && <Chip label="Selecionado" size="small" color="primary" />}
                </CardContent>
              </Card>
            );
          })}
        </Box>
        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
          {selectedIds.length} produto(s) selecionado(s)
        </Typography>
      </DialogContent>
      <TextField
        fullWidth
        size="small"
        type="number"
        label="Preço de venda para os produtos selecionados (R$)"
        value={precoVenda}
        onChange={(e) => setPrecoVenda(e.target.value)}
        sx={{ mt: 2 }}
      />
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button variant="contained" color="success" onClick={handleSave} disabled={loading}>
          {loading ? <CircularProgress size={18} color="inherit" /> : 'Alocar Produtos'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Fee Settings Card (taxas do dropshipping, 6.2a) ─────
function FeeSettingsCard() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api.get('/api/v1/admin/dropshipping/settings')
      .then((res) => setForm({
        commissionPercent: String(res.data.commissionPercent),
        gatewayPercent: String(res.data.gatewayPercent),
        defaultMaxStores: String(res.data.defaultMaxStores),
        termsVersion: res.data.termsVersion,
      }))
      .catch(() => setMessage({ severity: 'error', text: 'Não foi possível carregar as configurações.' }));
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.put('/api/v1/admin/dropshipping/settings', {
        commissionPercent: Number(form.commissionPercent),
        gatewayPercent: Number(form.gatewayPercent),
        defaultMaxStores: Number(form.defaultMaxStores),
        termsVersion: form.termsVersion,
      });
      setMessage({
        severity: 'success',
        text: res.data.pausa_agendada
          ? 'Configurações salvas. As alocações abaixo do novo preço mínimo serão pausadas em instantes.'
          : 'Configurações salvas.',
      });
    } catch (err) {
      setMessage({ severity: 'error', text: err.response?.data?.error || err.message });
    } finally {
      setSaving(false);
    }
  };

  if (!form) return null;

  const fields = [
    ['commissionPercent', 'Comissão padrão (%)'],
    ['gatewayPercent', 'Taxa do gateway (%)'],
    ['defaultMaxStores', 'Lojas por dropshipper (padrão)'],
    ['termsVersion', 'Versão dos termos (nova versão exige novo aceite)'],
  ];

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
      <Typography variant="subtitle1" fontWeight="bold">Taxas e limites do dropshipping</Typography>
      <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
        Independente da taxa por manejo, que pertence ao financiamento coletivo. Override por loja fica na tela do dropshipper.
      </Typography>
      <Grid container spacing={2}>
        {fields.map(([key, label]) => (
          <Grid item xs={12} sm={6} md={3} key={key}>
            <TextField
              fullWidth
              size="small"
              label={label}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </Grid>
        ))}
      </Grid>
      {message && <Alert severity={message.severity} sx={{ mt: 2, borderRadius: 2 }}>{message.text}</Alert>}
      <Button variant="contained" sx={{ mt: 2, borderRadius: 2 }} onClick={save} disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar taxas'}
      </Button>
    </Paper>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export function DropshippingAdmin() {
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);
  const [totalStores, setTotalStores] = useState(0);
  const [analytics, setAnalytics] = useState({ totals: null, trend: [] });
  const [allProducts, setAllProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const [transferStore, setTransferStore] = useState(null);
  const [catalogStore, setCatalogStore] = useState(null);


  const fetchAll = async () => {
    setLoading(true);
    try {
      const [storesRes, analyticsRes, prodRes] = await Promise.all([
        api.get('/api/v1/admin/dropshipping/stores', { params: { page, pageSize: 20, q: search } }),
        // Métricas de vendas: indisponíveis não devem impedir a listagem de lojas.
        api.get('/api/v1/admin/dropshipping/analytics/performance').catch(() => ({ data: null })),
        api.get('/produtos'),
      ]);
      // A API devolve nome/owner_user_id; a tela usa name/user_id.
      setStores((storesRes.data.data || []).map(s => ({ ...s, name: s.nome, user_id: s.owner_user_id })));
      setTotalStores(storesRes.data.total || 0);
      setAnalytics({ totals: analyticsRes.data?.totais || null, trend: [] });
      setAllProducts((prodRes.data || []).filter(p => p.is_ativo));
    } catch (err) {
      console.error('Erro ao carregar dados admin dropshipping', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [page, search]);

  const totals = analytics.totals || {};

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Page Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Administração de Dropshipping</Typography>
          <Typography variant="body2" color="textSecondary">
            Gerencie lojas, transfira propriedades, aloque catálogos e monitore receitas da plataforma.
          </Typography>
        </Box>
      </Box>

      <AnalyticsSection />

      <CandidaturaEmNomeCard />

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : (
        <>
          <FeeSettingsCard />

          {/* KPI Row */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: 'Total de Lojas', value: totalStores, color: '#1e293b', icon: <Store sx={{ color: '#4ade80' }} />, accent: 'rgba(74,222,128,0.15)' },
              { label: 'Receita das Lojas', value: fmt(totals.receita), color: '#1e293b', icon: <TrendingUp sx={{ color: '#fbbf24' }} />, accent: 'rgba(251,191,36,0.15)' },
              { label: 'Pedidos', value: Number(totals.pedidos || 0).toLocaleString('pt-BR'), color: '#1e293b', icon: <Inventory2 sx={{ color: '#a78bfa' }} />, accent: 'rgba(167,139,250,0.15)' },
              { label: 'Ticket Médio', value: fmt(totals.ticket_medio), color: '#1e293b', icon: <People sx={{ color: '#38bdf8' }} />, accent: 'rgba(56,189,248,0.15)' },
            ].map((kpi, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Card variant="outlined" sx={{ bgcolor: kpi.color, color: '#fff', borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ bgcolor: kpi.accent, p: 1.5, borderRadius: 2 }}>{kpi.icon}</Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>{kpi.label}</Typography>
                      <Typography variant="h5" fontWeight={800}>{kpi.value}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Revenue Splits AreaChart — Task 2.5 */}
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Evolução de Receitas por Split (Plataforma / Dropshipper / Produtor)
            </Typography>
            {analytics.trend.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>Sem dados de vendas no período selecionado.</Alert>
            ) : (
              <Box sx={{ height: { xs: 240, md: 320 } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradPlatform" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradDropshipper" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradProducer" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                    <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '0.75rem' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '0.75rem' }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: 8, fontSize: '0.8rem' }}
                      formatter={(value, name) => [fmt(value), name === 'platform' ? 'Plataforma' : name === 'dropshipper' ? 'Dropshipper' : 'Produtor']}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.8rem' }} formatter={name => name === 'platform' ? 'Plataforma' : name === 'dropshipper' ? 'Dropshipper' : 'Produtor'} />
                    <Area type="monotone" dataKey="platform" stroke="#fbbf24" fill="url(#gradPlatform)" strokeWidth={2} />
                    <Area type="monotone" dataKey="dropshipper" stroke="#38bdf8" fill="url(#gradDropshipper)" strokeWidth={2} />
                    <Area type="monotone" dataKey="producer" stroke="#4ade80" fill="url(#gradProducer)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>

          {/* Stores Table — Tasks 2.2, 2.3, 2.4 */}
          <Paper variant="outlined" sx={{ borderRadius: 3 }}>
            <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ flexGrow: 1 }}>
                Lojas Cadastradas ({totalStores})
              </Typography>
              <TextField
                size="small"
                placeholder="Buscar loja..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
                sx={{ minWidth: 220 }}
              />
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Nome da Loja</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Slug / URL</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Domínio</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Dono (UID)</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">Produtos</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">Criado em</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                        <Typography color="textSecondary" variant="body2">Nenhuma loja encontrada.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : stores.map(store => (
                    <TableRow key={store.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{store.name}</TableCell>
                      <TableCell>
                        <Chip label={store.slug} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }} />
                      </TableCell>
                      <TableCell>
                        {store.custom_domain ? (
                          <Chip label={store.custom_domain} size="small" color={store.domain_status === 'verified' ? 'success' : 'warning'} />
                        ) : (
                          <Typography variant="caption" color="textSecondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                          {store.user_id?.substring(0, 16)}...
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={store.product_count || 0} size="small" color={store.product_count > 0 ? 'success' : 'default'} />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="caption">
                          {new Date(store.created_at).toLocaleDateString('pt-BR')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Ver Detalhes">
                          <IconButton size="small" color="primary" disabled={!rotaDetalheDropshipper(store)} onClick={() => navigate(rotaDetalheDropshipper(store))}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Transferir Proprietário">
                          <IconButton size="small" color="warning" onClick={() => setTransferStore(store)}>
                            <SwapHoriz fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Alocar Produtos ao Catálogo">
                          <IconButton size="small" color="success" onClick={() => setCatalogStore(store)}>
                            <Inventory2 fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reenviar Convite / Credenciais">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={async () => {
                              if (!window.confirm(`Tem certeza que deseja reenviar o convite para ${store.name}?`)) return;
                              try {
                                await api.post(`/api/v1/admin/dropshipping/stores/${store.id}/resend-invite`);
                                alert('Convite reenviado com sucesso!');
                              } catch (err) {
                                alert('Erro: ' + (err.response?.data?.error || err.message));
                              }
                            }}
                          >
                            <MailOutline fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Abrir Loja">
                          <IconButton
                            size="small"
                            color="secondary"
                            component="a"
                            href={getStoreUrl(store)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <OpenInNew fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>

                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {/* Pagination controls */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', p: 2, gap: 1 }}>
              <Button size="small" variant="outlined" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
              <Typography variant="caption" color="textSecondary">Página {page}</Typography>
              <Button size="small" variant="outlined" disabled={stores.length < 20} onClick={() => setPage(p => p + 1)}>Próxima</Button>
            </Box>
          </Paper>
        </>
      )}

      {/* Modals */}
      {transferStore && (
        <TransferOwnerModal
          store={transferStore}
          onClose={() => setTransferStore(null)}
          onSuccess={fetchAll}
        />
      )}
      {catalogStore && (
        <CatalogModal
          store={catalogStore}
          allProducts={allProducts}
          onClose={() => setCatalogStore(null)}
          onSuccess={fetchAll}
        />
      )}
    </Box>

  );
}
