import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    INITIAL_NECROMASSA,
    MOCK_SPONSORS
} from '../constants/mockData';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext';
import { recordAudit } from '../services/auditLog';

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
    const { user } = useAuth();
    // ==================== ESTADOS ====================
    const urlMidiasFiles = "https://arpt.site/api/midias/files/";

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
            fotos: (p.fotos || []).map(f => ({
                src: f.src || f.url || f,
                alt: f.alt || `Foto do projeto ${p.descricao || ''}`.padEnd(10, '_'),
                type: f.type || 'image/jpeg'
            })),
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
            const before = projects.find(p => p.id === newProject.id);
            const payload = normalizeProjectForApi(newProject);
            const response = await api.put(`/manejos/${newProject.id}`, payload);
            if (response.status === 200) {
                console.log('Projeto atualizado com sucesso na API.');

                // Audit Log
                await recordAudit({
                    action: 'UPDATE',
                    entity: 'PROJECT',
                    entityId: String(newProject.id),
                    before,
                    after: newProject,
                    user
                });

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

    const createProject = async (newProject) => {
        try {
            const payload = normalizeProjectForApi(newProject);
            // Remove ID for creation allowing backend/DB to assign
            delete payload.id;

            const response = await api.post('/manejos', payload);
            if (response.status === 201 || response.status === 200) {
                console.log('Projeto criado com sucesso na API.');
                await recordAudit({
                    action: 'CREATE',
                    entity: 'PROJECT',
                    entityId: String(response.data.id),
                    before: null,
                    after: newProject,
                    user
                });
                await getProjects();
                return response.data;
            }
            const unexpected = new Error(`Resposta inesperada ao criar projeto: status ${response.status}`);
            console.warn(unexpected, response);
            throw unexpected;
        } catch (error) {
            console.error('ERROR: Error creating project:', error);
            throw error;
        }
    }

    const getProperties = async () => {

        try {
            const response = await api.get('/propriedades');
            if (response.status === 200) {
                setProperties(response.data);
            }
        } catch (error) {
            console.error("Error fetching properties:", error);
            alert("Não foi possível carregar as propriedades. Tente novamente mais tarde.");
        }

    };

    const getInventoriesByPropertyId = async (propertyId) => {
        try {
            const response = await api.get(`/propriedades/${propertyId}/inventarios`);
            if (response.status === 200) {
                return response.data;
            } else {
                console.warn(`Resposta inesperada ao buscar inventários: status ${response.status}`);
                return null;
            }
        } catch (error) {
            console.error("Error fetching inventories by property ID:", error);
            return null;
        }
    }

    const getTreesByInventoryId = async (inventoryId, page = 1, pageSize = 100) => {
        try {
            const response = await api.get(`/inventarios/${inventoryId}/arvores`, {
                params: { page, pageSize }
            });
            if (response.status === 200) {
                return response.data;
            } else {
                console.warn(`Resposta inesperada ao buscar árvores: status ${response.status}`);
                return null;
            }
        } catch (error) {
            console.error("Error fetching trees by inventory ID:", error);
            return null;
        }
    }

    const getAllInventoryByPropertyId = async (propertyId, page = 1, pageSize = 10, options = {}) => {
        try {
            const { sortBy, sortOrder, filters } = options;
            const params = { page, pageSize };

            if (sortBy) params.sortBy = sortBy;
            if (sortOrder) params.sortOrder = sortOrder;

            if (filters) {
                if (filters.plate) params.plate = filters.plate;
                if (filters.specie) params.specie = filters.specie;
                if (filters.popularName) params.popularName = filters.popularName;
                if (filters.dapMin) params.dapMin = filters.dapMin;
                if (filters.dapMax) params.dapMax = filters.dapMax;
                if (filters.volumeMin) params.volumeMin = filters.volumeMin;
                if (filters.volumeMax) params.volumeMax = filters.volumeMax;
                if (filters.heightMin) params.heightMin = filters.heightMin;
                if (filters.heightMax) params.heightMax = filters.heightMax;
            }

            const response = await api.get(`/inventarios/${propertyId}/arvores`, {
                params
            });
            if (response.status === 200) {
                return response.data;
            } else {
                console.warn(`Resposta inesperada ao buscar inventário: status ${response.status}`);
                return null;
            }
        } catch (error) {
            console.error("Error fetching inventory by property ID:", error);
            return null;
        }
    }

    const createInventory = async (payload) => {
        try {
            const response = await api.post('/inventarios', payload);
            if (response.status === 201 || response.status === 200) {
                return response.data;
            }
            console.warn(`Resposta inesperada ao criar inventário: status ${response.status}`);
            return null;
        } catch (error) {
            console.error("Error creating inventory:", error);
            return null;
        }
    }

    const createTree = async (inventoryId, payload) => {
        try {
            const response = await api.post(`/arvores`, payload);
            if (response.status === 201 || response.status === 200) {
                return response.data;
            }
            console.warn(`Resposta inesperada ao criar árvore: status ${response.status}`);
            return null;
        } catch (error) {
            console.error("Error creating tree:", error);
            return null;
        }
    }

    const updateTree = async (treeId, payload) => {
        try {
            const response = await api.put(`/arvores/${treeId}`, payload);
            if (response.status === 200) {
                return response.data;
            }
            console.warn(`Resposta inesperada ao atualizar árvore: status ${response.status}`);
            return null;
        } catch (error) {
            console.error("Error updating tree:", error);
            return null;
        }
    }

    const deleteTree = async (treeId) => {
        try {
            const response = await api.delete(`/arvores/${treeId}`);
            if (response.status === 200) {
                return true;
            }
            console.warn(`Resposta inesperada ao deletar árvore: status ${response.status}`);
            return false;
        } catch (error) {
            console.error("Error deleting tree:", error);
            return false;
        }
    }

    const uploadTreePhoto = async (treeId, file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post(`/arvores/${treeId}/photo_upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 200 || response.status === 201) {
                return response.data;
            }
            console.warn(`Resposta inesperada ao fazer upload de foto: status ${response.status}`);
            return null;
        } catch (error) {
            console.error("Error uploading tree photo:", error);
            return null;
        }
    }

    const createTreePhoto = async (payload) => {
        try {
            const response = await api.post('/arvorefotos', payload);
            if (response.status === 200 || response.status === 201) {
                return response.data;
            }
            console.warn(`Resposta inesperada ao registrar foto: status ${response.status}`);
            return null;
        } catch (error) {
            console.error("Error creating tree photo record:", error);
            return null;
        }
    }

    const getTreePhotos = async (treeId) => {
        try {
            const response = await api.get(`/arvores/${treeId}/photos`);
            if (response.status === 200) {
                return response.data;
            }
            console.warn(`Resposta inesperada ao buscar fotos da arvore: status ${response.status}`);
            return [];
        } catch (error) {
            console.error("Error fetching tree photos:", error);
            return [];
        }
    }

    const getTreeHistory = async (treeId) => {
        try {
            const response = await api.get(`/arvores/${treeId}/transactions`);
            if (response.status === 200) {
                return response.data;
            }
            console.warn(`Resposta inesperada ao buscar histórico da árvore: status ${response.status}`);
            return [];
        } catch (error) {
            console.error("Error fetching tree history:", error);
            return [];
        }
    }

    // ==================== REWARDS (PRODUTOS) MANAGEMENT ====================

    const getRewardsByManejoId = async (manejoId) => {
        try {
            const response = await api.get(`/manejos/${manejoId}/produtos`);
            if (response.status === 200) {
                return response.data;
            } else {
                console.warn(`Resposta inesperada ao buscar recompensas: status ${response.status}`);
                return null;
            }
        } catch (error) {
            console.error("Error fetching rewards by manejo ID:", error);
            return null;
        }
    }

    const getRewardById = async (manejoId, productId) => {
        try {
            const response = await api.get(`/manejos/${manejoId}/produtos/${productId}`);
            if (response.status === 200) {
                return response.data;
            } else {
                console.warn(`Resposta inesperada ao buscar recompensa: status ${response.status}`);
                return null;
            }
        } catch (error) {
            console.error("Error fetching reward by ID:", error);
            return null;
        }
    }

    const createReward = async (manejoId, payload) => {
        try {
            const response = await api.post(`/manejos/${manejoId}/produtos`, payload);
            if (response.status === 201 || response.status === 200) {
                await recordAudit({
                    action: 'CREATE',
                    entity: 'REWARD',
                    entityId: String(response.data.id || 'new'), // Entity ID might be in response
                    before: null,
                    after: { ...payload, manejoId },
                    user
                });
                return response.data;
            }
            console.warn(`Resposta inesperada ao criar recompensa: status ${response.status}`);
            return null;
        } catch (error) {
            console.error("Error creating reward:", error);
            return null;
        }
    }

    const updateReward = async (manejoId, productId, payload) => {
        try {
            // We don't easily have 'before' state here without fetching it first
            // or passing it. For now, let's use the payload as 'after'
            const response = await api.put(`/manejos/${manejoId}/produtos/${productId}`, payload);
            if (response.status === 200) {
                await recordAudit({
                    action: 'UPDATE',
                    entity: 'REWARD',
                    entityId: String(productId),
                    before: null, // Would need fetching
                    after: { ...payload, manejoId, productId },
                    user
                });
                return response.data;
            }
            console.warn(`Resposta inesperada ao atualizar recompensa: status ${response.status}`);
            return null;
        } catch (error) {
            console.error("Error updating reward:", error);
            return null;
        }
    }

    const deleteReward = async (manejoId, productId) => {
        try {
            const response = await api.delete(`/manejos/${manejoId}/produtos/${productId}`);
            if (response.status === 200 || response.status === 204) {
                await recordAudit({
                    action: 'DELETE',
                    entity: 'REWARD',
                    entityId: String(productId),
                    before: { manejoId, productId },
                    after: null,
                    user
                });
                return true;
            }
            console.warn(`Resposta inesperada ao deletar recompensa: status ${response.status}`);
            return false;
        } catch (error) {
            console.error("Error deleting reward:", error);
            return false;
        }
    }

    // ==================== DOCS MANAGEMENT ====================

    const getDocsByManejoId = async (manejoId) => {
        try {
            const response = await api.get(`/manejos/${manejoId}/docs`);
            if (response.status === 200) {
                return response.data;
            }
            console.warn(`Resposta inesperada ao buscar documentos: status ${response.status}`);
            return null;
        } catch (error) {
            console.error("Error fetching docs by manejo ID:", error);
            return null;
        }
    }

    const createDoc = async (manejoId, payload) => {
        try {
            // If payload has a file, use FormData
            let data = payload;
            let headers = {};

            if (payload instanceof FormData) {
                data = payload;
                headers = { 'Content-Type': 'multipart/form-data' };
            }

            const response = await api.post(`/manejos/${manejoId}/docs`, data, { headers });
            if (response.status === 201 || response.status === 200) {
                return response.data;
            }
            console.warn(`Resposta inesperada ao criar documento: status ${response.status}`);
            return null;
        } catch (error) {
            console.error("Error creating doc:", error);
            return null;
        }
    }

    const deleteDoc = async (manejoId, docId) => {
        try {
            const response = await api.delete(`/manejos/${manejoId}/docs/${docId}`);
            if (response.status === 200 || response.status === 204) {
                return true;
            }
            console.warn(`Resposta inesperada ao deletar documento: status ${response.status}`);
            return false;
        } catch (error) {
            console.error("Error deleting doc:", error);
            return false;
        }
    }

    // ==================== INCIDENTS MANAGEMENT ====================

    const getIncidentsByManejoId = async (manejoId) => {
        try {
            const response = await api.get(`/manejos/${manejoId}/incidents`);
            if (response.status === 200) {
                return response.data;
            }
            console.warn(`Resposta inesperada ao buscar incidentes: status ${response.status}`);
            return null;
        } catch (error) {
            console.error("Error fetching incidents by manejo ID:", error);
            return null;
        }
    }

    const createIncident = async (manejoId, payload) => {
        try {
            const response = await api.post(`/manejos/${manejoId}/incidents`, payload);
            if (response.status === 201 || response.status === 200) {
                return response.data;
            }
            console.warn(`Resposta inesperada ao criar incidente: status ${response.status}`);
            return null;
        } catch (error) {
            console.error("Error creating incident:", error);
            return null;
        }
    }

    const updateIncident = async (manejoId, incidentId, payload) => {
        try {
            const response = await api.put(`/manejos/${manejoId}/incidents/${incidentId}`, payload);
            if (response.status === 200) {
                return response.data;
            }
            console.warn(`Resposta inesperada ao atualizar incidente: status ${response.status}`);
            return null;
        } catch (error) {
            console.error("Error updating incident:", error);
            return null;
        }
    }

    const deleteIncident = async (manejoId, incidentId) => {
        try {
            const response = await api.delete(`/manejos/${manejoId}/incidents/${incidentId}`);
            if (response.status === 200 || response.status === 204) {
                return true;
            }
            console.warn(`Resposta inesperada ao deletar incidente: status ${response.status}`);
            return false;
        } catch (error) {
            console.error("Error deleting incident:", error);
            return false;
        }
    }

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
                // Criação de novo projeto via API
                await createProject(projectData);
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
    const handleDeleteProject = async (projectId) => {
        if (window.confirm('Tem certeza que deseja deletar este projeto?')) {
            const before = projects.find(p => p.id === projectId);

            // Logically we should call an API here, but current code only updates local state
            // Let's record the audit anyway
            await recordAudit({
                action: 'DELETE',
                entity: 'PROJECT',
                entityId: String(projectId),
                before,
                after: null,
                user
            });

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
    const handleAddProperty = async (property) => {
        const newProperty = {
            ...property,
            id: `PROP-${Math.floor(Math.random() * 10000)}`,
            area: Number(property.area),
            coords: {
                lat: Number(property.lat) || -3.0,
                lng: Number(property.lng) || -60.0
            }
        };

        await recordAudit({
            action: 'CREATE',
            entity: 'PROPERTY',
            entityId: newProperty.id,
            before: null,
            after: newProperty,
            user
        });

        setProperties(prev => [newProperty, ...prev]);
    };

    /**
     * Atualizar propriedade existente
     */
    const handleUpdateProperty = async (property) => {
        const before = properties.find(p => p.id === property.id);
        const updatedProperty = {
            ...property,
            area: Number(property.area),
            coords: {
                lat: Number(property.lat),
                lng: Number(property.lng)
            }
        };

        await recordAudit({
            action: 'UPDATE',
            entity: 'PROPERTY',
            entityId: property.id,
            before,
            after: updatedProperty,
            user
        });

        setProperties(prev => prev.map(p => p.id === property.id ? updatedProperty : p));
    };

    /**
     * Deletar propriedade
     */
    const handleDeleteProperty = async (propertyId) => {
        if (window.confirm('Tem certeza que deseja deletar esta propriedade?')) {
            const before = properties.find(p => p.id === propertyId);

            await recordAudit({
                action: 'DELETE',
                entity: 'PROPERTY',
                entityId: propertyId,
                before,
                after: null,
                user
            });

            setProperties(prev => prev.filter(p => p.id !== propertyId));
        }
    };

    // ==================== REGRAS DE NEGÓCIO - NECROMASSA ====================

    /**
     * Adicionar nova solicitação de necromassa
     */
    const handleAddNecromassa = async (request) => {
        const newRequest = {
            ...request,
            id: `NECRO-${Math.floor(Math.random() * 1000)}`,
            data: new Date().toISOString().split('T')[0],
            origem: "WhatsApp"
        };

        await recordAudit({
            action: 'CREATE',
            entity: 'NECROMASSA',
            entityId: newRequest.id,
            before: null,
            after: newRequest,
            user
        });

        setNecromassaRequests(prev => [newRequest, ...prev]);
    };

    /**
     * Atualizar status de solicitação de necromassa
     */
    const handleUpdateNecromassaStatus = async (requestId, newStatus) => {
        const before = necromassaRequests.find(req => req.id === requestId);
        const after = { ...before, status: newStatus };

        await recordAudit({
            action: 'UPDATE',
            entity: 'NECROMASSA',
            entityId: requestId,
            before,
            after,
            user
        });

        setNecromassaRequests(prev =>
            prev.map(req => req.id === requestId ? { ...req, status: newStatus } : req)
        );
    };

    /**
     * Deletar solicitação de necromassa
     */
    const handleDeleteNecromassa = async (requestId) => {
        if (window.confirm('Tem certeza que deseja deletar esta solicitação?')) {
            const before = necromassaRequests.find(req => req.id === requestId);

            await recordAudit({
                action: 'DELETE',
                entity: 'NECROMASSA',
                entityId: requestId,
                before,
                after: null,
                user
            });

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
        urlMidiasFiles,

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
        getAllInventoryByPropertyId,
        getInventoriesByPropertyId,
        getTreesByInventoryId,
        createInventory,
        createTree,
        updateTree,
        deleteTree,
        uploadTreePhoto,
        createTreePhoto,
        getTreePhotos,
        getTreeHistory,

        // Regras de Negócio - Rewards
        getRewardsByManejoId,
        getRewardById,
        createReward,
        updateReward,
        deleteReward,

        // Regras de Negócio - Docs
        getDocsByManejoId,
        createDoc,
        deleteDoc,

        // Regras de Negócio - Incidents
        getIncidentsByManejoId,
        createIncident,
        updateIncident,
        deleteIncident,
    };

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    );
};
