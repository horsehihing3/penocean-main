import { Box, Paper, Typography, Grid } from '@mui/material'
import { useTranslation } from 'react-i18next'

const GOALS: Array<{ metric: string; target: string }> = [
  { metric: '중대재해', target: 'ZERO' },
  { metric: '산업재해율(LTIR)', target: '전년 대비 감소' },
  { metric: '위험성평가 이행률', target: '100%' },
  { metric: '안전보건교육 이수율', target: '100%' },
  { metric: '협력업체 안전점검', target: '정기 분기 1회 이상' },
]

const GoalPage: React.FC = () => {
  const { t } = useTranslation()

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        {t('introduction.goal.title')}
      </Typography>

      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
          팬오션의 임직원과 이해관계자의 안전과 보건을 지키기 위해
          다음과 같이 연간 안전보건 목표를 수립하여 운영한다.
        </Typography>

        <Grid container spacing={2}>
          {GOALS.map((g) => (
            <Grid item xs={12} sm={6} key={g.metric}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {g.metric}
                </Typography>
                <Typography variant="h6" fontWeight={700} color="primary">
                  {g.target}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  )
}

export default GoalPage
