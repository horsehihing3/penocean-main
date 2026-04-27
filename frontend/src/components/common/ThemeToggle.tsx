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
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.1)',
          },
        }}
      >
        {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  )
}

export default ThemeToggle
