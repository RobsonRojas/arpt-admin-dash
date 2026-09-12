import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Autocomplete, TextField, CircularProgress } from '@mui/material';
import { api } from '../../services/api';

export const AssignPropertyModal = ({ open, onClose, userId, userName, onAssigned }) => {
  const [openSelect, setOpenSelect] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedProp, setSelectedProp] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    if (inputValue !== '' && inputValue.length < 2) {
      setOptions([]);
      return undefined;
    }

    setLoading(true);

    (async () => {
      try {
        const response = await api.get(`/propriedades/search?q=${inputValue}`);
        if (active) {
          setOptions(response.data || []);
        }
      } catch (error) {
        console.error("Erro ao buscar propriedades", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [inputValue]);

  const handleSave = async () => {
    if (!selectedProp) return;
    setSaving(true);
    try {
      await api.put(`/propriedades/${selectedProp.id}/link-user`, { user_id: userId });
      onAssigned();
      onClose();
    } catch (error) {
      console.error("Erro ao vincular propriedade", error);
      const errMsg = error.response?.data?.message || "Erro ao vincular propriedade";
      alert(errMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Vincular Propriedade ao Usuário: {userName}</DialogTitle>
      <DialogContent sx={{ pt: 2, minHeight: 200 }}>
        <Autocomplete
          sx={{ mt: 1 }}
          open={openSelect}
          onOpen={() => setOpenSelect(true)}
          onClose={() => setOpenSelect(false)}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          getOptionLabel={(option) => option.name || ''}
          options={options}
          loading={loading}
          value={selectedProp}
          onChange={(event, newValue) => setSelectedProp(newValue)}
          onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Buscar Propriedade (nome)"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button onClick={handleSave} disabled={!selectedProp || saving} variant="contained">
          {saving ? 'Vinculando...' : 'Vincular'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
