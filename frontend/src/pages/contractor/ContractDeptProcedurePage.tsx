import { Box, Paper, Typography, Stack, Chip, Grid, Alert, Button } from '@mui/material'
import FlagIcon from '@mui/icons-material/Flag'
import HandshakeIcon from '@mui/icons-material/Handshake'
import WorkIcon from '@mui/icons-material/Work'
import ReplayIcon from '@mui/icons-material/Replay'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// PPT slide 18: 계약부서용 협력업체 안전보건 절차 (업체선정 → 도급계약 기획 →
// 업무 진행 → 업무 종료/재계약)
const PHASES: {
  icon: React.ReactNode
  title: string
  color: string
  items: string[]
}[] = [
  {
    icon: <FlagIcon />,
    title: '업체선정 후 도급계약 기획',
    color: '#1d4ed8',
    items: [
      '① 안전보건 평가 (계약담당팀 시행)',
      '② 위험성 평가 자료 요청',
    ],
  },
  {
    icon: <HandshakeIcon />,
    title: '계약 체결',
    color: '#0891b2',
    items: [
      '① 안전보건 PORTAL 가입',
      '② 안전서약서 작성 요청 (업체 작성 후 제출)',
      '③ 안전수칙 제공',
    ],
  },
  {
    icon: <WorkIcon />,
    title: '업무 진행',
    color: '#059669',
    items: [
      '① 안전보건 평가 (반기평가)',
      '② 협력업체 안전점검 (당사 사업장에서 업무 시)',
      '③ 도급협의체 운영 (당사 사업장에서 업무 시)',
    ],
  },
  {
    icon: <ReplayIcon />,
    title: '업무 종료 / 재계약',
    color: '#b45309',
    items: [
      '① 재계약 시 평가 결과 등 반영하여 진행',
    ],
  },
]

const ContractDeptProcedurePage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        {t('contractor.procedure.title')}
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        {t('contractor.procedure.intro')}
      </Alert>

      <Grid container spacing={2}>
        {PHASES.map((p, idx) => (
          <Grid item xs={12} sm={6} md={3} key={p.title}>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                borderTop: '4px solid',
                borderTopColor: p.color,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: p.color,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {p.icon}
                </Box>
                <Chip size="small" label={`STEP ${idx + 1}`} sx={{ fontWeight: 700 }} />
              </Stack>
              <Typography variant="subtitle1" fontWeight={700}>
                {p.title}
              </Typography>
              <Stack component="ul" spacing={1} sx={{ pl: 2, m: 0 }}>
                {p.items.map((it) => (
                  <Typography key={it} component="li" variant="body2" sx={{ lineHeight: 1.6 }}>
                    {it}
                  </Typography>
                ))}
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 3 }}>
        <Button variant="contained" onClick={() => navigate('/contractor/evaluation')}>
          {t('contractor.procedure.goEval')}
        </Button>
        <Button variant="outlined" onClick={() => navigate('/contractor/evaluation/new')}>
          {t('contractor.procedure.goEvalNew')}
        </Button>
      </Stack>
    </Box>
  )
}

export default ContractDeptProcedurePage
