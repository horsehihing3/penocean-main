// [2026-04-24] PPT 슬라이드 22(정보수집) 기준으로 전면 재작성
// 출입신청 기록 목록 조회 — No/상태/구분/업종/방문사업장/지역항구/작업일정/작업상세/출입신청인원
import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useQuery } from '@tanstack/react-query'
import { accessRequestApi } from '../../api/accessRequestApi'
import type { AccessRequestStatus } from '../../types/accessRequest'

type StatusFilter = AccessRequestStatus | ''

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'SUBMITTED', label: '제출' },
  { value: 'IN_REVIEW', label: '검토중' },
  { value: 'APPROVED', label: '진행중' },
  { value: 'REJECTED', label: '반려' },
]

const docStatusLabel = (status: AccessRequestStatus): string => {
  switch (status) {
    case 'DRAFT': return '작성중'
    case 'SUBMITTED': return '제출'
    case 'IN_REVIEW': return '검토중'
    case 'IMPROVEMENT_REQUESTED': return '보완요청'
    case 'APPROVED': return '진행중'
    case 'REJECTED': return '반려'
    default: return status
  }
}

const docStatusColor = (
  status: AccessRequestStatus
): 'default' | 'info' | 'warning' | 'success' | 'error' => {
  switch (status) {
    case 'DRAFT': return 'default'
    case 'SUBMITTED': return 'info'
    case 'IN_REVIEW': return 'warning'
    case 'IMPROVEMENT_REQUESTED': return 'warning'
    case 'APPROVED': return 'success'
    case 'REJECTED': return 'error'
    default: return 'default'
  }
}

const formatDateRange = (start: string, end: string): string => {
  const fmt = (d: string) => d?.slice(0, 10).replace(/-/g, '.') ?? ''
  return `${fmt(start)} ~ ${fmt(end)}`
}

const CompanyManagePage: React.FC = () => {
  const [keywordInput, setKeywordInput] = useState('')
  const [statusInput, setStatusInput] = useState<StatusFilter>('')
  const [dateFromInput, setDateFromInput] = useState('')
  const [dateToInput, setDateToInput] = useState('')

  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  const listQuery = useQuery({
    queryKey: ['admin', 'info-collection', { keyword, statusFilter, dateFrom, dateTo, page, pageSize }],
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
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        정보수집
      </Typography>

      {/* 검색 조건 */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <Typography variant="body2" sx={{ minWidth: 52, fontWeight: 500 }}>작업일정</Typography>
            <TextField
              type="date"
              size="small"
              value={dateFromInput}
              onChange={(e) => setDateFromInput(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 160 }}
            />
            <Typography variant="body2">~</Typography>
            <TextField
              type="date"
              size="small"
              value={dateToInput}
              onChange={(e) => setDateToInput(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 160 }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>상태</InputLabel>
              <Select
                label="상태"
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value as StatusFilter)}
              >
                {STATUS_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <TextField
              size="small"
              label="방문사업장/선박·업체명 검색"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
              sx={{ flex: 1 }}
            />
            <Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearch}>
              검색
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* 목록 — PPT 슬라이드 22 컬럼 */}
      <Paper variant="outlined">
        {listQuery.isError && (
          <Alert severity="error" sx={{ m: 2 }}>목록을 불러오지 못했습니다.</Alert>
        )}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700, width: 48 }}>No.</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 90 }}>상태</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 70 }}>구분</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 100 }}>업종</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>방문사업장/선박</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 90 }}>지역/항구</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 190 }}>작업일정</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 120 }}>작업상세</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, width: 90 }}>출입신청인원</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {listQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              )}
              {!listQuery.isLoading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    조회된 데이터가 없습니다.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row, idx) => (
                <TableRow key={row.id} hover>
                  <TableCell>{page * pageSize + idx + 1}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={docStatusLabel(row.status)}
                      color={docStatusColor(row.status)}
                      sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                    />
                  </TableCell>
                  <TableCell>선박</TableCell>
                  <TableCell>{row.industryName ?? '-'}</TableCell>
                  <TableCell>{row.vesselName}</TableCell>
                  <TableCell>{row.portName ?? '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem' }}>
                    {formatDateRange(row.plannedStartDate, row.plannedEndDate)}
                  </TableCell>
                  <TableCell>{row.workType ?? '-'}</TableCell>
                  <TableCell align="right">{row.workerCount ?? '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={pageSize}
          rowsPerPageOptions={[10, 20, 50]}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setPageSize(Number(e.target.value)); setPage(0) }}
        />
      </Paper>
    </Box>
  )
}

export default CompanyManagePage
