import { useNavigate } from 'react-router-dom'
import { Box, Typography, Button } from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import { useTranslation } from 'react-i18next'

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        textAlign: 'center',
        p: 3,
      }}
    >
      <Typography variant="h1" sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: 80, md: 120 } }}>
        404
      </Typography>
      <Typography variant="h5" gutterBottom>
        {t('notFound.title')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {t('notFound.description')}
      </Typography>
      <Button variant="contained" startIcon={<HomeIcon />} onClick={() => navigate('/')}>
        {t('notFound.backHome')}
      </Button>
    </Box>
  )
}

export default NotFoundPage
