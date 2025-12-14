ARPT Admin Dashboard

Painel administrativo para gestão de manejo florestal sustentável, necromassa e ativos RWA (Real World Assets), desenvolvido com React, Material UI e Firebase.

Funcionalidades

Sala de Situação: Visão geral com métricas de hectares preservados e investimentos.

Gestão de Necromassa: Módulo especializado para licenciamento de árvores caídas, com validação geoespacial (Geofence) e cálculo volumétrico específico para espécies amazónicas.

Gestão de Projetos: Pipeline de aprovação de planos de manejo.

Patrocinadores (RWA): Rastreabilidade de investimentos e portfólio de ativos.

Segurança: Autenticação via Firebase (apenas administradores pré-cadastrados).

🚀 Como Iniciar

Pré-requisitos

Node.js (versão 16 ou superior)

npm ou yarn

Instalação

Clone o repositório ou extraia os ficheiros.

Instale as dependências:

npm install


Inicie o servidor de desenvolvimento:

npm run dev


🔐 Configuração do Firebase (Autenticação)

Para que o sistema de login funcione, é necessário configurar um projeto no Firebase. Siga os passos abaixo:

1. Criar Projeto no Firebase

Aceda ao Firebase Console.

Clique em "Adicionar projeto" e siga as instruções.

2. Ativar Autenticação

No menu lateral do seu projeto Firebase, clique em Criação > Authentication.

Clique em "Começar agora".

No separador Sign-in method, selecione E-mail/senha.

Ative a opção Email/Password e clique em Guardar.

Vá ao separador Users e clique em "Adicionar utilizador".

Crie um utilizador administrador (ex: admin@arpt.com com uma senha forte). Nota: A aplicação não possui ecrã de registo público por segurança.

3. Obter Credenciais

Vá às Definições do Projeto (ícone da engrenagem).

Em As suas aplicações, clique no ícone web (</>).

Registe a aplicação (dê um nome, ex: "ARPT Admin").

Copie o objeto firebaseConfig que será apresentado. Ele tem este formato:

const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};


4. Integrar no Código

Abra o ficheiro src/App.jsx e localize a função getFirebaseConfig. Substitua o conteúdo ou configure para usar o objeto que copiou:

Opção A (Direta - Apenas para Testes Locais):

const getFirebaseConfig = () => {
  return {
    apiKey: "SUA_API_KEY_COPIADA",
    authDomain: "SEU_PROJECT_ID.firebaseapp.com",
    // ... restante das chaves
  };
};


Opção B (Recomendada - Variáveis de Ambiente):
Crie um ficheiro .env na raiz do projeto:

VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
...


E ajuste o código para ler import.meta.env.VITE_FIREBASE_API_KEY, etc.

📱 Simulação Mobile

O projeto inclui um componente "Field App Embedded" dentro do Dashboard.
Para testar:

Vá ao menu Gestão ou Necromassa.

Clique no botão "Novo Input (WhatsApp)" ou "Novo".

Isto abrirá o simulador da aplicação de campo usada pelos técnicos.

🛠️ Tecnologias

Frontend: React, Vite

UI Framework: Material UI (MUI) v5

Mapas: OpenStreetMap (Embed)

Auth: Firebase Authentication v9