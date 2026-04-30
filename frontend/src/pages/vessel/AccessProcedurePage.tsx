// [2026-04-30] PPT 슬라이드 10 기준 플로우차트 — 반응형 flex-wrap + 글자 1.3배 확대
import { Box, Paper, Typography, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import InfoIcon from '@mui/icons-material/Info'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'

// 논리 순서 1~7
const ALL_STEPS = [
  { num: 1, label: '승선(방문)신청', sub: '제출서류: 위험성평가,\n안전보건서약서, 작업계획서' },
  { num: 2, label: '교육안내 송부', sub: '(교육 미수료자)' },
  { num: 3, label: '수신자 접속 및\n교육 이수', sub: null },
  { num: 4, label: '교육이수\n증명서 발급', sub: null },
  { num: 5, label: '선박 승선\n사업장 방문', sub: null },
  { num: 6, label: '현문당직자\n사업장 담당자\n증명서 확인', sub: null },
  { num: 7, label: 'WORK', sub: null },
]

const PROCEDURES = [
  { label: '도급업체 안전보건관리 절차', bullet: '절차서 등재' },
  { label: '위험성평가 절차', bullet: '절차서 등재' },
]

interface StepBoxProps {
  num: number
  label: string
  sub?: string | null
}


const StepBox = ({ label, sub }: Omit<StepBoxProps, 'num'>) => (
  <Box
    sx={{
      border: '1.5px solid #555',
      borderRadius: 2,
      px: 2,
      py: 2,
      minHeight: 100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      backgroundColor: '#fff',
      width: '100%',
    }}
  >
    <Typography
      sx={{
        fontWeight: 600,
        fontSize: '1.14rem',
        whiteSpace: 'pre-line',
        lineHeight: 1.55,
      }}
    >
      {label}
    </Typography>
    {sub && (
      <Typography
        sx={{
          display: 'block',
          mt: 0.5,
          fontSize: '0.975rem',
          color: 'text.secondary',
          whiteSpace: 'pre-line',
          lineHeight: 1.4,
        }}
      >
        {sub}
      </Typography>
    )}
  </Box>
)

const AccessProcedurePage: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [dialogLabel, setDialogLabel] = useState<string | null>(null)
  const [registerDialog, setRegisterDialog] = useState<string | null>(null)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        {t('vessel.procedure.accessTitle')}
      </Typography>

      {/* 반응형 플로우차트 */}
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#fafafa' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          {ALL_STEPS.map((step, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                // 화면 너비에 따라 자동 줄바꿈:
                // 최소 180px → 넓은 화면에서 4개(25%), 좁으면 3개·2개·1개씩
                flex: '1 1 180px',
                minWidth: 0,
              }}
            >
              <StepBox num={step.num} label={step.label} sub={step.sub} />
              {i < ALL_STEPS.length - 1 && (
                <ArrowForwardIcon sx={{ color: '#555', flexShrink: 0 }} />
              )}
            </Box>
          ))}
        </Box>
      </Paper>

      {/* 절차서 PDF 카드 */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-start' }}>
        {PROCEDURES.map((proc) => (
          <Box
            key={proc.label}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              minWidth: 220,
            }}
          >
            {/* 클릭 영역: PDF 다운로드 */}
            <Box
              onClick={() => setDialogLabel(proc.label)}
              sx={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                '&:hover': { opacity: 0.8 },
              }}
            >
              <PictureAsPdfIcon color="error" sx={{ mt: 0.2, flexShrink: 0 }} />
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
                  - {proc.label}
                </Typography>
                </Box>
            </Box>

            {/* 관리자 전용 등재 버튼 */}
            {isAdmin && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => setRegisterDialog(proc.label)}
                sx={{ alignSelf: 'flex-start', fontSize: '0.875rem' }}
              >
                절차서 등재
              </Button>
            )}
          </Box>
        ))}

        {/* 안내 말풍선 */}
        <Box
          sx={{
            p: 1.5,
            border: '1.5px solid',
            borderColor: 'info.main',
            borderRadius: 2,
            backgroundColor: '#e3f2fd',
            display: 'flex',
            alignItems: 'center',
            alignSelf: { sm: 'center' },
          }}
        >
          <Typography sx={{ fontSize: '0.875rem', color: 'info.dark' }}>
            화면 누르면 PDF 다운로드 가능
          </Typography>
        </Box>
      </Stack>

      {/* PDF 다운로드 준비중 다이얼로그 */}
      <Dialog open={!!dialogLabel} onClose={() => setDialogLabel(null)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoIcon color="warning" />
          준비 중
        </DialogTitle>
        <DialogContent>
          <Typography>
            <strong>{dialogLabel}</strong> PDF가 아직 등록되지 않았습니다.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            관리자에게 문의하거나 양식함에서 확인해 주세요.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogLabel(null)}>확인</Button>
        </DialogActions>
      </Dialog>

      {/* 절차서 등재 준비중 다이얼로그 (관리자 전용) */}
      <Dialog open={!!registerDialog} onClose={() => setRegisterDialog(null)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoIcon color="warning" />
          준비 중
        </DialogTitle>
        <DialogContent>
          <Typography>
            <strong>{registerDialog}</strong> 등재 기능은 아직 준비 중입니다.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            서식함(양식함)에서 파일을 직접 업로드해 주세요.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegisterDialog(null)}>확인</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AccessProcedurePage
