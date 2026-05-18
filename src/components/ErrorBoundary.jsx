import React, { Component } from 'react';
import { Box, Typography, Button, Paper, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { ErrorOutline, Refresh, ContentCopy, ExpandMore } from '@mui/icons-material';

export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null, expanded: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        
        // Log the render error to local storage error logs
        try {
            const savedErrors = localStorage.getItem('arpt_error_logs');
            const errors = savedErrors ? JSON.parse(savedErrors) : [];
            const newError = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                message: error.message || String(error),
                stack: error.stack || errorInfo.componentStack || null,
                context: 'React Rendering',
                details: null,
                url: window.location.href
            };
            localStorage.setItem('arpt_error_logs', JSON.stringify([newError, ...errors].slice(0, 100)));
        } catch (e) {
            console.error("Failed to log render error to localStorage", e);
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    handleCopyError = () => {
        const diagnosticText = `Error: ${this.state.error?.toString()}\n\nStack:\n${this.state.error?.stack || ''}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack || ''}`;
        navigator.clipboard.writeText(diagnosticText);
        alert('Detalhes do erro copiados para a área de transferência!');
    };

    render() {
        if (this.state.hasError) {
            return (
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    minHeight="75vh"
                    p={4}
                    textAlign="center"
                >
                    <ErrorOutline sx={{ fontSize: 72, color: 'error.main', mb: 2 }} />
                    
                    <Typography variant="h4" fontWeight={600} color="text.primary" mb={2}>
                        Ops! Algo deu errado
                    </Typography>
                    
                    <Typography variant="body1" color="text.secondary" mb={4} maxWidth={540}>
                        Ocorreu um erro de renderização inesperado nesta página. A falha foi registrada nos logs do sistema para análise da equipe técnica.
                    </Typography>

                    <Box display="flex" gap={2} mb={4}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<Refresh />}
                            onClick={this.handleReset}
                            sx={{ px: 3, py: 1, borderRadius: 2 }}
                        >
                            Recarregar Página
                        </Button>
                        <Button
                            variant="outlined"
                            color="inherit"
                            startIcon={<ContentCopy />}
                            onClick={this.handleCopyError}
                            sx={{ px: 3, py: 1, borderRadius: 2 }}
                        >
                            Copiar Diagnóstico
                        </Button>
                    </Box>

                    {this.state.error && (
                        <Paper 
                            variant="outlined" 
                            sx={{ 
                                width: '100%', 
                                maxWidth: 640, 
                                borderRadius: 3, 
                                overflow: 'hidden', 
                                border: '1px solid', 
                                borderColor: 'error.light' 
                            }}
                        >
                            <Accordion 
                                expanded={this.state.expanded} 
                                onChange={() => this.setState(prev => ({ expanded: !prev.expanded }))}
                                elevation={0}
                                sx={{ bgcolor: '#fafafa' }}
                            >
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography variant="subtitle2" color="error.dark" fontWeight={600}>
                                        Detalhes Técnicos do Erro
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ textAlign: 'left', bgcolor: 'white', borderTop: '1px solid #eee', p: 3 }}>
                                    <Typography variant="subtitle2" color="text.primary" fontWeight={700} mb={1}>
                                        {this.state.error.toString()}
                                    </Typography>
                                    <pre style={{ 
                                        margin: 0, 
                                        padding: '12px', 
                                        background: '#f5f5f5', 
                                        borderRadius: '8px', 
                                        overflow: 'auto', 
                                        fontSize: '0.75rem', 
                                        fontFamily: 'monospace', 
                                        maxHeight: 250,
                                        color: '#333'
                                    }}>
                                        {this.state.error.stack || this.state.errorInfo?.componentStack || 'Sem stack trace disponível.'}
                                    </pre>
                                </AccordionDetails>
                            </Accordion>
                        </Paper>
                    )}
                </Box>
            );
        }

        return this.props.children;
    }
}
