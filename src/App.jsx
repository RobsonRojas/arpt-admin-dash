import React, { useEffect } from 'react';
import { ThemeProvider, CssBaseline, CircularProgress, Box } from '@mui/material';
import { theme } from './theme';
import { Layout } from './components';
import { Dashboard, Projects, Properties, Necromassa, Sponsors, Login, Users, Rewards, Certificates, Products, AuditLogs, GeminiSettings, PaymentConfig, MediaManager, ErrorLogs } from './pages';
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
    return <Login />;
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
  const { currentView } = useAdmin();

  // Map currentView string to component
  const getViewComponent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'projects': return <Projects />;
      case 'properties': return <Properties />;
      case 'necromassa': return <Necromassa />;
      case 'sponsors': return <Sponsors />;
      case 'users': return <Users />;
      case 'rewards': return <Rewards />;
      case 'products': return <Products />;
      case 'certificates': return <Certificates />;
      case 'audit': return <AuditLogs />;
      case 'gemini-settings': return <GeminiSettings />;
      case 'payment-config': return <PaymentConfig />;
      case 'media-manager': return <MediaManager />;
      case 'error-logs': return <ErrorLogs />;
      default: return <Dashboard />;
    }
  };

  return (
    <ErrorProvider>
      <AxiosInterceptorSetup />
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Analytics />
        <Routes>
          <Route path="/certificate/view" element={<CertificateView />} />
          <Route path="/*" element={
            <PrivateRoute>
              {getViewComponent()}
            </PrivateRoute>
          } />
        </Routes>
      </ThemeProvider>
    </ErrorProvider>
  );
}
