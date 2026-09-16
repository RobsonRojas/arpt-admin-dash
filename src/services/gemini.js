import axios from 'axios';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const AI_SERVICE_URL = import.meta.env.VITE_ARPT_AI_URL || 'https://arpt.site/api/ai';
const ARPT_AI_SECRET = import.meta.env.VITE_ARPT_AI_SECRET || 'arpt_ai_secret_token_123456';

// Default configuration if Firestore is empty
const DEFAULT_MODELS = [
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", enabled: true, priority: 1 },
    { id: "gemini-1.5-pro-latest", name: "Gemini 1.5 Pro", enabled: true, priority: 2 },
    { id: "gemini-pro", name: "Gemini Pro (Legacy)", enabled: true, priority: 3 }
];

let dynamicModelsPriority = [];
let lastFetchTime = 0;
const CACHE_TTL = 30000;
const expiredModels = new Set();
let quotaExhaustedCallback = null;

export const setQuotaCallback = (callback) => {
    quotaExhaustedCallback = callback;
};

let genAI = null;
if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
}

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

// Fallback executor if calling client-side SDK directly
const runWithFallbackClientSide = async (operation) => {
    if (!genAI) throw new Error("API Key do Gemini não configurada e serviço arpt-ai indisponível");

    const modelsPriority = await fetchModelConfig();
    let lastError = null;

    for (const modelName of modelsPriority) {
        if (expiredModels.has(modelName)) continue;

        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            return await operation(model, modelName);
        } catch (error) {
            lastError = error;
            const errorMsg = error.message || "";

            if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("exhausted") || errorMsg.includes("503")) {
                console.warn(`Cota esgotada para modelo: ${modelName}. Tentando próximo...`);
                expiredModels.add(modelName);
                if (quotaExhaustedCallback) quotaExhaustedCallback(modelName);
                continue;
            }

            if (errorMsg.includes("404")) {
                expiredModels.add(modelName);
                continue;
            }

            throw error;
        }
    }

    throw lastError || new Error("Nenhum modelo Gemini disponível ou cotas esgotadas.");
};

// Helper: Call backend arpt-ai microservice with Auth header
const callArptAiService = async (endpoint, payload) => {
    const targetUrl = `${AI_SERVICE_URL.replace(/\/$/, '')}${endpoint}`;
    try {
        const response = await axios.post(targetUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ARPT_AI_SECRET}`,
                'x-arpt-ai-secret': ARPT_AI_SECRET,
            },
            timeout: 60000,
        });
        if (response.data && response.data.text) {
            return response.data.text;
        }
        throw new Error("Resposta inválida do serviço arpt-ai");
    } catch (error) {
        let errorMsg = error.message;
        if (error.response && error.response.data && error.response.data.error) {
            errorMsg = error.response.data.error;
        }
        
        console.warn(`[arpt-ai service] Call to ${targetUrl} failed:`, errorMsg);

        if (errorMsg.includes('high demand') || errorMsg.includes('quota') || error.response?.status === 503) {
            throw new Error('O modelo de IA está sobrecarregado (alta demanda) ou a cota esgotou. Tente novamente mais tarde.');
        }

        throw new Error(errorMsg);
    }
};

/**
 * Gera estratégia completa de campanha de crowdfunding
 */
export const generateCampaignStrategy = async (project, products = [], rewards = []) => {
    try {
        return await callArptAiService('/ai/campaign-strategy', { project, products, rewards });
    } catch (err) {
        if (genAI) {
            return runWithFallbackClientSide(async (model) => {
                const prodNames = products.map(p => `${p.nome} (R$ ${p.preco})`).join(", ");
                const rewardNames = rewards.map(r => `${r.name} (R$ ${r.reward_price})`).join(", ");
                const prompt = `
                    Atue como Especialista em Crowdfunding na Amazônia.
                    Projeto: ${project.descricao}
                    Local: ${project.municipio} - ${project.estado}
                    Produtos: ${prodNames}
                    Recompensas: ${rewardNames}
                `;
                const result = await model.generateContent(prompt);
                return (await result.response).text();
            });
        }
        throw err;
    }
};

/**
 * Função genérica para melhoria / tradução de texto com IA
 */
export const improveText = async (text, context = "", type = "improve", sourceText = "") => {
    const targetText = text || sourceText;
    if (!targetText || targetText.length < 5) return targetText;

    try {
        return await callArptAiService('/ai/improve-text', {
            text,
            sourceText,
            context,
            type,
        });
    } catch (err) {
        if (genAI) {
            return runWithFallbackClientSide(async (model) => {
                let specificInstruction = "Melhore a escrita do texto abaixo, tornando-o mais técnico e claro.";
                if (type === 'translate_en') {
                    specificInstruction = "Traduza o texto abaixo do Português para o Inglês mantendo a formatação Markdown.";
                }
                const prompt = `${specificInstruction}\n\nTexto: "${targetText}"\nContexto: ${context}`;
                const result = await model.generateContent(prompt);
                return (await result.response).text();
            });
        }
        throw err;
    }
};

/**
 * Gera documentos formais (licenciamento / árvore caída)
 */
export const generateDocument = async (type, data) => {
    try {
        return await callArptAiService('/ai/generate-document', { type, data });
    } catch (err) {
        if (genAI) {
            return runWithFallbackClientSide(async (model) => {
                const prompt = `Gere documento tipo ${type} para o projeto ${data.descricao || data.specieName}`;
                const result = await model.generateContent(prompt);
                return (await result.response).text();
            });
        }
        throw err;
    }
};

/**
 * Gera um Modelo de Negócio (Business Model Canvas)
 */
export const generateBusinessModel = async (project) => {
    try {
        return await callArptAiService('/ai/improve-text', {
            text: project.descricao,
            context: `Gere um Business Model Canvas em Markdown para o projeto de manejo ${project.descricao} em ${project.municipio}-${project.estado}`,
            type: 'expand',
        });
    } catch (err) {
        if (genAI) {
            return runWithFallbackClientSide(async (model) => {
                const prompt = `Crie um Business Model Canvas para o projeto ${project.descricao}`;
                const result = await model.generateContent(prompt);
                return (await result.response).text();
            });
        }
        throw err;
    }
};

/**
 * Consulta status do serviço arpt-ai (se está habilitado)
 */
export const getAiStatus = async () => {
    const targetUrl = `${AI_SERVICE_URL.replace(/\/$/, '')}/status`;
    try {
        const response = await axios.get(targetUrl, {
            headers: {
                'Authorization': `Bearer ${ARPT_AI_SECRET}`,
                'x-arpt-ai-secret': ARPT_AI_SECRET,
            },
            timeout: 10000,
        });
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
    const targetUrl = `${AI_SERVICE_URL.replace(/\/$/, '')}/status`;
    try {
        const payload = { enabled };
        if (defaultModel) payload.defaultModel = defaultModel;
        
        const response = await axios.post(targetUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ARPT_AI_SECRET}`,
                'x-arpt-ai-secret': ARPT_AI_SECRET,
            },
            timeout: 10000,
        });
        return response.data;
    } catch (error) {
        console.error("[arpt-ai] Failed to set AI status:", error.message);
        throw error;
    }
};

