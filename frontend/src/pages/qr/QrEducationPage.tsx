// [2026-04-27] QR 안전교육 이수 공개 페이지 (비로그인 접근 가능)
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import {
  Box, Typography, Paper, TextField, Button, Stepper, Step, StepLabel,
  Checkbox, FormControlLabel, CircularProgress, Alert, Divider,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

const API_BASE = '/api'
const STEPS = ['QR 확인', '작업자 정보', '안전교육 내용', '이수 완료']

interface QrInfo {
  id: number
  title: string
  vesselName: string
  content: string
}

export default function QrEducationPage() {
  const { token } = useParams<{ token: string }>()
  const [step, setStep] = useState(0)
  const [qrInfo, setQrInfo] = useState<QrInfo | null>(null)
  const [loadError, setLoadError] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [form, setForm] = useState({
    workerName: '',
    vesselName: '',
    workDate: new Date().toISOString().split('T')[0],
    gender: '',
    phone: '',
  })

  useEffect(() => {
    if (!token) return
    axios.get(`${API_BASE}/public/safety-qr/${token}`)
      .then(res => {
        setQrInfo(res.data.data)
        setStep(1)
      })
      .catch(() => setLoadError('유효하지 않거나 만료된 QR코드입니다.'))
  }, [token])

  const handleFormChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async () => {
    if (!agreed) return
    setSubmitting(true)
    setSubmitError('')
    try {
      await axios.post(`${API_BASE}/public/safety-qr/${token}/complete`, {
        ...form,
        workDate: form.workDate,
      })
      setStep(4)
    } catch {
      setSubmitError('제출 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadError) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, bgcolor: '#f5f5f5' }}>
        <Alert severity="error" sx={{ maxWidth: 400, width: '100%' }}>{loadError}</Alert>
      </Box>
    )
  }

  if (step === 0) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, px: 2 }}>
      <Paper elevation={2} sx={{ width: '100%', maxWidth: 480, borderRadius: 3, overflow: 'hidden' }}>
        {/* 헤더 */}
        <Box sx={{ bgcolor: '#1565c0', color: '#fff', px: 3, py: 2.5 }}>
          <Typography variant="h6" fontWeight={700}>안전교육 이수</Typography>
          {qrInfo && <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>{qrInfo.title}</Typography>}
        </Box>

        {/* 스텝퍼 */}
        {step < 4 && (
          <Box sx={{ px: 3, pt: 2.5 }}>
            <Stepper activeStep={step - 1} alternativeLabel>
              {STEPS.slice(1).map(label => (
                <Step key={label}><StepLabel>{label}</StepLabel></Step>
              ))}
            </Stepper>
          </Box>
        )}

        <Box sx={{ px: 3, py: 3 }}>
          {/* Step 1: 작업자 정보 */}
          {step === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>작업 정보를 입력하세요</Typography>
              <TextField label="선박명" fullWidth value={form.vesselName} onChange={handleFormChange('vesselName')}
                placeholder={qrInfo?.vesselName || '선박명 입력...'} />
              <TextField label="작업일자" type="date" fullWidth value={form.workDate} onChange={handleFormChange('workDate')}
                InputLabelProps={{ shrink: true }} />
              <TextField label="성함" fullWidth value={form.workerName} onChange={handleFormChange('workerName')}
                placeholder="성함 입력..." />
              <TextField label="성별" fullWidth value={form.gender} onChange={handleFormChange('gender')}
                placeholder="남 / 여" />
              <TextField label="전화번호" fullWidth value={form.phone} onChange={handleFormChange('phone')}
                placeholder="전화번호 입력..." />
              <Button variant="contained" size="large" fullWidth sx={{ mt: 1, py: 1.5 }}
                disabled={!form.workerName || !form.vesselName || !form.workDate}
                onClick={() => setStep(2)}>
                다음
              </Button>
            </Box>
          )}

          {/* Step 2: 안전교육 내용 */}
          {step === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>안전교육 내용</Typography>
              <Paper variant="outlined" sx={{ p: 2, maxHeight: 320, overflowY: 'auto', bgcolor: '#fafafa', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                  {qrInfo?.content || '안전교육 내용이 없습니다.'}
                </Typography>
              </Paper>
              <Divider />
              <FormControlLabel
                control={<Checkbox checked={agreed} onChange={e => setAgreed(e.target.checked)} color="success" />}
                label="본인은 위 교육을 성실히 이수하였으며 수칙 준수를 서약합니다."
              />
              {submitError && <Alert severity="error">{submitError}</Alert>}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" onClick={() => setStep(1)} sx={{ flex: 1 }}>이전</Button>
                <Button variant="contained" color="success" size="large" sx={{ flex: 2, py: 1.5 }}
                  disabled={!agreed || submitting} onClick={handleSubmit}>
                  {submitting ? <CircularProgress size={22} color="inherit" /> : '확인'}
                </Button>
              </Box>
            </Box>
          )}

          {/* Step 3: 완료 */}
          {step === 4 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 3 }}>
              <CheckCircleIcon sx={{ fontSize: 72, color: 'success.main' }} />
              <Typography variant="h6" fontWeight={700} color="success.main">안전교육 이수 완료</Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                이수 기록이 관리자 시스템으로 전송되었습니다.<br />수고하셨습니다.
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  )
}
