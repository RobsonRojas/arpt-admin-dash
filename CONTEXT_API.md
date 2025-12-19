# AdminContext - Guia de Uso

## 📚 O que é o AdminContext?

O **AdminContext** é um Context API do React que centraliza todo o **gerenciamento de estado** e **regras de negócio** da aplicação ARPT Admin. Ele elimina o "props drilling" e torna o código mais limpo e manutenível.

## 🎯 Estrutura

### AdminProvider
Provider que envolve a aplicação e fornece o contexto.

```javascript
// No App.jsx
<AdminProvider>
  <AppContent />
</AdminProvider>
```

### useAdmin Hook
Hook customizado para acessar o contexto de forma segura.

```javascript
import { useAdmin } from '../contexts/AdminContext';

const MeuComponente = () => {
  const { projects, handleSaveProject } = useAdmin();
  // ...
};
```

## 📦 Estados Disponíveis

### Navegação
- `currentView` - View atual ('dashboard', 'projects', etc)
- `mobileOpen` - Estado do drawer mobile

### Dados
- `projects` - Array de projetos
- `properties` - Array de propriedades
- `necromassaRequests` - Array de solicitações de necromassa
- `sponsors` - Array de patrocinadores

### UI State (Projetos)
- `openCadastro` - Modal de cadastro aberto/fechado
- `editingProject` - Projeto sendo editado (ou null)
- `selectedProject` - Projeto selecionado para visualização
- `searchTerm` - Termo de busca
- `filterStatus` - Status do filtro

## 🔧 Funções Disponíveis

### Projetos
```javascript
const {
  handleSaveProject,      // (projectData) => void - Criar ou atualizar
  handleEditProject,      // (project) => void - Abrir modal de edição
  handleDeleteProject,    // (projectId) => void - Deletar projeto
  handleOpenNewProject,   // () => void - Abrir modal para novo
  handleCloseCadastro,    // () => void - Fechar modal
  getFilteredProjects,    // () => Array - Projetos filtrados
} = useAdmin();
```

### Propriedades
```javascript
const {
  handleAddProperty,      // (property) => void - Adicionar nova
  handleUpdateProperty,   // (property) => void - Atualizar existente
  handleDeleteProperty,   // (propertyId) => void - Deletar
} = useAdmin();
```

### Necromassa
```javascript
const {
  handleAddNecromassa,         // (request) => void - Nova solicitação
  handleUpdateNecromassaStatus,// (id, status) => void - Atualizar status
  handleDeleteNecromassa,      // (requestId) => void - Deletar
} = useAdmin();
```

### Navegação
```javascript
const {
  navigateTo,            // (view) => void - Navegar para view
  handleDrawerToggle,    // () => void - Alternar drawer mobile
} = useAdmin();
```

### Utilitários
```javascript
const {
  getDashboardStats,     // () => Object - Estatísticas do dashboard
} = useAdmin();
```

## 💡 Exemplos de Uso

### Exemplo 1: Dashboard
```javascript
import { useAdmin } from '../contexts/AdminContext';

export const Dashboard = () => {
  const { getDashboardStats } = useAdmin();
  const stats = getDashboardStats();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard 
          title="Área Total" 
          value={`${stats.area} ha`} 
          subtext="Sob Gestão" 
          color="#2e7d32" 
          icon={<Landscape />} 
        />
      </Grid>
      {/* ... */}
    </Grid>
  );
};
```

### Exemplo 2: Página de Projetos
```javascript
import { useAdmin } from '../contexts/AdminContext';

export const Projects = () => {
  const {
    getFilteredProjects,
    handleEditProject,
    handleSaveProject,
    openCadastro,
    editingProject,
  } = useAdmin();

  const filteredProjects = getFilteredProjects();

  return (
    <Box>
      <Table>
        {filteredProjects.map(project => (
          <TableRow key={project.id}>
            <TableCell>{project.descricao}</TableCell>
            <TableCell>
              <IconButton onClick={() => handleEditProject(project)}>
                <Edit />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </Table>

      <Dialog open={openCadastro}>
        <FieldAppEmbedded 
          onSave={handleSaveProject}
          initialData={editingProject}
        />
      </Dialog>
    </Box>
  );
};
```

### Exemplo 3: Navegação no Layout
```javascript
import { useAdmin } from '../contexts/AdminContext';

export const Layout = ({ children }) => {
  const { currentView, navigateTo } = useAdmin();

  return (
    <List>
      <ListItemButton 
        selected={currentView === 'dashboard'} 
        onClick={() => navigateTo('dashboard')}
      >
        <ListItemText primary="Dashboard" />
      </ListItemButton>
    </List>
  );
};
```

## ✨ Benefícios

### 1. Elimina Props Drilling
**Antes (sem Context):**
```javascript
// App.jsx passa props
<Projects 
  projects={projects}
  searchTerm={searchTerm}
  setSearchTerm={setSearchTerm}
  filterStatus={filterStatus}
  setFilterStatus={setFilterStatus}
  // ... 10+ props
/>
```

**Depois (com Context):**
```javascript
// Componente acessa diretamente
<Projects />
```

### 2. Regras de Negócio Centralizadas
Todas as regras estão em um único lugar, facilitando:
- Manutenção
- Testes
- Reutilização
- Documentação

### 3. Estado Compartilhado
Qualquer componente pode acessar e modificar o estado global sem passar props.

### 4. Código Mais Limpo
Componentes ficam menores e mais focados na UI.

## 🔒 Segurança

O hook `useAdmin` valida se está sendo usado dentro do `AdminProvider`:

```javascript
export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin deve ser usado dentro de um AdminProvider');
  }
  return context;
};
```

## 🚀 Próximos Passos

Quando integrar com backend, adicione no AdminContext:

1. **Estados de Loading**
```javascript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
```

2. **Funções Assíncronas**
```javascript
const handleSaveProject = async (projectData) => {
  setLoading(true);
  try {
    const response = await api.post('/projects', projectData);
    setProjects(prev => [response.data, ...prev]);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

3. **Efeitos Colaterais**
```javascript
useEffect(() => {
  const fetchProjects = async () => {
    const data = await api.get('/projects');
    setProjects(data);
  };
  fetchProjects();
}, []);
```

## 📝 Convenções

- Use sempre o hook `useAdmin` para acessar o contexto
- Não modifique estados diretamente, use as funções fornecidas
- Adicione novas funções no AdminContext, não nos componentes
- Documente novas funções com comentários JSDoc
