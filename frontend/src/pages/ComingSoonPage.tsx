import { Box, Typography } from '@mui/material'
import ConstructionIcon from '@mui/icons-material/Construction'
import { useTranslation } from 'react-i18next'

const ComingSoonPage: React.FC = () => {
  const { t } = useTranslation()

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 400,
        textAlign: 'center',
        color: 'text.secondary',
        p: 3,
      }}
    >
      <ConstructionIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
      <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
        {t('common.comingSoon')}
      </Typography>
    </Box>
  )
}

export default ComingSoonPage
