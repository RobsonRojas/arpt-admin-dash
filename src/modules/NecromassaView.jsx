
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, Chip, Alert, Dialog, DialogTitle, DialogContent, TextField, MenuItem, Switch, FormControlLabel } from '@mui/material';
import { Forest, WhatsApp, Visibility } from '@mui/icons-material';
import MapEmbed from '../components/MapEmbed';
import { CONSTANTS, MOCK_DATA } from '../utils/constants';

export default function NecromassaView() {
  const [requests, setRequests] = useState(MOCK_DATA.necromassa);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ solicitante: "", especie: "Paxiúba", cap: "", alt: "", lat: "", lng: "", foto: false });
  const [vol, setVol] = useState(0);

  useEffect(() => {
    if (form.cap && form.alt) {
      const dap = form.cap / Math.PI;
      const ff = CONSTANTS.SPECIES_DB[form.especie]?.ff || 0.7;
      setVol(((Math.PI * Math.pow(dap, 2) / 40000) * form.alt * ff).toFixed(4));
    }
  }, [form.cap, form.alt, form.especie]);

  const handleSave = () => {
    const lat = parseFloat(form.lat);
    let alerts = [];
    if (lat > 5 || lat < -15) alerts.push("Fora da Amazônia");
    if (!form.foto) alerts.push("Sem foto da raiz");
    
    setRequests([{ id: "NEW", ...form, volume: vol, status: alerts.length ? "Erro" : "Ok", alerts, coords: {lat, lng: parseFloat(form.lng)} }, ...requests]);
    setOpen(false);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h5"><Forest /> Necromassa</Typography>
        <Button variant="contained" startIcon={<WhatsApp />} onClick={()=>setOpen(true)}>Input WhatsApp</Button>
      </Box>
      <Grid container spacing={2}>
        {requests.map((r, i) => (
          <Grid item xs={12} md={6} key={i}>
            <Card sx={{ borderLeft: r.alerts && r.alerts.length ? '4px solid red' : '4px solid green' }}>
              <CardContent>
                <Typography variant="h6">{r.solicitante}</Typography>
                <Typography>{r.especie} - {r.volume} m³</Typography>
                {r.alerts && r.alerts.map(a => <Alert severity="error" key={a}>{a}</Alert>)}
                <Box mt={2}><MapEmbed lat={r.coords?.lat || r.lat} lng={r.coords?.lng || r.lng} /></Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Dialog open={open} onClose={()=>setOpen(false)} fullWidth>
        <DialogTitle>Novo Input</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="Solicitante" onChange={e=>setForm({...form, solicitante: e.target.value})} />
            <TextField select label="Espécie" value={form.especie} onChange={e=>setForm({...form, especie: e.target.value})}>
               {Object.keys(CONSTANTS.SPECIES_DB).map(k=><MenuItem key={k} value={k}>{k}</MenuItem>)}
            </TextField>
            <Box display="flex" gap={2}>
               <TextField label="CAP (cm)" onChange={e=>setForm({...form, cap: e.target.value})} />
               <TextField label="Alt (m)" onChange={e=>setForm({...form, alt: e.target.value})} />
            </Box>
            <Alert severity="info">Volume Calculado: {vol} m³</Alert>
            <Box display="flex" gap={2}>
               <TextField label="Lat" onChange={e=>setForm({...form, lat: e.target.value})} />
               <TextField label="Lng" onChange={e=>setForm({...form, lng: e.target.value})} />
            </Box>
            <FormControlLabel control={<Switch onChange={e=>setForm({...form, foto: e.target.checked})}/>} label="Foto Raiz Exposta?" />
            <Button variant="contained" onClick={handleSave}>Salvar</Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
