import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
} else {
    console.warn("VITE_GEMINI_API_KEY not found in environment variables");
}

export const improveText = async (text, context = "") => {
    if (!genAI) {
        throw new Error("API Key do Gemini não configurada");
    }

    if (!text || text.length < 5) return text;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        let prompt = `Você é um assistente especializado em projetos de manejo sustentável e comunidades ribeirinhas.
    Melhore o texto abaixo, tornando-o mais técnico, claro e profissional, mantendo as informações originais.
    Corrija erros de português e pontuação.
    O texto é parte de um projeto de cadastro de unidade de manejo.
    
    Texto Original: "${text}"
    `;

        if (context) {
            prompt += `\nContexto adicional: ${context}`;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textOutput = response.text();

        return textOutput;
    } catch (error) {
        console.error("Erro ao chamar Gemini:", error);
        throw error;
    }
};
