import { createTheme, Theme } from '@mui/material/styles'

// PAN OCEAN Brand Light Mode Color Palette
const lightColors = {
  primary: '#0052a5',      // PAN OCEAN navy
  primaryHover: '#003d7a', // darker navy
  primaryLight: '#1e6ec0', // lighter navy
  background: '#f8fafc',   // slate-50
  sidebar: '#1e293b',      // slate-800
  sidebarBrand: '#0f172a', // slate-900
  surface: '#ffffff',
  textPrimary: '#1f2937',  // gray-800
  textSecondary: '#6b7280', // gray-500
  border: '#e5e7eb',       // gray-200
  success: '#16a34a',      // green-600
  warning: '#f97316',      // orange-500
  danger: '#ef4444',       // red-500
  tableHeader: '#f9fafb',  // gray-50
  tableHover: '#e6f0fa',   // pan ocean navy-50
}

// Dark Mode Color Palette (shadcn inspired)
const darkColors = {
  primary: '#3b82f6',      // blue-500
  primaryHover: '#2563eb', // blue-600
  primaryLight: '#60a5fa', // blue-400
  background: '#09090b',   // zinc-950
  sidebar: '#18181b',      // zinc-900
  sidebarBrand: '#09090b', // zinc-950
  surface: '#18181b',      // zinc-900
  textPrimary: '#fafafa',  // zinc-50
  textSecondary: '#a1a1aa', // zinc-400
  border: '#3f3f46',       // zinc-700
  success: '#22c55e',      // green-500
  warning: '#f97316',      // orange-500
  danger: '#ef4444',       // red-500
  tableHeader: '#27272a',  // zinc-800
  tableHover: '#1e3a5f',   // dark blue
}

const fontFamily = [
  '"Pretendard"',
  'ui-sans-serif',
  'system-ui',
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  '"Noto Sans KR"',
  'Roboto',
  '"Helvetica Neue"',
  'Arial',
  'sans-serif',
].join(',')

const createBaseTheme = (colors: typeof lightColors, mode: 'light' | 'dark'): Theme => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: colors.primary,
        light: colors.primaryLight,
        dark: colors.primaryHover,
      },
      secondary: {
        main: colors.textSecondary,
        light: mode === 'light' ? '#9ca3af' : '#71717a',
        dark: mode === 'light' ? '#4b5563' : '#52525b',
      },
      error: {
        main: colors.danger,
      },
      warning: {
        main: colors.warning,
      },
      success: {
        main: colors.success,
      },
      background: {
        default: colors.background,
        paper: colors.surface,
      },
      text: {
        primary: colors.textPrimary,
        secondary: colors.textSecondary,
      },
      divider: colors.border,
      grey: {
        50: mode === 'light' ? '#fafafa' : '#27272a',
        100: mode === 'light' ? '#f5f5f5' : '#3f3f46',
        200: mode === 'light' ? '#f3f4f6' : '#52525b',
        300: mode === 'light' ? '#e5e7eb' : '#71717a',
        400: mode === 'light' ? '#d1d5db' : '#a1a1aa',
        500: mode === 'light' ? '#9ca3af' : '#a1a1aa',
        600: mode === 'light' ? '#6b7280' : '#a1a1aa',
        700: mode === 'light' ? '#4b5563' : '#d4d4d8',
        800: mode === 'light' ? '#374151' : '#e4e4e7',
        900: mode === 'light' ? '#1f2937' : '#f4f4f5',
      },
      action: {
        hover: mode === 'light' ? '#f3f4f6' : '#27272a',
        selected: mode === 'light' ? '#e5e7eb' : '#3f3f46',
        disabledBackground: mode === 'light' ? '#f5f5f5' : '#27272a',
      },
    },
    typography: {
      fontFamily,
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      body2: { fontSize: '0.875rem' },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
              width: 10,
              height: 10,
            },
            '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
              background: mode === 'light' ? 'rgba(241, 245, 249, 0.5)' : 'rgba(39, 39, 42, 0.3)',
            },
            '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
              background: mode === 'light' ? 'rgba(156, 163, 175, 0.5)' : 'rgba(113, 113, 122, 0.6)',
              borderRadius: 10,
              border: '2px solid transparent',
              backgroundClip: 'padding-box',
            },
            '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
              background: mode === 'light' ? 'rgba(107, 114, 128, 0.7)' : 'rgba(161, 161, 170, 0.8)',
            },
            '&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner': {
              background: 'transparent',
            },
            scrollbarWidth: 'thin',
            scrollbarColor: mode === 'light'
              ? 'rgba(156, 163, 175, 0.5) rgba(241, 245, 249, 0.5)'
              : 'rgba(113, 113, 122, 0.6) rgba(39, 39, 42, 0.3)',
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
          contained: {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            '&:hover': {
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            },
          },
          containedPrimary: {
            backgroundColor: colors.primary,
            '&:hover': {
              backgroundColor: colors.primaryHover,
            },
          },
          outlined: {
            borderColor: colors.border,
            color: colors.textSecondary,
            '&:hover': {
              backgroundColor: mode === 'light' ? '#f9fafb' : '#27272a',
              borderColor: colors.border,
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'light' ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
            backgroundColor: mode === 'light' ? colors.surface : colors.sidebarBrand,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundImage: 'none',
            ...(mode === 'dark' && {
              border: `1px solid ${colors.border}`,
            }),
          },
          outlined: {
            borderColor: colors.border,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: colors.surface,
            ...(mode === 'dark' && {
              border: `1px solid ${colors.border}`,
            }),
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
            overflow: 'hidden',
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: colors.tableHeader,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderRight: `1px solid ${colors.border}`,
            '&:last-child': {
              borderRight: 'none',
            },
          },
          head: {
            backgroundColor: colors.tableHeader,
            color: colors.textSecondary,
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            textAlign: 'center',
            borderBottom: `1px solid ${colors.border}`,
          },
          body: {
            fontSize: '0.875rem',
            borderBottom: `1px solid ${colors.border}`,
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: `${colors.tableHover} !important`,
            },
            '&.Mui-selected': {
              backgroundColor: colors.tableHover,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            borderRadius: 6,
          },
          colorSuccess: {
            backgroundColor: mode === 'light' ? '#dcfce7' : '#14532d',
            color: colors.success,
          },
          colorWarning: {
            backgroundColor: mode === 'light' ? '#ffedd5' : '#7c2d12',
            color: colors.warning,
          },
          colorError: {
            backgroundColor: mode === 'light' ? '#fee2e2' : '#7f1d1d',
            color: colors.danger,
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
          },
          input: {
            fontSize: '0.875rem',
            '&::placeholder': {
              fontSize: '0.875rem',
              color: mode === 'light' ? '#9ca3af' : '#71717a',
              opacity: 1,
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
            borderRadius: 8,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.border,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'light' ? '#9ca3af' : '#52525b',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.primary,
            },
          },
          input: {
            fontSize: '0.875rem',
            '&::placeholder': {
              fontSize: '0.875rem',
              color: mode === 'light' ? '#9ca3af' : '#71717a',
              opacity: 1,
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
            '& .MuiInputBase-input': {
              fontSize: '0.875rem',
            },
            '& .MuiInputBase-inputMultiline::placeholder': {
              color: mode === 'light' ? '#9ca3af' : '#71717a',
              opacity: 1,
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontSize: '0.875rem',
          },
          select: {
            fontSize: '0.875rem',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            ...(mode === 'dark' && {
              border: `1px solid ${colors.border}`,
            }),
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            '@media (min-width: 900px)': {
              borderBottom: `4px solid ${colors.primary}`,
            },
            '@media (max-width: 899.95px)': {
              borderBottom: `1px solid ${colors.border}`,
            },
          },
          indicator: {
            backgroundColor: colors.primary,
            '@media (min-width: 900px)': {
              display: 'none',
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            '&.Mui-selected': {
              color: colors.primary,
              '@media (min-width: 900px)': {
                backgroundColor: colors.primary,
                color: '#ffffff',
                borderRadius: '6px 6px 0 0',
              },
            },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: 'none',
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            ...(mode === 'dark' && {
              border: `1px solid ${colors.border}`,
            }),
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: colors.border,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)',
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: mode === 'light' ? '#1f2937' : '#fafafa',
            color: mode === 'light' ? '#ffffff' : '#18181b',
            fontSize: '0.75rem',
            fontWeight: 500,
            padding: '6px 12px',
            borderRadius: 6,
            boxShadow: mode === 'light'
              ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              : '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
          },
          arrow: {
            color: mode === 'light' ? '#1f2937' : '#fafafa',
          },
        },
      },
    },
  })
}

export const createLightTheme = (): Theme => createBaseTheme(lightColors, 'light')
export const createDarkTheme = (): Theme => createBaseTheme(darkColors, 'dark')

// Export colors for use in components
export const themeColors = {
  light: lightColors,
  dark: darkColors,
}

// Default export for backward compatibility
export default createLightTheme()
