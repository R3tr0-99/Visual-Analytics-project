import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import App from './App.jsx';
import './index.css';

// --- TEMA AGGIORNATO ---
const modernTheme = createTheme({
  // Bordi arrotondati di default per tutti i componenti
  shape: {
    borderRadius: 12, // Un valore più morbido di 8
  },
  palette: {
    mode: 'light',
    background: {
      default: '#f4f6f8', // Un grigio molto chiaro e neutro
      paper: '#ffffff',
    },
    primary: {
      main: '#556cd6', // Un blu più vibrante
    },
    secondary: {
      main: '#19857b',
    },
    text: {
      primary: '#333333',
      secondary: '#555555',
    },
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
  // Sovrascriviamo gli stili di alcuni componenti per coerenza
  components: {
    MuiToggleButton: {
      styleOverrides: {
        root: {
          // Stile più morbido per i bottoni non selezionati
          color: '#555',
          borderColor: 'rgba(0, 0, 0, 0.12)',
          '&.Mui-selected': {
            // Stile più evidente per il bottone selezionato
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
        // Rimuoviamo il box-shadow di default per un look più pulito,
        // lo applicheremo noi dove serve.
        root: {
          boxShadow: 'none',
          // Rimuove la linea di separazione tra gli accordion (utile se ne avessimo più di uno)
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
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>
);