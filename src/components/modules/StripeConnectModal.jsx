import { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, Chip, CircularProgress,
    Alert, Divider, Link
} from '@mui/material';
import { CreditCard, OpenInNew, ContentCopy, CheckCircle, Warning } from '@mui/icons-material';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Modal para gerenciar a conexão Stripe Connect de um usuário.
 * Permite criar a conta Stripe e gerar link de onboarding.
 */
export const StripeConnectModal = ({ open, onClose, user, onStatusUpdate }) => {
    const { user: authUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [linkLoading, setLinkLoading] = useState(false);
    const [status, setStatus] = useState(null); // null | { connected, charges_enabled, account_id }
    const [onboardingUrl, setOnboardingUrl] = useState(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState(null);

    const stripeConnected = user?.stripe_account_id || status?.account_id;
    const chargesEnabled = status?.charges_enabled;

    const getStatusChip = () => {
        if (!stripeConnected) return <Chip label="Não conectado" color="error" size="small" />;
        if (!chargesEnabled && status !== null) return <Chip label="Pendente" color="warning" size="small" icon={<Warning fontSize="small" />} />;
        if (chargesEnabled) return <Chip label="Configurado" color="success" size="small" icon={<CheckCircle fontSize="small" />} />;
        // account_id existe mas ainda não verificamos charges_enabled
        return <Chip label="Conta criada" color="info" size="small" />;
    };

    const handleConnect = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = await authUser.getIdToken();
            const response = await api.post(`/user/${user.id}/stripe-connect`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatus({
                connected: true,
                charges_enabled: response.data.charges_enabled,
                account_id: response.data.stripe_account_id,
            });
            if (onStatusUpdate) onStatusUpdate(user.id, response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao conectar com a Stripe');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateLink = async () => {
        setLinkLoading(true);
        setError(null);
        setOnboardingUrl(null);
        try {
            const token = await authUser.getIdToken();
            const accountId = stripeConnected;
            const userId = user.id;
            // Check status first if needed
            const response = await api.post(`/user/${userId}/stripe-connect/onboarding-link`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOnboardingUrl(response.data.url);
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao gerar link de onboarding');
        } finally {
            setLinkLoading(false);
        }
    };

    const handleCopyLink = () => {
        if (onboardingUrl) {
            navigator.clipboard.writeText(onboardingUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleClose = () => {
        setStatus(null);
        setOnboardingUrl(null);
        setError(null);
        setCopied(false);
        onClose();
    };

    if (!user) return null;

    const userName = user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.name || user.email;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CreditCard color="primary" />
                Stripe Connect — {userName}
            </DialogTitle>
            <DialogContent dividers>
                <Box display="flex" flexDirection="column" gap={2}>
                    {/* Dados do usuário */}
                    <Box>
                        <Typography variant="body2" color="textSecondary">E-mail</Typography>
                        <Typography variant="body1">{user.email}</Typography>
                    </Box>

                    <Divider />

                    {/* Status da conta Stripe */}
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="subtitle2">Status Stripe Connect</Typography>
                        {getStatusChip()}
                    </Box>

                    {stripeConnected && (
                        <Box>
                            <Typography variant="body2" color="textSecondary">Account ID</Typography>
                            <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                                {stripeConnected}
                            </Typography>
                        </Box>
                    )}

                    {error && (
                        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
                    )}

                    {/* Ação: Conectar */}
                    {!stripeConnected && (
                        <Alert severity="info">
                            Este usuário ainda não possui conta Stripe vinculada. Clique em "Conectar Stripe" para criar a conta automaticamente com os dados cadastrados. Um e-mail com o link de configuração será enviado ao usuário.
                        </Alert>
                    )}

                    {/* Link de onboarding gerado */}
                    {onboardingUrl && (
                        <Alert severity="success" icon={<CheckCircle />}>
                            <Typography variant="body2" mb={1}>
                                Link de onboarding gerado. Envie ao usuário ou copie abaixo:
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                <Link href={onboardingUrl} target="_blank" rel="noopener" underline="hover" sx={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>
                                    {onboardingUrl.substring(0, 60)}...
                                </Link>
                                <Button
                                    size="small"
                                    startIcon={copied ? <CheckCircle /> : <ContentCopy />}
                                    onClick={handleCopyLink}
                                    color={copied ? 'success' : 'primary'}
                                >
                                    {copied ? 'Copiado!' : 'Copiar'}
                                </Button>
                                <Button
                                    size="small"
                                    startIcon={<OpenInNew />}
                                    href={onboardingUrl}
                                    target="_blank"
                                    rel="noopener"
                                >
                                    Abrir
                                </Button>
                            </Box>
                        </Alert>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ gap: 1, px: 3, pb: 2 }}>
                <Button onClick={handleClose} color="inherit">Fechar</Button>
                {!stripeConnected && (
                    <Button
                        variant="contained"
                        onClick={handleConnect}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} /> : <CreditCard />}
                    >
                        {loading ? 'Conectando...' : 'Conectar Stripe'}
                    </Button>
                )}
                {stripeConnected && (
                    <Button
                        variant="outlined"
                        onClick={handleGenerateLink}
                        disabled={linkLoading}
                        startIcon={linkLoading ? <CircularProgress size={16} /> : <OpenInNew />}
                    >
                        {linkLoading ? 'Gerando link...' : 'Enviar link de configuração'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default StripeConnectModal;
