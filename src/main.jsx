import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AdminProvider } from './contexts/AdminContext';
import { AuthProvider } from './contexts/AuthContext.jsx';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider>
            <AdminProvider>
                <App />
            </AdminProvider>
        </AuthProvider>
    </React.StrictMode>
);