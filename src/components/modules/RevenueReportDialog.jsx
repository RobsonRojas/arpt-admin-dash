import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, CircularProgress, LinearProgress, TableContainer,
    Table, TableHead, TableRow, TableCell, TableBody, Paper, Divider
} from '@mui/material';
import { ContentCopy, PictureAsPdf, Description } from '@mui/icons-material';
import { api } from '../../services/api';

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

    useEffect(() => {
        if (open && project) {
            setLoading(true);
            api.get(`/manejos/${project.id}/revenue-report`)
                .then(res => setReportData(res.data))
                .catch(err => {
                    console.error(err);
                    setReportData(null);
                })
                .finally(() => setLoading(false));
        }
    }, [open, project]);

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
            `Município: ${reportData.project.location}`,
            "",
            "METAS",
            `Alvo da Captação: R$ ${parseFloat(reportData.project.target_fundraising || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            `Receita Realizada: R$ ${parseFloat(reportData.project.realized_revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            `Progresso: ${((reportData.project.realized_revenue / reportData.project.target_fundraising) * 100).toFixed(1)}%`,
            "",
            "RESUMO DE ITENS",
            `Produtos Vendidos: ${totalProdutos}`,
            `Doações Recebidas: ${totalDoacoes}`,
            "",
            "VENDAS REALIZADAS",
            ...reportData.sales.map(s => `${new Date(s.date).toLocaleDateString('pt-BR')} - ${Number(s.rewardPrice) === 0 ? "Doação" : s.product} - ${s.quantity} un x ${s.qtdProducts || 0} itens/un = ${s.quantity * (s.qtdProducts || 0)} Itens - R$ ${parseFloat(s.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
        ];

        const xmlLines = textLines.map(line => `<text:p>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text:p>`).join('\\n   ');

        const fodt = `<?xml version="1.0" encoding="UTF-8"?>\\n<office:document xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" office:version="1.2" office:mimetype="application/vnd.oasis.opendocument.text">\\n <office:body>\\n  <office:text>\\n   ${xmlLines}\\n  </office:text>\\n </office:body>\\n</office:document>`;

        const blob = new Blob([fodt], { type: 'application/vnd.oasis.opendocument.text' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Relatorio_${reportData.project.name.replace(/\\s+/g, '_')}.odt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Relatório de Receitas</DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box p={4} textAlign="center"><CircularProgress /></Box>
                ) : reportData ? (
                    <Box id="revenue-report-content">
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                                <Typography variant="h5" gutterBottom>{reportData.project.name}</Typography>
                                <Typography color="textSecondary" gutterBottom>{reportData.project.location}</Typography>
                            </Box>
                            <Typography variant="body2" color="textSecondary" textAlign="right">
                                Gerado em:<br />
                                <strong>{new Date().toLocaleString('pt-BR')}</strong>
                            </Typography>
                        </Box>

                        <Box my={3} p={2} bgcolor="#f5f5f5" borderRadius={1}>
                            <Typography variant="subtitle2">RESUMO FINANCEIRO</Typography>
                            <Box display="flex" justifyContent="space-between" mt={1}>
                                <Typography><strong>Alvo da Captação:</strong> R$ {parseFloat(reportData.project.target_fundraising || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Typography>
                                <Typography><strong>Receita Realizada:</strong> R$ {parseFloat(reportData.project.realized_revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" mt={1}>
                                <Typography><strong>Produtos Vendidos:</strong> {reportData.sales.reduce((acc, s) => acc + (s.quantity * (s.qtdProducts || 0)), 0)}</Typography>
                                <Typography><strong>Doações Recebidas:</strong> {reportData.sales.filter(s => Number(s.rewardPrice) === 0).reduce((acc, s) => acc + s.quantity, 0)}</Typography>
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
                                        <TableCell>Produto / Recompensa</TableCell>
                                        <TableCell align="center">Qtd</TableCell>
                                        <TableCell align="center">Itens/Und</TableCell>
                                        <TableCell align="center">Total Itens</TableCell>
                                        <TableCell align="right">Valor Est.</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {reportData.sales.map((sale, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{new Date(sale.date).toLocaleDateString('pt-BR')}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {Number(sale.rewardPrice) === 0 ? "Doação" : sale.product}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">{sale.quantity}</TableCell>
                                            <TableCell align="center">{sale.qtdProducts || 0}</TableCell>
                                            <TableCell align="center">{sale.quantity * (sale.qtdProducts || 0)}</TableCell>
                                            <TableCell align="right">R$ {parseFloat(sale.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                        </TableRow>
                                    ))}
                                    {reportData.sales.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">Nenhuma venda registrada.</TableCell>
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
            <DialogActions>
                <Button onClick={onClose}>Fechar</Button>
                <Button variant="outlined" startIcon={<ContentCopy />} onClick={handleCopy} disabled={!reportData}>Copiar</Button>
                <Button variant="outlined" startIcon={<Description />} onClick={handleExportODT} disabled={!reportData}>Exportar ODT</Button>
                <Button variant="contained" startIcon={<PictureAsPdf />} onClick={handlePrint} disabled={!reportData}>Imprimir / PDF</Button>
            </DialogActions>
        </Dialog>
    );
};
