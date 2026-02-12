import React, { useState, useEffect } from 'react';
import {
  Box, Button, Grid, TextField, MenuItem, Paper, Typography,
  Stepper, Step, StepLabel, Alert, Avatar, Divider
} from '@mui/material';
import {
  Map, CloudUpload, ArrowForward, CheckCircle, Save, AutoFixHigh, ContentCopy
} from '@mui/icons-material';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { ESTADOS, UNIDADES, POTENCIAIS } from '../constants';
import { improveText } from '../services/gemini';
import { CircularProgress, IconButton, Snackbar } from '@mui/material';
import { AIAssistant } from './AIAssistant';

export const FieldAppEmbedded = ({ onClose, onSave, initialData, properties = [], statuses = [] }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loadingAI, setLoadingAI] = useState({ resumo: false, detalhes: false });
  const [errorLog, setErrorLog] = useState(null);

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
    data_inicio: "",
    data_termino: "",
    id_propriedade: "",
    id_status: "",
    custo_operacional: "",
    ranking: 5,
    resumo: "",
    detalhes: "",
    fotos: [],
    auditoria: { risco: "Baixo", alertas: [] },
    status: "Em Análise"
  };

  const [formData, setFormData] = useState(defaultState);

  // Load from local storage or initialData
  useEffect(() => {
    if (initialData) {
      // Check for saved draft specific to this project ID
      const draftKey = `project_draft_${initialData.id}`;
      const savedDraft = localStorage.getItem(draftKey);

      let baseData = { ...initialData };

      // Ensure dates are formatted as YYYY-MM-DD for input[type="date"]
      if (baseData.data_inicio && baseData.data_inicio.includes('T')) {
        baseData.data_inicio = baseData.data_inicio.split('T')[0];
      }
      if (baseData.data_termino && baseData.data_termino.includes('T')) {
        baseData.data_termino = baseData.data_termino.split('T')[0];
      }

      // Ensure id_status is set (fallback to status or default)
      if (!baseData.id_status && baseData.status) {
        baseData.id_status = baseData.status;
      }

      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (window.confirm(`Existe um rascunho salvo para ${initialData.descricao}. Deseja continuar editando?`)) {
            setFormData(parsed);
          } else {
            setFormData(baseData);
            localStorage.removeItem(draftKey);
          }
        } catch (e) {
          console.error("Erro ao ler rascunho", e);
          setFormData(baseData);
        }
      } else {
        setFormData(baseData);
      }
    } else {
      const savedDraft = localStorage.getItem('project_draft_new');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (window.confirm("Existe um novo projeto em rascunho. Deseja continuar editando?")) {
            setFormData(parsed);
          } else {
            setFormData(defaultState);
            localStorage.removeItem('project_draft_new');
          }
        } catch (e) {
          console.error("Erro ao ler rascunho", e);
          setFormData(defaultState);
        }
      } else {
        setFormData(defaultState);
      }
    }
  }, [initialData]);

  // Save to local storage
  useEffect(() => {
    const draftKey = initialData ? `project_draft_${initialData.id}` : 'project_draft_new';
    localStorage.setItem(draftKey, JSON.stringify(formData));
  }, [formData, initialData]);

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
      fotos: [...prev.fotos, {
        src: `https://picsum.photos/600?random=${randomId}`,
        alt: `Foto do projeto ${prev.descricao || 'Novo'} - ${randomId}`,
        type: 'image/jpeg'
      }]
    }));
  };

  const handleFinish = async () => {
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

    try {
      await onSave(projectToSave);
      // Clear draft on success
      const draftKey = initialData ? `project_draft_${initialData.id}` : 'project_draft_new';
      localStorage.removeItem(draftKey);
    } catch (error) {
      console.error("Erro ao salvar projeto:", error);
      let errorMsg = error.message;
      if (error.response?.data) {
        errorMsg = JSON.stringify(error.response.data, null, 2);
      }
      setErrorLog(errorMsg);
    }
  };

  const renderStep = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Propriedade Vinculada (Opcional)"
                name="id_propriedade"
                value={formData.id_propriedade || ""}
                onChange={handleChange}
                helperText="Selecione a propriedade à qual este projeto pertence"
              >
                <MenuItem value="">
                  <em>Nenhuma</em>
                </MenuItem>
                {properties.map((prop) => (
                  <MenuItem key={prop.id} value={prop.id}>
                    {prop.name || prop.nome} ({prop.municipio || prop.address || prop.id_municipality || 'N/A'})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
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
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Status do Projeto"
                name="id_status"
                value={formData.id_status || ""}
                onChange={handleChange}
                helperText="Selecione o status atual do projeto"
              >
                {statuses.map((st) => (
                  <MenuItem key={st.id} value={st.id}>
                    {st.description}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Data Início"
                name="data_inicio"
                value={formData.data_inicio || ""}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Data Término"
                name="data_termino"
                value={formData.data_termino || ""}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
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
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box>
                    <Typography variant="subtitle2">Geolocalização</Typography>
                    <Typography variant="caption">
                      Insira manualmente ou use o GPS
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleGeoLocation}
                    startIcon={<Map />}
                  >
                    Obter GPS
                  </Button>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Latitude"
                      name="latitude"
                      type="number"
                      value={formData.latitude}
                      onChange={handleChange}
                      InputProps={{ inputProps: { step: "any" } }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Longitude"
                      name="longitude"
                      type="number"
                      value={formData.longitude}
                      onChange={handleChange}
                      InputProps={{ inputProps: { step: "any" } }}
                    />
                  </Grid>
                </Grid>
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
                  src={f.src || f.url || f}
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
          pt: 2,
          mt: 2
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

      {/* Error Log Area */}
      {errorLog && (
        <Paper
          sx={{
            mt: 4,
            p: 2,
            bgcolor: '#ffebee',
            border: '1px solid #ef5350',
            position: 'relative'
          }}
        >
          <Typography variant="subtitle2" color="error" gutterBottom>
            Erro ao salvar projeto
          </Typography>
          <IconButton
            size="small"
            onClick={() => {
              navigator.clipboard.writeText(errorLog);
              alert("Log de erro copiado!");
            }}
            sx={{ position: 'absolute', top: 5, right: 5 }}
          >
            <ContentCopy fontSize="small" />
          </IconButton>
          <Box
            component="pre"
            sx={{
              overflowX: 'auto',
              fontSize: '0.75rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: 200,
              overflowY: 'auto'
            }}
          >
            {errorLog}
          </Box>
        </Paper>
      )}
    </Box>
  );
};
