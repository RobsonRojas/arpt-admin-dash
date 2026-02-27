import React, { useEffect } from 'react';
import { ThemeProvider, CssBaseline, CircularProgress, Box } from '@mui/material';
import { theme } from './theme';
import { Layout } from './components';
import { Dashboard, Projects, Properties, Necromassa, Sponsors, Login, Users, Rewards, Certificates, Products, AuditLogs, GeminiSettings, PaymentConfig, MediaManager, ErrorLogs, Refunds, ForestIntelligence } from './pages';
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
                <Route path="products" element={<Products />} />
                <Route path="certificates" element={<Certificates />} />
                <Route path="audit" element={<AuditLogs />} />
                <Route path="gemini-settings" element={<GeminiSettings />} />
                <Route path="payment-config" element={<PaymentConfig />} />
                <Route path="media-manager" element={<MediaManager />} />
                <Route path="forest-intelligence" element={<ForestIntelligence />} />
                <Route path="error-logs" element={<ErrorLogs />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </PrivateRoute>
          } />
        </Routes>
      </ThemeProvider>
    </ErrorProvider>
  );
}
