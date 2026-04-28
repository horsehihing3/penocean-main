// [2026-04-27] QR 안전교육 이수 공개 페이지 — cascading 선택 + 이수증 출력
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import {
  Box, Typography, Paper, TextField, Button, Stepper, Step, StepLabel,
  Checkbox, FormControlLabel, CircularProgress, Alert, Divider,
  MenuItem, Select, FormControl, InputLabel, SelectChangeEvent,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PrintIcon from '@mui/icons-material/Print'

const API_BASE = '/api'
const STEPS = ['QR 확인', '작업자 정보', '안전교육 내용', '이수 완료']

const headers = { 'ngrok-skip-browser-warning': 'true' }

interface QrInfo { id: number; title: string; content: string }
interface Vessel { vesselId: number; vesselName: string }
interface Company { companyId: number; companyName: string }
interface Worker { workerId: number; workerName: string; workerPhone: string }

export default function QrEducationPage() {
  const { token } = useParams<{ token: string }>()
  const [step, setStep] = useState(0)
  const [qrInfo, setQrInfo] = useState<QrInfo | null>(null)
  const [loadError, setLoadError] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [completedAt, setCompletedAt] = useState('')

  // cascading combo data
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])

  const [selectedVesselId, setSelectedVesselId] = useState<number | ''>('')
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | ''>('')
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | ''>('')
  const [fieldWarning, setFieldWarning] = useState('')  // [2026-04-28] 순서 안내 경고

  const [form, setForm] = useState({
    workerName: '',
    vesselName: '',
    workDate: new Date().toISOString().split('T')[0],
    phone: '',
  })

  // QR 정보 + 선박 목록 동시 로드
  useEffect(() => {
    if (!token) return
    Promise.all([
      axios.get(`${API_BASE}/public/safety-qr/${token}`, { headers }),
      axios.get(`${API_BASE}/public/safety-qr/vessels`, { headers }),
    ])
      .then(([qrRes, vesselRes]) => {
        setQrInfo(qrRes.data.data)
        setVessels(vesselRes.data.data || [])
        setStep(1)
      })
      .catch(() => setLoadError('유효하지 않거나 만료된 QR코드입니다.'))
  }, [token])

  // 선박 선택 → 업체 로드
  const handleVesselChange = (e: SelectChangeEvent<number | ''>) => {
    const vid = e.target.value as number
    setSelectedVesselId(vid)
    setSelectedCompanyId('')
    setSelectedWorkerId('')
    setCompanies([])
    setWorkers([])
    setFieldWarning('')
    const vessel = vessels.find(v => v.vesselId === vid)
    setForm(p => ({ ...p, vesselName: vessel?.vesselName ?? '' }))
    if (vid) {
      axios.get(`${API_BASE}/public/safety-qr/vessels/${vid}/companies`, { headers })
        .then(r => setCompanies(r.data.data || []))
    }
  }

  // 업체 선택 → 작업자 로드
  const handleCompanyChange = (e: SelectChangeEvent<number | ''>) => {
    const cid = e.target.value as number
    setSelectedCompanyId(cid)
    setSelectedWorkerId('')
    setWorkers([])
    setFieldWarning('')
    setForm(p => ({ ...p, workerName: '', phone: '' }))
    if (selectedVesselId && cid) {
      axios.get(`${API_BASE}/public/safety-qr/vessels/${selectedVesselId}/companies/${cid}/workers`, { headers })
        .then(r => setWorkers(r.data.data || []))
    }
  }

  // 작업자 선택 → 이름·연락처 자동 입력
  const handleWorkerChange = (e: SelectChangeEvent<number | ''>) => {
    const wid = e.target.value as number
    setSelectedWorkerId(wid)
    const worker = workers.find(w => w.workerId === wid)
    if (worker) {
      setForm(p => ({ ...p, workerName: worker.workerName, phone: worker.workerPhone || '' }))
    }
  }

  const handleSubmit = async () => {
    if (!agreed) return
    setSubmitting(true)
    setSubmitError('')
    try {
      await axios.post(`${API_BASE}/public/safety-qr/${token}/complete`, {
        workerId: selectedWorkerId || null,
        workerName: form.workerName,
        vesselName: form.vesselName,
        workDate: form.workDate,
        phone: form.phone,
      }, { headers })
      setCompletedAt(new Date().toLocaleString('ko-KR'))
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
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">QR 정보를 불러오는 중...</Typography>
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
          {/* Step 1: 작업자 정보 — cascading 콤보 */}
          {step === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>작업 정보를 선택하세요</Typography>

              {fieldWarning && (
                <Alert severity="warning" onClose={() => setFieldWarning('')}>{fieldWarning}</Alert>
              )}

              <FormControl fullWidth required>
                <InputLabel>선박명 *</InputLabel>
                <Select value={selectedVesselId} label="선박명 *" onChange={handleVesselChange}>
                  {vessels.map(v => (
                    <MenuItem key={v.vesselId} value={v.vesselId}>{v.vesselName}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* 업체명: 선박 미선택 시 클릭하면 경고 */}
              <Box onClick={() => !selectedVesselId && setFieldWarning('먼저 선박명을 선택하세요.')}>
                <FormControl fullWidth required disabled={!selectedVesselId}>
                  <InputLabel>업체명 *</InputLabel>
                  <Select value={selectedCompanyId} label="업체명 *" onChange={handleCompanyChange}>
                    {companies.map(c => (
                      <MenuItem key={c.companyId} value={c.companyId}>{c.companyName}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* 작업자: 업체 미선택 시 클릭하면 경고 */}
              <Box onClick={() => !selectedCompanyId && setFieldWarning(!selectedVesselId ? '먼저 선박명을 선택하세요.' : '먼저 업체명을 선택하세요.')}>
                <FormControl fullWidth required disabled={!selectedCompanyId}>
                  <InputLabel>작업자 *</InputLabel>
                  <Select value={selectedWorkerId} label="작업자 *" onChange={handleWorkerChange}>
                    {workers.map(w => (
                      <MenuItem key={w.workerId} value={w.workerId}>{w.workerName}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box onClick={() => !selectedVesselId && setFieldWarning('먼저 선박명을 선택하세요.')}>
                <TextField label="연락처" fullWidth value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="연락처 자동 입력"
                  InputProps={{ readOnly: !selectedWorkerId }} />
              </Box>

              <TextField label="작업일자" type="date" fullWidth value={form.workDate}
                onChange={e => setForm(p => ({ ...p, workDate: e.target.value }))}
                InputLabelProps={{ shrink: true }} />

              <Button variant="contained" size="large" fullWidth sx={{ mt: 1, py: 1.5 }}
                disabled={!selectedVesselId || !selectedCompanyId || !selectedWorkerId || !form.workDate}
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

          {/* Step 4: 완료 + 이수증 */}
          {step === 4 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, py: 2 }}>
                <CheckCircleIcon sx={{ fontSize: 72, color: 'success.main' }} />
                <Typography variant="h6" fontWeight={700} color="success.main">안전교육 이수 완료</Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  이수 기록이 관리자 시스템으로 전송되었습니다.
                </Typography>
              </Box>

              {/* 이수증 */}
              <Paper variant="outlined" id="certificate-print" sx={{ p: 3, borderRadius: 2, border: '2px solid #1565c0' }}>
                <Typography variant="h6" fontWeight={700} textAlign="center" color="primary" gutterBottom>
                  안전교육 이수증
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">성명</Typography>
                    <Typography variant="body2" fontWeight={600}>{form.workerName}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">선박명</Typography>
                    <Typography variant="body2" fontWeight={600}>{form.vesselName}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">작업일자</Typography>
                    <Typography variant="body2" fontWeight={600}>{form.workDate}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">연락처</Typography>
                    <Typography variant="body2" fontWeight={600}>{form.phone || '-'}</Typography>
                  </Box>
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="caption" color="text.secondary">교육명</Typography>
                    <Typography variant="body2" fontWeight={600}>{qrInfo?.title}</Typography>
                  </Box>
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="caption" color="text.secondary">이수일시</Typography>
                    <Typography variant="body2" fontWeight={600}>{completedAt}</Typography>
                  </Box>
                </Box>
                <Divider sx={{ mt: 2, mb: 1.5 }} />
                <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                  팬오션 주식회사 안전경영팀
                </Typography>
              </Paper>

              <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()} fullWidth>
                이수증 인쇄
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  )
}
