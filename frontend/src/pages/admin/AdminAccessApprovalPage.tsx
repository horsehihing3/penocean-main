// [2026-04-24] PPT 슬라이드 23(관리자 3/10) — 사업장 출입신청 허가
// 컬럼: No|선박명|지역/항구|회사|신청일|작업일정(From/To)|명단|서류/검토중/개선요청/검토완료|검토자|비고
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
  Pagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import CheckIcon from '@mui/icons-material/CheckCircle'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import PeopleIcon from '@mui/icons-material/People'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import axios from 'axios'
import axiosInstance from '../../api/axiosInstance'
import { useAlert } from '../../components/common/ConfirmDialogProvider'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accessRequestApi } from '../../api/accessRequestApi'
import type { AccessRequestStatus, AccessRequestListItem } from '../../types/accessRequest'

type StatusFilter = AccessRequestStatus | ''
type SnackbarState = { open: boolean; message: string; severity: 'success' | 'error' }

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'SUBMITTED', label: '제출' },
  { value: 'IN_REVIEW', label: '검토중' },
  { value: 'IMPROVEMENT_REQUESTED', label: '개선요청' },
  { value: 'APPROVED', label: '검토완료' },
  { value: 'REJECTED', label: '반려' },
]

const statusChip = (status: AccessRequestStatus) => {
  const map: Record<AccessRequestStatus, { label: string; color: 'default' | 'info' | 'warning' | 'success' | 'error' }> = {
    DRAFT:                  { label: '작성중',   color: 'default' },
    SUBMITTED:              { label: '제출',     color: 'info' },
    IN_REVIEW:              { label: '검토중',   color: 'warning' },
    IMPROVEMENT_REQUESTED:  { label: '개선요청', color: 'warning' },
    APPROVED:               { label: '검토완료', color: 'success' },
    REJECTED:               { label: '반려',     color: 'error' },
  }
  const { label, color } = map[status] ?? { label: status, color: 'default' }
  return <Chip size="small" label={label} color={color} />
}

const fmt = (d: string | null | undefined) => d?.slice(0, 10) ?? '-'

// 상태별 검토 단계 체크 (PPT의 서류/검토중/개선요청/검토완료 컬럼)
const stageCheck = (status: AccessRequestStatus) => ({
  서류:    ['SUBMITTED', 'IN_REVIEW', 'IMPROVEMENT_REQUESTED', 'APPROVED'].includes(status),
  검토중:  ['IN_REVIEW', 'IMPROVEMENT_REQUESTED', 'APPROVED'].includes(status),
  개선요청: status === 'IMPROVEMENT_REQUESTED',
  검토완료: status === 'APPROVED',
})

const StageCell: React.FC<{ checked: boolean }> = ({ checked }) =>
  checked ? <CheckIcon fontSize="small" color="success" /> : null

// ── 회사 정보 팝업 ─────────────────────────────────────────────────────────
const CompanyPopup: React.FC<{ id: number; companyName: string; onClose: () => void }> = ({ id, companyName, onClose }) => {
  const detailQuery = useQuery({
    queryKey: ['access-requests', 'detail', id],
    queryFn: () => accessRequestApi.detail(id),
  })
  const d = detailQuery.data

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography fontWeight={700}>업체 정보</Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {detailQuery.isLoading && <CircularProgress size={24} />}
        {d && (
          <TableContainer>
            <Table size="small">
              <TableBody>
                <TableRow><TableCell sx={{ fontWeight: 600, width: 120 }}>업체명</TableCell><TableCell>{companyName}</TableCell></TableRow>
                <TableRow><TableCell sx={{ fontWeight: 600 }}>사업자등록번호</TableCell><TableCell>{d.businessNumber ?? '-'}</TableCell></TableRow>
                <TableRow><TableCell sx={{ fontWeight: 600 }}>업종</TableCell><TableCell>{d.industryName ?? '-'}</TableCell></TableRow>
                <TableRow><TableCell sx={{ fontWeight: 600 }}>기타업종</TableCell><TableCell>{d.industryOther ?? '-'}</TableCell></TableRow>
                <TableRow>
                  <TableCell colSpan={2} sx={{ pt: 1.5, pb: 0.5 }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">안전담당자</Typography>
                  </TableCell>
                </TableRow>
                <TableRow><TableCell sx={{ fontWeight: 600 }}>성명</TableCell><TableCell>{d.safetyManagerName ?? '-'}</TableCell></TableRow>
                <TableRow><TableCell sx={{ fontWeight: 600 }}>직책</TableCell><TableCell>{d.safetyManagerTitle ?? '-'}</TableCell></TableRow>
                <TableRow><TableCell sx={{ fontWeight: 600 }}>Tel</TableCell><TableCell>{d.safetyManagerTel ?? '-'}</TableCell></TableRow>
                <TableRow><TableCell sx={{ fontWeight: 600 }}>E-Mail</TableCell><TableCell sx={{ wordBreak: 'break-all' }}>{d.safetyManagerEmail ?? '-'}</TableCell></TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>닫기</Button></DialogActions>
    </Dialog>
  )
}

// ── 명단 팝업 ─────────────────────────────────────────────────────────────
const WorkerListPopup: React.FC<{ id: number; vesselName: string; onClose: () => void }> = ({ id, vesselName, onClose }) => {
  const detailQuery = useQuery({
    queryKey: ['access-requests', 'detail', id],
    queryFn: () => accessRequestApi.detail(id),
  })
  const workers = detailQuery.data?.workers ?? []

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography fontWeight={700}>신청 명단 — {vesselName}</Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {detailQuery.isLoading && <CircularProgress size={24} />}
        {!detailQuery.isLoading && workers.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>등록된 작업자가 없습니다.</Typography>
        )}
        {workers.length > 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>No.</TableCell>
                  <TableCell>성명</TableCell>
                  <TableCell>생년월일</TableCell>
                  <TableCell>연락처</TableCell>
                  <TableCell>직무</TableCell>
                  <TableCell align="center">교육이수</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workers.map((w, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{w.workerName}</TableCell>
                    <TableCell>{w.workerBirth ?? '-'}</TableCell>
                    <TableCell>{w.workerPhone ?? '-'}</TableCell>
                    <TableCell>{w.workerRole ?? '-'}</TableCell>
                    <TableCell align="center">
                      {w.safetyEduCompleted
                        ? <Chip size="small" label="이수" color="success" />
                        : <Chip size="small" label="미이수" color="error" />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>닫기</Button></DialogActions>
    </Dialog>
  )
}

// ── 서류 팝업 ─────────────────────────────────────────────────────────────
const DOC_TYPE_LABELS: Record<string, string> = {
  RISK_ASSESSMENT: '위험성평가',
  PLEDGE: '안전보건서약서',
  WORK_PLAN: '작업계획서',
  OTHER: '기타',
}

// 항상 표시할 고정 서류 순서 (2번째에 안전보건서약서 포함)
const FIXED_DOC_TYPES = ['RISK_ASSESSMENT', 'PLEDGE', 'WORK_PLAN']

const AttachmentPopup: React.FC<{ id: number; vesselName: string; onClose: () => void }> = ({ id, vesselName, onClose }) => {
  const showAlert = useAlert()
  const detailQuery = useQuery({
    queryKey: ['access-requests', 'detail', id],
    queryFn: () => accessRequestApi.detail(id),
  })
  const attachments = detailQuery.data?.attachments ?? []
  const noRiskAssessment = detailQuery.data?.noRiskAssessment ?? false

  // [2026-05-04] JWT 인증 포함 파일 열기 → 새 탭에서 PDF/이미지 표시 후 인쇄
  const openFile = async (attId: number, mimeType?: string | null) => {
    try {
      const res = await axiosInstance.get(
        `/access-requests/${id}/attachments/${attId}/download`,
        { responseType: 'blob' }
      )
      const blob = new Blob([res.data], { type: mimeType ?? res.data.type ?? 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const tab = window.open(url, '_blank')
      if (tab) tab.focus()
    } catch {
      showAlert('파일을 열지 못했습니다.')
    }
  }

  // 고정 순서로 표시: 첨부파일 있으면 매핑, 없으면 빈 슬롯으로 표시
  const docList = FIXED_DOC_TYPES.map((type) => ({
    type,
    label: DOC_TYPE_LABELS[type],
    att: attachments.find((a) => a.attachmentType === type) ?? null,
  }))
  // 기타(OTHER) 첨부파일 추가
  const others = attachments.filter((a) => !FIXED_DOC_TYPES.includes(a.attachmentType))

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography fontWeight={700}>제출 서류 — {vesselName}</Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {detailQuery.isLoading && <CircularProgress size={24} />}
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          {docList.map(({ type, label, att }) => {
            const isNoRisk = type === 'RISK_ASSESSMENT' && !att && noRiskAssessment
            return (
              <Paper key={type} variant="outlined" sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>{label}</Typography>
                  <Typography variant="caption" color={att ? 'text.secondary' : isNoRisk ? 'text.disabled' : 'error'}>
                    {att ? att.fileName : isNoRisk ? '위험성평가 없음' : '미제출'}
                  </Typography>
                </Box>
                {att ? (
                  <Button size="small" variant="outlined" startIcon={<PrintIcon />}
                    onClick={() => openFile(att.id, att.mimeType)}>
                    열기/인쇄
                  </Button>
                ) : isNoRisk ? (
                  <Chip size="small" label="위험성평가 없음" sx={{ color: 'text.disabled', borderColor: 'text.disabled' }} variant="outlined" />
                ) : (
                  <Chip size="small" label="미제출" color="error" variant="outlined" />
                )}
              </Paper>
            )
          })}
          {others.map((att) => (
            <Paper key={att.id} variant="outlined" sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" fontWeight={600}>{DOC_TYPE_LABELS[att.attachmentType] ?? att.attachmentType}</Typography>
                <Typography variant="caption" color="text.secondary">{att.fileName}</Typography>
              </Box>
              <Button size="small" variant="outlined" startIcon={<PrintIcon />}
                onClick={() => openFile(att.id, att.mimeType)}>
                열기/인쇄
              </Button>
            </Paper>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>닫기</Button></DialogActions>
    </Dialog>
  )
}

// ── 개선요청 팝업 ─────────────────────────────────────────────────────────
const ImprovementPopup: React.FC<{
  row: AccessRequestListItem
  onClose: () => void
  onSubmit: (id: number, reason: string) => void
  isPending: boolean
}> = ({ row, onClose, onSubmit, isPending }) => {
  const [reason, setReason] = useState('')

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography fontWeight={700}>개선요청 사유 입력</Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {row.vesselName} — {row.companyName}
          </Typography>
          <TextField
            fullWidth multiline minRows={3}
            label="개선요청 사유"
            placeholder="사유를 입력하면 협력업체 담당자에게 자동으로 메일이 발송됩니다."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            autoFocus
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose}>취소</Button>
        <Button
          variant="contained" color="warning"
          disabled={isPending || !reason.trim()}
          onClick={() => onSubmit(row.id, reason.trim())}
        >
          {isPending ? <CircularProgress size={20} /> : '개선요청 발송'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────
const AdminAccessApprovalPage: React.FC = () => {
  const qc = useQueryClient()
  const showAlert = useAlert()

  // 검색 입력값
  const [keywordInput, setKeywordInput] = useState('')
  const [statusInput, setStatusInput] = useState<StatusFilter>('')
  const [dateFromInput, setDateFromInput] = useState('')
  const [dateToInput, setDateToInput] = useState('')

  // 실제 쿼리 파라미터
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('SUBMITTED')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 20

  // 팝업 상태
  const [companyPopup, setCompanyPopup] = useState<{ id: number; name: string } | null>(null)
  const [workerPopup, setWorkerPopup] = useState<{ id: number; vesselName: string } | null>(null)
  const [attachPopup, setAttachPopup] = useState<{ id: number; vesselName: string } | null>(null)
  const [improvPopup, setImprovPopup] = useState<AccessRequestListItem | null>(null)

  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' })

  const listQuery = useQuery({
    queryKey: ['admin', 'access-approval', { keyword, statusFilter, dateFrom, dateTo, page, pageSize }],
    queryFn: () =>
      accessRequestApi.list({
        keyword: keyword || undefined,
        status: statusFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
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
    mutationFn: ({ id, action, comment }: { id: number; action: string; comment?: string }) =>
      accessRequestApi.review(id, { action: action as never, comment }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'access-approval'] })
      qc.invalidateQueries({ queryKey: ['access-requests', 'detail', vars.id] })
      const labels: Record<string, string> = {
        START: '검토 시작 처리됐습니다.',
        IMPROVEMENT: '개선요청이 발송됐습니다.',
        APPROVE: '검토 완료(승인) 처리됐습니다.',
        REJECT: '반려 처리됐습니다.',
      }
      setSnackbar({ open: true, message: labels[vars.action] ?? '처리됐습니다.', severity: 'success' })
      setImprovPopup(null)
    },
    onError: (err) => setSnackbar({ open: true, message: extractError(err), severity: 'error' }),
  })

  const handleSearch = () => {
    setKeyword(keywordInput.trim())
    setStatusFilter(statusInput)
    setDateFrom(dateFromInput)
    setDateTo(dateToInput)
    setPage(0)
  }

  const rows = listQuery.data?.content ?? []
  const total = listQuery.data?.totalElements ?? 0

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>사업장 출입신청 허가</Typography>

      {/* 검색 조건 */}
      <Box>
        <Stack spacing={1.5}>
          {/* 1줄: 신청일 + 검토상태 */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} flexWrap="wrap" useFlexGap>
            <Typography variant="body2" sx={{ minWidth: 52, fontWeight: 500 }}>신청일</Typography>
            <TextField type="date" size="small" value={dateFromInput}
              onChange={(e) => setDateFromInput(e.target.value)}
              InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
            <Typography variant="body2">~</Typography>
            <TextField type="date" size="small" value={dateToInput}
              onChange={(e) => setDateToInput(e.target.value)}
              InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>검토상태</InputLabel>
              <Select label="검토상태" value={statusInput}
                onChange={(e) => setStatusInput(e.target.value as StatusFilter)}>
                {STATUS_FILTER_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          {/* 2줄: 협력업체명 + 사업자등록번호 + 버튼들 */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} flexWrap="wrap" useFlexGap>
            <TextField size="small" label="협력업체명" value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
              sx={{ width: { xs: '100%', sm: 220 } }} />
            <TextField size="small" label="사업자등록번호" sx={{ width: 180 }} />
            <Button variant="contained" size="small" startIcon={<SearchIcon />} onClick={handleSearch}
              sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
              검색
            </Button>
            {/* [2026-08-03] 내보내기 버튼은 우측 정렬 + 아이콘 통일 */}
            <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }} />
            <Button variant="outlined" size="small" startIcon={<FileDownloadIcon />}
              sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              onClick={() => showAlert('Excel 다운로드 준비중입니다.')}>
              Excel
            </Button>
            <Button variant="outlined" size="small" startIcon={<PrintIcon />}
              sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              onClick={() => window.print()}>
              인쇄
            </Button>
            <Button variant="outlined" size="small" startIcon={<FileDownloadIcon />}
              sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              onClick={() => showAlert('업체List 다운로드 준비중입니다.')}>
              업체List 다운로드
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* 목록 — PPT 슬라이드 23 */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            {/* 1행: 그룹 헤더 */}
            <TableRow>
              <TableCell rowSpan={2} sx={{ width: 46 }}>No.</TableCell>
              <TableCell rowSpan={2}>선박명</TableCell>
              <TableCell rowSpan={2} sx={{ width: 110 }}>지역/항구</TableCell>
              <TableCell rowSpan={2} sx={{ width: 100 }}>업체명</TableCell>
              <TableCell rowSpan={2} sx={{ width: 130 }}>신청일</TableCell>
              <TableCell colSpan={2} align="center" sx={{ borderBottom: 0 }}>작업일정</TableCell>
              <TableCell rowSpan={2} align="center" sx={{ width: 58 }}>명단</TableCell>
              <TableCell colSpan={4} align="center" sx={{ borderBottom: 0 }}>
                위험성평가, 안전보건서약서, 작업계획서
              </TableCell>
              {/* [2026-08-03] 헤더 2행의 마지막 셀(검토완료)이 :last-child 가 되어 테마 규칙에
                  우측 보더가 지워지므로, rowSpan 된 이 셀의 왼쪽 보더로 구분선을 그림 */}
              <TableCell
                rowSpan={2}
                sx={{
                  width: 72,
                  borderLeft: (th: any) =>
                    `1px solid ${th.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : th.palette.divider}`,
                }}
              >
                검토자
              </TableCell>
              <TableCell rowSpan={2} sx={{ width: 190, minWidth: 190 }}>비고</TableCell>
            </TableRow>
            {/* 2행: 세부 헤더 */}
            <TableRow>
              <TableCell sx={{ width: 96 }}>From</TableCell>
              <TableCell sx={{ width: 96 }}>To</TableCell>
              <TableCell align="center" sx={{ width: 52 }}>서류</TableCell>
              <TableCell align="center" sx={{ width: 60 }}>검토중</TableCell>
              <TableCell align="center" sx={{ width: 70 }}>개선요청</TableCell>
              <TableCell align="center" sx={{ width: 70 }}>검토완료</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {listQuery.isLoading && (
              <TableRow>
                <TableCell colSpan={14} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            )}
            {!listQuery.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={14} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  조회된 데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
            {rows.map((row, idx) => {
              const stage = stageCheck(row.status)
              const locked = row.status === 'APPROVED' || row.status === 'REJECTED'
              return (
                <TableRow key={row.id} hover>
                  <TableCell>{page * pageSize + idx + 1}</TableCell>
                  <TableCell>{row.vesselName}</TableCell>
                  <TableCell>{row.portName ?? '-'}</TableCell>
                  {/* 회사명 클릭 → 업체정보 팝업 */}
                  <TableCell>
                    <Button size="small" variant="text" sx={{ p: 0, minWidth: 0, textAlign: 'left', fontWeight: 400 }}
                      onClick={() => setCompanyPopup({ id: row.id, name: row.companyName })}>
                      {row.companyName}
                    </Button>
                  </TableCell>
                  <TableCell>
                    {row.submittedAt ? fmt(row.submittedAt) : '-'}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmt(row.plannedStartDate)}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmt(row.plannedEndDate)}</TableCell>
                  {/* 명단 클릭 → 작업자 팝업 */}
                  <TableCell align="center">
                    <Tooltip title={`명단 보기 (${row.workerCount}명)`}>
                      <IconButton size="small"
                        onClick={() => setWorkerPopup({ id: row.id, vesselName: row.vesselName })}>
                        <PeopleIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  {/* 서류 클릭 → 첨부파일 팝업 */}
                  <TableCell align="center">
                    <Tooltip title="서류 보기">
                      <IconButton size="small" color={stage.서류 ? 'primary' : 'default'}
                        onClick={() => setAttachPopup({ id: row.id, vesselName: row.vesselName })}>
                        <FolderOpenIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">{!locked && <StageCell checked={stage.검토중} />}</TableCell>
                  {/* 개선요청 — 검토완료/반려 시 숨김 */}
                  <TableCell align="center">
                    {!locked && (
                      <Tooltip title="개선요청 사유 입력">
                        <IconButton size="small" color="warning" onClick={() => setImprovPopup(row)}>
                          <CheckBoxIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell align="center"><StageCell checked={stage.검토완료} /></TableCell>
                  <TableCell>김환규</TableCell>
                  {/* 비고 */}
                  <TableCell>
                    {row.status === 'SUBMITTED' ? (
                      <Button size="small" variant="outlined" color="primary"
                        disabled={reviewMut.isPending}
                        onClick={() => reviewMut.mutate({ id: row.id, action: 'START' })}>
                        검토시작
                      </Button>
                    ) : row.status === 'IN_REVIEW' ? (
                      // [2026-08-03] 세로 적층 → 가로 배치, 라벨 줄바꿈 방지
                      <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ flexWrap: 'nowrap' }}>
                        <Button size="small" variant="contained" color="success"
                          disabled={reviewMut.isPending}
                          sx={{ px: 1, whiteSpace: 'nowrap', flexShrink: 0 }}
                          onClick={() => reviewMut.mutate({ id: row.id, action: 'APPROVE' })}>
                          검토완료
                        </Button>
                        <Button size="small" variant="outlined" color="warning"
                          disabled={reviewMut.isPending}
                          sx={{ px: 1, whiteSpace: 'nowrap', flexShrink: 0 }}
                          onClick={() => setImprovPopup(row)}>
                          개선요청
                        </Button>
                      </Stack>
                    ) : row.status === 'IMPROVEMENT_REQUESTED' ? (
                      <Button size="small" variant="outlined" color="info"
                        disabled={reviewMut.isPending}
                        onClick={() => reviewMut.mutate({ id: row.id, action: 'START' })}>
                        재검토
                      </Button>
                    ) : locked ? (
                      statusChip(row.status)
                    ) : null}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination
          count={Math.max(1, Math.ceil(total / pageSize))}
          page={page + 1}
          onChange={(_, newPage) => setPage(newPage - 1)}
          color="primary"
        />
      </Box>

      {/* 팝업들 */}
      {companyPopup && (
        <CompanyPopup id={companyPopup.id} companyName={companyPopup.name}
          onClose={() => setCompanyPopup(null)} />
      )}
      {workerPopup && (
        <WorkerListPopup id={workerPopup.id} vesselName={workerPopup.vesselName}
          onClose={() => setWorkerPopup(null)} />
      )}
      {attachPopup && (
        <AttachmentPopup id={attachPopup.id} vesselName={attachPopup.vesselName}
          onClose={() => setAttachPopup(null)} />
      )}
      {improvPopup && (
        <ImprovementPopup
          row={improvPopup}
          onClose={() => setImprovPopup(null)}
          isPending={reviewMut.isPending}
          onSubmit={(id, reason) => reviewMut.mutate({ id, action: 'IMPROVEMENT', comment: reason })}
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

export default AdminAccessApprovalPage
