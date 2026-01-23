import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField,
    CircularProgress, Chip
} from '@mui/material';
import { Add, Visibility, Delete, CardMembership } from '@mui/icons-material';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';

const Certificates = () => {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [formData, setFormData] = useState({
        sponsorName: '',
        projectName: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCertificates();
    }, []);

    const fetchCertificates = async () => {
        setLoading(true);
        try {
            if (!db) {
                console.warn("Firestore not initialized");
                setLoading(false);
                return;
            }
            const q = query(collection(db, "certificates"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const list = [];
            querySnapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() });
            });
            setCertificates(list);
        } catch (error) {
            console.error("Error fetching certificates: ", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = () => {
        setOpenDialog(true);
        setFormData({
            sponsorName: '',
            projectName: '',
            date: new Date().toISOString().split('T')[0]
        });
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.sponsorName || !formData.projectName || !formData.date) {
            alert("Preencha todos os campos");
            return;
        }

        setSubmitting(true);
        try {
            await addDoc(collection(db, "certificates"), {
                sponsorName: formData.sponsorName,
                projectName: formData.projectName,
                date: formData.date,
                createdAt: Timestamp.now()
            });
            await fetchCertificates();
            handleCloseDialog();
        } catch (error) {
            console.error("Error creating certificate: ", error);
            alert("Erro ao criar certificado");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir este certificado?")) {
            try {
                await deleteDoc(doc(db, "certificates", id));
                setCertificates(prev => prev.filter(c => c.id !== id));
            } catch (error) {
                console.error("Error deleting certificate: ", error);
                alert("Erro ao excluir certificado");
            }
        }
    };

    const handleView = (cert) => {
        // Prepare data for view
        const viewData = {
            sponsorName: cert.sponsorName,
            projectName: cert.projectName,
            date: cert.date
        };
        // Encode to base64
        const json = JSON.stringify(viewData);
        const encoded = btoa(json);
        window.open(`/certificate/view?d=${encoded}`, '_blank');
    };

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1" display="flex" alignItems="center" gap={1}>
                    <CardMembership fontSize="large" color="primary" />
                    Certificados Avulsos
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleOpenDialog}
                    disabled={!db}
                >
                    Novo Certificado
                </Button>
            </Box>

            {!db && (
                <Box mb={2}>
                    <Chip label="Firestore não configurado" color="error" variant="outlined" />
                </Box>
            )}

            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell><strong>Patrocinador</strong></TableCell>
                            <TableCell><strong>Projeto / Título</strong></TableCell>
                            <TableCell><strong>Data</strong></TableCell>
                            <TableCell align="right"><strong>Ações</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : certificates.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                    <Typography color="textSecondary">Nenhum certificado encontrado.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            certificates.map((cert) => (
                                <TableRow key={cert.id} hover>
                                    <TableCell>{cert.sponsorName}</TableCell>
                                    <TableCell>{cert.projectName}</TableCell>
                                    <TableCell>{new Date(cert.date).toLocaleDateString()}</TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            color="primary"
                                            onClick={() => handleView(cert)}
                                            title="Visualizar"
                                        >
                                            <Visibility />
                                        </IconButton>
                                        <IconButton
                                            color="error"
                                            onClick={() => handleDelete(cert.id)}
                                            title="Excluir"
                                        >
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Novo Certificado</DialogTitle>
                <DialogContent dividers>
                    <Box display="flex" flexDirection="column" gap={2} pt={1}>
                        <TextField
                            label="Nome do Patrocinador"
                            name="sponsorName"
                            value={formData.sponsorName}
                            onChange={handleInputChange}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Nome do Projeto / Título"
                            name="projectName"
                            value={formData.projectName}
                            onChange={handleInputChange}
                            fullWidth
                            required
                            helperText="Ex: Reflorestamento 2024"
                        />
                        <TextField
                            label="Data de Emissão"
                            name="date"
                            type="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            fullWidth
                            required
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="inherit">Cancelar</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={submitting}
                    >
                        {submitting ? 'Salvando...' : 'Salvar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Certificates;
