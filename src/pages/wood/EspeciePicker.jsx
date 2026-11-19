import { useEffect, useRef, useState } from 'react';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { api } from '../../services/api';
import { BASE } from '../../utils/wood';

const rotulo = (e) => `${e.nome_principal_pt} (${e.nome_cientifico})`;

/**
 * Escolha de espécie com busca no servidor (a lista tem milhares de espécies; não dá para carregar tudo nem listar todas).
 * `value`: objeto da espécie (ou lista deles com `multiple`). `soAtivas` (padrão) e `semBloqueadas` filtram as opções.
 */
export function EspeciePicker({ value, onChange, multiple = false, label = 'Espécie', soAtivas = true, semBloqueadas = false, size = 'small', sx, ...resto }) {
    const [texto, setTexto] = useState('');
    const [opcoes, setOpcoes] = useState([]);
    const [buscando, setBuscando] = useState(false);
    const [erro, setErro] = useState(false);
    const ultima = useRef(0);

    useEffect(() => {
        const minha = ++ultima.current;
        setBuscando(true);
        const t = setTimeout(() => {
            api.get(`${BASE}/species`, { params: { q: texto.trim() || undefined, por_pagina: 20, ...(soAtivas ? { ativo: 'true' } : {}) } })
                .then((r) => { if (minha === ultima.current) { setOpcoes((r.data.especies ?? []).filter((e) => !(semBloqueadas && e.situacao === 'BLOQUEADA'))); setErro(false); } })
                .catch(() => { if (minha === ultima.current) { setOpcoes([]); setErro(true); } })
                .finally(() => { if (minha === ultima.current) setBuscando(false); });
        }, 300);
        return () => clearTimeout(t);
    }, [texto, soAtivas, semBloqueadas]);

    return (
        <Autocomplete
            size={size} sx={sx} multiple={multiple} value={value ?? (multiple ? [] : null)} onChange={(_, v) => onChange(v)}
            options={opcoes} filterOptions={(x) => x} getOptionLabel={rotulo} isOptionEqualToValue={(a, b) => a.id === b.id}
            inputValue={texto} onInputChange={(_, v, motivo) => { if (motivo === 'input' || motivo === 'clear') setTexto(v); }}
            loading={buscando} loadingText="Buscando..." noOptionsText={erro ? 'Não foi possível buscar agora.' : 'Nenhuma espécie encontrada.'}
            renderInput={(params) => (
                <TextField {...params} label={label} helperText="Digite parte do nome popular ou científico."
                    InputProps={{ ...params.InputProps, endAdornment: <>{buscando ? <CircularProgress size={16} /> : null}{params.InputProps.endAdornment}</> }} />
            )}
            {...resto}
        />
    );
}
