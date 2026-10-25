import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { AdminProvider } from './contexts/AdminContext';
import { AuthProvider } from './contexts/AuthContext.jsx';
import './styles/index.css';

import { BrowserRouter } from 'react-router-dom';
import { startVersionWatch } from './pwa/versionWatch';
import UpdateBanner from './pwa/UpdateBanner';

startVersionWatch();

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <BrowserRouter>
                <AuthProvider>
                    <AdminProvider>
                        <App />
                        <UpdateBanner />
                    </AdminProvider>
                </AuthProvider>
            </BrowserRouter>
        </ErrorBoundary>
    </React.StrictMode>
);