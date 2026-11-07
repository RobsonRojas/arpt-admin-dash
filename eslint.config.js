import react from 'eslint-plugin-react';
import globals from 'globals';

// Só identificadores indefinidos: o projeto nunca foi linteado, e regras de estilo gerariam centenas de avisos.
// Foi um componente sem import (AnalyticsPixels) que deixou o painel em branco em produção.
export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  {
    files: ['src/**/*.{js,jsx}'],
    plugins: { react },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      // `__APP_BUILD_ID__` é injetado no build pelo `define` do vite.config.js.
      globals: { ...globals.browser, __APP_BUILD_ID__: 'readonly' },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-undef': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',
    },
  },
];
