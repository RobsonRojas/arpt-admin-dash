import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, Container, useMediaQuery, useTheme } from '@mui/material';
import { Share, Download, PictureAsPdf, Image } from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { exportToImage, exportToPdf } from '../utils/exportCertificate';

export const CertificateView = () => {
    const [searchParams] = useSearchParams();
    const [data, setData] = useState(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        const d = searchParams.get('d');
        if (d) {
            try {
                // Decode base64 (Unicode safe)
                const json = decodeURIComponent(escape(atob(d)));
                setData(JSON.parse(json));
            } catch (e) {
                console.error("Invalid certificate data", e);
            }
        }
    }, [searchParams]);

    useEffect(() => {
        const dl = searchParams.get('dl');
        if (dl && data) {
            const timer = setTimeout(() => {
                if (dl === 'pdf') {
                    handleDownloadPdf();
                } else if (dl === 'img') {
                    handleDownloadImage();
                }
            }, 1000); // Allow fonts and images to load
            return () => clearTimeout(timer);
        }
    }, [data, searchParams]);

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

    const handleDownloadPdf = async () => {
        await exportToPdf('certificate-content', `Certificado_ARPT_${data.sponsorName.replace(/ /g, '_')}.pdf`);
    };

    const handleDownloadImage = async () => {
        await exportToImage('certificate-content', `Certificado_ARPT_${data.sponsorName.replace(/ /g, '_')}.png`);
    };

    if (!data) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <Typography>Carregando certificado...</Typography>
            </Box>
        );
    }

    // Helper for colors
    const TYPE_COLORS = {
        Bronze: '#cd7f32',
        Prata: '#c0c0c0',
        Ouro: '#ffd700',
        Diamante: '#b9f2ff',
        Platina: '#e5e4e2'
    };

    const type = data.type || 'Ouro';
    const primaryColor = TYPE_COLORS[type] || TYPE_COLORS['Ouro'];

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: '#e0e0e0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: { xs: 2, md: 4 },
                fontFamily: "'Playfair Display', serif",
            }}
        >
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Great+Vibes&display=swap');
                `}
            </style>

            <Paper
                id="certificate-content"
                elevation={12}
                sx={{
                    position: 'relative',
                    maxWidth: 1123,
                    width: '100%',
                    aspectRatio: '1123 / 794', // Proporção A4 Paisagem
                    bgcolor: '#fffcf5', // Cream paper color
                    color: '#2c3e50',
                    backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)),
                        url("https://www.transparenttextures.com/patterns/cream-paper.png")
                    `,
                    boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    p: '5mm', // Margem de 5mm para a borda
                    boxSizing: 'border-box'
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        border: `double 6px #1b5e20`, // Keeping green as base
                        outline: `4px solid ${primaryColor}`, // Type color outline
                        outlineOffset: '-12px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        p: { xs: 3, md: 6 },
                        boxSizing: 'border-box'
                    }}
                >
                    {/* Decorative corners */}
                    <Box sx={{ position: 'absolute', top: 18, left: 18, width: 40, height: 40, borderTop: `4px solid ${primaryColor}`, borderLeft: `4px solid ${primaryColor}` }} />
                    <Box sx={{ position: 'absolute', top: 18, right: 18, width: 40, height: 40, borderTop: `4px solid ${primaryColor}`, borderRight: `4px solid ${primaryColor}` }} />
                    <Box sx={{ position: 'absolute', bottom: 18, left: 18, width: 40, height: 40, borderBottom: `4px solid ${primaryColor}`, borderLeft: `4px solid ${primaryColor}` }} />
                    <Box sx={{ position: 'absolute', bottom: 18, right: 18, width: 40, height: 40, borderBottom: `4px solid ${primaryColor}`, borderRight: `4px solid ${primaryColor}` }} />

                <Box mb={2}>
                    <img src="/arpt-logo-new.png" alt="ARPT Logo" style={{ height: isMobile ? 60 : 100, opacity: 0.9 }} />
                </Box>

                <Typography
                    variant="h3"
                    gutterBottom
                    sx={{
                        color: '#1b5e20',
                        fontWeight: 700,
                        fontFamily: "'Cinzel', serif",
                        letterSpacing: '0.1em',
                        fontSize: { xs: '1.5rem', md: '3rem' },
                        mb: 2,
                        textTransform: 'uppercase',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                    }}
                >
                    Certificado de Patrocínio
                </Typography>

                <Typography
                    variant="h6"
                    sx={{
                        my: 2,
                        color: '#546e7a',
                        fontFamily: "'Playfair Display', serif",
                        fontStyle: 'italic',
                        fontSize: { xs: '1rem', md: '1.25rem' }
                    }}
                >
                    Este certificado é orgulhosamente concedido a
                </Typography>

                <Typography
                    variant="h2"
                    component="div"
                    sx={{
                        my: 2,
                        color: '#2e7d32',
                        fontFamily: "'Great Vibes', cursive",
                        fontSize: { xs: '2.5rem', md: '4.5rem' },
                        lineHeight: 1.2
                    }}
                >
                    {data.sponsorName}
                </Typography>

                <Typography
                    variant="h6"
                    sx={{
                        my: 2,
                        color: '#546e7a',
                        fontFamily: "'Playfair Display', serif",
                        fontSize: { xs: '1rem', md: '1.25rem' },
                        maxWidth: '80%',
                        mx: 'auto'
                    }}
                >
                    em reconhecimento ao seu inestimável patrocínio e apoio ao projeto de manejo sustentável e preservação
                </Typography>

                <Box sx={{ my: 2, borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', py: 2, width: '80%', mx: 'auto' }}>
                    <Typography
                        variant="h4"
                        sx={{
                            fontFamily: "'Cinzel', serif",
                            color: '#1b5e20',
                            fontWeight: 600,
                            fontSize: { xs: '1.2rem', md: '2rem' }
                        }}
                    >
                        {data.projectName}
                    </Typography>
                </Box>

                <Box
                    display="flex"
                    flexDirection={{ xs: 'column-reverse', md: 'row' }}
                    justifyContent="space-between"
                    alignItems="center"
                    mt={4}
                    px={{ xs: 2, md: 8 }}
                    gap={4}
                >
                    <Box textAlign="center" flex={1}>
                        <Typography
                            variant="body1"
                            sx={{
                                borderTop: '2px solid #555',
                                pt: 1,
                                width: 200,
                                margin: '0 auto',
                                fontFamily: "'Cinzel', serif",
                                fontWeight: 700
                            }}
                        >
                            Diretoria ARPT
                        </Typography>
                        <Typography variant="caption" display="block" color="textSecondary" mt={0.5}>Assinatura Autorizada</Typography>
                    </Box>

                    <Box display="flex" flexDirection="column" alignItems="center" flex={1}>
                        <Box sx={{ p: 1, bgcolor: '#fff', border: '1px solid #ddd' }}>
                            <QRCodeSVG value={window.location.href} size={isMobile ? 80 : 100} fgColor="#1b5e20" />
                        </Box>
                        <Typography variant="caption" sx={{ mt: 1, color: '#1b5e20', fontWeight: 'bold', fontFamily: "'Cinzel', serif" }}>
                            VERIFICAR AUTENTICIDADE
                        </Typography>
                        <Typography variant="caption" display="block">
                            {new Date(data.date).toLocaleDateString()}
                        </Typography>
                    </Box>
                </Box>

                {data.blockchainLink && (
                    <Box mt={2}>
                        <Button
                            variant="outlined"
                            href={data.blockchainLink}
                            target="_blank"
                            sx={{
                                color: '#1b5e20',
                                borderColor: '#1b5e20',
                                fontFamily: "'Cinzel', serif",
                                fontSize: '0.8rem',
                                '&:hover': {
                                    bgcolor: '#e8f5e9',
                                    borderColor: '#003300'
                                }
                            }}
                        >
                            Ver Registro em Blockchain
                        </Button>
                    </Box>
                )}

                <Box mt={3}>
                    <Typography variant="caption" sx={{ color: '#888', fontStyle: 'italic' }}>
                        "Preservando a Amazônia para as futuras gerações."
                    </Typography>
                </Box>
                </Box>
            </Paper>

            <Box mt={4} display="flex" gap={2} flexWrap="wrap" justifyContent="center">
                <Button
                    variant="contained"
                    startIcon={<Share />}
                    onClick={handleShare}
                    sx={{
                        bgcolor: '#1b5e20',
                        color: 'white',
                        fontFamily: "'Cinzel', serif",
                        px: 3,
                        '&:hover': { bgcolor: '#003300' }
                    }}
                >
                    Compartilhar
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<PictureAsPdf />}
                    onClick={handleDownloadPdf}
                    sx={{
                        color: '#1b5e20',
                        borderColor: '#1b5e20',
                        fontFamily: "'Cinzel', serif",
                        px: 3,
                        '&:hover': { bgcolor: '#e8f5e9', borderColor: '#003300' }
                    }}
                >
                    PDF
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<Image />}
                    onClick={handleDownloadImage}
                    sx={{
                        color: '#1b5e20',
                        borderColor: '#1b5e20',
                        fontFamily: "'Cinzel', serif",
                        px: 3,
                        '&:hover': { bgcolor: '#e8f5e9', borderColor: '#003300' }
                    }}
                >
                    Imagem
                </Button>
            </Box>
        </Box>
    );
};
