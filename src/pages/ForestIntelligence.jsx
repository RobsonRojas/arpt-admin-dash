import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Paper, Card, CardContent, CardHeader,
    Button, CircularProgress, Chip, Divider, IconButton, Tooltip
} from '@mui/material';
import {
    TrendingUp, Forest, MonetizationOn, Psychology, Refresh, Info
} from '@mui/icons-material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

// Mock Data Generators
const generateYieldData = () => [
    { name: '2024', previsto: 4000, realizado: 2400 },
    { name: '2025', previsto: 3000, realizado: 1398 },
    { name: '2026', previsto: 2000, realizado: 9800 },
    { name: '2027', previsto: 2780, realizado: 3908 },
    { name: '2028', previsto: 1890, realizado: 4800 },
];

const generateSpeciesData = () => [
    { name: 'Mogno Africano', value: 400 },
    { name: 'Eucalipto', value: 300 },
    { name: 'Teca', value: 300 },
    { name: 'Ipê', value: 200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const ForestIntelligence = () => {
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    useEffect(() => {
        // Simulate AI processing time
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, [lastUpdated]);

    const handleRefresh = () => {
        setLoading(true);
        setLastUpdated(new Date());
    };

    const AnalysisCard = ({ title, icon, color, children, insight }) => (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardHeader
                avatar={<Box sx={{ color: color }}>{icon}</Box>}
                title={<Typography variant="h6">{title}</Typography>}
                action={
                    <Tooltip title="Insight gerado por IA">
                        <IconButton aria-label="info">
                            <Info fontSize="small" />
                        </IconButton>
                    </Tooltip>
                }
            />
            <Divider />
            <CardContent sx={{ flexGrow: 1 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                        <CircularProgress size={24} />
                        <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
                            Gerando análise...
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {children}
                        <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f9ff', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Psychology sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                                <Typography variant="subtitle2" color="primary">
                                    Insight Estratégico
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                {insight}
                            </Typography>
                        </Box>
                    </>
                )}
            </CardContent>
        </Card>
    );

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        Inteligência Florestal
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Análises preditivas e insights estratégicos impulsionados por IA
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={handleRefresh}
                >
                    Atualizar Análises
                </Button>
            </Box>

            <Grid container spacing={3}>
                {/* Yield Prediction */}
                <Grid item xs={12} md={6} lg={4}>
                    <AnalysisCard
                        title="Predição de Colheita"
                        icon={<TrendingUp />}
                        color="success.main"
                        insight="A taxa de crescimento atual indica um superávit de 15% na produção para 2026, sugerindo um momento ideal para contratos futuros."
                    >
                        <Box sx={{ height: 250, width: '100%' }}>
                            <ResponsiveContainer>
                                <BarChart data={generateYieldData()}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <RechartsTooltip />
                                    <Legend />
                                    <Bar dataKey="previsto" fill="#8884d8" name="Previsto (m³)" />
                                    <Bar dataKey="realizado" fill="#82ca9d" name="Realizado (m³)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </AnalysisCard>
                </Grid>

                {/* Species Distribution */}
                <Grid item xs={12} md={6} lg={4}>
                    <AnalysisCard
                        title="Distribuição de Espécies"
                        icon={<Forest />}
                        color="primary.main"
                        insight="A diversificação está equilibrada, mas recomenda-se aumentar a área de Teca para maximizar o retorno a longo prazo devido à alta demanda."
                    >
                        <Box sx={{ height: 250, width: '100%' }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={generateSpeciesData()}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {generateSpeciesData().map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    </AnalysisCard>
                </Grid>

                {/* Economic Valuation */}
                <Grid item xs={12} md={6} lg={4}>
                    <AnalysisCard
                        title="Valoração Econômica"
                        icon={<MonetizationOn />}
                        color="warning.main"
                        insight="O valor estimado do ativo biológico cresceu 8.5% no último trimestre, impulsionado pela valorização do Mogno no mercado internacional."
                    >
                        <Box sx={{ height: 250, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                            <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
                                R$ 12.5M
                            </Typography>
                            <Typography variant="body1" color="text.secondary" gutterBottom>
                                Valor Total Estimado
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mt: 2 }}>
                                <Chip label="+8.5% Trimestre" color="success" size="small" />
                                <Chip label="+22% Anual" color="success" size="small" />
                            </Box>
                        </Box>
                    </AnalysisCard>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ForestIntelligence;
