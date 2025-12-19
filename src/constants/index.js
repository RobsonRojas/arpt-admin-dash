// Constantes da aplicação
export const ESTADOS = [
  "Amazonas", "Pará", "Acre", "Rondônia", "Mato Grosso", 
  "Amapá", "Roraima", "Tocantins", "Maranhão"
];

export const UNIDADES = ["ha", "m²", "km²"];

export const SPECIES_DB = {
  "Paxiúba": { 
    scientific: "Socratea exorrhiza", 
    ff: 0.9, 
    type: "Palmeira" 
  },
  "Açaí": { 
    scientific: "Euterpe oleracea", 
    ff: 0.85, 
    type: "Palmeira" 
  },
  "Angelim": { 
    scientific: "Hymenolobium petraeum", 
    ff: 0.7, 
    type: "Dicotiledônea" 
  },
  "Cumaru": { 
    scientific: "Dipteryx odorata", 
    ff: 0.7, 
    type: "Dicotiledônea" 
  },
  "Outros": { 
    scientific: "N/A", 
    ff: 0.7, 
    type: "Geral" 
  }
};

export const POTENCIAIS = [
  "Manejo de Madeira", 
  "Preservação", 
  "Carbono",
  "Manejo de Pesca",
  "Produtos Não Madeireiros"
];

export const STATUS_PROPRIEDADE = ["Regular", "Pendente", "Irregular"];

export const NIVEIS_PATROCINADOR = ["Bronze", "Prata", "Ouro", "Platina"];

export const STATUS_PROJETO = ["Em breve", "Ativo", "Concluído", "Suspenso", "Cancelado"];

export const RISCOS_AUDITORIA = ["Baixo", "Médio", "Alto"];
