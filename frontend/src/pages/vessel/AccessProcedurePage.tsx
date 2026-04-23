import { Box, Paper, Typography, Stack, Button, Alert, Snackbar } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const PDF_URL = '/procedures/access-procedure.pdf'

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
  const [missingOpen, setMissingOpen] = useState(false)

  const handleDownload = async () => {
    try {
      const res = await fetch(PDF_URL, { method: 'HEAD' })
      if (!res.ok) {
        setMissingOpen(true)
        return
      }
      window.open(PDF_URL, '_blank', 'noopener,noreferrer')
    } catch {
      setMissingOpen(true)
    }
  }

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
          onClick={handleDownload}
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

      <Snackbar
        open={missingOpen}
        autoHideDuration={3500}
        onClose={() => setMissingOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="warning" variant="filled">
          절차서 PDF가 아직 등록되지 않았습니다. 관리자에게 문의하거나 양식함에서 확인해주세요.
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default AccessProcedurePage
