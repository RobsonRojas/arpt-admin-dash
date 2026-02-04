import React, { useState, useMemo } from 'react';
import { Box, Paper, Toolbar, Typography, TextField, MenuItem, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Drawer, Divider, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, LinearProgress, Tabs, Tab } from '@mui/material';
import { Search, Add, Visibility, Assessment, ContentCopy, PictureAsPdf } from '@mui/icons-material';
import { StatusChip, RiskChip } from '../common/Chips';
import MapEmbed from '../common/MapEmbed';
import { CampaignAssistant } from '../CampaignAssistant';

const ProjectsView = ({ projects, onStatusChange, onOpenCadastro }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("Todos");
    const [selectedProject, setSelectedProject] = useState(null);
    const [reportProject, setReportProject] = useState(null);
    const [tabValue, setTabValue] = useState(0);

    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                (project.descricao?.toLowerCase().includes(searchLower) || false) ||
                (project.municipio?.toLowerCase().includes(searchLower) || false);
            const matchesStatus = filterStatus === "Todos" ? true : project.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [projects, searchTerm, filterStatus]);

    return (
        <Box sx={{ animation: 'fadeIn 0.5s' }}>
            <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
                <Toolbar sx={{ pl: 0, pr: 0, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField label="Buscar projeto..." size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} /> }} sx={{ flexGrow: 1 }} />
                    <TextField select label="Status" size="small" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} sx={{ minWidth: 150 }}>
                        <MenuItem value="Todos">Todos</MenuItem>
                        <MenuItem value="Em Análise">Em Análise</MenuItem>
                        <MenuItem value="Aprovado">Aprovado</MenuItem>
                    </TextField>
                    <Button variant="contained" startIcon={<Add />} onClick={onOpenCadastro}>Novo</Button>
                </Toolbar>
            </Paper>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead><TableRow><TableCell>Projeto</TableCell><TableCell>Status</TableCell><TableCell>Custo</TableCell><TableCell align="right">Ação</TableCell></TableRow></TableHead>
                    <TableBody>
                        {filteredProjects.map(p => (
                            <TableRow key={p.id}>
                                <TableCell><Typography variant="body2" fontWeight="bold">{p.descricao}</Typography><Typography variant="caption">{p.municipio}</Typography></TableCell>
                                <TableCell><StatusChip status={p.status} /></TableCell>
                                <TableCell>R$ {p.custo_operacional}</TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => setReportProject(p)} title="Relatório de Receitas"><Assessment /></IconButton>
                                    <IconButton size="small" onClick={() => setSelectedProject(p)}><Visibility /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Drawer
                anchor="right"
                open={Boolean(selectedProject)}
                onClose={() => setSelectedProject(null)}
                PaperProps={{ sx: { width: { xs: '100%', md: 600 } } }}
            >
                {selectedProject && (
                    <Box p={3} display="flex" flexDirection="column" height="100%">
                        <Typography variant="h6">{selectedProject.descricao}</Typography>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} aria-label="project tabs">
                                <Tab label="Visão Geral" />
                                <Tab label="Estratégia" />
                            </Tabs>
                        </Box>

                        <Box flexGrow={1} p={3} overflow="auto">
                            {tabValue === 0 && (
                                <>
                                    <MapEmbed lat={-3.354} lng={-64.712} />
                                    <List>
                                        <ListItem><ListItemText primary="Proponente" secondary={selectedProject.proponente} /></ListItem>
                                        <ListItem><ListItemText primary="Área" secondary={`${selectedProject.tamanho} ${selectedProject.unidade_medida}`} /></ListItem>
                                        <ListItem><ListItemText primary="Risco Auditoria" secondary={<RiskChip level={selectedProject.auditoria.risco} />} /></ListItem>
                                    </List>
                                </>
                            )}
                            {tabValue === 1 && (
                                <CampaignAssistant project={selectedProject} />
                            )}
                        </Box>
                        <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            {selectedProject.status === 'Em Análise' && (
                                <>
                                    <Button variant="outlined" color="error" onClick={() => onStatusChange(selectedProject.id, 'Rejeitado')}>Rejeitar</Button>
                                    <Button variant="contained" color="success" onClick={() => onStatusChange(selectedProject.id, 'Aprovado')}>Aprovar</Button>
                                </>
                            )}
                        </Box>
                    </Box>
                )}
            </Drawer>

            <RevenueReportDialog
                open={!!reportProject}
                onClose={() => setReportProject(null)}
                project={reportProject}
            />
        </Box>
    );
};

const RevenueReportDialog = ({ open, onClose, project }) => {
    const [reportData, setReportData] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    // Use generic api service or fetch. Assuming 'api' is available via context or we use fetch directly for now if not passed.
    // Ideally we pass a callback, but let's try to grab simple fetch since we are in a pure component file mostly.
    // Actually, Projects.jsx likely passes handlers. But here I'll use inline fetch relative to API root for now or similar.
    // Wait, the user has 'api' likely in context. 
    // Let's check imports. No api import. I'll add `import { api } from '../../services/api';` or similar if I can.
    // But `ProjectsView` is a presentation component. I should ask `Projects.jsx` to fetch?
    // User requested changes in `Projects.jsx` too (L24). "Para cada projeto adicionar um botão..."
    // I am editing `ProjectsView.jsx` directly.

    // I'll make this dialog self-contained with axios if possible, or better, pass `onGenerateReport` prop from Projects.jsx.
    // But since I'm editing ProjectsView, let's just use fetch for simplicity or standard axios.
    // Let's assume there's an axios instance available or just use fetch('/api/...').
    // The backend is on port 4001 usually or proxied.
    // I'll use standard fetch to the backend URL (usually configured in env or context).
    // Let's rely on `useEffect` to fetch when open changes.

    React.useEffect(() => {
        if (open && project) {
            setLoading(true);
            // Assuming simplified relative path or configured proxy. 
            // In admin dashboard `api` is usually from `../../services/api`.
            // I'll stick to a simple fetch for now and assume /api proxy is set up or use hardcoded base if needed.
            // Adjust to use the standard 'api' service if we can import it.
            // Since I can't easily see 'api.js' location without search, I'll try to find it.
            // It is `src/services/api.js`.
            // I'll import it.

            import('../../services/api').then(({ default: api }) => {
                api.get(`/manejos/${project.id}/revenue-report`)
                    .then(res => setReportData(res.data))
                    .catch(err => {
                        console.error(err);
                        setReportData(null);
                        window.alert("Erro ao carregar relatório.");
                        onClose();
                    })
                    .finally(() => setLoading(false));
            });
        }
    }, [open, project]);

    const handleCopy = () => {
        if (!reportData) return;
        const text = `
RELATÓRIO DE RECEITAS
Projeto: ${reportData.project.name}
Município: ${reportData.project.location}

METAS
Alvo da Captação: R$ ${parseFloat(reportData.project.target_fundraising || 0).toFixed(2)}
Receita Realizada: R$ ${parseFloat(reportData.project.realized_revenue || 0).toFixed(2)}
Progresso: ${((reportData.project.realized_revenue / reportData.project.target_fundraising) * 100).toFixed(1)}%

VENDAS REALIZADAS
${reportData.sales.map(s => `${new Date(s.date).toLocaleDateString()} - ${s.product} - ${s.quantity}un - R$ ${parseFloat(s.value).toFixed(2)}`).join('\n')}
        `.trim();
        navigator.clipboard.writeText(text);
        alert("Relatório copiado para a área de transferência!");
    };

    const handlePrint = () => {
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Relatório de Receitas</title>');
        printWindow.document.write('</head><body >');
        printWindow.document.write(document.getElementById('revenue-report-content').innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <React.Fragment> {/* Dialog needs to be outside of Drawer or independent */}
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>Relatório de Receitas</DialogTitle>
                <DialogContent dividers>
                    {loading ? <Box p={4} textAlign="center"><CircularProgress /></Box> : reportData ? (
                        <Box id="revenue-report-content">
                            <Typography variant="h5" gutterBottom>{reportData.project.name}</Typography>
                            <Typography color="textSecondary" gutterBottom>{reportData.project.location}</Typography>

                            <Box my={3} p={2} bgcolor="#f5f5f5" borderRadius={1}>
                                <Typography variant="subtitle2">RESUMO FINANCEIRO</Typography>
                                <Box display="flex" justifyContent="space-between" mt={1}>
                                    <Typography><strong>Alvo da Captação:</strong> R$ {parseFloat(reportData.project.target_fundraising || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Typography>
                                    <Typography><strong>Receita Realizada:</strong> R$ {parseFloat(reportData.project.realized_revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Typography>
                                </Box>
                                <Box mt={1}>
                                    <Typography variant="caption">Progresso da Meta</Typography>
                                    <LinearProgress variant="determinate" value={Math.min((reportData.project.realized_revenue / reportData.project.target_fundraising) * 100, 100)} sx={{ height: 10, borderRadius: 5 }} />
                                    <Typography variant="caption" align="right" display="block">{((reportData.project.realized_revenue / reportData.project.target_fundraising) * 100).toFixed(1)}%</Typography>
                                </Box>
                            </Box>

                            <Typography variant="h6" gutterBottom mt={3}>Vendas Realizadas</Typography>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Data</TableCell>
                                            <TableCell>Produto</TableCell>
                                            <TableCell>Qtd</TableCell>
                                            <TableCell align="right">Valor Est.</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {reportData.sales.map((sale, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{new Date(sale.date).toLocaleDateString('pt-BR')}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{sale.product}</Typography>
                                                    <Typography variant="caption" color="textSecondary">{sale.email}</Typography>
                                                </TableCell>
                                                <TableCell>{sale.quantity}</TableCell>
                                                <TableCell align="right">R$ {parseFloat(sale.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                            </TableRow>
                                        ))}
                                        {reportData.sales.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} align="center">Nenhuma venda registrada.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    ) : <Typography color="error">Não foi possível carregar os dados.</Typography>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Fechar</Button>
                    <Button variant="outlined" startIcon={<ContentCopy />} onClick={handleCopy} disabled={!reportData}>Copiar Texto</Button>
                    <Button variant="contained" startIcon={<PictureAsPdf />} onClick={handlePrint} disabled={!reportData}>Imprimir / PDF</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
};

export default ProjectsView;
