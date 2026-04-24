// [2026-04-24] PPT 슬라이드 24(관리자 4/10) — 협력업체 안전보건평가 검토
// 컬럼: 평가일|사업자등록번호|평가업체|평가팀|평가자|평가결과|[평가표|증빙서류|검토중|개선요청|검토완료]|검토자|비고
import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import CheckIcon from '@mui/icons-material/CheckCircle'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import AssessmentIcon from '@mui/icons-material/Assessment'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import axios from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as XLSX from 'xlsx'
import { evaluationApi } from '../../api/evaluationApi'
import type { EvaluationListItem, EvaluationStatus } from '../../types/evaluation'

type StatusFilter = EvaluationStatus | ''
type SnackbarState = { open: boolean; message: string; severity: 'success' | 'error' }

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'SUBMITTED', label: '제출' },
  { value: 'APPROVED', label: '검토완료' },
  { value: 'REJECTED', label: '개선요청' },
]

const fmt = (d: string | null | undefined) => d?.slice(0, 10) ?? '-'

// 상태별 검토 단계 체크
const stageCheck = (status: EvaluationStatus) => ({
  평가표:   ['SUBMITTED', 'APPROVED', 'REJECTED'].includes(status),
  증빙서류: ['SUBMITTED', 'APPROVED', 'REJECTED'].includes(status),
  검토중:   status === 'SUBMITTED',
  개선요청: status === 'REJECTED',
  검토완료: status === 'APPROVED',
})

const StageCell: React.FC<{ checked: boolean }> = ({ checked }) =>
  checked ? <CheckIcon fontSize="small" color="success" /> : null

// ── 업체 정보 팝업 ────────────────────────────────────────────────────────
const CompanyPopup: React.FC<{
  item: EvaluationListItem
  onClose: () => void
}> = ({ item, onClose }) => (
  <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography fontWeight={700}>업체 정보</Typography>
      <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
    </DialogTitle>
    <DialogContent dividers>
      <Table size="small">
        <TableBody>
          <TableRow><TableCell sx={{ fontWeight: 600, width: 120 }}>업체명</TableCell><TableCell>{item.companyName}</TableCell></TableRow>
          <TableRow><TableCell sx={{ fontWeight: 600 }}>사업자등록번호</TableCell><TableCell>{item.businessNumber}</TableCell></TableRow>
          <TableRow><TableCell sx={{ fontWeight: 600 }}>평가연도</TableCell><TableCell>{item.periodYear}년 {item.periodHalf === 'H1' ? '상반기' : '하반기'}</TableCell></TableRow>
          <TableRow><TableCell sx={{ fontWeight: 600 }}>평가자</TableCell><TableCell>{item.evaluatorName ?? '-'}</TableCell></TableRow>
        </TableBody>
      </Table>
    </DialogContent>
    <DialogActions><Button onClick={onClose}>닫기</Button></DialogActions>
  </Dialog>
)

// ── 평가표 팝업 (itemScores 상세) ─────────────────────────────────────────
const EvalFormPopup: React.FC<{
  id: number
  companyName: string
  onClose: () => void
}> = ({ id, companyName, onClose }) => {
  const detailQuery = useQuery({
    queryKey: ['evaluations', 'detail', id],
    queryFn: () => evaluationApi.detail(id),
  })
  const detail = detailQuery.data

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography fontWeight={700}>평가표 — {companyName}</Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {detailQuery.isLoading && <CircularProgress size={24} />}
        {detail && (
          <>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Typography variant="body2">총점: <strong>{detail.totalScore ?? 0} / {detail.maxTotalScore ?? 100}</strong></Typography>
              <Typography variant="body2">점수율: <strong>{detail.scorePercentage ?? 0}%</strong></Typography>
              <Chip size="small" label={detail.qualified ? '적격' : '부적격'}
                color={detail.qualified ? 'success' : 'error'} sx={{ fontWeight: 700 }} />
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 700 }}>No.</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>구분</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>평가항목</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>배점</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>점수</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>비고</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detail.itemScores.map((s, i) => (
                    <TableRow key={s.itemId} hover>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell sx={{ fontSize: '0.78rem' }}>{s.itemCategory}</TableCell>
                      <TableCell>{s.itemTitle}</TableCell>
                      <TableCell align="right">{s.maxScore}</TableCell>
                      <TableCell align="right">
                        {s.notApplicable ? <Typography variant="caption" color="text.secondary">N/A</Typography> : (s.score ?? '-')}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>{s.comment ?? ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => window.print()}>인쇄</Button>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  )
}

// ── 증빙서류 팝업 ─────────────────────────────────────────────────────────
const EvidencePopup: React.FC<{
  id: number
  companyName: string
  onClose: () => void
}> = ({ id, companyName, onClose }) => {
  const detailQuery = useQuery({
    queryKey: ['evaluations', 'detail', id],
    queryFn: () => evaluationApi.detail(id),
  })
  const attachments = detailQuery.data?.attachments ?? []

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography fontWeight={700}>증빙서류 — {companyName}</Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {detailQuery.isLoading && <CircularProgress size={24} />}
        {!detailQuery.isLoading && attachments.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>제출된 서류가 없습니다.</Typography>
        )}
        {attachments.length > 0 && (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700 }}>No.</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>평가항목</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>파일명</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attachments.map((att, i) => (
                <TableRow key={att.id} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                    {att.itemId ? `항목 ${att.itemId}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Button size="small" variant="text" sx={{ p: 0, textAlign: 'left' }}
                      href={`/api/evaluations/${id}/attachments/${att.id}/download`}
                      target="_blank">
                      {att.fileName}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>닫기</Button></DialogActions>
    </Dialog>
  )
}

// ── 개선요청(반려) 팝업 ───────────────────────────────────────────────────
const RejectPopup: React.FC<{
  item: EvaluationListItem
  onClose: () => void
  onSubmit: (id: number, reason: string) => void
  isPending: boolean
}> = ({ item, onClose, onSubmit, isPending }) => {
  const [reason, setReason] = useState('')

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography fontWeight={700}>개선요청 사유 입력</Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">{item.companyName} ({item.businessNumber})</Typography>
          <TextField fullWidth multiline minRows={3}
            label="개선요청 사유"
            placeholder="사유를 입력하면 협력업체 담당자에게 자동으로 메일이 발송됩니다."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            autoFocus />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose}>취소</Button>
        <Button variant="contained" color="warning"
          disabled={isPending || !reason.trim()}
          onClick={() => onSubmit(item.id, reason.trim())}>
          {isPending ? <CircularProgress size={20} /> : '개선요청 발송'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────
const AdminEvaluationReviewPage: React.FC = () => {
  const qc = useQueryClient()

  const [keywordInput, setKeywordInput] = useState('')
  const [statusInput, setStatusInput] = useState<StatusFilter>('SUBMITTED')
  const [yearInput, setYearInput] = useState(new Date().getFullYear())

  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('SUBMITTED')
  const [year, setYear] = useState(new Date().getFullYear())
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  const [companyPopup, setCompanyPopup] = useState<EvaluationListItem | null>(null)
  const [evalFormPopup, setEvalFormPopup] = useState<EvaluationListItem | null>(null)
  const [evidencePopup, setEvidencePopup] = useState<EvaluationListItem | null>(null)
  const [rejectPopup, setRejectPopup] = useState<EvaluationListItem | null>(null)

  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' })

  const listQuery = useQuery({
    queryKey: ['admin', 'eval-review', { keyword, statusFilter, year, page, pageSize }],
    queryFn: () =>
      evaluationApi.list({
        keyword: keyword || undefined,
        status: statusFilter || undefined,
        periodYear: year || undefined,
        page,
        size: pageSize,
      }),
    placeholderData: (prev) => prev,
  })

  const extractError = (err: unknown) =>
    axios.isAxiosError(err)
      ? (err.response?.data as { message?: string })?.message ?? '처리 중 오류가 발생했습니다.'
      : '처리 중 오류가 발생했습니다.'

  const reviewMut = useMutation({
    mutationFn: ({ id, action, reason }: { id: number; action: 'APPROVE' | 'REJECT'; reason?: string }) =>
      evaluationApi.review(id, { action, reason }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'eval-review'] })
      qc.invalidateQueries({ queryKey: ['evaluations', 'detail', vars.id] })
      setSnackbar({
        open: true,
        message: vars.action === 'APPROVE' ? '검토 완료 처리됐습니다.' : '개선요청이 발송됐습니다.',
        severity: 'success',
      })
      setRejectPopup(null)
    },
    onError: (err) => setSnackbar({ open: true, message: extractError(err), severity: 'error' }),
  })

  const handleSearch = () => {
    setKeyword(keywordInput.trim())
    setStatusFilter(statusInput)
    setYear(yearInput)
    setPage(0)
  }

  const handleExcel = () => {
    const rows = listQuery.data?.content ?? []
    const data = rows.map((r) => ({
      '평가일': fmt(r.submittedAt),
      '사업자등록번호': r.businessNumber,
      '평가업체': r.companyName,
      '평가자': r.evaluatorName ?? '-',
      '평가결과': r.qualified ? '적격' : '부적격',
      '점수': `${r.totalScore ?? 0} / ${r.maxTotalScore ?? 100}`,
      '상태': r.status,
      '검토자': '-',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '평가검토')
    XLSX.writeFile(wb, `eval_review_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const rows = listQuery.data?.content ?? []
  const total = listQuery.data?.totalElements ?? 0

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>협력업체 안전보건평가 검토</Typography>

      {/* 검색 조건 */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <Typography variant="body2" sx={{ minWidth: 52, fontWeight: 500 }}>평가연도</Typography>
            <TextField
              type="number" size="small" value={yearInput}
              onChange={(e) => setYearInput(Number(e.target.value))}
              sx={{ width: 110 }}
              inputProps={{ min: 2020, max: 2099 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>구분(상태)</InputLabel>
              <Select label="구분(상태)" value={statusInput}
                onChange={(e) => setStatusInput(e.target.value as StatusFilter)}>
                {STATUS_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <TextField size="small" label="평가업체·사업자등록번호·평가자 검색"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
              sx={{ flex: 1 }} />
            <Button variant="outlined" startIcon={<FileDownloadIcon />}
              onClick={handleExcel} disabled={!rows.length}>
              Excel
            </Button>
            <Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearch}>검색</Button>
          </Stack>
        </Stack>
      </Paper>

      {/* 목록 — PPT 슬라이드 24 */}
      <Paper variant="outlined">
        {listQuery.isError && <Alert severity="error" sx={{ m: 2 }}>목록을 불러오지 못했습니다.</Alert>}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell rowSpan={2} sx={{ fontWeight: 700, width: 96 }}>평가일</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 700, width: 130 }}>사업자등록번호</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 700 }}>평가업체</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 700, width: 90 }}>평가자</TableCell>
                <TableCell rowSpan={2} align="center" sx={{ fontWeight: 700, width: 72 }}>평가결과</TableCell>
                <TableCell colSpan={5} align="center" sx={{ fontWeight: 700 }}>평가결과 검토</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 700, width: 72 }}>검토자</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 700, width: 90 }}>액션</TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.78rem', width: 54 }}>평가표</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.78rem', width: 60 }}>증빙서류</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.78rem', width: 54 }}>검토중</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.78rem', width: 60 }}>개선요청</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.78rem', width: 60 }}>검토완료</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {listQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              )}
              {!listQuery.isLoading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    조회된 데이터가 없습니다.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row) => {
                const stage = stageCheck(row.status)
                const locked = row.status === 'APPROVED'
                return (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontSize: '0.78rem' }}>{fmt(row.submittedAt)}</TableCell>
                    <TableCell sx={{ fontSize: '0.78rem' }}>{row.businessNumber}</TableCell>
                    {/* 업체명 클릭 → 팝업 */}
                    <TableCell>
                      <Button size="small" variant="text"
                        sx={{ p: 0, minWidth: 0, fontWeight: 400, textAlign: 'left' }}
                        onClick={() => setCompanyPopup(row)}>
                        {row.companyName}
                      </Button>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.78rem' }}>{row.evaluatorName ?? '-'}</TableCell>
                    <TableCell align="center">
                      <Chip size="small"
                        label={row.qualified ? '적격' : '부적격'}
                        color={row.qualified ? 'success' : 'error'}
                        sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
                    </TableCell>
                    {/* 평가표 클릭 */}
                    <TableCell align="center">
                      <Tooltip title="평가표 보기">
                        <IconButton size="small" color={stage.평가표 ? 'primary' : 'default'}
                          onClick={() => setEvalFormPopup(row)}>
                          <AssessmentIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    {/* 증빙서류 클릭 */}
                    <TableCell align="center">
                      <Tooltip title="증빙서류 보기">
                        <IconButton size="small" color={stage.증빙서류 ? 'primary' : 'default'}
                          onClick={() => setEvidencePopup(row)}>
                          <FolderOpenIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center"><StageCell checked={stage.검토중} /></TableCell>
                    <TableCell align="center"><StageCell checked={stage.개선요청} /></TableCell>
                    <TableCell align="center"><StageCell checked={stage.검토완료} /></TableCell>
                    <TableCell sx={{ fontSize: '0.78rem' }}>{'-'}</TableCell>
                    {/* 액션 */}
                    <TableCell>
                      {locked ? (
                        <Chip size="small" label="검토완료" color="success" sx={{ fontWeight: 600 }} />
                      ) : row.status === 'SUBMITTED' ? (
                        <Stack direction="column" spacing={0.5}>
                          <Button size="small" variant="contained" color="success"
                            disabled={reviewMut.isPending}
                            onClick={() => reviewMut.mutate({ id: row.id, action: 'APPROVE' })}>
                            검토완료
                          </Button>
                          <Button size="small" variant="outlined" color="warning"
                            disabled={reviewMut.isPending}
                            onClick={() => setRejectPopup(row)}>
                            개선요청
                          </Button>
                        </Stack>
                      ) : row.status === 'REJECTED' ? (
                        <Chip size="small" label="개선요청" color="warning" sx={{ fontWeight: 600 }} />
                      ) : null}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div" count={total} page={page}
          rowsPerPage={pageSize} rowsPerPageOptions={[10, 20, 50]}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setPageSize(Number(e.target.value)); setPage(0) }}
        />
      </Paper>

      {/* 팝업들 */}
      {companyPopup && <CompanyPopup item={companyPopup} onClose={() => setCompanyPopup(null)} />}
      {evalFormPopup && (
        <EvalFormPopup id={evalFormPopup.id} companyName={evalFormPopup.companyName}
          onClose={() => setEvalFormPopup(null)} />
      )}
      {evidencePopup && (
        <EvidencePopup id={evidencePopup.id} companyName={evidencePopup.companyName}
          onClose={() => setEvidencePopup(null)} />
      )}
      {rejectPopup && (
        <RejectPopup item={rejectPopup}
          onClose={() => setRejectPopup(null)}
          isPending={reviewMut.isPending}
          onSubmit={(id, reason) => reviewMut.mutate({ id, action: 'REJECT', reason })}
        />
      )}

      <Snackbar open={snackbar.open} autoHideDuration={3500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default AdminEvaluationReviewPage
