import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";
import App from './App.jsx';
import { AdminProvider } from './providers/adminProviders.jsx';
import './styles/index.css';


ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <AdminProvider>
                <App />
            </AdminProvider>
        </BrowserRouter>
    </React.StrictMode>
);