import { api } from './api';

// Sempre pela API do backend (papel administrador). Este fluxo NÃO usa o fallback com chave do navegador de gemini.js:
// texto jurídico em rascunho não deve sair por uma chave exposta no front. Se a API falhar, o painel mostra o erro e a escrita segue manual.
const OPCOES = { timeout: 120000 }; // revisão de texto longo pode passar do limite padrão de 8 s da instância

export const revisarTermo = async ({ text, audience, clauseFreight }) => {
    const { data } = await api.post('/admin/ai/terms/review', { text, audience, contem_clausula_frete: !!clauseFreight }, OPCOES);
    return data;
};

export const traduzirTermo = async ({ text, audience }) => {
    const { data } = await api.post('/admin/ai/terms/translate', { text, audience }, OPCOES);
    return data;
};
