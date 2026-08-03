import { IconButton, Tooltip } from '@mui/material'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import { useTranslation } from 'react-i18next'
import { useThemeMode } from '../../context/ThemeContext'

interface ThemeToggleProps {
  color?: string
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ color = 'white' }) => {
  const { t } = useTranslation()
  const { isDarkMode, toggleTheme } = useThemeMode()

  return (
    <Tooltip title={isDarkMode ? t('theme.light') : t('theme.dark')}>
      <IconButton
        onClick={toggleTheme}
        size="small"
        sx={{
          color,
          // [2026-08-03] AppBar 흰색 배경에서도 보이도록 테마 기준 hover 색상 사용
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  )
}

export default ThemeToggle
