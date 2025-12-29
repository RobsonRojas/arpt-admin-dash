import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  INITIAL_PROPERTIES, 
  INITIAL_NECROMASSA, 
  MOCK_SPONSORS 
} from '../constants/mockData';
import { api } from '../services/api.js';

// Criar o Context
const AdminContext = createContext();

// Hook personalizado para usar o context
export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin deve ser usado dentro de um AdminProvider');
  }
  return context;
};

// Provider do Context
export const AdminProvider = ({ children }) => {
    // ==================== ESTADOS ====================
    
    // Navegação
    const [currentView, setCurrentView] = useState('dashboard');
    const [mobileOpen, setMobileOpen] = useState(false);
    
    // Dados
    const [projects, setProjects] = useState([]);
    const [properties, setProperties] = useState([]);
    const [necromassaRequests, setNecromassaRequests] = useState(INITIAL_NECROMASSA);
    const [sponsors] = useState(MOCK_SPONSORS);
    
    // Gerenciamento de Projetos
    const [openCadastro, setOpenCadastro] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("Todos");

    const getProjects = async () => {
        try {
            const response = await api.get("/manejos");
            setProjects(response.data);
        } catch (error) {
            console.error("Error fetching projects:", error);
        }
    }

    // Helper: normaliza payload para API (tipos e campos exigidos)
    const normalizeProjectForApi = (p) => {
        const statusMap = {
            'Em breve': 1,
            'Aguardando inventario': 2,
            'Inventariado': 3,
            'Finalizado prospecção': 4,
            'Em captação': 5,
            // Fallback para possíveis desc_status antigos
            'Em Análise': 2,
            'Ativo': 3,
        };

        const numericStatus = (() => {
            if (p == null) return 1;
            // Se já vier status numérico
            if (typeof p.status === 'number' && p.status > 0) return p.status;
            const st = Number(p.status);
            if (!Number.isNaN(st) && st > 0) return st;
            
            // Se vier id_status numérico
            if (p.id_status != null) {
                const is = Number(p.id_status);
                if (!Number.isNaN(is) && is > 0) return is;
            }
            // cod_status existente
            if (p.cod_status != null) {
                const cs = Number(p.cod_status);
                if (!Number.isNaN(cs) && cs > 0) return cs;
            }
            // desc_status mapeado
            if (p.desc_status && statusMap[p.desc_status]) return statusMap[p.desc_status];
            // status textual comum
            if (typeof p.status === 'string' && statusMap[p.status]) return statusMap[p.status];
            
            return 1;
        })();

        // Mapear apenas os campos que a API espera para UPDATE
        const payload = {
            id: p.id,
            descricao: p.descricao || '',
            resumo: p.resumo || '',
            detalhes: p.detalhes || '',
            estado: p.estado || '',
            municipio: p.municipio || '',
            potencial: p.potencial || '',
            tamanho: Number(p.tamanho || 0),
            unidade_medida: p.unidade_medida || 'ha',
            latitude: Number(p.latitude || 0),
            longitude: Number(p.longitude || 0),
            ranking: Number(p.ranking || 0),
            custo_operacional: Number(p.custo_operacional || 0),
            valor_arrecadado: Number(p.valor_arrecadado || 0),
            url_doacao: p.url_doacao || '',
            id_status: numericStatus,
            // Campos opcionais que podem estar no objeto
            ...(p.data_inicio && { data_inicio: p.data_inicio }),
            ...(p.data_termino && { data_termino: p.data_termino }),
            ...(p.intervalo_tempo_manejo && { intervalo_tempo_manejo: p.intervalo_tempo_manejo }),
            ...(p.expira_anos && { expira_anos: p.expira_anos }),
            ...(p.nome && { nome: p.nome }),
            ...(p.id_propriedade && { id_propriedade: p.id_propriedade }),
        };

        return payload;
    };

    const updateProject = async (newProject) => {
        if (!newProject?.id) {
            const err = new Error('Projeto inválido: id ausente');
            console.error(err);
            throw err;
        }

        try {
            const payload = normalizeProjectForApi(newProject);
            const response = await api.put(`/manejos/${newProject.id}`, payload);
            if (response.status === 200) {
                console.log('Projeto atualizado com sucesso na API.');
                await getProjects();
                return response;
            }
            const unexpected = new Error(`Resposta inesperada ao atualizar projeto: status ${response.status}`);
            console.warn(unexpected, response);
            throw unexpected;
        } catch (error) {
            console.error('ERROR: Error updating project:', error);
            if (error.response?.data) {
                console.error('Detalhes do erro:', error.response.data);
            }
            throw error;
        }
    }

    const getProperties = async () => {
        
        const response = await api.get('/propriedades');
        console.log("Propriedades fetched:", response.data);
        if (response.status === 200) {
            setProperties(response.data);
        }

    };

    // ==================== REGRAS DE NEGÓCIO - PROJETOS ====================
    
    /**
     * Salvar projeto (criar ou atualizar)
     */
    const handleSaveProject = async (projectData) => {
        try {
            if (editingProject) {
                // Atualização via API para projeto existente
                await updateProject(projectData);
            } else {
                // Criação de novo projeto (mantém local por enquanto)
                setProjects(prev => [projectData, ...prev]);
            }
            setOpenCadastro(false);
            setEditingProject(null);
            setCurrentView('projects');
        } catch (error) {
            console.error('ERROR: Error saving project:', error);
            window.alert('Não foi possível salvar o projeto. Verifique os dados e tente novamente.');
        }
    };

    /**
     * Abrir modal de edição de projeto
     */
    const handleEditProject = (project) => {
        setEditingProject(project);
        setOpenCadastro(true);
    };

    /**
     * Deletar projeto
     */
    const handleDeleteProject = (projectId) => {
        if (window.confirm('Tem certeza que deseja deletar este projeto?')) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        }
    };

    /**
     * Abrir modal para novo projeto
     */
    const handleOpenNewProject = () => {
        setEditingProject(null);
        setOpenCadastro(true);
    };

    /**
     * Fechar modal de cadastro
     */
    const handleCloseCadastro = () => {
        setOpenCadastro(false);
        setEditingProject(null);
    };

    // ==================== REGRAS DE NEGÓCIO - PROPRIEDADES ====================
    
    /**
     * Adicionar nova propriedade
     */
    const handleAddProperty = (property) => {
        const newProperty = {
        ...property,
        id: `PROP-${Math.floor(Math.random() * 10000)}`,
        area: Number(property.area),
        coords: { 
            lat: Number(property.lat) || -3.0, 
            lng: Number(property.lng) || -60.0 
        }
        };
        setProperties(prev => [newProperty, ...prev]);
    };

    /**
     * Atualizar propriedade existente
     */
    const handleUpdateProperty = (property) => {
        const updatedProperty = {
        ...property,
        area: Number(property.area),
        coords: { 
            lat: Number(property.lat), 
            lng: Number(property.lng) 
        }
        };
        setProperties(prev => prev.map(p => p.id === property.id ? updatedProperty : p));
    };

    /**
     * Deletar propriedade
     */
    const handleDeleteProperty = (propertyId) => {
        if (window.confirm('Tem certeza que deseja deletar esta propriedade?')) {
        setProperties(prev => prev.filter(p => p.id !== propertyId));
        }
    };

    // ==================== REGRAS DE NEGÓCIO - NECROMASSA ====================
    
    /**
     * Adicionar nova solicitação de necromassa
     */
    const handleAddNecromassa = (request) => {
        const newRequest = {
        ...request,
        id: `NECRO-${Math.floor(Math.random() * 1000)}`,
        data: new Date().toISOString().split('T')[0],
        origem: "WhatsApp"
        };
        setNecromassaRequests(prev => [newRequest, ...prev]);
    };

    /**
     * Atualizar status de solicitação de necromassa
     */
    const handleUpdateNecromassaStatus = (requestId, newStatus) => {
        setNecromassaRequests(prev => 
        prev.map(req => req.id === requestId ? { ...req, status: newStatus } : req)
        );
    };

    /**
     * Deletar solicitação de necromassa
     */
    const handleDeleteNecromassa = (requestId) => {
        if (window.confirm('Tem certeza que deseja deletar esta solicitação?')) {
        setNecromassaRequests(prev => prev.filter(req => req.id !== requestId));
        }
    };

    // ==================== REGRAS DE NEGÓCIO - NAVEGAÇÃO ====================
    
    /**
     * Alternar menu mobile
     */
    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    /**
     * Navegar para uma view específica
     */
    const navigateTo = (view) => {
        setCurrentView(view);
        if (mobileOpen) setMobileOpen(false);
    };

    // ==================== REGRAS DE NEGÓCIO - FILTROS E BUSCA ====================
    
    /**
     * Filtrar projetos por termo de busca e status
     */
    const getFilteredProjects = () => {
        return projects.filter(project => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
            (project.descricao?.toLowerCase().includes(searchLower) || false) ||
            (project.municipio?.toLowerCase().includes(searchLower) || false) ||
            (project.estado?.toLowerCase().includes(searchLower) || false);
        const matchesStatus = filterStatus === "Todos" ? true : project.desc_status === filterStatus;
        return matchesSearch && matchesStatus;
        });
    };

    /**
     * Calcular estatísticas do dashboard
     */
    const getDashboardStats = () => {
        const totalArea = projects.reduce((sum, p) => sum + parseFloat(p.tamanho || 0), 0);
        const totalInvestimento = projects.reduce((sum, p) => sum + parseFloat(p.custo_operacional || 0), 0);
        const pendentes = projects.filter(p => p.desc_status === 'Em breve').length;
        const aprovados = projects.filter(p => p.desc_status === 'Ativo').length;

        return {
        area: totalArea,
        investimento: totalInvestimento,
        pendentes,
        aprovados
        };
    };

    useEffect(() => {
        getProjects();
        getProperties();
    }, []);

    // ==================== VALOR DO CONTEXTO ====================
    const value = {
        // Estados
        currentView,
        mobileOpen,
        projects,
        properties,
        necromassaRequests,
        sponsors,
        openCadastro,
        editingProject,
        selectedProject,
        searchTerm,
        filterStatus,
        
        // Setters (para casos específicos)
        setCurrentView,
        setMobileOpen,
        setSelectedProject,
        setSearchTerm,
        setFilterStatus,
        setOpenCadastro,
        
        // Regras de Negócio - Projetos
        handleSaveProject,
        handleEditProject,
        handleDeleteProject,
        handleOpenNewProject,
        handleCloseCadastro,
        updateProject,
        
        // Regras de Negócio - Propriedades
        handleAddProperty,
        handleUpdateProperty,
        handleDeleteProperty,
        
        // Regras de Negócio - Necromassa
        handleAddNecromassa,
        handleUpdateNecromassaStatus,
        handleDeleteNecromassa,
        
        // Regras de Negócio - Navegação
        handleDrawerToggle,
        navigateTo,
        
        // Regras de Negócio - Utilitários
        getFilteredProjects,
        getDashboardStats,
    };

    return (
        <AdminContext.Provider value={value}>
        {children}
        </AdminContext.Provider>
    );
};
