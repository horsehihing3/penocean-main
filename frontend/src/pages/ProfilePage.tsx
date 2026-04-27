import { Box, Paper, Typography, Avatar, Divider, Stack } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

const ProfilePage: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()

  if (!user) return null

  const rows: Array<{ label: string; value?: string | number | null }> = [
    { label: t('auth.username'), value: user.username },
    { label: t('profile.name'), value: user.name },
    { label: t('profile.email'), value: user.email },
    { label: t('profile.phone'), value: user.phone },
    { label: t('profile.role'), value: user.role },
    { label: t('profile.status'), value: user.status },
    { label: t('profile.lastLogin'), value: user.lastLoginAt },
  ]

  return (
    <Box sx={{ p: 3, maxWidth: 720, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        {t('profile.title')}
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 24 }}>
            {user.name?.charAt(0) || user.username?.charAt(0) || 'U'}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {user.name || user.username}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Stack divider={<Divider flexItem />} spacing={1.5}>
          {rows.map((row) => (
            <Box
              key={row.label}
              sx={{
                display: 'grid',
                gridTemplateColumns: '160px 1fr',
                gap: 2,
                py: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {row.label}
              </Typography>
              <Typography variant="body2">{row.value ?? '-'}</Typography>
            </Box>
          ))}
        </Stack>
      </Paper>
    </Box>
  )
}

export default ProfilePage
