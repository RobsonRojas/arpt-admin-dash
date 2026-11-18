/** Auxiliares da análise da origem da madeira (add-wood-product-origin-compliance). */
export const BASE = '/api/v1/admin/wood';

export const TIPO_ORIGEM = { MANEJO: 'Manejo florestal', ARVORE_CAIDA: 'Árvore caída', REAPROVEITAMENTO: 'Reaproveitamento' };
export const USO_PECA = { DECORACAO: 'Decoração', MOVEL: 'Móvel', UTENSILIO_COZINHA: 'Utensílio de cozinha', BRINQUEDO: 'Brinquedo', OUTRO: 'Outro' };
export const SITUACAO_ESPECIE = { PERMITIDA: 'Permitida', EXIGE_CITES: 'Exige CITES', BLOQUEADA: 'Bloqueada' };

/** Mensagens em linguagem clara para os códigos de erro do backend. */
const MENSAGENS = {
    DOCUMENT_NOT_APPROVED: 'Aprove antes o documento comprovante da origem. Sem ele a declaração não pode ser aprovada.',
    SPECIES_TO_CONFIRM: 'O produtor marcou "não tenho certeza". Escolha a espécie antes de aprovar.',
    JUSTIFICATION_REQUIRED: 'Reaproveitamento sem comprovante fiscal exige a justificativa da aprovação.',
    NOT_UNDER_REVIEW: 'Este item não está mais em análise. Atualize a fila.',
    ENVIRONMENTAL_CLAIM: 'O texto do produtor traz uma alegação ambiental sem comprovação. Peça a correção.',
};

export const mensagemErro = (err, padrao = 'Não foi possível concluir a ação.') => {
    const d = err?.response?.data;
    if (!d) return padrao;
    let texto = MENSAGENS[d.code] || d.error || d.message || padrao;
    if (d.code === 'ORIGIN_INCOMPLETE' && Array.isArray(d.pendencias) && d.pendencias.length) {
        texto = `${d.error || 'A declaração ainda está incompleta.'} Falta: ${d.pendencias.map((p) => p.mensagem).join(' ')}`;
    }
    if (d.code === 'VALIDATION_ERROR' && Array.isArray(d.detalhes) && d.detalhes.length) {
        texto = d.detalhes.map((x) => x.mensagem).join(' ');
    }
    return texto;
};

export const motivoValido = (m) => String(m ?? '').trim().length >= 3;

/** Mesma regra do servidor: 10 a 15 dígitos (com DDD). Devolve o número normalizado ou null. */
export const normalizarWhatsapp = (v) => {
    const d = String(v ?? '').replace(/\D/g, '');
    if (d.length < 10 || d.length > 15) return null;
    return d.length <= 11 ? `55${d}` : d;
};

export const formatarData = (v) => (v ? new Date(v).toLocaleString('pt-BR') : '—');
export const linkMapa = (lat, lng) => `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;

/** Mesma regra do servidor: 4, 6 ou 8 dígitos, pontos só nos lugares certos. Devolve só os dígitos ou null. */
export const normalizarNcm = (v) => {
    const t = String(v ?? '').trim();
    return /^\d{4}(\.?\d{2}(\.?\d{2})?)?$/.test(t) ? t.replace(/\./g, '') : null;
};

/** 44209000 -> 4420.90.00; 442090 -> 4420.90; 4420 fica como está. */
export const formatarNcm = (d) => {
    const s = String(d ?? '');
    return s.length === 8 ? `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6)}` : s.length === 6 ? `${s.slice(0, 4)}.${s.slice(4)}` : s;
};

/** Origem de cada dado da declaração (simplificar-processo-produtor): como foi preenchido. */
export const FONTE_DADO = {
    digitado: { texto: 'Digitado pelo produtor', cor: 'default' },
    copiado: { texto: 'Copiado de outra peça', cor: 'info' },
    padrao_perfil: { texto: 'Padrão do perfil', cor: 'info' },
    ia_leitura: { texto: 'Lido por IA', cor: 'warning' },
    ia_sugestao: { texto: 'Sugerido por IA', cor: 'warning' },
    lote: { texto: 'Aplicado em lote', cor: 'info' },
};

export const ROTULO_CAMPO = {
    tipo_origem: 'Tipo de origem', especies: 'Espécies', ponto: 'Ponto de colheita', municipio: 'Município', comunidade: 'Comunidade', descricao_local: 'Descrição do local',
    uso_previsto: 'Uso', acabamento: 'Acabamento', acabamento_seguro_alimento: 'Acabamento seguro p/ alimento', embalagem: 'Embalagem', embalagem_nimf15: 'Selo NIMF 15',
    autor_nome: 'Nome de quem fez', autor_foto_url: 'Foto de quem fez', historia_pt: 'História (pt)', historia_en: 'História (en)', tecnica: 'Técnica', cuidados: 'Cuidados',
};

/** Linhas para a tela da análise, na ordem dos campos. Só os campos que têm marca. */
export const linhasDeProveniencia = (prov) => Object.keys(ROTULO_CAMPO).filter((c) => prov?.[c]).map((c) => ({ campo: c, rotulo: ROTULO_CAMPO[c], ...prov[c], texto: (FONTE_DADO[prov[c].fonte] ?? { texto: prov[c].fonte }).texto, cor: (FONTE_DADO[prov[c].fonte] ?? {}).cor ?? 'default' }));

/** Quantos campos não foram digitados pelo produtor (para destacar na análise). */
export const naoDigitados = (prov) => linhasDeProveniencia(prov).filter((l) => l.fonte !== 'digitado');
