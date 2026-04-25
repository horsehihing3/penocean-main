import { Box, Paper, Typography, Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import InfoIcon from '@mui/icons-material/Info'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const STEPS = [
  '협력업체 등록 및 포털 가입 신청',
  '안전보건 평가 및 적격업체 선정',
  '위험성평가 수행 및 자료 제출',
  '안전보건 서약서 제출 및 안전수칙 교육 이수',
  '승선/출입 신청 — 작업자 명단 + 위험성평가 + 서약서 + 작업계획서 첨부',
  '계약부서 검토 → 방문 허가서 발급',
  '현장 안전점검 및 도급협의체 운영',
  '작업 종료 후 반기평가 반영',
]

const AccessProcedurePage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        {t('vessel.procedure.accessTitle')}
      </Typography>

      <Paper sx={{ p: { xs: 3, md: 4 }, mb: 2 }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          팬오션 사업장(선박) 출입을 위한 도급업체 안전보건 관리 절차입니다.
          각 단계별 양식 및 절차서는 "양식함"에서 다운로드할 수 있습니다.
        </Typography>

        <Stack component="ol" spacing={1.5} sx={{ pl: 3, m: 0 }}>
          {STEPS.map((s, i) => (
            <Typography key={i} component="li" variant="body1" sx={{ lineHeight: 1.7 }}>
              {s}
            </Typography>
          ))}
        </Stack>
      </Paper>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
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
        <Button
          variant="outlined"
          startIcon={<OpenInNewIcon />}
          onClick={() => navigate('/vessel/access-request')}
        >
          출입신청 바로가기
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

export default AccessProcedurePage
