// [2026-04-30] PPT 슬라이드 10 기준 플로우차트 — 절차서 등재·다운로드 실제 구현
import {
  Box, Paper, Typography, Stack, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, CircularProgress, Alert, IconButton
} from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import DeleteIcon from '@mui/icons-material/Delete'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import {
  getLatestProcedureDoc,
  uploadProcedureDoc,
  deleteProcedureDoc,
  getProcedureDocDownloadUrl,
  ProcedureDocResponse,
  ProcType,
} from '../../api/procedureDocApi'

const ALL_STEPS = [
  { num: 1, label: '승선(방문)신청', sub: '제출서류: 위험성평가,\n안전보건서약서, 작업계획서' },
  { num: 2, label: '교육안내 송부', sub: '(교육 미수료자)' },
  { num: 3, label: '수신자 접속 및\n교육 이수', sub: null },
  { num: 4, label: '교육이수\n증명서 발급', sub: null },
  { num: 5, label: '선박 승선\n사업장 방문', sub: null },
  { num: 6, label: '현문당직자\n사업장 담당자\n증명서 확인', sub: null },
  { num: 7, label: 'WORK', sub: null },
]

const PROC_ITEMS: { label: string; procType: ProcType }[] = [
  { label: '도급업체 안전보건관리 절차', procType: 'ACCESS_SAFETY' },
  { label: '위험성평가 절차', procType: 'RISK_ASSESSMENT' },
]

interface StepBoxProps { label: string; sub?: string | null }
const StepBox = ({ label, sub }: StepBoxProps) => (
  <Box sx={{
    border: '1.5px solid #555', borderRadius: 2, px: 2, py: 2,
    minHeight: 100, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', textAlign: 'center',
    backgroundColor: '#fff', width: '100%',
  }}>
    <Typography sx={{ fontWeight: 600, fontSize: '1.14rem', whiteSpace: 'pre-line', lineHeight: 1.55 }}>
      {label}
    </Typography>
    {sub && (
      <Typography sx={{ display: 'block', mt: 0.5, fontSize: '0.975rem', color: 'text.secondary', whiteSpace: 'pre-line', lineHeight: 1.4 }}>
        {sub}
      </Typography>
    )}
  </Box>
)

const AccessProcedurePage: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  // 각 procType 별 최신 문서
  const [docs, setDocs] = useState<Record<ProcType, ProcedureDocResponse | null>>({
    ACCESS_SAFETY: null,
    RISK_ASSESSMENT: null,
  })
  const [loading, setLoading] = useState(true)

  // 등재 다이얼로그
  const [uploadTarget, setUploadTarget] = useState<{ label: string; procType: ProcType } | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 삭제 확인 다이얼로그
  const [deleteTarget, setDeleteTarget] = useState<{ label: string; procType: ProcType; id: number } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadDocs = async () => {
    setLoading(true)
    try {
      const [r1, r2] = await Promise.all([
        getLatestProcedureDoc('ACCESS_SAFETY'),
        getLatestProcedureDoc('RISK_ASSESSMENT'),
      ])
      setDocs({
        ACCESS_SAFETY: r1.data.data,
        RISK_ASSESSMENT: r2.data.data,
      })
    } catch {
      // 미등재 상태면 null 유지
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDocs() }, [])

  const handleDownload = (procType: ProcType) => {
    const doc = docs[procType]
    if (!doc) return
    window.open(getProcedureDocDownloadUrl(doc.id), '_blank')
  }

  const openUploadDialog = (item: { label: string; procType: ProcType }) => {
    setUploadTarget(item)
    setSelectedFile(null)
    setUploadError(null)
  }

  const handleUpload = async () => {
    if (!uploadTarget || !selectedFile) return
    setUploading(true)
    setUploadError(null)
    try {
      await uploadProcedureDoc(uploadTarget.procType, selectedFile)
      setUploadTarget(null)
      await loadDocs()
    } catch (e: any) {
      setUploadError(e?.response?.data?.message || '업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteProcedureDoc(deleteTarget.id)
      setDeleteTarget(null)
      await loadDocs()
    } catch {
      // 에러 무시 (이미 삭제됐을 수도)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        {t('vessel.procedure.accessTitle')}
      </Typography>

      {/* 반응형 플로우차트 */}
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#fafafa' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          {ALL_STEPS.map((step, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '1 1 180px', minWidth: 0 }}>
              <StepBox label={step.label} sub={step.sub} />
              {i < ALL_STEPS.length - 1 && <ArrowForwardIcon sx={{ color: '#555', flexShrink: 0 }} />}
            </Box>
          ))}
        </Box>
      </Paper>

      {/* 절차서 카드 목록 */}
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">절차서 정보 불러오는 중...</Typography>
        </Box>
      ) : (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-start' }}>
          {PROC_ITEMS.map((item) => {
            const doc = docs[item.procType]
            return (
              <Box key={item.procType} sx={{
                p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2,
                display: 'flex', flexDirection: 'column', gap: 1, minWidth: 260,
              }}>
                {/* 절차서 제목 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PictureAsPdfIcon color={doc ? 'error' : 'disabled'} sx={{ flexShrink: 0 }} />
                  <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    {item.label}
                  </Typography>
                </Box>

                {/* 버튼 행 */}
                <Stack direction="row" spacing={1} alignItems="center">
                  {doc ? (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleDownload(item.procType)}
                    >
                      다운로드
                    </Button>
                  ) : (
                    <Typography variant="body2" color="text.disabled">등재된 파일 없음</Typography>
                  )}
                  {isAdmin && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<UploadFileIcon />}
                      onClick={() => openUploadDialog(item)}
                    >
                      {doc ? '절차서 교체' : '절차서 등재'}
                    </Button>
                  )}
                  {isAdmin && doc && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteTarget({ label: item.label, procType: item.procType, id: doc.id })}
                      title="삭제"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              </Box>
            )
          })}
        </Stack>
      )}

      {/* 업로드 다이얼로그 */}
      <Dialog open={!!uploadTarget} onClose={() => setUploadTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>절차서 등재 — {uploadTarget?.label}</DialogTitle>
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
          <Button onClick={() => setUploadTarget(null)} disabled={uploading}>취소</Button>
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
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>절차서 삭제</DialogTitle>
        <DialogContent>
          <Typography>
            <strong>{deleteTarget?.label}</strong> 절차서를 삭제하시겠습니까?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            삭제 후에는 다시 등재해야 합니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>취소</Button>
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

export default AccessProcedurePage
