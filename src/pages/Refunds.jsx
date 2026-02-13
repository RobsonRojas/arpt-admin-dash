import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Table, TableContainer, TableHead,
    TableRow, TableCell, TableBody, Paper, Chip, IconButton,
    TextField, InputAdornment, Tooltip
} from '@mui/material';
import { Search, Refresh, Replay as RefundIcon, CheckCircle, Cancel } from '@mui/icons-material';
import { api } from '../services/api';
import { useError } from '../contexts/ErrorContext';

export const Refunds = () => {
    const { logError } = useError();
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchRefunds = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/refunds');
            setRefunds(response.data);
        } catch (error) {
            logError(error, 'Error fetching refunds');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRefunds();
    }, []);

    const handleRequestRefund = async (paymentId, email, pixKey) => {
        if (!window.confirm(`Confirmar solicitação de devolução para ${email}?`)) return;

        try {
            await api.post('/admin/refunds', {
                payment_id: paymentId,
                requester_email: email,
                pix_key: pixKey
            });
            alert('Solicitação de devolução criada com sucesso. Verifique seu email para aprovação.');
            fetchRefunds();
        } catch (error) {
            logError(error, 'Error requesting refund');
            alert('Erro ao solicitar devolução: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleApprove = async (refundId) => {
        // This might logically happen via email link, but adding here just in case admin panel allows it too if logged in as admin
        try {
            await api.post('/admin/refunds/approve', { refund_request_id: refundId });
            alert('Aprovado com sucesso!');
            fetchRefunds();
        } catch (error) {
            logError(error, 'Error approving refund');
            alert('Erro ao aprovar: ' + (error.response?.data?.error || error.message));
        }
    }

    // Mock list of payments if refunds list is empty or for demo
    // ideally we should have a "Payments" list to select from to *initiate* a refund.
    // For this implementation, I'll assume we list *existing* refund requests here.
    // To initiate a NEW refund, we probably need a "New Refund" button that opens a modal to select a payment/sponsor.
    // Or reuse the Sponsors/Purchases view. 
    // Given the requirement "Descreva um painel...", I will focus on the list of refunds and their status.

    const filteredRefunds = refunds.filter(r =>
        r.requester_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.pix_key.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ animation: 'fadeIn 0.5s' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight={600}>
                    Gestão de Devoluções (Reembolsos)
                </Typography>
                <Button variant="outlined" startIcon={<Refresh />} onClick={fetchRefunds}>
                    Atualizar
                </Button>
            </Box>

            <Box mb={3}>
                <TextField
                    fullWidth
                    placeholder="Buscar por email ou chave PIX..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f9fafb' }}>
                        <TableRow>
                            <TableCell>Data</TableCell>
                            <TableCell>Solicitante</TableCell>
                            <TableCell>Chave PIX</TableCell>
                            <TableCell>Valor (Líquido)</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Aprovações</TableCell>
                            <TableCell align="right">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredRefunds.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">Nenhuma solicitação encontrada.</TableCell>
                            </TableRow>
                        ) : (
                            filteredRefunds.map((row) => (
                                <TableRow key={row.id} hover>
                                    <TableCell>{new Date(row.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>{row.requester_email}</TableCell>
                                    <TableCell>{row.pix_key}</TableCell>
                                    <TableCell>R$ {Number(row.amount).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={row.status}
                                            color={
                                                row.status === 'APPROVED' ? 'success' :
                                                    row.status === 'REJECTED' ? 'error' : 'warning'
                                            }
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{row.approval_count || 0}</TableCell>
                                    <TableCell align="right">
                                        {row.status === 'PENDING' && (
                                            <Tooltip title="Aprovar (Simulação)">
                                                <IconButton color="success" onClick={() => handleApprove(row.id)}>
                                                    <CheckCircle />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};
