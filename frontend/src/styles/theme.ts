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
  // [2026-08-03] 목록 테이블 zebra 줄무늬 (com4in_ehs 기준)
  zebraOdd: '#ffffff',
  zebraEven: '#f5f7fa',
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
  // [2026-08-03] 목록 테이블 zebra 줄무늬 (com4in_ehs 기준)
  zebraOdd: 'transparent',
  zebraEven: 'rgba(255,255,255,0.04)',
}

// [2026-08-03] 폰트 스타일 com4in_ehs 기준으로 교체
// 스타일가이드 폰트 — Pretendard Variable(한글) + Inter(영문)
const fontFamily = '"Inter", "Pretendard Variable", "Malgun Gothic", sans-serif'

// [2026-08-03] 목록 화면 상태 Chip 색상 토큰 (com4in_ehs designTokens.status)
const statusTokens = {
  success: { bg: '#E6F9EE', text: '#1A8040', border: '#a0e0b8' },
  info: { bg: '#e8f0ff', text: '#2A5ACC', border: '#b0c8f8' },
  warning: { bg: '#fff8e6', text: '#b07800', border: '#f0d890' },
  danger: { bg: '#ffeaea', text: '#C02020', border: '#f0a0a0' },
} as const

// 타이포그래피 스케일 (스타일가이드 --type-* 매핑)
const typeScale = {
  minimal: { size: 10, line: 14 },
  label: { size: 12, line: 16 },
  body: { size: 14, line: 20 },
  title: { size: 16, line: 24 },
} as const

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
      // 스타일가이드 type-* 매핑 (10/12/14/16 base)
      htmlFontSize: 16,
      fontSize: typeScale.body.size, // 14
      h1: { fontSize: '2rem', lineHeight: 1.25, fontWeight: 700, letterSpacing: '-0.01em' },
      h2: { fontSize: '1.5rem', lineHeight: 1.3, fontWeight: 700, letterSpacing: '-0.01em' },
      h3: { fontSize: '1.25rem', lineHeight: 1.35, fontWeight: 700 },
      h4: { fontSize: '1.125rem', lineHeight: 1.4, fontWeight: 700 },
      h5: { fontSize: '1rem', lineHeight: '24px', fontWeight: 700 }, // type-title
      h6: { fontSize: '0.875rem', lineHeight: '20px', fontWeight: 700 }, // type-body bold
      body1: { fontSize: `${typeScale.body.size}px`, lineHeight: `${typeScale.body.line}px` }, // 14/20
      body2: { fontSize: '13px', lineHeight: '18px' },
      caption: { fontSize: '12px', lineHeight: '16px' },
      subtitle1: { fontSize: `${typeScale.title.size}px`, lineHeight: `${typeScale.title.line}px`, fontWeight: 600 },
      subtitle2: { fontSize: `${typeScale.body.size}px`, lineHeight: `${typeScale.body.line}px`, fontWeight: 600 },
      button: { fontSize: `${typeScale.body.size}px`, fontWeight: 600, textTransform: 'none' as const, letterSpacing: 0 },
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
            // 내부 TableContainer 가 모서리에서 튀어나오는 현상 방지
            '&:has(.MuiTableContainer-root)': {
              overflow: 'hidden',
            },
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
            // [2026-08-03] overflow:hidden 이 모든 목록의 가로 스크롤을 막던 문제 해결
            overflowX: 'auto',
            overflowY: 'auto',
            // 부모가 Paper variant="outlined" 인 경우 이중 외곽선 방지
            '.MuiPaper-outlined &': {
              border: 'none',
              borderRadius: 0,
            },
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
            // [2026-08-03] 다크모드 셀 경계선 대비 강화 (com4in_ehs 기준)
            borderRight: mode === 'dark' ? '1px solid rgba(255,255,255,0.25)' : `1px solid ${colors.border}`,
            borderBottomColor: mode === 'dark' ? 'rgba(255,255,255,0.25)' : undefined,
            '&:last-child': {
              borderRight: 'none',
            },
          },
          head: {
            backgroundColor: colors.tableHeader,
            color: mode === 'dark' ? '#ffffff' : '#46536e',
            // [2026-08-03] 헤더 라벨은 항상 한 줄 — "사업자 등록번호" 등이 2줄로 접히는 문제 방지.
            // 본문은 전역 nowrap 미적용 (기존 셀 줄바꿈 처리와 충돌하므로 컬럼 단위로만 적용)
            whiteSpace: 'nowrap',
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
            // [2026-08-03] 목록 셀은 두 줄로 접히지 않게 한 줄 고정 — 폭을 넘으면
            // TableContainer 의 overflowX 로 가로 스크롤. 줄바꿈이 필요한 폼/상세 셀은
            // 인라인 sx(whiteSpace: pre-line | normal)가 같은 특이도로 이 값을 덮어씀
            whiteSpace: 'nowrap',
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
      // [2026-08-03] 목록 테이블 zebra 줄무늬 + 마지막 행 이중선 제거 (com4in_ehs 기준)
      // TableHead 가 있는 데이터/목록 테이블에만 적용 — 라벨/값 폼 테이블은 제외
      MuiTableBody: {
        styleOverrides: {
          root: {
            '.MuiTable-root:has(.MuiTableHead-root) &': {
              '& > tr:nth-of-type(odd):not(.Mui-selected)': {
                backgroundColor: colors.zebraOdd,
              },
              '& > tr:nth-of-type(even):not(.Mui-selected)': {
                backgroundColor: colors.zebraEven,
              },
            },
            '& tr:last-child .MuiTableCell-body, & tr:last-child .MuiTableCell-root': {
              borderBottom: 'none !important',
            },
          },
        },
      },
      // [2026-08-03] 목록 화면 공통 페이지네이션 (맨앞/맨끝 버튼 기본 노출)
      MuiPagination: {
        defaultProps: {
          showFirstButton: true,
          showLastButton: true,
        },
      },
      MuiPaginationItem: {
        styleOverrides: {
          root: {
            '&.Mui-selected': {
              backgroundColor: colors.primary,
              color: '#ffffff',
              '&:hover': {
                backgroundColor: colors.primaryHover,
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            borderRadius: 6,
            // [2026-08-03] com4in_ehs 목록 Chip 규격
            fontSize: `${typeScale.label.size}px`,
            lineHeight: 1.2,
            height: 22,
            // default color chip 다크 대비 개선 (ChipClasses 에 colorDefault 슬롯 없음)
            ...(mode === 'dark' && {
              '&.MuiChip-colorDefault': {
                backgroundColor: 'rgba(255,255,255,0.12)',
                color: '#e5e7eb',
              },
            }),
          },
          colorSuccess: {
            backgroundColor: mode === 'light' ? statusTokens.success.bg : '#14532d',
            color: mode === 'light' ? statusTokens.success.text : '#86efac',
            ...(mode === 'light' && { border: `1px solid ${statusTokens.success.border}` }),
          },
          colorWarning: {
            backgroundColor: mode === 'light' ? statusTokens.warning.bg : '#7c2d12',
            color: mode === 'light' ? statusTokens.warning.text : '#fdba74',
            ...(mode === 'light' && { border: `1px solid ${statusTokens.warning.border}` }),
          },
          colorError: {
            backgroundColor: mode === 'light' ? statusTokens.danger.bg : '#7f1d1d',
            color: mode === 'light' ? statusTokens.danger.text : '#fca5a5',
            ...(mode === 'light' && { border: `1px solid ${statusTokens.danger.border}` }),
          },
          colorInfo: {
            backgroundColor: mode === 'light' ? statusTokens.info.bg : '#172554',
            color: mode === 'light' ? statusTokens.info.text : '#93c5fd',
            ...(mode === 'light' && { border: `1px solid ${statusTokens.info.border}` }),
          },
          // outlined variant 다크 대비 — MUI v5 ChipClasses 에 outlined{Success,...} 슬롯이
          // 없어 outlined 슬롯 안에서 color 클래스로 분기
          outlined: {
            ...(mode === 'dark' && {
              '&.MuiChip-colorSuccess': { color: '#86efac', borderColor: '#4ade80' },
              '&.MuiChip-colorWarning': { color: '#fdba74', borderColor: '#fb923c' },
              '&.MuiChip-colorError': { color: '#fca5a5', borderColor: '#f87171' },
              '&.MuiChip-colorInfo': { color: '#93c5fd', borderColor: '#60a5fa' },
            }),
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
      MuiDataGrid: {
        defaultProps: {
          showCellVerticalBorder: true,
          showColumnVerticalBorder: true,
        },
        styleOverrides: {
          root: {
            '& .MuiDataGrid-columnHeader': {
              borderRight: `1px solid ${colors.border}`,
            },
            '& .MuiDataGrid-cell': {
              borderRight: `1px solid ${colors.border}`,
              borderBottom: `1px solid ${colors.border}`,
            },
            '& .MuiDataGrid-columnHeaders': {
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.tableHeader,
            },
            // [2026-08-03] Table 목록 디자인과 헤더 서체·zebra 통일 (com4in_ehs 기준)
            '& .MuiDataGrid-columnHeaderTitle': {
              color: mode === 'dark' ? '#ffffff' : '#46536e',
              fontWeight: 600,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            },
            '& .MuiDataGrid-row:nth-of-type(odd)': {
              backgroundColor: colors.zebraOdd,
            },
            '& .MuiDataGrid-row:nth-of-type(even)': {
              backgroundColor: colors.zebraEven,
            },
            '& .MuiDataGrid-row': {
              '&:hover': {
                backgroundColor: `${colors.tableHover} !important`,
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
