import { ThemeProvider, CssBaseline, CircularProgress, Box } from '@mui/material';
import { theme } from './theme';
import { Layout } from './components';
import { Dashboard, Projects, Properties, Necromassa, Sponsors, Login, Users, Rewards, Certificates, Products, AuditLogs } from './pages';
import { CertificateView } from './pages/CertificateView';
import { useAdmin } from './contexts/AdminContext';
import { useAuth } from './contexts/AuthContext.jsx';
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
      default: return <Dashboard />;
    }
  };

  return (
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
  );
}
