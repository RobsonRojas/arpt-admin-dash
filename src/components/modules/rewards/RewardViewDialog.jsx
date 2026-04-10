import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Box,
    Typography, Button, Divider
} from '@mui/material';
import { Image as ImageIcon, BrokenImage } from '@mui/icons-material';

export const RewardViewDialog = ({
    open,
    onClose,
    reward,
    imgError,
    setImgError,
    handleOpenEdit
}) => {
    if (!reward) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Detalhes da Recompensa</DialogTitle>
            <DialogContent dividers>
                <Box display="flex" flexDirection="column" gap={2}>
                    {reward.foto_url && !imgError ? (
                        <Box
                            component="img"
                            src={reward.foto_url}
                            alt={reward.name}
                            onError={() => setImgError(true)}
                            sx={{
                                width: '100%',
                                maxHeight: 300,
                                objectFit: 'contain',
                                borderRadius: 1,
                                mb: 2,
                                bgcolor: 'grey.100'
                            }}
                        />
                    ) : (
                        <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column" height={150} bgcolor="grey.100" borderRadius={1} mb={2}>
                            {reward.foto_url ? (
                                <BrokenImage sx={{ fontSize: 60, color: 'grey.300', mb: 1 }} />
                            ) : (
                                <ImageIcon sx={{ fontSize: 60, color: 'grey.300' }} />
                            )}
                            <Typography variant="caption" color="textSecondary">
                                {reward.foto_url ? "Erro ao carregar imagem" : "Sem foto"}
                            </Typography>
                        </Box>
                    )}
                    <Typography variant="h6">{reward.name}</Typography>
                    <Typography variant="body1" color="text.secondary">
                        {reward.info || "Sem descrição"}
                    </Typography>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={2}>
                        <Box>
                            <Typography variant="caption" color="textSecondary" display="block">Preço Varejo</Typography>
                            <Typography variant="body1">
                                {reward.retail_price ? `R$ ${Number(reward.retail_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="textSecondary" display="block">Preço Recompensa</Typography>
                            <Typography variant="body1" fontWeight="bold" color="primary">
                                {reward.reward_price ? `R$ ${Number(reward.reward_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Grátis'}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="textSecondary" display="block">Qtd. Disponível</Typography>
                            <Typography variant="body1">{reward.reward_qtd}</Typography>
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, flexWrap: 'wrap', gap: 1 }}>
                <Button onClick={onClose} fullWidth={{ xs: true, sm: false }}>Fechar</Button>
                <Button
                    variant="contained"
                    fullWidth={{ xs: true, sm: false }}
                    onClick={() => {
                        onClose();
                        handleOpenEdit(reward);
                    }}
                >
                    Editar Recompensa
                </Button>
            </DialogActions>
        </Dialog>
    );
};
