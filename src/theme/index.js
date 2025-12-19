import { createTheme } from '@mui/material';

export const theme = createTheme({
  palette: {
    primary: { 
      main: '#1b5e20' 
    }, 
    secondary: { 
      main: '#4caf50' 
    }, 
    background: { 
      default: '#f4f6f8', 
      paper: '#ffffff' 
    },
    error: { 
      main: '#d32f2f' 
    },
    warning: { 
      main: '#ed6c02' 
    },
    success: { 
      main: '#2e7d32' 
    },
  },
  typography: { 
    fontFamily: '"Roboto", sans-serif', 
    h5: { 
      fontWeight: 600 
    }, 
    h6: { 
      fontWeight: 600 
    } 
  },
  components: {
    MuiButton: { 
      styleOverrides: { 
        root: { 
          borderRadius: 8, 
          textTransform: 'none' 
        } 
      } 
    },
    MuiPaper: { 
      styleOverrides: { 
        rounded: { 
          borderRadius: 12 
        }, 
        elevation1: { 
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)' 
        } 
      } 
    },
    MuiTextField: { 
      defaultProps: { 
        size: "small", 
        variant: "outlined" 
      } 
    }
  }
});
