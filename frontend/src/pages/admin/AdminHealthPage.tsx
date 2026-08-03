// [2026-04-28] 건강검진 결과 — PDF 업로드 자동 파싱 + DB 연동
import { useState, useEffect, useRef } from 'react'
import axiosInstance from '../../api/axiosInstance'
import {
  Box, Paper, Stack, Typography, Button, Table, TableHead,
  TableBody, TableRow, TableCell, TableContainer, TextField,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Alert, Tabs, Tab, FormControl, Select, MenuItem,
  Snackbar, CircularProgress, InputAdornment, Switch, FormControlLabel, Divider,
} from '@mui/material'
import ListSearchBar from '../../components/common/ListSearchBar'
import LockIcon from '@mui/icons-material/Lock'
import CloseIcon from '@mui/icons-material/Close'
import RefreshIcon from '@mui/icons-material/Refresh'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import UploadIcon from '@mui/icons-material/Upload'
import EmailIcon from '@mui/icons-material/Email'
import EditNoteIcon from '@mui/icons-material/EditNote'
import SaveIcon from '@mui/icons-material/Save'
import DeleteIcon from '@mui/icons-material/Delete'

const HOSPITALS = ['우리원', '중앙', '하나로', '강북삼성']
const DIRECT_IDX = HOSPITALS.length  // 직접입력 탭 인덱스 = 4

interface HealthRecord {
  id: number
  checkupYear: number
  checkupDate: string
  hospitalName: string
  department: string
  empName: string
  age: number | null
  bpCategory: string
  bpMed: boolean
  bpSystolic: number | null
  bpDiastolic: number | null
  dmCategory: string
  dmMed: boolean
  bst: number | null
  dlCategory: string
  dlMed: boolean
  tc: number | null
  tg: number | null
  ldl: number | null
  hdl: number | null
  height: number | null
  weight: number | null
  bmi: number | null
  waist: number | null
  ast: number | null
  alt: number | null
  ggt: number | null
  gender: string | null
  followupOpinion: string
  workFitness: string
  note: string
  sourceFile: string
  _pending?: boolean  // 미저장 임시 레코드
}

const categoryColor = (cat: string) => {
  if (cat === 'A') return 'success'
  if (cat === 'B') return 'warning'
  if (cat === 'C' || cat === 'D') return 'error'
  return 'default'
}

/** 검진일 포맷: YYYY-MM-DD → YYYY.MM.DD */
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return dateStr.substring(0, 10).replace(/-/g, '.')
}

// ── 3개년 비교 팝업 (연도당 최신 1건, 최대 3개년) ────────────────────────
interface CompareDialogProps { open: boolean; empName: string | null; onClose: () => void }

const CompareDialog: React.FC<CompareDialogProps> = ({ open, empName, onClose }) => {
  const [rows, setRows] = useState<HealthRecord[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !empName) return
    setLoading(true)
    axiosInstance.get('/admin/health/results/recent', { params: { empName } })
      .then(res => setRows(res.data.data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [open, empName])

  // 연도 오름차순 정렬 (왼쪽=과거 → 오른쪽=최근)
  const cols = [...rows].sort((a, b) => (a.checkupYear ?? 0) - (b.checkupYear ?? 0))
  const latest = cols[cols.length - 1]

  const T: Record<string, React.CSSProperties> = {
    tbl:       { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
    iLbl:      { padding: '8px 12px', border: '1px solid #dde5f0', background: '#e8edf5', color: '#4a5a78', fontWeight: 600, width: 72, textAlign: 'center' },
    iVal:      { padding: '8px 12px', border: '1px solid #dde5f0', background: '#f7f9fc', color: '#1a2a4a', fontWeight: 500 },
    yItemTh:   { padding: '10px 8px', textAlign: 'center', fontWeight: 700, border: '1px solid #cdd8eb', background: '#d5dff0', color: '#2d3f60', minWidth: 130 },
    yColTh:    { padding: '10px 8px', textAlign: 'center', fontWeight: 700, border: '1px solid #cdd8eb', background: '#dce8fb', color: '#1a3a7a', letterSpacing: 1 },
    subLbl:    { padding: '4px 14px', border: '1px solid #dde5f0', background: '#d5dff0', color: '#8a99b0', fontSize: 11, textAlign: 'left', whiteSpace: 'nowrap' },
    subCell:   { padding: '4px 10px', border: '1px solid #dde5f0', textAlign: 'center', fontSize: 11, color: '#8a99b0' },
    rowLbl:    { padding: '7px 14px', border: '1px solid #dde5f0', background: '#f0f4fa', color: '#3a4a62', fontWeight: 500, textAlign: 'left', whiteSpace: 'nowrap' },
    dataCell:  { padding: '7px 10px', border: '1px solid #dde5f0', textAlign: 'center', color: '#444', minWidth: 100 },
  }

  const dash = <span style={{ color: '#b0bcc8' }}>-</span>

  const catNode = (v: string | null | undefined) => {
    if (!v) return dash
    if (v === 'A') return <span style={{ color: '#1d8a4a', fontWeight: 600 }}>{v}</span>
    if (v === 'B') return <span style={{ color: '#d97706', fontWeight: 600 }}>{v}</span>
    return <span style={{ color: '#e05252', fontWeight: 600 }}>{v}</span>
  }
  const medNode = (v: boolean | null | undefined) => v ? <span>복용</span> : dash
  const numNode = (v: number | null | undefined, warnThr?: number, cautionThr?: number) => {
    if (v == null) return dash
    if (warnThr != null && v >= warnThr) return <span style={{ color: '#e05252', fontWeight: 600 }}>{v}</span>
    if (cautionThr != null && v >= cautionThr) return <span style={{ color: '#d97706', fontWeight: 600 }}>{v}</span>
    return <span>{v}</span>
  }
  const bpNode = (r: HealthRecord) =>
    r.bpSystolic && r.bpDiastolic ? <span>{r.bpSystolic}/{r.bpDiastolic}</span> : dash
  const gotNode = (r: HealthRecord) => {
    if (r.ast == null && r.alt == null && r.ggt == null) return dash
    return <span style={{ color: '#2563eb', fontWeight: 500 }}>{[r.ast, r.alt, r.ggt].map(v => v ?? '-').join('/')}</span>
  }
  const opinionNode = (v: string | null | undefined) => {
    if (!v || v === '미작성') return <span style={{ color: '#b0bcc8' }}>미작성</span>
    if (v === '필요없음') return <span style={{ color: '#1d8a4a', fontWeight: 600 }}>정상</span>
    return <span style={{ color: '#e05252', fontWeight: 600 }}>{v}</span>
  }
  const fitnessNode = (v: string | null | undefined) => {
    if (!v) return dash
    if (v === '나') return <span style={{ color: '#2563eb', fontWeight: 600 }}>{v}</span>
    return <span>{v}</span>
  }

  const DATA_ROWS: { label: string; render: (r: HealthRecord) => React.ReactNode }[] = [
    { label: '고혈압',          render: r => catNode(r.bpCategory) },
    { label: 'HTN medi',       render: r => medNode(r.bpMed) },
    { label: 'BP',              render: r => bpNode(r) },
    { label: '이상지질',        render: r => catNode(r.dlCategory) },
    { label: '중성지방',        render: r => numNode(r.tg, 200, 150) },
    { label: '콜레스테롤',      render: r => numNode(r.tc, 240, 200) },
    { label: 'HDL',             render: r => numNode(r.hdl) },
    { label: 'LDL',             render: r => numNode(r.ldl, 160, 130) },
    { label: 'DL medi',         render: r => medNode(r.dlMed) },
    { label: '당뇨',            render: r => catNode(r.dmCategory) },
    { label: 'BS',              render: r => numNode(r.bst, 126, 100) },
    { label: 'DM medi',         render: r => medNode(r.dmMed) },
    { label: 'GOT/GPT/r-GPT',  render: r => gotNode(r) },
    { label: 'BMI',             render: r => numNode(r.bmi != null ? Number(r.bmi) : null, 30, 25) },
    { label: '업무적합',        render: r => fitnessNode(r.workFitness) },
    { label: '사후관리소견',    render: r => opinionNode(r.followupOpinion) },
    { label: '비고',            render: r => r.note ? <span style={{ color: '#5a6a82' }}>{r.note}</span> : dash },
  ]

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5, fontWeight: 700, color: '#1a2a4a' }}>
        임직원 건강검진 비교 — {empName}
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0, background: '#f2f5f9' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : rows.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>데이터가 없습니다.</Box>
        ) : (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* 인적사항 */}
            <Box sx={{ background: '#fff', borderRadius: 1.5, boxShadow: '0 2px 8px rgba(30,50,100,0.07)', overflow: 'hidden' }}>
              <table style={T.tbl}>
                <tbody>
                  <tr>
                    <td style={T.iLbl}>이름</td>
                    <td style={T.iVal}>{latest?.empName ?? '-'}</td>
                    <td style={T.iLbl}>연령/성별</td>
                    <td style={T.iVal}>{latest?.age ?? '-'} / {latest?.gender ?? '-'}</td>
                  </tr>
                  <tr>
                    <td style={T.iLbl}>부서</td>
                    <td style={T.iVal}>{latest?.department ?? '-'}</td>
                    <td style={T.iLbl}>최근병원</td>
                    <td style={T.iVal}>{latest?.hospitalName ?? '-'}</td>
                  </tr>
                </tbody>
              </table>
            </Box>

            {/* 연도별 비교표 */}
            <Box sx={{ background: '#fff', borderRadius: 1.5, boxShadow: '0 2px 8px rgba(30,50,100,0.07)', overflow: 'auto' }}>
              <table style={T.tbl}>
                <thead>
                  <tr>
                    <th style={T.yItemTh}>검진항목</th>
                    {cols.map(r => (
                      <th key={r.id} style={T.yColTh}>{r.checkupYear ?? '-'}</th>
                    ))}
                  </tr>
                  <tr>
                    <td style={T.subLbl}>검진일</td>
                    {cols.map(r => (
                      <td key={r.id} style={T.subCell}>
                        {r.checkupDate ? String(r.checkupDate).substring(0, 10).replace(/-/g, '.') : '-'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td style={T.subLbl}>병원명</td>
                    {cols.map(r => (
                      <td key={r.id} style={T.subCell}>{r.hospitalName ?? '-'}</td>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DATA_ROWS.map(({ label, render }, idx) => (
                    <tr key={label} style={{ background: idx % 2 === 1 ? '#f8fafd' : undefined }}>
                      <td style={T.rowLbl}>{label}</td>
                      {cols.map(r => (
                        <td key={r.id} style={T.dataCell}>{render(r)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  )
}

// ── 수작업 편집 다이얼로그 ────────────────────────────────────────
interface EditDialogProps {
  open: boolean
  record: HealthRecord | null
  saving: boolean
  onClose: () => void
  onSave: (r: HealthRecord) => void
}

const EditDialog: React.FC<EditDialogProps> = ({ open, record, saving, onClose, onSave }) => {
  const [form, setForm] = useState<HealthRecord | null>(null)

  useEffect(() => { if (record) setForm({ ...record }) }, [record])

  if (!form) return null

  const str = (key: keyof HealthRecord) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f!, [key]: e.target.value || null }))
  const num = (key: keyof HealthRecord) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f!, [key]: e.target.value === '' ? null : Number(e.target.value) }))
  const bool = (key: keyof HealthRecord) => (_: any, checked: boolean) =>
    setForm(f => ({ ...f!, [key]: checked }))

  const F = (label: string, key: keyof HealthRecord, type = 'text', width = 140) => (
    <TextField key={String(key)} size="small" label={label} type={type}
      value={(form as any)[key] ?? ''}
      onChange={type === 'number' ? num(key) : str(key)}
      sx={{ width }} inputProps={type === 'number' ? { step: 'any' } : undefined} />
  )
  const M = (label: string, key: keyof HealthRecord) => (
    <FormControlLabel key={String(key)} sx={{ ml: 0 }}
      control={<Switch checked={!!(form as any)[key]} onChange={bool(key)} size="small" />}
      label={<Typography variant="body2">{label}</Typography>} />
  )
  const SEC = (title: string) => (
    <Typography key={title} variant="caption" color="primary.main" sx={{ fontWeight: 700, mt: 0.5 }}>{title}</Typography>
  )

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5, fontWeight: 700 }}>
        검진 결과 수정
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          {SEC('기본 정보')}
          <Stack direction="row" flexWrap="wrap" gap={1.5}>
            {F('성명 *', 'empName', 'text', 120)}
            {F('부서', 'department', 'text', 120)}
            {F('검진일', 'checkupDate', 'date', 160)}
            {F('병원명', 'hospitalName', 'text', 130)}
            {F('나이', 'age', 'number', 80)}
          </Stack>
          <Divider />
          {SEC('혈압')}
          <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center">
            {F('수축기(mmHg)', 'bpSystolic', 'number', 130)}
            {F('이완기(mmHg)', 'bpDiastolic', 'number', 130)}
            {M('혈압약 복용', 'bpMed')}
          </Stack>
          <Divider />
          {SEC('혈당')}
          <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center">
            {F('공복혈당(mg/dL)', 'bst', 'number', 140)}
            {M('혈당약 복용', 'dmMed')}
          </Stack>
          <Divider />
          {SEC('이상지질혈증')}
          <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center">
            {F('총콜레스테롤', 'tc', 'number', 120)}
            {F('중성지방', 'tg', 'number', 100)}
            {F('LDL', 'ldl', 'number', 80)}
            {F('HDL', 'hdl', 'number', 80)}
            {M('지질약 복용', 'dlMed')}
          </Stack>
          <Divider />
          {SEC('간기능')}
          <Stack direction="row" flexWrap="wrap" gap={1.5}>
            {F('AST', 'ast', 'number', 90)}
            {F('ALT', 'alt', 'number', 90)}
            {F('GGT', 'ggt', 'number', 90)}
          </Stack>
          <Divider />
          {SEC('신체계측')}
          <Stack direction="row" flexWrap="wrap" gap={1.5}>
            {F('키(cm)', 'height', 'number', 100)}
            {F('체중(kg)', 'weight', 'number', 100)}
            {F('BMI', 'bmi', 'number', 90)}
          </Stack>
          <Divider />
          {SEC('사후관리')}
          <Stack direction="row" flexWrap="wrap" gap={1.5}>
            {F('사후관리소견', 'followupOpinion', 'text', 180)}
            {F('업무적합', 'workFitness', 'text', 90)}
            <TextField size="small" label="비고" value={form.note ?? ''}
              onChange={str('note')} multiline rows={2} sx={{ width: 320 }} />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>취소</Button>
        <Button variant="contained" disabled={saving || !form.empName} onClick={() => onSave(form)}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}>
          {saving ? '저장 중...' : '저장'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ───────────────────────────────────────────────────────────────

const AdminHealthPage: React.FC = () => {
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [pendingUnsaved, setPendingUnsaved] = useState<HealthRecord[]>([])
  const pendingCounter = useRef(-1)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [hospital, setHospital] = useState(0)
  const [filter, setFilter] = useState<'전체' | '추적관리' | '정상'>('전체')
  const [keyword, setKeyword] = useState('')
  const [searchKw, setSearchKw] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null)
  const [compareOpen, setCompareOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<HealthRecord | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [hospitalNameInput, setHospitalNameInput] = useState('')
  const [hospitalNameError, setHospitalNameError] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // 비밀번호 다이얼로그
  const [pwdDialogOpen, setPwdDialogOpen] = useState(false)
  const [pwdValue, setPwdValue] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const notify = (message: string, severity: 'success' | 'error' | 'info' = 'info') =>
    setSnackbar({ open: true, message, severity })

  const loadRecords = async () => {
    setLoading(true)
    try {
      const res = await axiosInstance.get('/admin/health/results', {
        params: { keyword: searchKw || undefined },
      })
      setRecords(res.data.data || [])
    } catch {
      notify('데이터를 불러오는 중 오류가 발생했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRecords() }, [searchKw])

  const doUpload = async (file: File, password?: string) => {
    setUploading(true)
    const resolvedHospital = hospital < DIRECT_IDX ? HOSPITALS[hospital] : hospitalNameInput.trim()
    const formData = new FormData()
    formData.append('file', file)
    if (password) formData.append('password', password)
    if (resolvedHospital) formData.append('hospitalName', resolvedHospital)
    try {
      const res = await axiosInstance.post('/admin/health/upload-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const parsed: HealthRecord = { ...res.data.data, id: pendingCounter.current--, _pending: true }
      setPendingUnsaved(prev => [...prev, parsed])
      notify(`"${file.name}" 파싱 완료 — DB 저장하기 버튼을 눌러 저장하세요.`, 'info')
      return true
    } catch (e: any) {
      const msg: string = e?.response?.data?.message || ''
      if (msg === 'PDF_PASSWORD_REQUIRED') {
        setPendingFile(file)
        setPwdValue('')
        setPwdError('')
        setPwdDialogOpen(true)
      } else if (msg.includes('비밀번호가 올바르지')) {
        setPwdError('비밀번호가 올바르지 않습니다. 다시 입력해주세요.')
      } else {
        notify(msg || 'PDF 업로드 중 오류가 발생했습니다.', 'error')
      }
      return false
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSaveAll = async () => {
    if (pendingUnsaved.length === 0) return
    setSaving(true)
    try {
      for (const r of pendingUnsaved) {
        const { _pending, id, ...body } = r
        await axiosInstance.post('/admin/health/results', body)
      }
      setPendingUnsaved([])
      notify(`${pendingUnsaved.length}건 저장 완료`, 'success')
      await loadRecords()
    } catch {
      notify('저장 중 오류가 발생했습니다.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleFileButtonClick = () => {
    if (hospital === DIRECT_IDX && !hospitalNameInput.trim()) {
      setHospitalNameError(true)
      return
    }
    fileInputRef.current?.click()
  }

  const handleImageButtonClick = () => {
    if (hospital === DIRECT_IDX && !hospitalNameInput.trim()) {
      setHospitalNameError(true)
      return
    }
    imageInputRef.current?.click()
  }

  const handleImageUpload = async (files: FileList) => {
    if (!files || files.length === 0) return
    setUploadingImages(true)
    const resolvedHospital = hospital < DIRECT_IDX ? HOSPITALS[hospital] : hospitalNameInput.trim()
    const formData = new FormData()
    Array.from(files).forEach(f => formData.append('files', f))
    if (resolvedHospital) formData.append('hospitalName', resolvedHospital)
    try {
      const res = await axiosInstance.post('/admin/health/upload-images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const parsed: HealthRecord = { ...res.data.data, id: pendingCounter.current--, _pending: true }
      setPendingUnsaved(prev => [...prev, parsed])
      notify(`이미지 ${files.length}장 파싱 완료 — DB 저장하기 버튼을 눌러 저장하세요.`, 'info')
    } catch (e: any) {
      const msg: string = e?.response?.data?.message || ''
      notify(msg || '이미지 업로드 중 오류가 발생했습니다.', 'error')
    } finally {
      setUploadingImages(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  const handleUpload = (file: File) => doUpload(file)

  const handleUploadWithPassword = async () => {
    if (!pendingFile || !pwdValue.trim()) return
    const ok = await doUpload(pendingFile, pwdValue.trim())
    if (ok) {
      setPwdDialogOpen(false)
      setPendingFile(null)
      setPwdValue('')
      setPwdError('')
    }
  }

  const handleEditSave = async (r: HealthRecord) => {
    setEditSaving(true)
    try {
      await axiosInstance.put(`/admin/health/results/${r.id}`, r)
      setRecords(prev => prev.map(x => x.id === r.id ? { ...x, ...r } : x))
      notify('수정되었습니다.', 'success')
      setEditOpen(false)
    } catch {
      notify('수정 중 오류가 발생했습니다.', 'error')
    } finally {
      setEditSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('이 검진 결과를 삭제하시겠습니까?')) return
    try {
      await axiosInstance.delete(`/admin/health/results/${id}`)
      notify('삭제되었습니다.', 'success')
      setRecords(prev => prev.filter(r => r.id !== id))
    } catch {
      notify('삭제 중 오류가 발생했습니다.', 'error')
    }
  }

  const filtered = records.filter(r => {
    if (filter === '추적관리' && (r.followupOpinion === '미작성' || r.followupOpinion === '필요없음')) return false
    if (filter === '정상' && r.followupOpinion !== '필요없음') return false
    return true
  })

  return (
    <Box sx={{ overflowX: 'auto' }}>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 1100 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>보건파트</Typography>

      {/* PDF 업로드 */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', whiteSpace: 'nowrap' }}>
            ≡ 병원 PDF 결과지<br />자동 변환 업로드
          </Typography>
          <Tabs
            value={hospital}
            onChange={(_, v) => { setHospital(v); setHospitalNameError(false) }}
            sx={{ minHeight: 36 }}
            TabIndicatorProps={{ sx: { height: 3 } }}
          >
            {HOSPITALS.map((h, i) => (
              <Tab key={h} label={h} value={i} sx={{ minHeight: 36, py: 0.5, px: 2, fontSize: '0.85rem' }} />
            ))}
            <Tab label="직접입력" value={DIRECT_IDX} sx={{ minHeight: 36, py: 0.5, px: 2, fontSize: '0.85rem' }} />
          </Tabs>
          {hospital === DIRECT_IDX && (
            <TextField
              size="small"
              label="병원명 *"
              placeholder="예) 성동보건소"
              value={hospitalNameInput}
              onChange={e => { setHospitalNameInput(e.target.value); setHospitalNameError(false) }}
              error={hospitalNameError}
              helperText={hospitalNameError ? '병원명을 입력해주세요.' : ''}
              sx={{ minWidth: 200 }}
            />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handleUpload(file)
            }}
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,.jpg,.jpeg,.png"
            multiple
            style={{ display: 'none' }}
            onChange={e => {
              if (e.target.files && e.target.files.length > 0) handleImageUpload(e.target.files)
            }}
          />
          <Button
            variant="contained"
            startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}
            disabled={uploading || uploadingImages}
            onClick={handleFileButtonClick}
          >
            {uploading ? '업로드 중...' : 'PDF 선택'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => notify('이미지 업로드 기능은 준비 중입니다.', 'info')}
            title="병원 앱 스크린샷(JPG/PNG) — ANTHROPIC_API_KEY 설정 후 활성화"
          >
            이미지(JPG) 선택
          </Button>
        </Stack>
      </Paper>

      {/* [2026-08-03] 목록 — 필터를 Paper 밖으로 빼고 공용 목록 스타일 적용 */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
              <MenuItem value="전체">전체 보기</MenuItem>
              <MenuItem value="추적관리">추적관리</MenuItem>
              <MenuItem value="정상">정상</MenuItem>
            </Select>
          </FormControl>
          <ListSearchBar
            placeholder="성명, 부서명 또는 병원명 입력"
            value={keyword}
            onChange={setKeyword}
            onSearch={() => setSearchKw(keyword)}
            sx={{ width: { xs: '100%', sm: 300 } }}
          />
          <IconButton size="small" onClick={() => { setKeyword(''); setSearchKw(''); setFilter('전체') }}>
            <RefreshIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary">
          총 {filtered.length}건의 데이터 {loading && '(불러오는 중...)'}
          {pendingUnsaved.length > 0 && (
            <Chip size="small" label={`미저장 ${pendingUnsaved.length}건`} color="warning" sx={{ ml: 1 }} />
          )}
        </Typography>
      </Box>

      {/* Filters - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
        <FormControl size="small" fullWidth>
          <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
            <MenuItem value="전체">전체 보기</MenuItem>
            <MenuItem value="추적관리">추적관리</MenuItem>
            <MenuItem value="정상">정상</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ListSearchBar
            placeholder="성명, 부서명 또는 병원명 입력"
            value={keyword}
            onChange={setKeyword}
            onSearch={() => setSearchKw(keyword)}
            fullWidth
          />
          <IconButton size="small" sx={{ flexShrink: 0 }}
            onClick={() => { setKeyword(''); setSearchKw(''); setFilter('전체') }}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      <Alert severity="info" sx={{ py: 0 }}>
        행을 클릭하면 3개년 비교/조회 화면이 팝업으로 열립니다. PDF 파일명 앞 6자리는 생년월일(YYMMDD) 비밀번호로 사용됩니다.
      </Alert>

      <Box>
        <TableContainer component={Paper} sx={{ maxHeight: 420 }}>

          <Table size="small" stickyHeader sx={{ minWidth: 1300 }}>
            <TableHead>
              <TableRow>
                <TableCell rowSpan={2} sx={{ whiteSpace: 'nowrap' }}>No</TableCell>
                <TableCell rowSpan={2} sx={{ whiteSpace: 'nowrap' }}>검진일</TableCell>
                <TableCell rowSpan={2} sx={{ whiteSpace: 'nowrap', minWidth: 67 }}>병원명</TableCell>
                <TableCell rowSpan={2} sx={{ whiteSpace: 'nowrap' }}>부서명</TableCell>
                <TableCell rowSpan={2} sx={{ whiteSpace: 'nowrap' }}>성명</TableCell>
                <TableCell rowSpan={2} sx={{ whiteSpace: 'nowrap' }}>연령</TableCell>
                <TableCell colSpan={3} align="center" sx={{ color: 'primary.main', borderBottom: 1, borderColor: 'divider' }}>고혈압</TableCell>
                <TableCell colSpan={3} align="center" sx={{ color: 'success.dark', borderBottom: 1, borderColor: 'divider' }}>당뇨병</TableCell>
                <TableCell colSpan={6} align="center" sx={{ color: 'warning.dark', borderBottom: 1, borderColor: 'divider' }}>이상지질혈증</TableCell>
                <TableCell rowSpan={2}>사후관리소견</TableCell>
                <TableCell rowSpan={2}>업무적합</TableCell>
                <TableCell rowSpan={2}>비고</TableCell>
                <TableCell rowSpan={2}>편집</TableCell>
                <TableCell rowSpan={2}>삭제</TableCell>
              </TableRow>
              <TableRow>
                {['건강구분', '약복용', 'BP'].map(h => (
                  <TableCell key={h}>{h}</TableCell>
                ))}
                {['건강구분', '약복용', 'BST'].map(h => (
                  <TableCell key={h}>{h}</TableCell>
                ))}
                {['건강구분', '약복용', 'T.C', 'TG', 'LDL', 'HDL'].map(h => (
                  <TableCell key={h}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={22} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : [...pendingUnsaved, ...filtered].length === 0 ? (
                <TableRow>
                  <TableCell colSpan={22} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    {records.length === 0 && pendingUnsaved.length === 0
                      ? 'PDF를 업로드하면 건강검진 결과가 자동으로 표시됩니다.'
                      : '검색 결과가 없습니다.'}
                  </TableCell>
                </TableRow>
              ) : [...pendingUnsaved, ...filtered].map((r, idx) => (
                <TableRow
                  key={r.id}
                  hover
                  sx={{
                    bgcolor: r._pending ? 'warning.50' : r.workFitness === '나' ? 'error.50' : 'inherit',
                    cursor: r._pending ? 'default' : 'pointer',
                  }}
                  onClick={() => { if (!r._pending) { setSelectedRecord(r); setCompareOpen(true) } }}
                >
                  <TableCell>
                    {r._pending
                      ? <Chip size="small" label="미저장" color="warning" />
                      : idx - pendingUnsaved.length + 1}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(r.checkupDate)}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.hospitalName || '-'}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.department || '-'}</TableCell>
                  <TableCell sx={{ color: 'primary.main', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.empName}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.age ?? '-'}</TableCell>
                  <TableCell align="center">
                    {r.bpCategory ? <Chip size="small" label={r.bpCategory} color={categoryColor(r.bpCategory) as any} sx={{ fontWeight: 700, minWidth: 28 }} /> : '-'}
                  </TableCell>
                  <TableCell align="center">{r.bpMed ? '복용' : '-'}</TableCell>
                  <TableCell align="center">{r.bpSystolic && r.bpDiastolic ? `${r.bpSystolic}/${r.bpDiastolic}` : '-'}</TableCell>
                  <TableCell align="center">
                    {r.dmCategory ? <Chip size="small" label={r.dmCategory} color={categoryColor(r.dmCategory) as any} sx={{ fontWeight: 700, minWidth: 28 }} /> : '-'}
                  </TableCell>
                  <TableCell align="center">{r.dmMed ? '복용' : '-'}</TableCell>
                  <TableCell align="right">{r.bst ?? '-'}</TableCell>
                  <TableCell align="center">
                    {r.dlCategory ? <Chip size="small" label={r.dlCategory} color={categoryColor(r.dlCategory) as any} sx={{ fontWeight: 700, minWidth: 28 }} /> : '-'}
                  </TableCell>
                  <TableCell align="center">{r.dlMed ? '복용' : '-'}</TableCell>
                  <TableCell align="right" sx={{ color: r.tc && r.tc > 220 ? 'error.main' : 'text.primary' }}>{r.tc ?? '-'}</TableCell>
                  <TableCell align="right">{r.tg ?? '-'}</TableCell>
                  <TableCell align="right" sx={{ color: r.ldl && r.ldl > 150 ? 'error.main' : 'text.primary' }}>{r.ldl ?? '-'}</TableCell>
                  <TableCell align="right">{r.hdl ?? '-'}</TableCell>
                  <TableCell>
                    <Typography variant="caption"
                      color={r.followupOpinion === '필요없음' ? 'success.main' : r.followupOpinion === '미작성' ? 'text.secondary' : 'error.main'}
                      sx={{ fontWeight: 600 }}>
                      {r.followupOpinion || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">{r.workFitness || '-'}</TableCell>
                  <TableCell>{r.note || '-'}</TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    {!r._pending && (
                      <IconButton size="small" color="primary" onClick={() => { setEditRecord(r); setEditOpen(true) }}>
                        <EditNoteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <IconButton size="small" color="error" onClick={() =>
                      r._pending
                        ? setPendingUnsaved(prev => prev.filter(p => p.id !== r.id))
                        : handleDelete(r.id)
                    }>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 하단 버튼 — [2026-08-03] 아이콘·크기 통일, 내보내기는 좌측 / 저장은 우측 */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          spacing={1}
          sx={{ mt: 2 }}
          flexWrap="wrap"
          useFlexGap
        >
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button variant="outlined" size="small" startIcon={<FileDownloadIcon />}
              sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              onClick={() => notify('엑셀 다운로드 기능은 준비 중입니다.')}>
              엑셀 다운로드
            </Button>
            <Button variant="outlined" size="small" color="success" startIcon={<EmailIcon />}
              sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              onClick={() => notify('건강상담 메일발송 기능은 준비 중입니다.')}>
              건강상담 메일발송
            </Button>
            <Button variant="outlined" size="small" startIcon={<EditNoteIcon />}
              sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              onClick={() => notify('상담내역 작성 기능은 준비 중입니다.')}>
              상담내역 작성하기
            </Button>
          </Stack>
          <Button
            variant="contained"
            size="small"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            disabled={saving || pendingUnsaved.length === 0}
            onClick={handleSaveAll}
            sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            {saving ? '저장 중...' : `DB 저장하기${pendingUnsaved.length > 0 ? ` (${pendingUnsaved.length}건)` : ''}`}
          </Button>
        </Stack>
      </Box>

      {/* 비밀번호 입력 다이얼로그 */}
      <Dialog open={pwdDialogOpen} onClose={() => { setPwdDialogOpen(false); setPendingFile(null) }} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockIcon fontSize="small" color="warning" />
          PDF 비밀번호 입력
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            이 PDF 파일은 비밀번호로 보호되어 있습니다.<br />
            비밀번호를 입력하면 자동으로 파싱을 진행합니다.
          </Typography>
          {pendingFile && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontStyle: 'italic' }}>
              파일: {pendingFile.name}
            </Typography>
          )}
          <TextField
            autoFocus
            fullWidth
            label="비밀번호"
            type="password"
            value={pwdValue}
            onChange={e => { setPwdValue(e.target.value); setPwdError('') }}
            onKeyDown={e => e.key === 'Enter' && handleUploadWithPassword()}
            error={!!pwdError}
            helperText={pwdError}
            InputProps={{
              startAdornment: <InputAdornment position="start"><LockIcon fontSize="small" /></InputAdornment>,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setPwdDialogOpen(false); setPendingFile(null) }}>취소</Button>
          <Button
            variant="contained"
            disabled={!pwdValue.trim() || uploading}
            onClick={handleUploadWithPassword}
          >
            {uploading ? <CircularProgress size={18} color="inherit" /> : '확인'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 수작업 편집 다이얼로그 */}
      <EditDialog
        open={editOpen}
        record={editRecord}
        saving={editSaving}
        onClose={() => setEditOpen(false)}
        onSave={handleEditSave}
      />

      {/* 3개년 비교 팝업 */}
      <CompareDialog
        open={compareOpen}
        empName={selectedRecord?.empName ?? null}
        onClose={() => setCompareOpen(false)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
    </Box>
  )
}

export default AdminHealthPage
