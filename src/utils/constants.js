
export const CONSTANTS = {
  ESTADOS: ["Amazonas", "Pará", "Acre", "Rondônia", "Mato Grosso", "Amapá", "Roraima", "Tocantins", "Maranhão"],
  SPECIES_DB: {
    "Paxiúba": { scientific: "Socratea exorrhiza", ff: 0.9 },
    "Açaí": { scientific: "Euterpe oleracea", ff: 0.85 },
    "Angelim": { scientific: "Hymenolobium petraeum", ff: 0.7 },
    "Outros": { scientific: "N/A", ff: 0.7 }
  }
};

export const MOCK_DATA = {
  projects: [
    { id: "PROJ-001", status: "Em Análise", descricao: "Manejo Pirarucu", proponente: "Assoc. Solimões", municipio: "Tefé", tamanho: 1200, custo: 85000, risco: "Baixo" },
    { id: "PROJ-002", status: "Aprovado", descricao: "Cacau Nativo", proponente: "Coop. Verde", municipio: "Altamira", tamanho: 450, custo: 120000, risco: "Baixo" }
  ],
  necromassa: [
    { id: "NECRO-059", solicitante: "João Silva", especie: "Paxiúba", volume: 0.557, status: "Pendente", lat: 58.0, lng: 25.0, alerts: ["Geofence Error"] }
  ],
  sponsors: [
    { id: "SPON-01", nome: "EcoFurniture", nivel: "Ouro", total: 450000, status: "Ativo" }
  ]
};
