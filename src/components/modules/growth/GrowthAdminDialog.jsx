import { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Tab, Tabs } from '@mui/material';
import { ResponsaveisTab } from './ResponsaveisTab';
import { CertificacoesTab } from './CertificacoesTab';
import { MuralTab } from './MuralTab';

/** Console de crescimento do administrador, por negócio: donos, certificação de carbono e mural de apoiadores. */
export const GrowthAdminDialog = ({ open, onClose, project }) => {
    const [aba, setAba] = useState(0);
    useEffect(() => { if (open) setAba(0); }, [open, project?.id]);
    if (!project) return null;
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
                Crescimento: {project.descricao || project.nome || `Negócio #${project.id}`}
            </DialogTitle>
            <Tabs value={aba} onChange={(_, v) => setAba(v)} variant="scrollable" sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="Donos e responsáveis" />
                <Tab label="Certificação de carbono" />
                <Tab label="Mural de apoiadores" />
            </Tabs>
            <DialogContent>
                <Box pt={1}>
                    {aba === 0 && <ResponsaveisTab projectId={project.id} />}
                    {aba === 1 && <CertificacoesTab projectId={project.id} />}
                    {aba === 2 && <MuralTab projectId={project.id} />}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Fechar</Button>
            </DialogActions>
        </Dialog>
    );
};
