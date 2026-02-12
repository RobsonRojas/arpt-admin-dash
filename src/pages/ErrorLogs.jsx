import React, { useState } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, Chip, TextField
} from '@mui/material';
import { Delete, ContentCopy, Visibility, Refresh } from '@mui/icons-material';
import { useError } from '../contexts/ErrorContext';

export const ErrorLogs = () => {
    const { errors, clearErrors } = useError();
    const [selectedError, setSelectedError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copiado para a área de transferência!');
    };

    const handleCopyAll = () => {
        const text = JSON.stringify(errors, null, 2);
        handleCopy(text);
    };

    const filteredErrors = errors.filter(err =>
        err.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        err.context.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (err.url && err.url.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5">Log de Erros do Sistema</Typography>
                <Box display="flex" gap={2}>
                    <Button startIcon={<ContentCopy />} onClick={handleCopyAll}>
                        Copiar Todos
                    </Button>
                    <Button startIcon={<Delete />} color="error" onClick={clearErrors}>
                        Limpar Logs
                    </Button>
                </Box>
            </Box>

            <TextField
                fullWidth
                placeholder="Filtrar erros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
                size="small"
            />

            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Data/Hora</TableCell>
                            <TableCell>Contexto</TableCell>
                            <TableCell>Mensagem</TableCell>
                            <TableCell align="right">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredErrors.map((row) => (
                            <TableRow key={row.id} hover>
                                <TableCell>
                                    {new Date(row.timestamp).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    <Chip label={row.context} size="small" color={row.context === 'API' ? 'error' : 'warning'} />
                                </TableCell>
                                <TableCell sx={{ maxWidth: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {row.message}
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => setSelectedError(row)}>
                                        <Visibility />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => handleCopy(JSON.stringify(row, null, 2))}>
                                        <ContentCopy />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredErrors.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} align="center">Nenhum erro registrado.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Detail Dialog */}
            <Dialog open={!!selectedError} onClose={() => setSelectedError(null)} maxWidth="md" fullWidth>
                <DialogTitle>Detalhes do Erro</DialogTitle>
                <DialogContent dividers>
                    {selectedError && (
                        <Box>
                            <Typography variant="subtitle2" gutterBottom>Mensagem:</Typography>
                            <Paper variant="outlined" sx={{ p: 1, bgcolor: '#f5f5f5', mb: 2 }}>
                                <code>{selectedError.message}</code>
                            </Paper>

                            <Typography variant="subtitle2" gutterBottom>URL / Local:</Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>{selectedError.url}</Typography>

                            {selectedError.details && (
                                <>
                                    <Typography variant="subtitle2" gutterBottom>Detalhes da Resposta (API):</Typography>
                                    <Paper variant="outlined" sx={{ p: 1, bgcolor: '#f5f5f5', mb: 2, maxHeight: 200, overflow: 'auto' }}>
                                        <pre style={{ margin: 0, fontSize: '0.8rem' }}>
                                            {JSON.stringify(selectedError.details, null, 2)}
                                        </pre>
                                    </Paper>
                                </>
                            )}

                            {selectedError.stack && (
                                <>
                                    <Typography variant="subtitle2" gutterBottom>Stack Trace:</Typography>
                                    <Paper variant="outlined" sx={{ p: 1, bgcolor: '#f5f5f5', maxHeight: 200, overflow: 'auto' }}>
                                        <pre style={{ margin: 0, fontSize: '0.8rem' }}>
                                            {selectedError.stack}
                                        </pre>
                                    </Paper>
                                </>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleCopy(JSON.stringify(selectedError, null, 2))}>Copiar JSON</Button>
                    <Button onClick={() => setSelectedError(null)}>Fechar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
