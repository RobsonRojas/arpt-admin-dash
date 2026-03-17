import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, CircularProgress, TableContainer,
    Table, TableHead, TableRow, TableCell, TableBody, Paper, Divider,
    Grid, Card, CardContent, Chip
} from '@mui/material';
import { ContentCopy, PictureAsPdf, Description, Nature, People, Gavel } from '@mui/icons-material';
import { api } from '../../services/api';

export const CarbonReportDialog = ({ open, onClose, project }) => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && project) {
            setLoading(true);
            api.get(`/manejos/${project.id}/carbon-report`)
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
RELATÓRIO DE ESTOQUE DE CARBONO E ESG
Projeto: ${reportData.project.name}
Localização: ${reportData.project.location}
Área: ${reportData.project.area}

METODOLOGIAS DE CARBONO (ESTIMATIVAS)
1. IPCC GPG: ${(reportData.summary.methodologies.ipcc.totalCarbonTon || 0).toFixed(2)} tC (${(reportData.summary.methodologies.ipcc.totalCO2Eq || 0).toFixed(2)} tCO2eq)
2. Chave et al. (2014): ${(reportData.summary.methodologies.chave.totalCarbonTon || 0).toFixed(2)} tC (${(reportData.summary.methodologies.chave.totalCO2Eq || 0).toFixed(2)} tCO2eq)
3. Higuchi et al. (1998): ${(reportData.summary.methodologies.higuchi.totalCarbonTon || 0).toFixed(2)} tC (${(reportData.summary.methodologies.higuchi.totalCO2Eq || 0).toFixed(2)} tCO2eq)

MÉDIA DE CARBONO FIXADO: ${(reportData.summary.averageCarbonTon || 0).toFixed(2)} tC

MÉTRICAS ESG
- Ambiental: Índice de Biodiversidade ${(reportData.summary.esgMetrics.biodiversityIndex || 0).toFixed(2)}
- Social: ${reportData.summary.esgMetrics.socialImpact}
- Governança: ${reportData.summary.esgMetrics.governance}

Total de Árvores Inventariadas: ${reportData.summary.totalTrees}
        `.trim();
        navigator.clipboard.writeText(text);
        alert("Relatório copiado!");
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
                Relatório de Carbono e ESG
            </DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box p={4} textAlign="center"><CircularProgress /></Box>
                ) : reportData ? (
                    <Box>
                        <Box mb={3}>
                            <Typography variant="h5" color="primary">{reportData.project.name}</Typography>
                            <Typography color="textSecondary">{reportData.project.location} | {reportData.project.area}</Typography>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="h6" gutterBottom>Estoque de Carbono por Metodologia</Typography>
                        <Grid container spacing={2} sx={{ mb: 4 }}>
                            {Object.entries(reportData.summary.methodologies).map(([key, m]) => (
                                <Grid item xs={12} md={4} key={key}>
                                    <Card variant="outlined" sx={{ height: '100%', borderColor: 'success.main' }}>
                                        <CardContent>
                                            <Typography variant="subtitle2" color="success.main">{m.name}</Typography>
                                            <Typography variant="h4" sx={{ my: 1 }}>{(m.totalCarbonTon || 0).toFixed(2)} <Typography component="span" variant="body2">tC</Typography></Typography>
                                            <Typography variant="body2" color="textSecondary">{(m.totalCO2Eq || 0).toFixed(2)} tCO2eq</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>

                        <Typography variant="h6" gutterBottom>Impacto ESG</Typography>
                        <Grid container spacing={2} sx={{ mb: 4 }}>
                            <Grid item xs={12} md={4}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Nature color="success" />
                                    <Box>
                                        <Typography variant="subtitle2">Ambiental</Typography>
                                        <Typography variant="body2">Biodiversidade: {(reportData.summary.esgMetrics.biodiversityIndex || 0).toFixed(2)}</Typography>
                                    </Box>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <People color="info" />
                                    <Box>
                                        <Typography variant="subtitle2">Social</Typography>
                                        <Typography variant="body2">{reportData.summary.esgMetrics.socialImpact}</Typography>
                                    </Box>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Gavel color="warning" />
                                    <Box>
                                        <Typography variant="subtitle2">Governança</Typography>
                                        <Typography variant="body2">{reportData.summary.esgMetrics.governance}</Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>

                        <Typography variant="h6" gutterBottom>Inventário de Árvores (Amostra)</Typography>
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                        <TableCell>Nº</TableCell>
                                        <TableCell>Espécie</TableCell>
                                        <TableCell align="right">DAP (cm)</TableCell>
                                        <TableCell align="right">Alt (m)</TableCell>
                                        <TableCell align="right">Vol (m³)</TableCell>
                                        <TableCell align="right">Carbono (tC)*</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {reportData.trees.slice(0, 50).map((tree) => (
                                        <TableRow key={tree.id}>
                                            <TableCell>{tree.number}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{tree.popularName}</Typography>
                                                <Typography variant="caption" color="textSecondary"><i>{tree.specieName}</i></Typography>
                                            </TableCell>
                                            <TableCell align="right">{(tree.dap || 0).toFixed(2)}</TableCell>
                                            <TableCell align="right">{(tree.height || 0).toFixed(2)}</TableCell>
                                            <TableCell align="right">{(tree.volume || 0).toFixed(3)}</TableCell>
                                            <TableCell align="right">{(tree.carbon?.chave || 0).toFixed(4)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {reportData.trees.length > 50 && (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">
                                                <Typography variant="caption">E mais {reportData.trees.length - 50} árvores...</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                            * Carbono estimado pela média das metodologias. CO2eq = Carbono * 3.67.
                        </Typography>
                    </Box>
                ) : (
                    <Typography color="error" align="center">Erro ao carregar dados do relatório.</Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Fechar</Button>
                <Button variant="outlined" onClick={() => {
                    const link = `https://arpt.site/carbon-report/${reportData.project.slug || reportData.project.id}`;
                    navigator.clipboard.writeText(link);
                    alert("Link copiado!");
                }} disabled={!reportData}>Link Público</Button>
                <Button variant="outlined" startIcon={<ContentCopy />} onClick={handleCopy} disabled={!reportData}>Copiar Resumo</Button>
            </DialogActions>
        </Dialog>
    );
};
