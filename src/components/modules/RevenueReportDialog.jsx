import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, CircularProgress, LinearProgress, TableContainer,
    Table, TableHead, TableRow, TableCell, TableBody, Paper, Divider,
    IconButton, Grid
} from '@mui/material';
import { ContentCopy, PictureAsPdf, Description } from '@mui/icons-material';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { PreCadForm } from './PreCadForm';
import { Edit, Add, Email } from '@mui/icons-material';

/**
 * A reusable dialog component to display project revenue reports.
 * 
 * @param {boolean} open - Whether the dialog is open.
 * @param {function} onClose - Function to close the dialog.
 * @param {object} project - The project object to generate report for.
 */
export const RevenueReportDialog = ({ open, onClose, project }) => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [openPreCadForm, setOpenPreCadForm] = useState(false);
    const [selectedPreCad, setSelectedPreCad] = useState(null);

    const { user } = useAuth();

    useEffect(() => {
        fetchReport();
    }, [open, project, user]);

    const fetchReport = async () => {
        if (open && project && user) {
            setLoading(true);
            try {
                const token = await user.getIdToken(true);
                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };
                const res = await api.get(`/manejos/${project.id}/revenue-report`, config);
                setReportData(res.data);
            } catch (err) {
                console.error(">>> [RevenueReportDialog] Error fetching report:", err);
                setReportData(null);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleResendEmail = async (saleId) => {
        if (!window.confirm("Deseja reenviar o e-mail de finalização de cadastro para este usuário?")) return;
        
        try {
            const token = await user.getIdToken(true);
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            await api.post(`/admin/pagamentos/${saleId}/resend-email`, {}, config);
            alert("E-mail de reenvio solicitado com sucesso!");
        } catch (err) {
            console.error(">>> [RevenueReportDialog] Error resending email:", err);
            alert("Erro ao reenviar e-mail. Verifique os logs.");
        }
    };

    const handleCopy = () => {
        if (!reportData) return;
        const totalProdutos = reportData.sales.reduce((acc, s) => acc + (s.quantity * (s.qtdProducts || 0)), 0);
        const totalDoacoes = reportData.sales.filter(s => Number(s.rewardPrice) === 0).reduce((acc, s) => acc + s.quantity, 0);

        const text = `
RELATÓRIO DE RECEITAS
Projeto: ${reportData.project.name}
Município: ${reportData.project.location}

METAS
Alvo da Captação: R$ ${parseFloat(reportData.project.target_fundraising || 0).toFixed(2)}
Receita Realizada: R$ ${parseFloat(reportData.project.realized_revenue || 0).toFixed(2)}
Progresso: ${((reportData.project.realized_revenue / reportData.project.target_fundraising) * 100).toFixed(1)}%

RESUMO DE ITENS
Produtos Vendidos: ${totalProdutos}
Doações Recebidas: ${totalDoacoes}

VENDAS REALIZADAS
${reportData.sales.map(s => `${new Date(s.date).toLocaleDateString()} - ${Number(s.rewardPrice) === 0 ? "Doação" : s.product} - ${s.quantity} un x ${s.qtdProducts || 0} itens/un = ${s.quantity * (s.qtdProducts || 0)} Itens - R$ ${parseFloat(s.value).toFixed(2)}`).join('\n')}
        `.trim();
        navigator.clipboard.writeText(text);
        alert("Relatório copiado para a área de transferência!");
    };

    const handlePrint = () => {
        const printWindow = window.open('', '', 'height=600,width=800');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Relatório de Receitas</title>');
            const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(s => s.outerHTML).join('');
            printWindow.document.write(styles);
            printWindow.document.write(`
                <style>
                    @media print {
                        body { -webkit-print-color-adjust: exact; color-adjust: exact; print-color-adjust: exact; }
                        .MuiTableCell-root { border: 1px solid #e0e0e0 !important; }
                        * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; }
                    }
                </style>
            `);
            printWindow.document.write('</head><body >');
            const content = document.getElementById('revenue-report-content');
            if (content) {
                printWindow.document.write(content.innerHTML);
            } else {
                printWindow.document.write('Conteúdo não encontrado');
            }
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            // Wait for content to load mostly for images if any, but text is instant
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
            }, 1000);
        }
    };

    const handleExportODT = () => {
        if (!reportData) return;
        const totalProdutos = reportData.sales.reduce((acc, s) => acc + (s.quantity * (s.qtdProducts || 0)), 0);
        const totalDoacoes = reportData.sales.filter(s => Number(s.rewardPrice) === 0).reduce((acc, s) => acc + s.quantity, 0);

        const textLines = [
            "RELATÓRIO DE RECEITAS",
            `Projeto: ${reportData.project.name}`,
            `Município: ${reportData.project.municipio}`,
            `Status: ${reportData.project.desc_status}`,
            `Meta de Captação: R$ ${Number(reportData.project.target_fundraising).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            `Valor Realizado: R$ ${Number(reportData.project.realized_revenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            `Progresso: ${Number((reportData.project.realized_revenue / reportData.project.target_fundraising) * 100).toFixed(1)}%`,
            "",
            "DETALHAMENTO DE RECEITAS",
            ...reportData.revenues.map(r => `- ${r.description}: R$ ${Number(r.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${new Date(r.date).toLocaleDateString()})`),
            "",
            "RESUMO DE ITENS",
            `Produtos Vendidos: ${totalProdutos}`,
            `Doações Recebidas: ${totalDoacoes}`,
            "",
            "VENDAS REALIZADAS",
            ...reportData.sales.map(s => `${new Date(s.date).toLocaleDateString('pt-BR')} - ${Number(s.rewardPrice) === 0 ? "Doação" : s.product} - ${s.quantity} un x ${s.qtdProducts || 0} itens/un = ${s.quantity * (s.qtdProducts || 0)} Itens - R$ ${parseFloat(s.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
        ];

        const xmlLines = textLines.map(line => `<text:p>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text:p>`).join('\n   ');

        const fodt = `<?xml version="1.0" encoding="UTF-8"?>\n<office:document xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" office:version="1.2" office:mimetype="application/vnd.oasis.opendocument.text">\n <office:body>\n  <office:text>\n   ${xmlLines}\n  </office:text>\n </office:body>\n</office:document>`;

        const blob = new Blob([fodt], { type: 'application/vnd.oasis.opendocument.text' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Relatorio_${reportData.project.name.replace(/\s+/g, '_')}.odt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <>
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="md" 
            fullWidth 
            fullScreen={{ xs: true, sm: false }}
        >
            <DialogTitle sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between', 
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 2,
                p: { xs: 2, sm: 3 }
            }}>
                Relatório de Receitas
                <Button 
                    variant="contained" 
                    color="primary" 
                    size="medium" 
                    startIcon={<Add />}
                    fullWidth={{ xs: true, sm: false }}
                    onClick={() => { setSelectedPreCad(null); setOpenPreCadForm(true); }}
                >
                    Nova Venda Manual
                </Button>
            </DialogTitle>
            <DialogContent dividers sx={{ p: { xs: 1, sm: 3 } }}>
                {loading ? (
                    <Box p={4} textAlign="center"><CircularProgress /></Box>
                ) : reportData ? (
                    <Box id="revenue-report-content">
                        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="flex-start" gap={2}>
                            <Box>
                                <Typography variant="h5" gutterBottom>{reportData.project.name}</Typography>
                                <Typography color="textSecondary" gutterBottom>{reportData.project.location}</Typography>
                            </Box>
                            <Typography variant="body2" color="textSecondary" textAlign={{ xs: 'left', sm: 'right' }}>
                                Gerado em:<br />
                                <strong>{new Date().toLocaleString('pt-BR')}</strong>
                            </Typography>
                        </Box>

                        <Box my={3} p={2} bgcolor="#f5f5f5" borderRadius={1}>
                            <Typography variant="subtitle2">RESUMO FINANCEIRO</Typography>
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2"><strong>Alvo da Captação:</strong> R$ {parseFloat(reportData.project.target_fundraising || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2"><strong>Receita Realizada:</strong> R$ {parseFloat(reportData.project.realized_revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2"><strong>Produtos Vendidos:</strong> {reportData.sales.reduce((acc, s) => acc + (s.quantity * (s.qtdProducts || 0)), 0)}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2"><strong>Doações Recebidas:</strong> {reportData.sales.filter(s => Number(s.rewardPrice) === 0).reduce((acc, s) => acc + s.quantity, 0)}</Typography>
                                </Grid>
                            </Grid>
                            <Box mt={2}>
                                <Typography variant="caption">Progresso da Meta</Typography>
                                <LinearProgress variant="determinate" value={Math.min((reportData.project.realized_revenue / reportData.project.target_fundraising) * 100, 100)} sx={{ height: 10, borderRadius: 5 }} />
                                <Typography variant="caption" align="right" display="block">{Number((reportData.project.realized_revenue / reportData.project.target_fundraising) * 100).toFixed(1)}%</Typography>
                            </Box>
                        </Box>

                        <Typography variant="h6" gutterBottom mt={3}>Vendas Realizadas</Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ minWidth: 100 }}>Data</TableCell>
                                        <TableCell>Produto</TableCell>
                                        <TableCell align="center">Qtd</TableCell>
                                        <TableCell align="center" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Total Itens</TableCell>
                                        <TableCell align="right">Valor Est.</TableCell>
                                        <TableCell align="right">Ação</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {reportData.sales.map((sale, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{new Date(sale.date).toLocaleDateString('pt-BR')}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ 
                                                    maxWidth: { xs: 120, sm: 'none' },
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {Number(sale.rewardPrice) === 0 ? "Doação" : sale.product}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">{sale.quantity}</TableCell>
                                            <TableCell align="center" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                                {sale.quantity * (sale.qtdProducts || 0)}
                                            </TableCell>
                                            <TableCell align="right">R$ {parseFloat(sale.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                            <TableCell align="right">
                                                <Box display="flex" justifyContent="flex-end" gap={0.5}>
                                                    <IconButton 
                                                        size="small" 
                                                        title="Reenviar E-mail de Cadastro" 
                                                        color="primary"
                                                        onClick={() => handleResendEmail(sale.id || sale.purchase_id)}
                                                    >
                                                        <Email fontSize="small" />
                                                    </IconButton>
                                                    <IconButton 
                                                        size="small" 
                                                        title="Editar" 
                                                        onClick={() => { setSelectedPreCad(sale); setOpenPreCadForm(true); }}
                                                    >
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {reportData.sales.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center">Nenhuma venda registrada.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                ) : (
                    <Typography color="error" align="center">
                        {loading ? "" : "Não foi possível carregar os dados ou o projeto não possui vendas."}
                    </Typography>
                )}
            </DialogContent>
            <DialogActions sx={{ 
                p: { xs: 2, sm: 3 }, 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 1
            }}>
                <Box sx={{ flexGrow: 1, display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
                    <Button fullWidth variant="outlined" startIcon={<ContentCopy />} onClick={handleCopy} disabled={!reportData}>Copiar</Button>
                    <Button fullWidth variant="outlined" startIcon={<Description />} onClick={handleExportODT} disabled={!reportData}>Exportar</Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
                    <Button fullWidth variant="contained" startIcon={<PictureAsPdf />} onClick={handlePrint} disabled={!reportData}>PDF</Button>
                    <Button onClick={onClose}>Fechar</Button>
                </Box>
            </DialogActions>
        </Dialog>

        <PreCadForm
            open={openPreCadForm}
            onClose={() => setOpenPreCadForm(false)}
            project={project}
            purchase={selectedPreCad}
            onSave={fetchReport}
        />
        </>
    );
};
