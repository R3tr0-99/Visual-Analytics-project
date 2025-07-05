import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import App from './App.jsx';
import './index.css';

// --- TEMA AGGIORNATO E COMPLETO ---
const modernTheme = createTheme({
  shape: {
    borderRadius: 12, // Bordi più morbidi
  },
  palette: {
    mode: 'light',
    background: {
      default: '#f4f6f8', // Grigio neutro e chiaro
      paper: '#ffffff',
    },
    primary: {
      main: '#556cd6', // Blu vibrante
    },
    secondary: {
      main: '#19857b',
    },
    text: {
      primary: '#333333',
      secondary: '#555555',
    },
    action: {
      hover: 'rgba(0, 0, 0, 0.04)',
    }
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    fontSize: 14,
    h6: {
      fontWeight: 500,
    },
    subtitle1: {
      fontWeight: 500,
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Necessario per sovrascrivere stili di default di MUI v5
        }
      }
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          color: '#555',
          borderColor: 'rgba(0, 0, 0, 0.12)',
          '&.Mui-selected': {
            color: '#ffffff',
            backgroundColor: '#556cd6',
            '&:hover': {
              backgroundColor: '#4459b8',
            },
          },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '&:before': {
            display: 'none',
          },
        },
      },
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={modernTheme}>
      {/* CssBaseline normalizza gli stili e applica i colori di sfondo */}
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>
);