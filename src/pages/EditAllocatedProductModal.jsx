import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, Alert, CircularProgress
} from '@mui/material';
import { api } from '../services/api';

export function EditAllocatedProductModal({ open, onClose, storeId, product, onUpdateSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [seoKeywords, setSeoKeywords] = useState('');
  const [tags, setTags] = useState('');
  const [marketingScripts, setMarketingScripts] = useState('');

  useEffect(() => {
    if (open && product) {
      setError('');
      try {
        const config = typeof product.allocation_config === 'string' 
          ? JSON.parse(product.allocation_config) 
          : (product.allocation_config || {});
          
        setSeoKeywords(config.seoKeywords || '');
        setTags(config.tags || '');
        setMarketingScripts(config.marketingScripts || '');
      } catch (err) {
        console.error("Erro ao parsear allocation_config", err);
        setSeoKeywords('');
        setTags('');
        setMarketingScripts('');
      }
    }
  }, [open, product]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      await api.put(`/api/v1/admin/dropshipping/stores/${storeId}/products/${product.id}`, {
        seoKeywords,
        tags,
        marketingScripts
      });

      onUpdateSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erro ao atualizar produto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Configurações do Produto</DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Produto: <strong>{product?.nome}</strong>
            </Typography>

            <TextField
              label="Palavras-chave SEO"
              variant="outlined"
              fullWidth
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
              placeholder="ex: cadeira sustentável, madeira certificada"
              helperText="Separadas por vírgula. Melhora a indexação da página do produto."
            />

            <TextField
              label="Tags"
              variant="outlined"
              fullWidth
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="ex: lançamento, destaque"
              helperText="Tags para agrupar ou destacar o produto na loja."
            />

            <TextField
              label="Scripts de Marketing (Pixel/Tag Manager)"
              variant="outlined"
              fullWidth
              multiline
              rows={4}
              value={marketingScripts}
              onChange={(e) => setMarketingScripts(e.target.value)}
              placeholder="<script>...</script>"
              helperText="Scripts que serão inseridos especificamente na página deste produto."
              InputProps={{
                sx: { fontFamily: 'monospace', fontSize: '0.875rem' }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={loading} startIcon={loading ? <CircularProgress size={20} /> : null}>
            Salvar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
