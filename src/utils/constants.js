export const CONSTANTS = {
  ESTADOS: ["Amazonas", "Pará", "Acre", "Rondônia", "Mato Grosso", "Amapá", "Roraima", "Tocantins", "Maranhão"],
  UNIDADES: ["ha", "m²", "km²"],
  SPECIES_DB: {
    "Paxiúba": { scientific: "Socratea exorrhiza", ff: 0.9, type: "Palmeira" },
    "Açaí": { scientific: "Euterpe oleracea", ff: 0.85, type: "Palmeira" },
    "Angelim": { scientific: "Hymenolobium petraeum", ff: 0.7, type: "Dicotiledônea" },
    "Cumaru": { scientific: "Dipteryx odorata", ff: 0.7, type: "Dicotiledônea" },
    "Outros": { scientific: "N/A", ff: 0.7, type: "Geral" }
  }
};

export const INITIAL_PROJECTS = [
  { id: "PROJ-001", status: "Em Análise", descricao: "Manejo de Pirarucu - Solimões", proponente: "Assoc. Ribeirinha Solimões", municipio: "Tefé", tamanho: 1200, unidade_medida: "ha", custo_operacional: 85000, auditoria: { risco: "Baixo", alertas: [] } },
  { id: "PROJ-002", status: "Aprovado", descricao: "Agrofloresta de Cacau Nativo", proponente: "Coop. Verde Vida", municipio: "Altamira", tamanho: 450, unidade_medida: "ha", custo_operacional: 120000, auditoria: { risco: "Baixo", alertas: [] } },
  { id: "PROJ-004", status: "Em Análise", descricao: "Plano de Manejo Madeireiro", proponente: "Madeireira Legal Ltda", municipio: "Porto Velho", tamanho: 5000, unidade_medida: "ha", custo_operacional: 1500000, auditoria: { risco: "Alto", alertas: ["Sobreposição com Terra Indígena detectada no CAR"] } }
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

export const MOCK_SPONSORS = [
  {
    id: "SPON-001", nome: "EcoFurniture S.A.", tipo: "Pessoa Jurídica", contato: "compras@ecofurniture.com", nivel: "Ouro", total_patrocinado: 450000, status: "Ativo",
    portfolio: [{ projeto: "Manejo Solimões", valor: 85000, status: "Confirmado" }]
  },
  {
    id: "SPON-002", nome: "Tech Green Corp", tipo: "Pessoa Jurídica", contato: "esg@tech.com", nivel: "Platina", total_patrocinado: 1200000, status: "Ativo",
    portfolio: [{ projeto: "Manejo Madeira", valor: 1200000, status: "Confirmado" }]
  }
];
