import { ThemeProvider, CssBaseline, CircularProgress, Box } from '@mui/material';
import { theme } from './theme';
import { Layout } from './components';
import { Dashboard, Projects, Properties, Necromassa, Sponsors, Login, Users } from './pages';
import { useAdmin } from './contexts/AdminContext';
import { useAuth } from './contexts/AuthContext.jsx';

export default function App() {
  const { currentView } = useAdmin();
  const { user, loading } = useAuth();

  // Renderização condicional das páginas
  const renderPage = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;

      case 'projects':
        return <Projects />;

      case 'properties':
        return <Properties />;

      case 'necromassa':
        return <Necromassa />;

      case 'sponsors':
        return <Sponsors />;

      case 'users':
        return <Users />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      ) : !user ? (
        <Login />
      ) : (
        <Layout>
          {renderPage()}
        </Layout>
      )}
    </ThemeProvider>
  );
}
