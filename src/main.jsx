import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import App from './App.jsx';
import './index.css';

const lightGrayTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#f0f0f0', // grigio chiaro come sfondo principale
      paper: '#ffffff',   // bianco per i box "card"
    },
    primary: {
      main: '#607d8b',    // blu-grigio MUI
    },
    secondary: {
      main: '#90a4ae',    // grigio secondario
    },
    text: {
      primary: '#333333', // quasi nero
      secondary: '#666666', // grigio medio
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    fontSize: 14,
  },
  shape: {
    borderRadius: 8,
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={lightGrayTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>
);
