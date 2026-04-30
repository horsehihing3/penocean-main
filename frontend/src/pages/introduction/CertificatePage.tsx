import { Box, Paper, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

const CertificatePage: React.FC = () => {
  const { t } = useTranslation()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        {t('introduction.certificate.title')}
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, md: 4 },
          display: 'flex',
          justifyContent: 'center',
          bgcolor: 'background.paper',
        }}
      >
        <Box
          component="img"
          src="/brand/certificate.png"
          alt={t('introduction.certificate.title')}
          sx={{
            maxWidth: '100%',
            height: 'auto',
            display: 'block',
          }}
        />
      </Paper>
    </Box>
  )
}

export default CertificatePage
