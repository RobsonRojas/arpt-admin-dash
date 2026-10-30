import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Configuração própria dos testes de componente: sem PWA nem https do vite.config.js.
export default defineConfig({
    plugins: [react()],
    define: { __APP_BUILD_ID__: JSON.stringify('teste') },
    test: {
        environment: 'jsdom',
        include: ['src/**/*.test.{js,jsx}'],
        setupFiles: ['src/test/setup.js'],
    },
});
