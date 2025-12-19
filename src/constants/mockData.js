// Dados mockados para desenvolvimento
export const INITIAL_PROJECTS = [
  { 
    id: "PROJ-001", 
    status: "Em Análise", 
    descricao: "Manejo de Pirarucu - Solimões", 
    proponente: "Assoc. Ribeirinha Solimões", 
    estado: "Amazonas", 
    municipio: "Tefé", 
    tamanho: 1200, 
    unidade_medida: "ha", 
    custo_operacional: 85000, 
    latitude: -3.354, 
    longitude: -64.712, 
    potencial: "Manejo de Pesca", 
    ranking: 8, 
    fotos: [], 
    auditoria: { risco: "Baixo", alertas: [] } 
  },
  { 
    id: "PROJ-002", 
    status: "Aprovado", 
    descricao: "Agrofloresta de Cacau Nativo", 
    proponente: "Coop. Verde Vida", 
    estado: "Pará", 
    municipio: "Altamira", 
    tamanho: 450, 
    unidade_medida: "ha", 
    custo_operacional: 120000, 
    latitude: -3.203, 
    longitude: -52.206, 
    potencial: "Produtos Não Madeireiros", 
    ranking: 9, 
    fotos: [], 
    auditoria: { risco: "Baixo", alertas: [] } 
  }
];

export const INITIAL_NECROMASSA = [
  { 
    id: "NECRO-059", 
    solicitante: "João da Silva (Lote 12)", 
    especie_vulgar: "Paxiúba", 
    volume: 0.557, 
    status: "Pendente Correção", 
    data: "2025-11-29", 
    coords: { lat: 58.0, lng: 25.0 }, 
    alerts: ["Coordenada fora da Amazônia Legal", "Volume subestimado"], 
    origem: "WhatsApp" 
  }
];

export const INITIAL_PROPERTIES = [
  { 
    id: "PROP-101", 
    proprietario: "Maria das Graças", 
    car: "AM-1302401-8923", 
    municipio: "Tefé", 
    area: 50, 
    status: "Regular", 
    foto: "https://picsum.photos/200?random=1", 
    coords: { lat: -3.35, lng: -64.71 } 
  },
  { 
    id: "PROP-102", 
    proprietario: "José Ferreira", 
    car: "AM-1302401-9988", 
    municipio: "Alvarães", 
    area: 120, 
    status: "Pendente", 
    foto: "https://picsum.photos/200?random=2", 
    coords: { lat: -3.22, lng: -64.80 } 
  }
];

export const MOCK_SPONSORS = [
  { 
    id: "SPON-001", 
    nome: "EcoFurniture S.A.", 
    tipo: "PJ", 
    contato: "compras@ecofurniture.com", 
    nivel: "Ouro", 
    total_patrocinado: 450000, 
    status: "Ativo", 
    portfolio: [
      { projeto: "Manejo Solimões", valor: 85000, status: "Confirmado" }
    ] 
  },
  { 
    id: "SPON-002", 
    nome: "Tech Green Corp", 
    tipo: "PJ", 
    contato: "esg@tech.com", 
    nivel: "Platina", 
    total_patrocinado: 1200000, 
    status: "Ativo", 
    portfolio: [
      { projeto: "Manejo Madeira", valor: 1200000, status: "Confirmado" }
    ] 
  }
];
