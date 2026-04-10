import React from 'react';
import {
    Box, Table, TableContainer, TableHead, TableRow, TableCell,
    TableBody, Paper, IconButton, Avatar, Typography, Button,
    Stack, Divider
} from '@mui/material';
import {
    Edit, Delete, Visibility, Image as ImageIcon
} from '@mui/icons-material';

export const RewardList = ({
    rewards,
    handleOpenView,
    handleOpenEdit,
    handleDelete
}) => {
    if (rewards.length === 0) {
        return (
            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                <Typography variant="body1" color="text.secondary">
                    Nenhuma recompensa cadastrada para este manejo
                </Typography>
            </Paper>
        );
    }

    return (
        <Box>
            {/* Desktop Table View */}
            <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, borderRadius: 2, boxShadow: 1 }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Descrição</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Preço Varejo</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Preço Recompensa</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Quantidade</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rewards.map((reward) => (
                            <TableRow key={reward.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell>
                                    <Typography variant="body2" color="text.secondary">#{reward.id}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar
                                            src={reward.foto_url}
                                            variant="rounded"
                                            sx={{ width: 40, height: 40, bgcolor: 'grey.100' }}
                                        >
                                            <ImageIcon fontSize="small" color="disabled" />
                                        </Avatar>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{reward.name}</Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" color="text.secondary" sx={{
                                        maxWidth: 200,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {reward.info || '-'}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {reward.retail_price ? `R$ ${Number(reward.retail_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                                        {reward.reward_price ? `R$ ${Number(reward.reward_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Grátis'}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{reward.reward_qtd ?? '-'}</Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                        <IconButton size="small" color="info" onClick={() => handleOpenView(reward)} title="Visualizar">
                                            <Visibility fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" color="primary" onClick={() => handleOpenEdit(reward)} title="Editar">
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(reward.id)} title="Excluir">
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Mobile Card View */}
            <Stack spacing={2} sx={{ display: { xs: 'flex', md: 'none' } }}>
                {rewards.map((reward) => (
                    <Paper key={reward.id} sx={{ p: 2, borderRadius: 2, boxShadow: 1, border: '1px solid', borderColor: 'grey.200' }}>
                        <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
                            <Avatar
                                src={reward.foto_url}
                                variant="rounded"
                                sx={{ width: 60, height: 60, bgcolor: 'grey.50' }}
                            >
                                <ImageIcon fontSize="large" color="disabled" />
                            </Avatar>
                            <Box flex={1}>
                                <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                                    {reward.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {reward.info}
                                </Typography>
                            </Box>
                        </Stack>

                        <Divider sx={{ mb: 2 }} />

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Varejo</Typography>
                                <Typography variant="body2" sx={{ textDecoration: reward.retail_price ? 'line-through' : 'none', color: 'text.secondary' }}>
                                    {reward.retail_price ? `R$ ${Number(reward.retail_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                                </Typography>
                            </Box>
                            <Box textAlign="right">
                                <Typography variant="caption" color="text.secondary">Recompensa</Typography>
                                <Typography variant="body1" fontWeight="bold" color="primary.main">
                                    {reward.reward_price ? `R$ ${Number(reward.reward_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Grátis'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">ID</Typography>
                                <Typography variant="body2" fontWeight="medium">#{reward.id}</Typography>
                            </Box>
                            <Box textAlign="right">
                                <Typography variant="caption" color="text.secondary">Disponível</Typography>
                                <Typography variant="body2" fontWeight="medium">{reward.reward_qtd}</Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        <Stack direction="row" spacing={1} justifyContent="center">
                            <Button 
                                fullWidth 
                                variant="outlined" 
                                size="small" 
                                startIcon={<Visibility />} 
                                onClick={() => handleOpenView(reward)}
                                sx={{ borderRadius: 2 }}
                            >
                                Ver
                            </Button>
                            <Button 
                                fullWidth 
                                variant="outlined" 
                                size="small" 
                                startIcon={<Edit />} 
                                onClick={() => handleOpenEdit(reward)}
                                sx={{ borderRadius: 2 }}
                            >
                                Editar
                            </Button>
                            <Button 
                                fullWidth 
                                variant="outlined" 
                                size="small" 
                                color="error" 
                                startIcon={<Delete />} 
                                onClick={() => handleDelete(reward.id)}
                                sx={{ borderRadius: 2 }}
                            >
                                Excluir
                            </Button>
                        </Stack>
                    </Paper>
                ))}
            </Stack>
        </Box>
    );
};
