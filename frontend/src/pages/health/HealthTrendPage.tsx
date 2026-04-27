import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  Chip,
  Alert,
  Grid,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { healthApi } from '../../api/healthApi'
import { useAuth } from '../../context/AuthContext'

const HealthTrendPage: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [searchParams] = useSearchParams()
  const presetUserId = searchParams.get('userId')
  const [userIdInput, setUserIdInput] = useState<string>(
    presetUserId ?? (isAdmin ? '' : user?.id ? String(user.id) : '')
  )
  const effectiveUserId = isAdmin ? Number(userIdInput) || 0 : user?.id ?? 0

  const trendQuery = useQuery({
    queryKey: ['health', 'trend', effectiveUserId],
    queryFn: () => healthApi.trends(effectiveUserId, 3),
    enabled: effectiveUserId > 0,
  })

  const data = trendQuery.data

  const chartData = useMemo(() => {
    if (!data?.years) return []
    return data.years
      .slice()
      .sort((a, b) => (a.year === b.year ? a.month - b.month : a.year - b.year))
      .map((p) => ({
        label: `${String(p.year).slice(2)}/${String(p.month).padStart(2, '0')}`,
        systolicBp: p.systolicBp ?? null,
        diastolicBp: p.diastolicBp ?? null,
        fastingGlucose: p.fastingGlucose ?? null,
        hba1c: p.hba1c ?? null,
        totalCholesterol: p.totalCholesterol ?? null,
        ldl: p.ldl ?? null,
      }))
  }, [data])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        {t('health.trend.pageTitle')}
      </Typography>

      {isAdmin && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              size="small"
              type="number"
              label={t('health.checkup.userId')}
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              sx={{ minWidth: 160 }}
            />
            <Typography variant="caption" color="text.secondary">
              {t('health.trend.userIdHint')}
            </Typography>
          </Stack>
        </Paper>
      )}

      {effectiveUserId === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">{t('health.trend.selectUserHint')}</Typography>
        </Paper>
      ) : trendQuery.isError ? (
        <Alert severity="error">{t('approval.loadError')}</Alert>
      ) : (
        <>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                label={t('health.trend.hypertension')}
                color={data?.isHypertension ? 'error' : 'default'}
                variant={data?.isHypertension ? 'filled' : 'outlined'}
                sx={{ fontWeight: 600 }}
              />
              <Chip
                label={t('health.trend.diabetes')}
                color={data?.isDiabetes ? 'error' : 'default'}
                variant={data?.isDiabetes ? 'filled' : 'outlined'}
                sx={{ fontWeight: 600 }}
              />
              <Chip
                label={t('health.trend.dyslipidemia')}
                color={data?.isDyslipidemia ? 'error' : 'default'}
                variant={data?.isDyslipidemia ? 'filled' : 'outlined'}
                sx={{ fontWeight: 600 }}
              />
            </Stack>
          </Paper>

          {chartData.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">{t('common.noData')}</Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    {t('health.vitals.bp')}
                  </Typography>
                  <Box sx={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="systolicBp"
                          stroke="#d32f2f"
                          name={t('health.vitals.systolic')}
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey="diastolicBp"
                          stroke="#1976d2"
                          name={t('health.vitals.diastolic')}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    {t('health.vitals.glucose')}
                  </Typography>
                  <Box sx={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="fastingGlucose"
                          stroke="#ed6c02"
                          name={t('health.vitals.fastingGlucose')}
                          connectNulls
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="hba1c"
                          stroke="#9c27b0"
                          name="HbA1c"
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    {t('health.vitals.cholesterol')}
                  </Typography>
                  <Box sx={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="totalCholesterol"
                          stroke="#2e7d32"
                          name={t('health.vitals.totalCholesterol')}
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey="ldl"
                          stroke="#d32f2f"
                          name="LDL"
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}
        </>
      )}
    </Box>
  )
}

export default HealthTrendPage
