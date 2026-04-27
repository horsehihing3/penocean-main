import { Box, CircularProgress, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

interface LoadingScreenProps {
  message?: string
  fullscreen?: boolean
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message, fullscreen = true }) => {
  const { t } = useTranslation()

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        minHeight: fullscreen ? '100vh' : 240,
        backgroundColor: 'background.default',
      }}
    >
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        {message ?? t('common.loading')}
      </Typography>
    </Box>
  )
}

export default LoadingScreen
