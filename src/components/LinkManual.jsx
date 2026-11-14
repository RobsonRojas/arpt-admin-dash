import { Badge, Button } from '@mui/material';
import { MenuBook } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { resumo, secaoDaRota } from '../manual/dados';

/** Botão "Manual" no cabeçalho da área corrente, apontando para a seção correspondente. Sem seção no mapa, não aparece. */
export const LinkManual = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const secao = secaoDaRota(pathname);
    if (!secao || pathname.startsWith('/manual')) return null;
    const n = resumo.porArea[secao]?.total ?? 0;
    return (
        <Badge badgeContent={n} color="warning" max={999} sx={{ mr: 1 }}>
            <Button size="small" variant="outlined" startIcon={<MenuBook />} onClick={() => navigate(`/manual/${secao}`)} data-testid="link-manual" aria-label={n ? `Manual desta área (${n} pendências)` : 'Manual desta área'}>
                Manual
            </Button>
        </Badge>
    );
};
