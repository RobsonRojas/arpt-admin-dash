
import { createTheme } from '@mui/material';
export const theme = createTheme({
  palette: {
    primary: { main: '#1b5e20' },
    secondary: { main: '#4caf50' },
    background: { default: '#f4f6f8', paper: '#ffffff' },
  },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 8, textTransform: 'none' } } },
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 12 } } }
  }
});
