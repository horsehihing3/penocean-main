import React from 'react'
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Tooltip } from '@mui/material'
import LanguageIcon from '@mui/icons-material/Language'
import CheckIcon from '@mui/icons-material/Check'
import { useTranslation } from 'react-i18next'
import { useLanguage, type Language } from '../../context/LanguageContext'

interface LanguageSwitcherProps {
  color?: string
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ color = 'white' }) => {
  const { t } = useTranslation()
  const { language, changeLanguage, languages } = useLanguage()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleSelect = (code: Language) => {
    changeLanguage(code)
    handleClose()
  }

  return (
    <>
      <Tooltip title={t('language.select')}>
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{
            color,
            // [2026-08-03] AppBar 흰색 배경에서도 보이도록 테마 기준 hover 색상 사용
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <LanguageIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {languages.map((lang) => (
          <MenuItem
            key={lang.code}
            onClick={() => handleSelect(lang.code)}
            selected={language === lang.code}
          >
            <ListItemIcon>
              {language === lang.code && <CheckIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText>{lang.name}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

export default LanguageSwitcher
