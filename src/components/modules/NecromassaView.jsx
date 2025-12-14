import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, Chip, Alert, CardActions, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Paper, FormControlLabel, Switch, Divider, Drawer, List, ListItem, ListItemText } from '@mui/material';
import { Forest, WhatsApp, Visibility, Warning, Rule } from '@mui/icons-material';
import MapEmbed from '../common/MapEmbed';
import { CONSTANTS, INITIAL_NECROMASSA } from '../../utils/constants';

const NecromassaView = () => {
    const [requests, setRequests] = useState(INITIAL_NECROMASSA);
    const [openForm, setOpenForm] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [formData, setFormData] = useState({ solicitante: "", especie_vulgar: "Paxiúba", cap: "", altura: "", lat: "", lng: "", fotoRaiz: false, fotoFuste: false });
    const [calculatedVolume, setCalculatedVolume] = useState(0);
    const [scientificName, setScientificName] = useState("");

    useEffect(() => {
        const spec = CONSTANTS.SPECIES_DB[formData.especie_vulgar] || CONSTANTS.SPECIES_DB["Outros"];
        setScientificName(spec.scientific);
        if (formData.cap && formData.altura) {
            const capVal = parseFloat(formData.cap);
            const altVal = parseFloat(formData.altura);
            const dap = capVal / Math.PI;
            const volume = (Math.PI * Math.pow(dap, 2) / 40000) * altVal * spec.ff;
            setCalculatedVolume(volume.toFixed(4));
        } else {
            setCalculatedVolume(0);
        }
    }, [formData.cap, formData.altura, formData.especie_vulgar]);

    const handleSave = () => {
        const lat = parseFloat(formData.lat);
        const lng = parseFloat(formData.lng);
        let alerts = [];
        if (lat > 5 || lat < -15 || lng > -40 || lng < -75) alerts.push("Coordenada fora da Amazônia");
        if (!formData.fotoRaiz) alerts.push("Falta evidência da raiz (Risco de Fraude)");

        const newReq = {
            id: `NECRO-${Math.floor(Math.random() * 1000)}`,
            solicitante: formData.solicitante,
            especie_vulgar: formData.especie_vulgar,
            volume: calculatedVolume,
            status: alerts.length > 0 ? "Pendente Correção" : "Aprovado p/ IPAAM",
            data: new Date().toISOString().split('T')[0],
            coords: { lat, lng },
            alerts: alerts,
            origem: "WhatsApp"
        };
        setRequests([newReq, ...requests]);
        setOpenForm(false);
    };

    return (
        <Box sx={{ animation: 'fadeIn 0.5s' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h5" fontWeight={600} display="flex" alignItems="center" gap={1}><Forest color="primary" /> Licenciamento de Necromassa</Typography>
                    <Typography variant="body2" color="textSecondary">Gestão de aproveitamento de árvores caídas (PA Niterói)</Typography>
                </Box>
                <Button variant="contained" startIcon={<WhatsApp />} color="success" onClick={() => setOpenForm(true)}>Novo Input (WhatsApp)</Button>
            </Box>

            <Grid container spacing={3}>
                {requests.map((req) => (
                    <Grid item xs={12} md={6} key={req.id}>
                        <Card sx={{ borderLeft: `6px solid ${req.status.includes('Aprovado') ? '#2e7d32' : '#d32f2f'}` }}>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" mb={1}><Typography variant="subtitle2" color="textSecondary">{req.id}</Typography><Chip label={req.status} color={req.status.includes('Aprovado') ? "success" : "error"} size="small" /></Box>
                                <Typography variant="h6">{req.solicitante}</Typography>
                                <Typography variant="body2" gutterBottom>{req.especie_vulgar} • {req.volume} m³</Typography>
                                {req.alerts.length > 0 && (<Alert severity="error" sx={{ mt: 2, py: 0 }}><ul style={{margin: '4px 0', paddingLeft: '20px'}}>{req.alerts.map((a, i) => <li key={i}><Typography variant="caption">{a}</Typography></li>)}</ul></Alert>)}
                            </CardContent>
                            <CardActions sx={{ justifyContent: 'flex-end', bgcolor: '#f5f5f5' }}><Button size="small" startIcon={<Visibility />} onClick={() => setSelectedRequest(req)}>Auditar</Button></CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* MODAL */}
            <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ bgcolor: 'success.main', color: 'white' }}>Input Técnico (Origem: WhatsApp)</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3} sx={{ mt: 0 }}>
                        <Grid item xs={12} md={6}><TextField fullWidth label="Assentado / Lote" value={formData.solicitante} onChange={e => setFormData({...formData, solicitante: e.target.value})} /></Grid>
                        <Grid item xs={12} md={6}><TextField select fullWidth label="Espécie" value={formData.especie_vulgar} onChange={e => setFormData({...formData, especie_vulgar: e.target.value})}>{Object.keys(CONSTANTS.SPECIES_DB).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField><Typography variant="caption">Científico: {scientificName}</Typography></Grid>
                        <Grid item xs={6} md={4}><TextField fullWidth type="number" label="CAP (cm)" value={formData.cap} onChange={e => setFormData({...formData, cap: e.target.value})} /></Grid>
                        <Grid item xs={6} md={4}><TextField fullWidth type="number" label="Altura (m)" value={formData.altura} onChange={e => setFormData({...formData, altura: e.target.value})} /></Grid>
                        <Grid item xs={12} md={4}><Paper sx={{ p: 2, bgcolor: '#e8f5e9', textAlign: 'center' }}><Typography variant="caption">Volume Estimado</Typography><Typography variant="h5" color="primary" fontWeight="bold">{calculatedVolume} m³</Typography></Paper></Grid>
                        <Grid item xs={6}><TextField fullWidth label="Latitude" value={formData.lat} onChange={e => setFormData({...formData, lat: e.target.value})} /></Grid>
                        <Grid item xs={6}><TextField fullWidth label="Longitude" value={formData.lng} onChange={e => setFormData({...formData, lng: e.target.value})} /></Grid>
                        <Grid item xs={12}><FormControlLabel control={<Switch checked={formData.fotoRaiz} onChange={e => setFormData({...formData, fotoRaiz: e.target.checked})} />} label="Foto mostra raiz exposta?" /></Grid>
                    </Grid>
                </DialogContent>
                <DialogActions><Button onClick={() => setOpenForm(false)}>Cancelar</Button><Button variant="contained" onClick={handleSave}>Salvar</Button></DialogActions>
            </Dialog>

            {/* DRAWER */}
            <Drawer anchor="right" open={Boolean(selectedRequest)} onClose={() => setSelectedRequest(null)} PaperProps={{ sx: { width: { xs: '100%', md: 500 } } }}>
                {selectedRequest && (
                    <Box p={3}>
                        <Typography variant="h6">Auditoria Técnica {selectedRequest.id}</Typography>
                        <Divider sx={{ my: 2 }} />
                        <MapEmbed lat={selectedRequest.coords.lat} lng={selectedRequest.coords.lng} />
                        <List>
                            <ListItem><ListItemText primary="Solicitante" secondary={selectedRequest.solicitante} /></ListItem>
                            <ListItem><ListItemText primary="Espécie" secondary={selectedRequest.especie_vulgar} /></ListItem>
                            <ListItem><ListItemText primary="Volume Calculado" secondary={`${selectedRequest.volume} m³`} /></ListItem>
                        </List>
                        {selectedRequest.alerts.length > 0 ? <Button fullWidth variant="outlined" color="error" startIcon={<Warning />}>Notificar Correção</Button> : <Button fullWidth variant="contained" color="success" startIcon={<Rule />}>Gerar Doc. IPAAM</Button>}
                    </Box>
                )}
            </Drawer>
        </Box>
    );
};
export default NecromassaView;
