// [2026-05-02] 비로그인 파일 업로드 페이지 — /upload/:token
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  Alert,
  LinearProgress,
} from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import axios from 'axios'

// 상대경로 사용 — ngrok/모바일 환경에서도 동작
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const DOC_TYPES = [
  { value: 'DAILY_SAFETY_LOG', label: '일일안전교육일지' },
  { value: 'WORK_PLAN',        label: '작업계획서' },
  { value: 'PLEDGE',           label: '서명본' },
  { value: 'OTHER',            label: '기타' },
]

interface TokenInfo {
  accessRequestId: number
  requestNo: string
  companyName: string
  vesselName: string
  workType: string
  plannedStartDate: string
  plannedEndDate: string
  status: string
}

interface UploadedItem {
  fileName: string
  docTypeLabel: string
}

const UploadByTokenPage = () => {
  const { token } = useParams<{ token: string }>()

  const [info, setInfo] = useState<TokenInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const [docType, setDocType] = useState('DAILY_SAFETY_LOG')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedItems, setUploadedItems] = useState<UploadedItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) { setLoadError(true); setLoading(false); return }
    axios.get(`${BASE_URL}/public/upload/${token}`, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
    })
      .then((res) => { setInfo(res.data.data); setLoading(false) })
      .catch(() => { setLoadError(true); setLoading(false) })
  }, [token])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setSelectedFile(f)
    setError(null)
  }

  const handleUpload = async () => {
    if (!selectedFile || !token) return
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('attachmentType', docType)
      await axios.post(`${BASE_URL}/public/upload/${token}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'ngrok-skip-browser-warning': 'true',
        },
      })
      const label = DOC_TYPES.find((d) => d.value === docType)?.label ?? docType
      setUploadedItems((prev) => [...prev, { fileName: selectedFile.name, docTypeLabel: label }])
      setSelectedFile(null)
      // input 초기화
      const input = document.getElementById('file-input') as HTMLInputElement | null
      if (input) input.value = ''
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? '업로드에 실패했습니다.')
      } else {
        setError('업로드에 실패했습니다.')
      }
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (loadError || !info) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 2 }}>
        <Alert severity="error" sx={{ maxWidth: 420, width: '100%' }}>
          유효하지 않거나 만료된 링크입니다.
        </Alert>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'grey.50',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        p: 2,
        pt: 4,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 480 }}>
        {/* 헤더 */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <Box
            component="img"
            src="/logo.png"
            alt="팬오션"
            sx={{ height: 32, objectFit: 'contain' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            서류 제출
          </Typography>
        </Stack>

        {/* 신청 정보 카드 */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent sx={{ pb: '16px !important' }}>
            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
              신청 정보
            </Typography>
            <Stack spacing={0.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">선박</Typography>
                <Typography variant="body2" fontWeight={600}>{info.vesselName}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">업체</Typography>
                <Typography variant="body2">{info.companyName}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">작업</Typography>
                <Typography variant="body2">{info.workType}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">작업기간</Typography>
                <Typography variant="body2">
                  {info.plannedStartDate} ~ {info.plannedEndDate}
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* 업로드 완료 목록 */}
        {uploadedItems.length > 0 && (
          <Card variant="outlined" sx={{ mb: 2, borderColor: 'success.light' }}>
            <CardContent sx={{ pb: '16px !important' }}>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
                <CheckCircleOutlineIcon fontSize="small" color="success" />
                <Typography variant="caption" color="success.main" fontWeight={600}>
                  제출 완료 ({uploadedItems.length}건)
                </Typography>
              </Stack>
              <Stack spacing={0.5}>
                {uploadedItems.map((item, i) => (
                  <Stack key={i} direction="row" alignItems="center" spacing={1}>
                    <Chip label={item.docTypeLabel} size="small" color="success" variant="outlined" />
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      {item.fileName}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* 업로드 폼 */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
              서류 제출
            </Typography>

            <Stack spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>서류 종류</InputLabel>
                <Select
                  label="서류 종류"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                >
                  {DOC_TYPES.map((d) => (
                    <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*,application/pdf,.jpg,.jpeg,.png,.pdf"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<UploadFileIcon />}
                  onClick={() => document.getElementById('file-input')?.click()}
                  sx={{ justifyContent: 'flex-start', py: 1.5 }}
                >
                  {selectedFile ? selectedFile.name : '파일 선택 (사진 또는 PDF)'}
                </Button>
                {selectedFile && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {(selectedFile.size / 1024).toFixed(0)} KB
                  </Typography>
                )}
              </Box>

              {uploading && <LinearProgress />}

              {error && <Alert severity="error" sx={{ py: 0.5 }}>{error}</Alert>}

              <Divider />

              <Button
                variant="contained"
                fullWidth
                size="large"
                disabled={!selectedFile || uploading}
                onClick={handleUpload}
              >
                {uploading ? '업로드 중...' : '제출'}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
          팬오션 안전보건 포털 · 서류를 여러 건 제출할 경우 건별로 반복 제출하세요.
        </Typography>
      </Box>
    </Box>
  )
}

export default UploadByTokenPage
