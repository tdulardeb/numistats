'use client';

import { createTheme, Theme, ThemeOptions } from '@mui/material/styles';

// Colores base compartidos
const violetPrimary = {
  main: '#8b5cf6',     // Violeta principal
  light: '#a78bfa',
  dark: '#7c3aed',
  contrastText: '#ffffff',
};

const violetSecondary = {
  main: '#a855f7',     // Violeta secundario
  light: '#c084fc',
  dark: '#9333ea',
  contrastText: '#ffffff',
};

// Colores de estado compartidos
const statusColors = {
  error: {
    main: '#ef4444',
    light: '#f87171',
    dark: '#dc2626',
  },
  warning: {
    main: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
  },
  success: {
    main: '#10b981',
    light: '#34d399',
    dark: '#059669',
  },
  info: {
    main: '#3b82f6',
    light: '#60a5fa',
    dark: '#2563eb',
  },
};

// Tipografía compartida
const typography = {
  fontFamily: '"IBM Plex Sans", "Segoe UI", Roboto, sans-serif',
  h1: {
    fontSize: '2.5rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 600,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontSize: '1.5rem',
    fontWeight: 600,
  },
  h4: {
    fontSize: '1.25rem',
    fontWeight: 600,
  },
  h5: {
    fontSize: '1rem',
    fontWeight: 600,
  },
  h6: {
    fontSize: '0.875rem',
    fontWeight: 600,
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.6,
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.5,
  },
  caption: {
    fontSize: '0.75rem',
  },
};

// Forma compartida
const shape = {
  borderRadius: 12,
};

// ==========================================
// TEMA OSCURO: Negro / Gris / Violeta
// ==========================================
const darkPalette = {
  mode: 'dark' as const,
  primary: violetPrimary,
  secondary: violetSecondary,
  background: {
    default: '#0a0a0f',      // Negro profundo
    paper: '#13131a',        // Gris muy oscuro con toque violeta
  },
  text: {
    primary: '#f5f5f7',
    secondary: '#a1a1aa',
  },
  divider: 'rgba(139, 92, 246, 0.12)',  // Violeta sutil
  ...statusColors,
};

const darkComponents: ThemeOptions['components'] = {
  MuiCard: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        backgroundColor: '#1a1a24',
        border: '1px solid rgba(139, 92, 246, 0.15)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 600,
        borderRadius: 8,
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        backgroundImage: 'none',
        backgroundColor: '#0f0f14',
        borderRight: '1px solid rgba(139, 92, 246, 0.12)',
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        backgroundColor: '#0f0f14',
        boxShadow: 'none',
        borderBottom: '1px solid rgba(139, 92, 246, 0.12)',
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        margin: '2px 8px',
        '&.Mui-selected': {
          backgroundColor: 'rgba(139, 92, 246, 0.15)',
          '&:hover': {
            backgroundColor: 'rgba(139, 92, 246, 0.25)',
          },
        },
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        '&:hover': {
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        fontWeight: 500,
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        backgroundColor: '#1a1a24',
        border: '1px solid rgba(139, 92, 246, 0.2)',
      },
    },
  },
};

// ==========================================
// TEMA CLARO: Blanco / Gris / Violeta
// ==========================================
const lightPalette = {
  mode: 'light' as const,
  primary: violetPrimary,
  secondary: violetSecondary,
  background: {
    default: '#fafafc',      // Blanco con toque gris
    paper: '#ffffff',        // Blanco puro
  },
  text: {
    primary: '#18181b',
    secondary: '#52525b',
  },
  divider: 'rgba(139, 92, 246, 0.12)',
  ...statusColors,
};

const lightComponents: ThemeOptions['components'] = {
  MuiCard: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        backgroundColor: '#ffffff',
        border: '1px solid rgba(139, 92, 246, 0.12)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 600,
        borderRadius: 8,
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        backgroundImage: 'none',
        backgroundColor: '#ffffff',
        borderRight: '1px solid rgba(139, 92, 246, 0.12)',
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        backgroundColor: '#ffffff',
        boxShadow: 'none',
        borderBottom: '1px solid rgba(139, 92, 246, 0.12)',
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        margin: '2px 8px',
        '&.Mui-selected': {
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          '&:hover': {
            backgroundColor: 'rgba(139, 92, 246, 0.18)',
          },
        },
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        '&:hover': {
          backgroundColor: 'rgba(139, 92, 246, 0.08)',
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        fontWeight: 500,
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        backgroundColor: '#18181b',
        color: '#ffffff',
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        border: '1px solid',
      },
    },
  },
};

// Crear temas
export const darkTheme: Theme = createTheme({
  palette: darkPalette,
  typography: {
    ...typography,
    caption: {
      ...typography.caption,
      color: '#a1a1aa',
    },
  },
  shape,
  components: darkComponents,
});

export const lightTheme: Theme = createTheme({
  palette: lightPalette,
  typography: {
    ...typography,
    caption: {
      ...typography.caption,
      color: '#71717a',
    },
  },
  shape,
  components: lightComponents,
});

// Función para obtener el tema según el modo
export function getTheme(mode: 'light' | 'dark'): Theme {
  return mode === 'dark' ? darkTheme : lightTheme;
}

// Exportar tema oscuro por defecto para compatibilidad
export default darkTheme;
