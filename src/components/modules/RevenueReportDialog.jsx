import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, CircularProgress, LinearProgress, TableContainer,
    Table, TableHead, TableRow, TableCell, TableBody, Paper, Divider
} from '@mui/material';
import { ContentCopy, PictureAsPdf } from '@mui/icons-material';
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
        if (printWindow) {
            printWindow.document.write('<html><head><title>Relatório de Receitas</title>');
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
                printWindow.print();
            }, 500);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Relatório de Receitas</DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box p={4} textAlign="center"><CircularProgress /></Box>
                ) : reportData ? (
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
                ) : (
                    <Typography color="error" align="center">
                        {loading ? "" : "Não foi possível carregar os dados ou o projeto não possui vendas."}
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Fechar</Button>
                <Button variant="outlined" startIcon={<ContentCopy />} onClick={handleCopy} disabled={!reportData}>Copiar Texto</Button>
                <Button variant="contained" startIcon={<PictureAsPdf />} onClick={handlePrint} disabled={!reportData}>Imprimir / PDF</Button>
            </DialogActions>
        </Dialog>
    );
};
