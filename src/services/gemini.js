import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Default configuration if Firestore is empty
const DEFAULT_MODELS = [
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", enabled: true, priority: 1 },
    { id: "gemini-1.5-pro-latest", name: "Gemini 1.5 Pro", enabled: true, priority: 2 },
    { id: "gemini-pro", name: "Gemini Pro (Legacy)", enabled: true, priority: 3 }
];

let dynamicModelsPriority = [];
let lastFetchTime = 0;
const CACHE_TTL = 30000;
let quotaExhaustedCallback = null;

export const setQuotaCallback = (callback) => {
    quotaExhaustedCallback = callback;
};

export const fetchModelConfig = async (forceRefresh = false) => {
    const now = Date.now();
    if (!forceRefresh && dynamicModelsPriority.length > 0 && (now - lastFetchTime < CACHE_TTL)) {
        return dynamicModelsPriority;
    }

    try {
        const docRef = doc(db, 'settings', 'gemini');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data().models || [];
            dynamicModelsPriority = data
                .filter(m => m.enabled)
                .sort((a, b) => a.priority - b.priority)
                .map(m => m.id);
        } else {
            dynamicModelsPriority = DEFAULT_MODELS.map(m => m.id);
        }

        lastFetchTime = now;
        return dynamicModelsPriority;
    } catch (error) {
        console.error("Error fetching Gemini config:", error);
        return DEFAULT_MODELS.filter(m => m.enabled).map(m => m.id);
    }
};

export const saveModelConfig = async (models) => {
    try {
        const docRef = doc(db, 'settings', 'gemini');
        await setDoc(docRef, { models, updatedAt: new Date() });
        dynamicModelsPriority = [];
        return true;
    } catch (error) {
        console.error("Error saving Gemini config:", error);
        return false;
    }
};

export class QuotaError extends Error {
    constructor(model, message) {
        super(message);
        this.name = "QuotaError";
        this.model = model;
    }
}

// Toda chamada de IA vai pela manejo-api (token do administrador). Nenhuma chave nem segredo de IA existe no navegador.
const chamarIa = async (endpoint, payload) => {
    try {
        const { api } = await import('./api');
        const response = await api.post(`/admin/ai${endpoint}`, payload, { timeout: 60000 });
        const text = response.data?.text ?? response.data?.result;
        if (typeof text === 'string' && text) return text;
        throw new Error('Resposta inválida do serviço de IA');
    } catch (error) {
        const status = error.response?.status;
        const errorMsg = error.response?.data?.error || error.message || '';
        if (status === 503 || /high demand|quota/i.test(errorMsg)) {
            if (quotaExhaustedCallback) quotaExhaustedCallback('arpt-ai');
            throw new Error('O modelo de IA está sobrecarregado (alta demanda) ou a cota esgotou. Tente novamente mais tarde.');
        }
        throw new Error(errorMsg);
    }
};

/**
 * Gera estratégia completa de campanha de crowdfunding
 */
export const generateCampaignStrategy = async (project, products = [], rewards = []) =>
    chamarIa('/campaign-strategy', { project, products, rewards });

/**
 * Função genérica para melhoria / tradução de texto com IA
 */
export const improveText = async (text, context = "", type = "improve", sourceText = "") => {
    const targetText = text || sourceText;
    if (!targetText || targetText.length < 2) return targetText;
    const { api } = await import('./api');
    const response = await api.post('/admin/ai/translate', { text: targetText, sourceText, context, type });
    return response.data?.text || response.data?.result || response.data;
};

/**
 * Gera documentos formais (licenciamento / árvore caída)
 */
export const generateDocument = async (type, data) => chamarIa('/generate-document', { type, data });

/**
 * Gera um Modelo de Negócio (Business Model Canvas)
 */
export const generateBusinessModel = async (project) =>
    improveText(
        project.descricao,
        `Gere um Business Model Canvas em Markdown para o projeto de manejo ${project.descricao} em ${project.municipio}-${project.estado}`,
        'expand',
    );

/**
 * Consulta status do serviço arpt-ai (se está habilitado)
 */
export const getAiStatus = async () => {
    try {
        const { api } = await import('./api');
        const response = await api.get('/admin/ai/status', { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.warn("[arpt-ai] Failed to get AI status:", error.message);
        return { enabled: true, error: error.message };
    }
};

/**
 * Habilita ou desabilita o serviço arpt-ai via API e define o defaultModel
 */
export const setAiStatus = async (enabled, defaultModel = undefined) => {
    const payload = { enabled };
    if (defaultModel) payload.defaultModel = defaultModel;
    const { api } = await import('./api');
    const response = await api.post('/admin/ai/status', payload, { timeout: 10000 });
    return response.data;
};
