import React, { memo } from 'react';
import { TableRow, TableCell, IconButton } from '@mui/material';
import { Edit, Description, Image as ImageIcon, Delete as DeleteIcon } from '@mui/icons-material';

const TreeRow = memo(({ tree, onOpenPhotos, onEdit, onDelete, onGenerateDocument }) => {
    return (
        <TableRow hover>
            <TableCell>{tree.id}</TableCell>
            <TableCell fontWeight="bold">{tree.number ?? '-'}</TableCell>
            <TableCell>{tree.specieName}</TableCell>
            <TableCell>{tree.popularName || '-'}</TableCell>
            <TableCell>{tree.cap ? parseFloat(tree.cap).toFixed(2) : '-'} cm</TableCell>
            <TableCell>{tree.dap ? parseFloat(tree.dap).toFixed(2) : '-'} cm</TableCell>
            <TableCell>{tree.volume ? parseFloat(tree.volume).toFixed(2) : '-'} m³</TableCell>
            <TableCell>{tree.height ? parseFloat(tree.height).toFixed(2) : '-'} m</TableCell>
            <TableCell align="center">
                <IconButton
                    size="small"
                    color="default"
                    onClick={() => onOpenPhotos(tree.id)}
                    title="Ver Fotos"
                >
                    <ImageIcon fontSize="small" />
                </IconButton>
                <IconButton
                    size="small"
                    color="primary"
                    onClick={() => onEdit(tree)}
                    title="Editar"
                >
                    <Edit fontSize="small" />
                </IconButton>
                {tree.classification === 'Árvore Caída' && (
                    <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => onGenerateDocument(tree)}
                        title="Gerar Documento"
                    >
                        <Description fontSize="small" />
                    </IconButton>
                )}
                <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDelete(tree.id)}
                    title="Excluir"
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </TableCell>
        </TableRow>
    );
});

TreeRow.displayName = 'TreeRow';

export default TreeRow;
