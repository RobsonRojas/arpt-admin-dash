import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
    // O E2E local roda o dev server com o código montado só para leitura do cache: o cache vai para outro lugar.
    // E2E local: o painel é acessado pelo nome do serviço do Docker (`panel`), que o Vite recusa por padrão.
    ...(process.env.VITE_ALLOWED_HOSTS ? { server: { allowedHosts: process.env.VITE_ALLOWED_HOSTS.split(',') } } : {}),
    ...(process.env.VITE_CACHE_DIR ? { cacheDir: process.env.VITE_CACHE_DIR } : {}),
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        return 'vendor';
                    }
                }
            }
        }
    },
    plugins: [
        // O dev server é https por padrão; o E2E local (http, em Docker) desliga com VITE_NO_SSL=1.
        ...(process.env.VITE_NO_SSL ? [] : [basicSsl()]),
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'arpt-logo-new.png'],
            manifest: {
                name: 'ARPT Admin Dashboard',
                short_name: 'ARPT Admin',
                description: 'Painel Administrativo da ARPT',
                theme_color: '#1976d2',
                background_color: '#ffffff',
                display: 'standalone',
                orientation: 'portrait',
                icons: [
                    {
                        src: 'arpt-logo-new.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'arpt-logo-new.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            },
            workbox: {
                maximumFileSizeToCacheInBytes: 5242880
            }
        })
    ]
});