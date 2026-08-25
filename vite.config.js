import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
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
        basicSsl(),
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