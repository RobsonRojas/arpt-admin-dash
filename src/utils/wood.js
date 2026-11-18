/** Auxiliares da análise da origem da madeira (add-wood-product-origin-compliance). */
export const BASE = '/api/v1/admin/wood';

export const TIPO_ORIGEM = { MANEJO: 'Manejo florestal', ARVORE_CAIDA: 'Árvore caída', REAPROVEITAMENTO: 'Reaproveitamento' };
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
