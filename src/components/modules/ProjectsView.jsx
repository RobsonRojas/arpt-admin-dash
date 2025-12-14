import React, { useState, useMemo } from 'react';
import { Box, Paper, Toolbar, Typography, TextField, MenuItem, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Drawer, Divider, List, ListItem, ListItemText } from '@mui/material';
import { Search, Add, Visibility } from '@mui/icons-material';
import { StatusChip, RiskChip } from '../common/Chips';
import MapEmbed from '../common/MapEmbed';

const ProjectsView = ({ projects, onStatusChange, onOpenCadastro }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("Todos");
    const [selectedProject, setSelectedProject] = useState(null);

    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = 
                (project.descricao?.toLowerCase().includes(searchLower) || false) ||
                (project.municipio?.toLowerCase().includes(searchLower) || false);
            const matchesStatus = filterStatus === "Todos" ? true : project.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [projects, searchTerm, filterStatus]);

    return (
        <Box sx={{ animation: 'fadeIn 0.5s' }}>
            <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
                <Toolbar sx={{ pl: 0, pr: 0, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField label="Buscar projeto..." size="small" value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} InputProps={{startAdornment:<Search sx={{mr:1, color:'action.active'}}/>}} sx={{flexGrow:1}} />
                    <TextField select label="Status" size="small" value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)} sx={{minWidth:150}}>
                        <MenuItem value="Todos">Todos</MenuItem>
                        <MenuItem value="Em Análise">Em Análise</MenuItem>
                        <MenuItem value="Aprovado">Aprovado</MenuItem>
                    </TextField>
                    <Button variant="contained" startIcon={<Add />} onClick={onOpenCadastro}>Novo</Button>
                </Toolbar>
            </Paper>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead><TableRow><TableCell>Projeto</TableCell><TableCell>Status</TableCell><TableCell>Custo</TableCell><TableCell align="right">Ação</TableCell></TableRow></TableHead>
                    <TableBody>
                        {filteredProjects.map(p => (
                            <TableRow key={p.id}>
                                <TableCell><Typography variant="body2" fontWeight="bold">{p.descricao}</Typography><Typography variant="caption">{p.municipio}</Typography></TableCell>
                                <TableCell><StatusChip status={p.status} /></TableCell>
                                <TableCell>R$ {p.custo_operacional}</TableCell>
                                <TableCell align="right"><IconButton size="small" onClick={()=>setSelectedProject(p)}><Visibility /></IconButton></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Drawer anchor="right" open={Boolean(selectedProject)} onClose={() => setSelectedProject(null)} PaperProps={{ sx: { width: { xs: '100%', md: 500 } } }}>
                {selectedProject && (
                    <Box p={3} display="flex" flexDirection="column" height="100%">
                        <Typography variant="h6">{selectedProject.descricao}</Typography>
                        <Divider sx={{my:2}} />
                        <Box flexGrow={1}>
                            <MapEmbed lat={-3.354} lng={-64.712} />
                            <List>
                                <ListItem><ListItemText primary="Proponente" secondary={selectedProject.proponente} /></ListItem>
                                <ListItem><ListItemText primary="Área" secondary={`${selectedProject.tamanho} ${selectedProject.unidade_medida}`} /></ListItem>
                                <ListItem><ListItemText primary="Risco Auditoria" secondary={<RiskChip level={selectedProject.auditoria.risco} />} /></ListItem>
                            </List>
                        </Box>
                        <Box sx={{mt:2, display:'flex', gap:2, justifyContent:'flex-end'}}>
                            {selectedProject.status === 'Em Análise' && (
                                <>
                                    <Button variant="outlined" color="error" onClick={()=>onStatusChange(selectedProject.id, 'Rejeitado')}>Rejeitar</Button>
                                    <Button variant="contained" color="success" onClick={()=>onStatusChange(selectedProject.id, 'Aprovado')}>Aprovar</Button>
                                </>
                            )}
                        </Box>
                    </Box>
                )}
            </Drawer>
        </Box>
    );
};
export default ProjectsView;
