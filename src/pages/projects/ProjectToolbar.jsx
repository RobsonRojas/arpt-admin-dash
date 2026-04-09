import React from 'react';
import { Paper, Toolbar, TextField, MenuItem, Button } from '@mui/material';
import { Search, Add } from '@mui/icons-material';
import { STATUS_PROJETO } from '../../constants';

export const ProjectToolbar = ({ searchTerm, setSearchTerm, filterStatus, setFilterStatus, onNewProject }) => {
  return (
    <Paper sx={{ width: '100%', mb: 2, p: 2 }} elevation={1}>
      <Toolbar sx={{ pl: 0, pr: 0, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Buscar projeto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
          }}
          sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 250 } }}
        />
        <TextField
          select
          label="Status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          sx={{ minWidth: { xs: '100%', sm: 150 } }}
        >
          <MenuItem value="Todos">Todos</MenuItem>
          {STATUS_PROJETO.map(status => (
            <MenuItem key={status} value={status}>{status}</MenuItem>
          ))}
        </TextField>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onNewProject}
          fullWidth={{ xs: true, sm: false }}
          sx={{ height: 55 }}
        >
          Novo Manejo
        </Button>
      </Toolbar>
    </Paper>
  );
};
