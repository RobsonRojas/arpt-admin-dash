import { useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import { motivoValido } from '../../utils/wood';

/** Pede o motivo (obrigatório) antes de recusar, pedir correção ou reabrir. */
export function ReasonDialog({ titulo, descricao, rotulo = 'Motivo', confirmar = 'Confirmar', minimo = 3, onConfirm, onClose, erro }) {
    const [texto, setTexto] = useState('');
    const [tocou, setTocou] = useState(false);
    const valido = minimo === 3 ? motivoValido(texto) : texto.trim().length >= minimo;
    const enviar = () => { setTocou(true); if (valido) onConfirm(texto.trim()); };
    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{titulo}</DialogTitle>
            <DialogContent>
                {descricao && <Typography variant="body2" sx={{ mb: 2 }}>{descricao}</Typography>}
                {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
                <TextField autoFocus fullWidth multiline minRows={3} label={rotulo} value={texto} onChange={(e) => setTexto(e.target.value)}
                    error={tocou && !valido} helperText={tocou && !valido ? `Informe o ${rotulo.toLowerCase()} (mínimo ${minimo} caracteres).` : 'O produtor recebe este texto.'} inputProps={{ maxLength: 1000 }} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button variant="contained" onClick={enviar}>{confirmar}</Button>
            </DialogActions>
        </Dialog>
    );
}
