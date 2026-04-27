import { Box, Paper, Typography, Stack, Button, Grid, Chip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import InfoIcon from '@mui/icons-material/Info'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const STEPS = [
  { title: '사전 준비', desc: '작업 범위, 대상 설비, 투입 인력 파악' },
  { title: '유해·위험요인 파악', desc: '물리/화학/생물학적, 인간공학적, 심리적 요인 식별' },
  { title: '위험성 추정', desc: '가능성(Likelihood) × 중대성(Severity) 산출' },
  { title: '위험성 결정', desc: '허용 가능 여부 판단 및 등급 부여' },
  { title: '위험성 감소 대책', desc: '제거 → 대체 → 공학적 → 관리적 → 보호구 순 적용' },
  { title: '기록 및 보관', desc: '평가표 작성 → 사업장 출입신청 시 첨부' },
  { title: '재평가', desc: '설비/공정 변경 시, 사고 발생 시, 정기(연 1회) 재평가' },
]

const RiskAssessmentProcedurePage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        {t('vessel.procedure.riskTitle')}
      </Typography>

      <Paper sx={{ p: { xs: 3, md: 4 }, mb: 2 }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          도급업체 작업 전 필수로 수행해야 하는 위험성평가 표준 절차입니다.
          평가표는 출입신청 시 첨부 파일로 제출됩니다.
        </Typography>

        <Grid container spacing={2}>
          {STEPS.map((s, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Chip label={`STEP ${i + 1}`} size="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight={700}>
                    {s.title}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {s.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Button
          variant="contained"
          startIcon={<PictureAsPdfIcon />}
          onClick={() => setDialogOpen(true)}
        >
          절차서 PDF 다운로드
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => navigate('/notice/forms')}
        >
          양식함으로 이동
        </Button>
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoIcon color="warning" />
          준비 중
        </DialogTitle>
        <DialogContent>
          <Typography>절차서 PDF가 아직 등록되지 않았습니다.</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            관리자에게 문의하거나 양식함에서 확인해 주세요.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>확인</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default RiskAssessmentProcedurePage
