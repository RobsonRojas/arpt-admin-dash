import React, { useEffect } from 'react';
import { ThemeProvider, CssBaseline, CircularProgress, Box } from '@mui/material';
import { theme } from './theme';
import { Layout, ErrorBoundary } from './components';
import { Dashboard, Projects, Properties, Necromassa, Sponsors, Login, Users, Rewards, Certificates, Products, AuditLogs, GeminiSettings, PaymentConfig, MediaManager, ErrorLogs, Refunds, ForestIntelligence, Adoptions, PhysicalPieces, Notifications, DeveloperSettings, ProductSimulation, Dropshipping, ManejoLogs, DropshippingAdmin, DropshipperDetails, PrivacySettings } from './pages';
import { CertificateView } from './pages/CertificateView';
import { useAdmin } from './contexts/AdminContext';
import { useAuth } from './contexts/AuthContext.jsx';
import { ErrorProvider, useError } from './contexts/ErrorContext';
import { setupInterceptors } from './services/api';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

const AxiosInterceptorSetup = () => {
  const { logError } = useError();
  useEffect(() => {
    setupInterceptors(logError);
  }, [logError]);
  return null;
};

export default function App() {
  useEffect(() => {
    console.log(`🚀 [Build Info] App version: 11.0.1 - Deployed: ${new Date().toLocaleString()}`);
    console.log(`📌 [Debug] Build Fix: Hardened Auth Headers & PWA Cache Buster v1`);
  }, []);

  return (
    <ErrorProvider>
      <AxiosInterceptorSetup />
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Analytics />
        <Routes>
          <Route path="/certificate/view" element={<CertificateView />} />
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <PrivateRoute>
              <ErrorBoundary>
                <Routes>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="properties" element={<Properties />} />
                  <Route path="necromassa" element={<Necromassa />} />
                  <Route path="sponsors" element={<Sponsors />} />
                  <Route path="refunds" element={<Refunds />} />
                  <Route path="users" element={<Users />} />
                  <Route path="rewards" element={<Rewards />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="physical-pieces" element={<PhysicalPieces />} />
                  <Route path="products" element={<Products />} />
                  <Route path="certificates" element={<Certificates />} />
                  <Route path="audit" element={<AuditLogs />} />
                  <Route path="manejo-logs" element={<ManejoLogs />} />
                  <Route path="gemini-settings" element={<GeminiSettings />} />
                  <Route path="payment-config" element={<PaymentConfig />} />
                  <Route path="media-manager" element={<MediaManager />} />
                  <Route path="forest-intelligence" element={<ForestIntelligence />} />
                  <Route path="adoptions" element={<Adoptions />} />
                  <Route path="developer-settings" element={<DeveloperSettings />} />
                  <Route path="error-logs" element={<ErrorLogs />} />
                  <Route path="product-simulation" element={<ProductSimulation />} />
                  <Route path="dropshipping" element={<Dropshipping />} />
                  <Route path="dropshipping-admin" element={<DropshippingAdmin />} />
                  <Route path="dropshipping-admin/:id" element={<DropshipperDetails />} />
                  <Route path="privacy-settings" element={<PrivacySettings />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </ErrorBoundary>
            </PrivateRoute>
          } />
        </Routes>
      </ThemeProvider>
    </ErrorProvider>
  );
}
