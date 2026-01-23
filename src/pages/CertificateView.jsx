
import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { Share, Download } from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

export const CertificateView = () => {
    const [searchParams] = useSearchParams();
    const [data, setData] = useState(null);

    useEffect(() => {
        const d = searchParams.get('d');
        if (d) {
            try {
                // Decode base64
                const json = atob(d);
                setData(JSON.parse(json));
            } catch (e) {
                console.error("Invalid certificate data", e);
            }
        }
    }, [searchParams]);

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Certificado de Patrocínio - ARPT',
                    text: `Confira meu certificado de patrocínio para o projeto ${data?.projectName}!`,
                    url: window.location.href,
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copiado para a área de transferência!");
        }
    };

    if (!data) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <Typography>Carregando certificado...</Typography>
            </Box>
        );
    }

    const projectUrl = `https://arpt.site/projetos/${encodeURIComponent(data.projectName)}`;


    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: '#f5f5f5',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2
            }}
        >
            <Paper
                elevation={6}
                sx={{
                    p: 6,
                    maxWidth: 800,
                    width: '100%',
                    textAlign: 'center',
                    borderRadius: 4,
                    bgcolor: '#fff',
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.95), rgba(255,255,255,0.95)), url("https://img.freepik.com/free-vector/subtle-prism-background_1055-1681.jpg")',
                    backgroundSize: 'cover'
                }}
            >
                <img src="/logo.png" alt="ARPT Logo" style={{ height: 80, marginBottom: 20 }} />

                <Typography variant="h3" gutterBottom sx={{ color: '#2e7d32', fontWeight: 700, fontFamily: 'serif' }}>
                    CERTIFICADO DE PATROCÍNIO
                </Typography>

                <Typography variant="h6" sx={{ my: 4, color: '#555' }}>
                    A Associação de Reflorestamento e Preservação certifica que
                </Typography>

                <Typography variant="h4" sx={{ my: 2, fontWeight: 'bold', color: '#1b5e20' }}>
                    {data.sponsorName}
                </Typography>

                <Typography variant="h6" sx={{ my: 4, color: '#555' }}>
                    é um patrocinador oficial do projeto de manejo sustentável
                </Typography>

                <Typography variant="h5" sx={{ mb: 6, fontStyle: 'italic' }}>
                    "{data.projectName}"
                </Typography>

                <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="center" alignItems="center" gap={4} mb={6}>
                    <Box textAlign="left">
                        <Typography variant="body2" color="textSecondary">Data de Emissão</Typography>
                        <Typography variant="body1" fontWeight="bold">
                            {new Date(data.date).toLocaleDateString()}
                        </Typography>
                    </Box>
                    <Box component={Paper} elevation={3} p={1} bgcolor="white">
                        <QRCodeSVG value={projectUrl} size={120} />
                        <Typography variant="caption" display="block" align="center" mt={1} fontSize={10}>
                            Verificar Autenticidade
                        </Typography>
                    </Box>
                </Box>

                <Typography variant="caption" display="block" color="textSecondary" sx={{ mb: 4 }}>
                    Juntos estamos preservando a Amazônia para as futuras gerações.
                </Typography>

                <Box display="flex" justifyContent="center" gap={2}>
                    <Button
                        variant="contained"
                        startIcon={<Share />}
                        onClick={handleShare}
                        sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
                    >
                        Compartilhar
                    </Button>
                </Box>
            </Paper>
            <Typography variant="caption" sx={{ mt: 4, color: '#888' }}>
                ARPT - Sistema de Gestão Ambiental
            </Typography>
        </Box>
    );
};
