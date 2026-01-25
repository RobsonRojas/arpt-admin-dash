import React, { useState, useEffect } from 'react';
import {
  Box, Button, Grid, TextField, MenuItem, Paper, Typography,
  Stepper, Step, StepLabel, Alert, Avatar, Divider
} from '@mui/material';
import {
  Map, CloudUpload, ArrowForward, CheckCircle, Save, AutoFixHigh
} from '@mui/icons-material';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { ESTADOS, UNIDADES, POTENCIAIS } from '../constants';
import { improveText } from '../services/gemini';
import { CircularProgress } from '@mui/material';
import { AIAssistant } from './AIAssistant';

export const FieldAppEmbedded = ({ onClose, onSave, initialData }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loadingAI, setLoadingAI] = useState({ resumo: false, detalhes: false });

  const defaultState = {
    id: null,
    descricao: "",
    proponente: "Técnico Administrativo",
    estado: "Amazonas",
    municipio: "",
    tamanho: "",
    unidade_medida: "ha",
    latitude: 0,
    longitude: 0,
    potencial: "Manejo de Madeira",
    data_submissao: new Date().toISOString().split('T')[0],
    custo_operacional: "",
    ranking: 5,
    resumo: "",
    detalhes: "",
    fotos: [],
    auditoria: { risco: "Baixo", alertas: [] },
    status: "Em Análise"
  };

  const [formData, setFormData] = useState(defaultState);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData(defaultState);
    }
  }, [initialData]);

  const steps = ['Identificação', 'Detalhes Técnicos', 'Resumo e Detalhes', 'Mídia', 'Revisão'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGeoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setFormData(prev => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        })),
        () => alert("Erro ao obter GPS")
      );
    }
  };



  const handleAddPhoto = () => {
    const randomId = Math.floor(Math.random() * 100);
    setFormData(prev => ({
      ...prev,
      fotos: [...prev.fotos, `https://picsum.photos/600?random=${randomId}`]
    }));
  };

  const handleFinish = () => {
    if (!formData.descricao || !formData.municipio) {
      alert("Preencha os campos obrigatórios");
      return;
    }

    const projectToSave = {
      ...formData,
      id: formData.id || `PROJ-${Math.floor(Math.random() * 1000)}`,
      custo_operacional: Number(formData.custo_operacional),
      tamanho: Number(formData.tamanho)
    };

    onSave(projectToSave);
  };

  const renderStep = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Nome do Projeto / Comunidade"
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
              >
                {ESTADOS.map((opt) => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Município"
                name="municipio"
                value={formData.municipio}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: '#f1f8e9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box>
                  <Typography variant="subtitle2">Geolocalização</Typography>
                  <Typography variant="caption">
                    Lat: {Number(formData.latitude).toFixed(4)} / Long: {Number(formData.longitude).toFixed(4)}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleGeoLocation}
                  startIcon={<Map />}
                >
                  GPS
                </Button>
              </Paper>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={8}>
              <TextField
                fullWidth
                type="number"
                label="Tamanho da Área"
                name="tamanho"
                value={formData.tamanho}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                select
                fullWidth
                label="Unid."
                name="unidade_medida"
                value={formData.unidade_medida}
                onChange={handleChange}
              >
                {UNIDADES.map((u) => (
                  <MenuItem key={u} value={u}>{u}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Potencial"
                name="potencial"
                value={formData.potencial}
                onChange={handleChange}
              >
                {POTENCIAIS.map((p) => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Custo Operacional (R$)"
                name="custo_operacional"
                value={formData.custo_operacional}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              import {AIAssistant} from './AIAssistant';

              // ... inside FieldAppEmbedded ...

              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box>
                  <Typography variant="subtitle2">
                    Resumo do Projeto
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Breve descrição do projeto (suporta Markdown)
                  </Typography>
                </Box>
                <AIAssistant
                  initialText={formData.resumo}
                  context={`Projeto: ${formData.descricao}`}
                  onApply={(text) => setFormData(prev => ({ ...prev, resumo: text }))}
                />
              </Box>
              <Box sx={{ mt: 1 }} data-color-mode="light">
                <MDEditor
                  value={formData.resumo}
                  onChange={(value) => setFormData(prev => ({ ...prev, resumo: value || '' }))}
                  preview="edit"
                  height={200}
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box>
                  <Typography variant="subtitle2">
                    Detalhes do Projeto
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Informações detalhadas sobre o projeto (suporta Markdown)
                  </Typography>
                </Box>
                <AIAssistant
                  initialText={formData.detalhes}
                  context={`Projeto: ${formData.descricao}`}
                  onApply={(text) => setFormData(prev => ({ ...prev, detalhes: text }))}
                />
              </Box>
              <Box sx={{ mt: 1 }} data-color-mode="light">
                <MDEditor
                  value={formData.detalhes}
                  onChange={(value) => setFormData(prev => ({ ...prev, detalhes: value || '' }))}
                  preview="edit"
                  height={300}
                />
              </Box>
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUpload />}
              onClick={handleAddPhoto}
            >
              Simular Upload
            </Button>
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                mt: 2,
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}
            >
              {formData.fotos.map((f, i) => (
                <Avatar
                  key={i}
                  src={f}
                  variant="rounded"
                  sx={{ width: 80, height: 80 }}
                />
              ))}
              {formData.fotos.length === 0 && (
                <Typography variant="caption" display="block">
                  Sem fotos
                </Typography>
              )}
            </Box>
          </Box>
        );

      case 4:
        return (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info">
              <Typography variant="subtitle2" gutterBottom>
                Revisão Final {initialData ? "(Edição)" : "(Novo)"}
              </Typography>
              <Typography variant="body2">
                <strong>Projeto:</strong> {formData.descricao}
              </Typography>
              <Typography variant="body2">
                <strong>Local:</strong> {formData.municipio} - {formData.estado}
              </Typography>
              <Typography variant="body2">
                <strong>Área:</strong> {formData.tamanho} {formData.unidade_medida}
              </Typography>
              <Typography variant="body2">
                <strong>Valor:</strong> R$ {formData.custo_operacional}
              </Typography>
            </Alert>

            {formData.resumo && (
              <Paper variant="outlined" sx={{ mt: 2, p: 2 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Resumo do Projeto
                </Typography>
                <Divider sx={{ mb: 1 }} />
                <Box data-color-mode="light">
                  <MDEditor.Markdown source={formData.resumo} style={{ whiteSpace: 'pre-wrap' }} />
                </Box>
              </Paper>
            )}

            {formData.detalhes && (
              <Paper variant="outlined" sx={{ mt: 2, p: 2 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Detalhes do Projeto
                </Typography>
                <Divider sx={{ mb: 1 }} />
                <Box data-color-mode="light">
                  <MDEditor.Markdown source={formData.detalhes} style={{ whiteSpace: 'pre-wrap' }} />
                </Box>
              </Paper>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map(label => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ minHeight: 300, py: 2 }}>
        {renderStep(activeStep)}
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          borderTop: '1px solid #eee',
          pt: 2
        }}
      >
        <Button
          disabled={activeStep === 0}
          onClick={() => setActiveStep(p => p - 1)}
        >
          Voltar
        </Button>

        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            color="primary"
            onClick={handleFinish}
            startIcon={initialData ? <Save /> : <CheckCircle />}
          >
            {initialData ? "Atualizar" : "Finalizar"}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={() => setActiveStep(p => p + 1)}
            endIcon={<ArrowForward />}
          >
            Próximo
          </Button>
        )}
      </Box>
    </Box>
  );
};
