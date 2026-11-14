import { Chip, Tooltip } from '@mui/material';
import { WarningAmber } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { resumo } from '../manual/dados';

/** Alerta fixo no cabeçalho com as pendências abertas (ações manuais em destaque). Leva à seção de pendências do manual. Some com zero. */
export const AlertaPendencias = () => {
    const navigate = useNavigate();
    if (!resumo.total) return null;
    const rotulo = `${resumo.total} pendências${resumo.manuais ? ` · ${resumo.manuais} ações manuais` : ''}`;
    return (
        <Tooltip title="Ver todas as pendências no manual">
            <Chip
                icon={<WarningAmber />} color={resumo.manuais ? 'warning' : 'info'} label={rotulo} onClick={() => navigate('/manual/pendencias')}
                data-testid="alerta-pendencias" aria-label={`${rotulo}. Abrir pendências no manual`}
                sx={{ mr: 1, maxWidth: { xs: 130, sm: 'none' }, fontWeight: 600 }}
            />
        </Tooltip>
    );
};
