import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
} else {
    console.warn("VITE_GEMINI_API_KEY not found in environment variables");
}

// Função genérica para melhoria de texto com IA
export const improveText = async (text, context = "", type = "improve") => {
    if (!genAI) {
        throw new Error("API Key do Gemini não configurada");
    }

    if (!text || text.length < 5) return text;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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
    } catch (error) {
        console.error("Erro ao chamar Gemini:", error);
        throw error;
    }
};

export const generateDocument = async (type, data) => {
    if (!genAI) {
        throw new Error("API Key do Gemini não configurada");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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

    } catch (error) {
        console.error("Erro ao gerar documento:", error);
        throw error;
    }
};
