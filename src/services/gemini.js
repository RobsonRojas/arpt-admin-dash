import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Default configuration if Firestore is empty
const DEFAULT_MODELS = [
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", enabled: true, priority: 1 },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", enabled: true, priority: 2 },
    { id: "gemini-pro", name: "Gemini Pro (Legacy)", enabled: true, priority: 3 }
];

// Cache for the active models list
let dynamicModelsPriority = [];
let lastFetchTime = 0;
const CACHE_TTL = 30000; // 30 seconds

// Track expired models to avoid immediate retries
const expiredModels = new Set();
// Callback for UI notifications
let quotaExhaustedCallback = null;

export const setQuotaCallback = (callback) => {
    quotaExhaustedCallback = callback;
};

let genAI = null;
if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
} else {
    console.warn("VITE_GEMINI_API_KEY not found in environment variables");
}

/**
 * Fetch and refresh model configuration from Firestore
 */
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
            // Seed defaults if not present
            dynamicModelsPriority = DEFAULT_MODELS.map(m => m.id);
        }

        lastFetchTime = now;
        return dynamicModelsPriority;
    } catch (error) {
        console.error("Error fetching Gemini config:", error);
        return DEFAULT_MODELS.filter(m => m.enabled).map(m => m.id);
    }
};

/**
 * Save model configuration to Firestore
 */
export const saveModelConfig = async (models) => {
    try {
        const docRef = doc(db, 'settings', 'gemini');
        await setDoc(docRef, { models, updatedAt: new Date() });
        dynamicModelsPriority = []; // Clear cache
        return true;
    } catch (error) {
        console.error("Error saving Gemini config:", error);
        return false;
    }
};

/**
 * Custom Error for Quota Exhaustion
 */
export class QuotaError extends Error {
    constructor(model, message) {
        super(message);
        this.name = "QuotaError";
        this.model = model;
    }
}

/**
 * Execute a function with model fallback
 */
const runWithFallback = async (operation) => {
    if (!genAI) throw new Error("API Key do Gemini não configurada");

    // Ensure models are loaded
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

            // Check for Quota Exceeded (429) or Service Overloaded (503)
            if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("exhausted") || errorMsg.includes("503")) {
                console.warn(`Cota esgotada ou serviço indisponível para o modelo: ${modelName}. Tentando próximo...`);
                expiredModels.add(modelName);

                if (quotaExhaustedCallback) {
                    quotaExhaustedCallback(modelName);
                }

                continue; // Try next model
            }

            // If it's a 404, the model might not exist
            if (errorMsg.includes("404")) {
                console.warn(`Modelo não encontrado: ${modelName}.`);
                expiredModels.add(modelName);
                continue;
            }

            // For other errors, rethrow immediately
            throw error;
        }
    }

    throw lastError || new Error("Nenhum modelo Gemini disponível ou cotas esgotadas.");
};

// Função genérica para melhoria de texto com IA
export const improveText = async (text, context = "", type = "improve") => {
    if (!text || text.length < 5) return text;

    return runWithFallback(async (model, modelName) => {
        let specificInstruction = "";

        switch (type) {
            case "expand":
                specificInstruction = "Expanda o texto abaixo com mais detalhes relevantes, mantendo o tom profissional.";
                break;
            case "summarize":
                specificInstruction = "Resuma o texto abaixo mantendo os pontos chave de forma concisa.";
                break;
            case "fix":
                specificInstruction = "Corrija apenas erros gramaticais e de pontuação do texto abaixo, mantendo o estilo original.";
                break;
            case "improve":
            default:
                specificInstruction = "Melhore a escrita do texto abaixo, tornando-o mais técnico, claro e profissional.";
                break;
        }

        let prompt = `Você é um assistente especializado em gestão de projetos e administração.
    ${specificInstruction}
    
    Texto Original: "${text}"
    `;

        if (context) {
            prompt += `\nContexto adicional: ${context}`;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    });
};

export const generateDocument = async (type, data) => {
    return runWithFallback(async (model, modelName) => {
        let prompt = "";

        if (type === 'fallen_tree') {
            prompt = `
      Atue como um advogado ambientalista especializado.
      Gere um REQUERIMENTO FORMAL para o órgão ambiental competente (IPAAM/IBAMA) solicitando a AUTORIZAÇÃO PARA O APROVEITAMENTO DE ÁRVORE MORTA/CAÍDA.

      Dados da Árvore:
      - Espécie: ${data.specieName}
      - Nome Popular: ${data.popularName}
      - DAP: ${data.dap} cm
      - Volume Estimado: ${data.volume} m³
      - Localização (Coord): Lat ${data.latitude}, Long ${data.longitude}
      - Justificativa: Árvore caída naturalmente, oferecendo risco ou desperdício de recurso.

      Estrutura do documento:
      1. Cabeçalho (Ao Ilmo. Sr. Diretor...)
      2. Qualificação do Requerente (deixar lacunas para CPF, RG, Endereço)
      3. Dos Fatos (Descrever a árvore e a situação)
      4. Do Pedido (Solicitar autorização para desdobro e transporte)
      5. Fechamento (Local, Data, Assinatura)

      Use linguagem formal, jurídica e técnica.
      `;
        } else if (type === 'licensing') {
            prompt = `
      Atue como um consultor florestal experiente.
      Gere uma CARTA DE SOLICITAÇÃO DE LICENCIAMENTO AMBIENTAL PARA MANEJO FLORESTAL EM PEQUENA ESCALA.

      Dados do Projeto:
      - Nome do Projeto: ${data.descricao}
      - Município: ${data.municipio} - ${data.estado}
      - Área Total: ${data.tamanho} ${data.unidade_medida}
      - Proponente: ${data.proponente}

      O documento deve solicitar a análise e aprovação do Plano de Manejo Florestal Sustentável (PMFS).
      Inclua solicitação de vistoria técnica preliminar.

      Use linguagem formal e administrativa.
      `;
        } else {
            return "Tipo de documento desconhecido.";
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    });
};

