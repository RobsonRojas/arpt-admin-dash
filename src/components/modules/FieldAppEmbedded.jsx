import React, { useState } from 'react';
import { Box, Stepper, Step, StepLabel, Grid, TextField, Paper, Typography, Button, Alert } from '@mui/material';
import { Map, CloudUpload, ArrowBack, CheckCircle, ArrowForward } from '@mui/icons-material';
import { CONSTANTS } from '../../utils/constants';

const FieldAppEmbedded = ({ onClose, onSave }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({ descricao: "", municipio: "Tefé", tamanho: "", custo: "" });
  const steps = ['Dados', 'Revisão'];

  return (
    <Box>
       <Stepper activeStep={activeStep} alternativeLabel>{steps.map(l => <Step key={l}><StepLabel>{l}</StepLabel></Step>)}</Stepper>
       <Box sx={{ minHeight: 200, mt: 2 }}>
          {activeStep === 0 ? (
              <Grid container spacing={2}>
                  <Grid item xs={12}><TextField fullWidth label="Nome do Projeto" value={formData.descricao} onChange={e=>setFormData({...formData, descricao: e.target.value})} /></Grid>
                  <Grid item xs={6}><TextField fullWidth label="Município" value={formData.municipio} onChange={e=>setFormData({...formData, municipio: e.target.value})} /></Grid>
                  <Grid item xs={6}><TextField fullWidth label="Tamanho (ha)" type="number" value={formData.tamanho} onChange={e=>setFormData({...formData, tamanho: e.target.value})} /></Grid>
                  <Grid item xs={12}><TextField fullWidth label="Custo Operacional (R$)" type="number" value={formData.custo} onChange={e=>setFormData({...formData, custo: e.target.value})} /></Grid>
              </Grid>
          ) : (
              <Alert severity="info">Confirme os dados: {formData.descricao} em {formData.municipio}, {formData.tamanho} ha.</Alert>
          )}
       </Box>
       <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button disabled={activeStep === 0} onClick={()=>setActiveStep(0)} startIcon={<ArrowBack />}>Voltar</Button>
          {activeStep === 0 ? <Button variant="contained" onClick={()=>setActiveStep(1)} endIcon={<ArrowForward />}>Próximo</Button> : <Button variant="contained" color="success" onClick={() => onSave({...formData, id: "NEW-001", status: "Em Análise", auditoria: {risco: "Baixo"}})} startIcon={<CheckCircle />}>Finalizar</Button>}
       </Box>
    </Box>
  );
};
export default FieldAppEmbedded;
