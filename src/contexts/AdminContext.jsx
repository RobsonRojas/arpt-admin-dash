import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  INITIAL_PROJECTS, 
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
    const [properties, setProperties] = useState(INITIAL_PROPERTIES);
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

    useEffect(() => {
        getProjects();
    }, []);

    // ==================== REGRAS DE NEGÓCIO - PROJETOS ====================
    
    /**
     * Salvar projeto (criar ou atualizar)
     */
    const handleSaveProject = (projectData) => {
        if (editingProject) {
        // Atualização de projeto existente
        setProjects(prev => prev.map(p => p.id === projectData.id ? projectData : p));
        } else {
        // Criação de novo projeto
        setProjects(prev => [projectData, ...prev]);
        }
        setOpenCadastro(false);
        setEditingProject(null);
        setCurrentView('projects');
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
