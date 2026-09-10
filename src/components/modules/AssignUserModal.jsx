import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Autocomplete, TextField, CircularProgress } from '@mui/material';
import { api } from '../../services/api';

export const AssignUserModal = ({ open, onClose, propertyId, propertyName, onAssigned }) => {
  const [openSelect, setOpenSelect] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
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
        const response = await api.get(`/user/search?q=${inputValue}`);
        if (active) {
          setOptions(response.data || []);
        }
      } catch (error) {
        console.error("Erro ao buscar usuários", error);
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
    if (!selectedUser) return;
    setSaving(true);
    try {
      await api.put(`/propriedades/${propertyId}/link-user`, { user_id: selectedUser.id });
      onAssigned();
      onClose();
    } catch (error) {
      console.error("Erro ao vincular usuário", error);
      const errMsg = error.response?.data?.message || "Erro ao vincular usuário";
      alert(errMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Vincular Usuário à Propriedade: {propertyName}</DialogTitle>
      <DialogContent sx={{ pt: 2, minHeight: 200 }}>
        <Autocomplete
          sx={{ mt: 1 }}
          open={openSelect}
          onOpen={() => setOpenSelect(true)}
          onClose={() => setOpenSelect(false)}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          getOptionLabel={(option) => `${option.name || option.first_name || ''} (${option.email})`}
          options={options}
          loading={loading}
          value={selectedUser}
          onChange={(event, newValue) => setSelectedUser(newValue)}
          onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Buscar Usuário (nome ou email)"
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
        <Button onClick={handleSave} disabled={!selectedUser || saving} variant="contained">
          {saving ? 'Vinculando...' : 'Vincular'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
