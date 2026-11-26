# ARPT Admin v1 - Estrutura do Projeto

## 📁 Estrutura de Pastas

```
src/
├── components/          # Componentes reutilizáveis
│   ├── FieldAppEmbedded.jsx   # Wizard de cadastro/edição de projetos
│   ├── Layout.jsx              # Layout principal (AppBar + Drawer)
│   ├── MapEmbed.jsx            # Componente de mapa
│   ├── StatCard.jsx            # Card de estatísticas
│   ├── StatusChip.jsx          # Chip de status colorido
│   └── index.js                # Exportação centralizada
│
├── pages/              # Páginas/Módulos principais
│   ├── Dashboard.jsx           # Painel de visão geral
│   ├── Projects.jsx            # Gestão de projetos
│   ├── Properties.jsx          # Gestão de propriedades
│   ├── Necromassa.jsx          # Licenciamento de necromassa
│   ├── Sponsors.jsx            # Gestão de patrocinadores
│   └── index.js                # Exportação centralizada
│
├── contexts/           # Context API (Gerenciamento de Estado)
│   ├── AdminContext.jsx        # Context com todas as regras de negócio
│   └── index.js                # Exportação centralizada
│
├── constants/          # Constantes e dados mockados
│   ├── index.js                # Constantes da aplicação
│   └── mockData.js             # Dados mockados para desenvolvimento
│
├── theme/              # Tema Material-UI
│   └── index.js                # Configuração do tema customizado
│
├── utils/              # Funções utilitárias (vazio por enquanto)
│
├── App.jsx             # Componente raiz (orquestrador limpo)
├── main.jsx            # Entry point
└── index.css           # Estilos globais
```

## 🎯 Descrição dos Módulos

### Components (Componentes Reutilizáveis)

- **MapEmbed**: Componente para exibir mapas do OpenStreetMap com validação de geofence
- **StatusChip**: Chip colorido que muda de cor baseado no status
- **StatCard**: Card de estatística para o dashboard
- **Layout**: Layout principal com AppBar e Drawer lateral
- **FieldAppEmbedded**: Wizard em steps para cadastro/edição de projetos

### Pages (Páginas)

- **Dashboard**: Visão geral com cards de estatísticas (usa `useAdmin` hook)
- **Projects**: CRUD completo de projetos de manejo (usa `useAdmin` hook)
- **Properties**: Gestão de propriedades rurais com CAR (usa `useAdmin` hook)
- **Necromassa**: Licenciamento de árvores caídas (usa `useAdmin` hook)
- **Sponsors**: Gestão de patrocinadores (RWA) (usa `useAdmin` hook)

### Contexts (Gerenciamento de Estado)

- **AdminContext**: Context API centralizado que gerencia:
  - **Estados globais**: projetos, propriedades, necromassa, patrocinadores, navegação
  - **Regras de negócio**: todas as funções de CRUD e manipulação de dados
  - **Filtros e buscas**: lógica de filtragem centralizada
  - **Cálculos**: estatísticas do dashboard

- **useAdmin Hook**: Hook customizado para acessar o contexto de forma segura

### Constants

A aplicação agora usa **Context API** para gerenciamento de estado centralizado:

```javascript
App.jsx (ThemeProvider)
  ↓
AdminProvider (Context - Estado Global + Regras de Negócio)
  ↓
AppContent (Roteamento)
  ↓
Layout (Navegação - usa useAdmin)
  ↓
Pages (Consumem useAdmin hook)
  ↓
Components (Componentes reutilizáveis)
```

### Como funciona o AdminContext:

1. **AdminProvider** envolve toda a aplicação e fornece:
   - Estados globais (projects, properties, etc)
   - Funções de CRUD (handleSaveProject, handleAddProperty, etc)
   - Regras de negócio centralizadas
   - Filtros e cálculos

2. **useAdmin hook** é usado nos componentes para acessar:
   ```javascript
   const { 
     projects,              // Estado
     handleSaveProject,     // Função
     getFilteredProjects    // Regra de negócio
   } = useAdmin();
   ```
✅ FEITO - Context API)
   - AdminContext centraliza todas as regras de negócio
   - useAdmin hook para acesso ao contexto
   - ✅ Props drilling eliminado
   - ✅ Regras de negócio centralizadas
   - ✅ Estado compartilhado entre componentes
   - ✅ Código mais limpo e manutenível
   - ✅ Fácil de testarpp.jsx mantém o estado global e passa props para as páginas:

```javascript
App.jsx (Estado Global)
  ↓
Layout (Navegação)
  ↓
Pages (Recebem dados via props)
  ↓
Components (Componentes reutilizáveis)
```

## 🚀 Próximos Passos

Quando for trabalhar com dados reais:

1. **Criar camada de serviços** (`src/services/`)
   - `api.js` - Cliente Axios configurado
   - `projectsService.js` - CRUD de projetos
   - `propertiesService.js` - CRUD de propriedades
   - etc.

2. **Adicionar gerenciamento de estado** (opcional)
   - Context API ou Redux para estados complexos

3. **Adicionar validações**
   - Criar `src/utils/validators.js`
   - Yup ou Zod para validação de formulários

4. **Adicionar autenticação**
   - Context de autenticação
   - Rotas protegidas

## 📦 Dependências Principais

- React 18.2.0
- Material-UI 5.15.0
- Axios 1.13.2
- React Router Dom 7.11.0
- Firebase 10.8.0

## 💡 Convenções de Código

- Componentes em PascalCase
- Arquivos de componentes com extensão `.jsx`
- Exportações nomeadas para componentes (exceto App.jsx)
- Comentários descritivos nos componentes complexos

## Agente de IA do administrador
Página `AgenteIA` (SSE via `services/agente.js`) → `manejo-api` `/admin/agent` (loop sobre o SDK da Anthropic, tools em lista fechada, pseudonimização de dados pessoais, escritas só por proposta confirmada) → provedor. Detalhes e operação: `backend/manejo-api/docs/RUNBOOK_SEGREDOS.md` e a change `agente-ia-admin-dash`.
