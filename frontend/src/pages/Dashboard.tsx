import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  Badge,
  IconButton,
  Chip,
  Skeleton,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
} from '@mui/material'
import NotificationsIcon from '@mui/icons-material/Notifications'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import LoginIcon from '@mui/icons-material/Login'
import AssessmentIcon from '@mui/icons-material/Assessment'
import HowToRegIcon from '@mui/icons-material/HowToReg'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { dashboardApi } from '../api/dashboardApi'
import type { DashboardSummary } from '../types/dashboard'

interface DashCardProps {
  icon: React.ReactNode
  title: string
  description: string
  count?: number
  accent?: string
  onClick?: () => void
  loading?: boolean
}

const DashCard: React.FC<DashCardProps> = ({
  icon,
  title,
  description,
  count,
  accent,
  onClick,
  loading,
}) => {
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: { xs: 2, md: 3 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:hover': onClick
          ? {
              transform: 'translateY(-2px)',
              boxShadow: 3,
            }
          : {},
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: accent ?? 'primary.main',
            color: 'white',
          }}
        >
          {icon}
        </Box>
        {loading ? (
          <Skeleton variant="rounded" width={40} height={24} />
        ) : (
          <Chip
            label={typeof count === 'number' ? count : '—'}
            size="small"
            sx={{ fontWeight: 700 }}
          />
        )}
      </Box>

      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>

      <Box sx={{ flex: 1 }} />
    </Paper>
  )
}

const Dashboard: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'ADMIN'

  const {
    data: summary,
    isLoading,
    isError,
  } = useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardApi.getSummary,
    staleTime: 30_000,
  })

  const totalNotifications = summary?.recentNotifications.length ?? 0
  const pendingNotice =
    user?.status === 'PENDING' || summary?.myPendingRegistrationStatus === 'PENDING'

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleString(i18n.language === 'ko' ? 'ko-KR' : 'en-US', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  return (
    <Box sx={{ p: { xs: 0.5, md: 1 } }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {t('dashboard.welcome')}
            {user?.name ? `, ${user.name}` : ''}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t('dashboard.welcomeSubtitle')}
          </Typography>
        </Box>

        <IconButton size="large" aria-label={t('dashboard.notifications')}>
          <Badge badgeContent={totalNotifications} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Stack>

      {/* Pending notice (defensive; usually blocked at login) */}
      {pendingNotice && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {t('dashboard.myPendingApproval')}
        </Alert>
      )}

      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {t('dashboard.loadError')}
        </Alert>
      )}

      {/* Cards */}
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <DashCard
            icon={<WarningAmberIcon />}
            title={t('dashboard.cardAccidentAlert')}
            description={t('dashboard.cardAccidentAlertDesc')}
            accent="#ef4444"
            count={summary?.highIncidentCompanies.length}
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <DashCard
            icon={<LoginIcon />}
            title={t('dashboard.cardPendingAccess')}
            description={t('dashboard.cardPendingAccessDesc')}
            accent="#0052a5"
            count={summary?.pendingAccessRequests}
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <DashCard
            icon={<AssessmentIcon />}
            title={t('dashboard.cardPendingEval')}
            description={t('dashboard.cardPendingEvalDesc')}
            accent="#f97316"
            count={summary?.pendingEvaluations}
            loading={isLoading}
          />
        </Grid>
        {isAdmin && (
          <Grid item xs={12} sm={6} lg={3}>
            <DashCard
              icon={<HowToRegIcon />}
              title={t('dashboard.cardPendingApproval')}
              description={t('dashboard.cardPendingApprovalDesc')}
              accent="#10b981"
              count={summary?.pendingApprovalCount}
              loading={isLoading}
              onClick={() => navigate('/admin/approval')}
            />
          </Grid>
        )}
      </Grid>

      {/* Two-column detail area */}
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mt: { xs: 2, md: 3 } }}>
        {/* High incident companies */}
        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, height: '100%' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {t('dashboard.highIncidentTitle')}
              </Typography>
            </Stack>
            {isLoading ? (
              <Stack spacing={1}>
                <Skeleton height={40} />
                <Skeleton height={40} />
                <Skeleton height={40} />
              </Stack>
            ) : summary?.highIncidentCompanies.length ? (
              <List dense disablePadding>
                {summary.highIncidentCompanies.map((c, idx) => (
                  <Box key={c.companyId}>
                    {idx > 0 && <Divider component="li" />}
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={c.companyName}
                        secondary={`${t('dashboard.incidentRate')}: ${c.incidentRate != null ? Number(c.incidentRate).toFixed(2) : '-'}%`}
                      />
                      <Chip
                        label={`${c.incidentRate != null ? Number(c.incidentRate).toFixed(1) : '-'}%`}
                        color="error"
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                {t('common.noData')}
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Recent notifications */}
        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, height: '100%' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {t('dashboard.recentNotifications')}
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/notice/board')}
              >
                {t('dashboard.viewAll')}
              </Button>
            </Stack>
            {isLoading ? (
              <Stack spacing={1}>
                <Skeleton height={36} />
                <Skeleton height={36} />
                <Skeleton height={36} />
              </Stack>
            ) : summary?.recentNotifications.length ? (
              <List dense disablePadding>
                {summary.recentNotifications.map((n, idx) => (
                  <Box key={n.id}>
                    {idx > 0 && <Divider component="li" />}
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={n.subject}
                        secondary={formatDate(n.createdAt)}
                        primaryTypographyProps={{
                          noWrap: true,
                          sx: { fontWeight: 500 },
                        }}
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                {t('dashboard.notificationsEmpty')}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard
