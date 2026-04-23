import { Box, Paper, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

const PolicyPage: React.FC = () => {
  const { t } = useTranslation()

  return (
    <Box sx={{ p: 3, maxWidth: 960, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        {t('introduction.policy.title')}
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
          src="/brand/policy.png"
          alt={t('introduction.policy.title')}
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

export default PolicyPage
