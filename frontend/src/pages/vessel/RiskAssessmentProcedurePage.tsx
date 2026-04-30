// [2026-04-30] 위험성평가 절차 — 절차서 등재·다운로드 실제 구현
import {
  Box, Paper, Typography, Stack, Button, Grid, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Alert, IconButton
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import DeleteIcon from '@mui/icons-material/Delete'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import {
  getLatestProcedureDoc,
  uploadProcedureDoc,
  deleteProcedureDoc,
  getProcedureDocDownloadUrl,
  ProcedureDocResponse,
} from '../../api/procedureDocApi'

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
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [doc, setDoc] = useState<ProcedureDocResponse | null>(null)
  const [loading, setLoading] = useState(true)

  // 업로드 다이얼로그
  const [uploadOpen, setUploadOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 삭제 확인 다이얼로그
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadDoc = async () => {
    setLoading(true)
    try {
      const res = await getLatestProcedureDoc('RISK_ASSESSMENT')
      setDoc(res.data.data)
    } catch {
      setDoc(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDoc() }, [])

  const handleDownload = () => {
    if (!doc) return
    window.open(getProcedureDocDownloadUrl(doc.id), '_blank')
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    setUploadError(null)
    try {
      await uploadProcedureDoc('RISK_ASSESSMENT', selectedFile)
      setUploadOpen(false)
      await loadDoc()
    } catch (e: any) {
      setUploadError(e?.response?.data?.message || '업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!doc) return
    setDeleting(true)
    try {
      await deleteProcedureDoc(doc.id)
      setDeleteOpen(false)
      await loadDoc()
    } catch {
      // 에러 무시
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
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

      {/* 절차서 상태 및 버튼 */}
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">절차서 정보 불러오는 중...</Typography>
        </Box>
      ) : (
        <>
          {doc && (
            <Box sx={{
              p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2,
              display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap',
            }}>
              <PictureAsPdfIcon color="error" />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 600 }}>{doc.fileName}</Typography>
                {doc.uploaderName && (
                  <Typography variant="body2" color="text.secondary">등재자: {doc.uploaderName}</Typography>
                )}
              </Box>
              <IconButton size="small" onClick={handleDownload} title="다운로드">
                <DownloadIcon fontSize="small" />
              </IconButton>
              {isAdmin && (
                <IconButton size="small" color="error" onClick={() => setDeleteOpen(true)} title="삭제">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {doc ? (
              <Button
                variant="contained"
                startIcon={<PictureAsPdfIcon />}
                onClick={handleDownload}
              >
                절차서 PDF 다운로드
              </Button>
            ) : (
              <Typography variant="body2" color="text.disabled" sx={{ alignSelf: 'center' }}>
                등재된 절차서가 없습니다.
              </Typography>
            )}
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => navigate('/notice/forms')}
            >
              양식함으로 이동
            </Button>
            {isAdmin && (
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={() => { setSelectedFile(null); setUploadError(null); setUploadOpen(true) }}
              >
                {doc ? '절차서 교체' : '절차서 등재'}
              </Button>
            )}
          </Stack>
        </>
      )}

      {/* 업로드 다이얼로그 */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>위험성평가 절차서 등재</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {uploadError && <Alert severity="error">{uploadError}</Alert>}
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadFileIcon />}
          >
            파일 선택
            <input
              type="file"
              hidden
              ref={fileInputRef}
              accept=".pdf,.doc,.docx,.hwp,.hwpx"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />
          </Button>
          {selectedFile && (
            <Typography variant="body2" color="text.secondary">
              선택된 파일: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadOpen(false)} disabled={uploading}>취소</Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            startIcon={uploading ? <CircularProgress size={16} /> : undefined}
          >
            {uploading ? '업로드 중...' : '등재'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>절차서 삭제</DialogTitle>
        <DialogContent>
          <Typography>
            <strong>위험성평가 절차서</strong>를 삭제하시겠습니까?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            삭제 후에는 다시 등재해야 합니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>취소</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : undefined}
          >
            {deleting ? '삭제 중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default RiskAssessmentProcedurePage
