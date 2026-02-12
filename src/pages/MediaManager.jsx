import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Button, Grid, Card, CardMedia, CardContent, CardActions,
    IconButton, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, InputAdornment, Snackbar, Alert
} from '@mui/material';
import {
    CloudUpload, Search, ContentCopy, InsertDriveFile, Description, Image as ImageIcon,
    Close, Download, Visibility
} from '@mui/icons-material';
import { api } from '../services/api';
import { useAdmin } from '../contexts/AdminContext';
import { usePersistence } from '../hooks/usePersistence';

export const MediaManager = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Persistence for search
    const [searchTerm, setSearchTerm] = usePersistence('media_manager_search', "");

    const [selectedFile, setSelectedFile] = useState(null); // For preview modal
    const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });

    const { urlMidiasFiles } = useAdmin();

    // Fetch files on mount
    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            // Endpoint defined in medias.routes.ts: GET /midias/files
            const response = await api.get('/midias/files');
            if (response.data) {
                setFiles(response.data);
            }
        } catch (error) {
            console.error("Erro ao carregar arquivos:", error);
            showNotification("Erro ao carregar arquivos.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Endpoint defined in medias.routes.ts: POST /midias/upload
            const response = await api.post('/midias/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 200 || response.status === 201) {
                showNotification("Upload realizado com sucesso!", "success");
                fetchFiles(); // Refresh list
            }
        } catch (error) {
            console.error("Erro no upload:", error);
            showNotification("Erro ao fazer upload.", "error");
        } finally {
            setUploading(false);
            // Reset input value to allow uploading same file again if needed
            event.target.value = '';
        }
    };

    const showNotification = (message, severity = "success") => {
        setNotification({ open: true, message, severity });
    };

    const handleCopyUrl = (url) => {
        navigator.clipboard.writeText(url);
        showNotification("Link copiado para a área de transferência!");
    };

    const getFileIcon = (type) => {
        if (type === 'image') return <ImageIcon sx={{ fontSize: 40, color: 'primary.main' }} />;
        if (type === 'pdf') return <Description sx={{ fontSize: 40, color: 'error.main' }} />;
        if (type === 'video') return <InsertDriveFile sx={{ fontSize: 40, color: 'secondary.main' }} />;
        return <InsertDriveFile sx={{ fontSize: 40, color: 'text.secondary' }} />;
    };

    const filteredFiles = files.filter(f =>
        f.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ p: 0, animation: 'fadeIn 0.5s' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" component="h1">
                    Gerenciador de Arquivos
                </Typography>
                <Button
                    variant="contained"
                    component="label"
                    startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
                    disabled={uploading}
                >
                    {uploading ? "Enviando..." : "Upload Novo Arquivo"}
                    <input
                        type="file"
                        hidden
                        onChange={handleUpload}
                    />
                </Button>
            </Box>

            {/* Search Bar */}
            <Paper sx={{ mb: 3, p: 2 }}>
                <TextField
                    fullWidth
                    placeholder="Buscar arquivos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search color="action" />
                            </InputAdornment>
                        ),
                    }}
                    size="small"
                />
            </Paper>

            {/* Files Grid */}
            {loading ? (
                <Box display="flex" justifyContent="center" p={5}>
                    <CircularProgress />
                </Box>
            ) : (
                <Grid container spacing={2}>
                    {filteredFiles.map((file, index) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                            <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <Box
                                    sx={{
                                        height: 140,
                                        bgcolor: '#f5f5f5',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        position: 'relative'
                                    }}
                                >
                                    {file.type === 'image' ? (
                                        <Box
                                            component="img"
                                            src={file.url}
                                            alt={file.filename}
                                            sx={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                                            onClick={() => setSelectedFile(file)}
                                        />
                                    ) : (
                                        getFileIcon(file.type)
                                    )}
                                </Box>
                                <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
                                    <Typography variant="subtitle2" noWrap title={file.filename}>
                                        {file.filename}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {file.type.toUpperCase()}
                                    </Typography>
                                </CardContent>
                                <CardActions sx={{ justifyContent: 'space-between', px: 1 }}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleCopyUrl(file.url)}
                                        title="Copiar Link"
                                    >
                                        <ContentCopy fontSize="small" />
                                    </IconButton>
                                    <Box>
                                        <IconButton
                                            size="small"
                                            onClick={() => setSelectedFile(file)}
                                            title="Visualizar"
                                        >
                                            <Visibility fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            href={file.url}
                                            target="_blank"
                                            download
                                            title="Baixar / Abrir"
                                        >
                                            <Download fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                    {filteredFiles.length === 0 && (
                        <Grid item xs={12}>
                            <Box p={4} textAlign="center">
                                <Typography color="text.secondary">Nenhum arquivo encontrado.</Typography>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            )}

            {/* Preview Modal */}
            <Dialog
                open={Boolean(selectedFile)}
                onClose={() => setSelectedFile(null)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {selectedFile?.filename}
                    <IconButton onClick={() => setSelectedFile(null)}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedFile && (
                        <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column" gap={2}>
                            {selectedFile.type === 'image' ? (
                                <img
                                    src={selectedFile.url}
                                    alt={selectedFile.filename}
                                    style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain' }}
                                />
                            ) : (
                                <Box textAlign="center" py={5}>
                                    {getFileIcon(selectedFile.type)}
                                    <Typography mt={2}>Pré-visualização não disponível para este tipo de arquivo.</Typography>
                                    <Button variant="outlined" sx={{ mt: 2 }} href={selectedFile.url} target="_blank">
                                        Abrir Arquivo
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleCopyUrl(selectedFile?.url)}>Copiar Link</Button>
                    <Button onClick={() => setSelectedFile(null)}>Fechar</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={notification.open}
                autoHideDuration={4000}
                onClose={() => setNotification({ ...notification, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setNotification({ ...notification, open: false })}
                    severity={notification.severity}
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};
