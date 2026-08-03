// [2026-04-30] PPT 슬라이드 28 기준으로 전면 재설계
// 선박 선택 + 연도 조회 → 12개월 인라인 편집 테이블 → 임시저장/최종제출
import { useRef, useState } from 'react'
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import SaveIcon from '@mui/icons-material/Save'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import UploadIcon from '@mui/icons-material/Upload'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { safetyPerformanceSeaApi } from '../../api/safetyPerformanceApi'
import { lookupApi } from '../../api/lookupApi'
import type { SafetyPerformanceSea } from '../../types/safetyPerformance'

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i)
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const POS_SM_URL = 'https://pos-sm.panocean.com'

type SnackState = { open: boolean; message: string; severity: 'success' | 'error' | 'info' }

type RowKey = 'crewCount' | 'illnessCount' | 'injuryCount' | 'evacuationCount' | 'sickLeaveDays'
const ROW_DEFS: { key: RowKey; label: string; unit: string }[] = [
  { key: 'crewCount',      label: '관리 척수',    unit: '척' },
  { key: 'illnessCount',   label: '질병 발생',    unit: '건' },
  { key: 'injuryCount',    label: '부상 사고',    unit: '건' },
  { key: 'evacuationCount',label: '후송 건수',    unit: '건' },
  { key: 'sickLeaveDays',  label: '병가 일수',    unit: '일' },
]

type MonthData = {
  id?: number
  crewCount: number
  illnessCount: number
  injuryCount: number
  evacuationCount: number
  sickLeaveDays: number
}

const emptyMonth = (): MonthData => ({
  crewCount: 0, illnessCount: 0, injuryCount: 0, evacuationCount: 0, sickLeaveDays: 0,
})

const SafetyPerformanceSeaPage: React.FC = () => {
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedVesselId, setSelectedVesselId] = useState<number | ''>('')
  const [selectedYear, setSelectedYear]         = useState(currentYear)
  const [queried, setQueried]                   = useState(false)
  const [tableData, setTableData]               = useState<Record<number, MonthData>>({})
  const [snack, setSnack]                       = useState<SnackState>({ open: false, message: '', severity: 'success' })

  const { data: vessels = [] } = useQuery({
    queryKey: ['lookup', 'vessels'],
    queryFn: () => lookupApi.vessels(),
  })

  const selectedVessel = vessels.find((v) => v.id === selectedVesselId)

  // 조회: vessel + year로 12개월 데이터 로드
  const listQuery = useQuery({
    queryKey: ['safetyPerformance', 'sea', 'table', selectedVesselId, selectedYear],
    queryFn: () =>
      safetyPerformanceSeaApi.list({
        vesselId: Number(selectedVesselId),
        periodYear: selectedYear,
        size: 12,
      }),
    enabled: false, // 조회 버튼 클릭 시만 실행
  })

  const handleQuery = async () => {
    if (!selectedVesselId) {
      setSnack({ open: true, message: '선박을 선택해주세요.', severity: 'info' })
      return
    }
    const result = await listQuery.refetch()
    const loaded: Record<number, MonthData> = {}
    MONTHS.forEach((m) => { loaded[m] = emptyMonth() })
    ;(result.data?.content ?? []).forEach((r: SafetyPerformanceSea) => {
      loaded[r.periodMonth] = {
        id: r.id,
        crewCount:       r.crewCount      ?? 0,
        illnessCount:    r.illnessCount   ?? 0,
        injuryCount:     r.injuryCount    ?? 0,
        evacuationCount: r.evacuationCount ?? 0,
        sickLeaveDays:   r.sickLeaveDays  ?? 0,
      }
    })
    setTableData(loaded)
    setQueried(true)
  }

  const extractError = (err: unknown) => {
    if (axios.isAxiosError(err)) {
      return (err.response?.data as { message?: string } | undefined)?.message ?? '저장에 실패했습니다.'
    }
    return '저장에 실패했습니다.'
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!selectedVesselId) return
      const promises = MONTHS.map((m) =>
        safetyPerformanceSeaApi.upsert({
          vesselId:        Number(selectedVesselId),
          periodYear:      selectedYear,
          periodMonth:     m,
          crewCount:       tableData[m]?.crewCount      ?? 0,
          illnessCount:    tableData[m]?.illnessCount   ?? 0,
          injuryCount:     tableData[m]?.injuryCount    ?? 0,
          evacuationCount: tableData[m]?.evacuationCount ?? 0,
          sickLeaveDays:   tableData[m]?.sickLeaveDays  ?? 0,
        })
      )
      await Promise.all(promises)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['safetyPerformance', 'sea'] })
      qc.invalidateQueries({ queryKey: ['seaYearlyStats'] })
    },
    onError: (err) => setSnack({ open: true, message: extractError(err), severity: 'error' }),
  })

  const handleTempSave = async () => {
    await saveMut.mutateAsync()
    setSnack({ open: true, message: '임시 저장되었습니다.', severity: 'success' })
  }

  const handleFinalSave = async () => {
    await saveMut.mutateAsync()
    setSnack({ open: true, message: '최종 제출되었습니다.', severity: 'success' })
  }

  const importMut = useMutation({
    mutationFn: (file: File) => safetyPerformanceSeaApi.importExcel(file),
    onSuccess: () => setSnack({ open: true, message: '엑셀 업로드 완료', severity: 'success' }),
    onError: () => setSnack({ open: true, message: '엑셀 업로드 실패', severity: 'error' }),
  })

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { importMut.mutate(file); e.target.value = '' }
  }

  const updateCell = (month: number, key: RowKey, value: number) => {
    setTableData((prev) => ({
      ...prev,
      [month]: { ...(prev[month] ?? emptyMonth()), [key]: value },
    }))
  }

  const rowTotal = (key: RowKey) =>
    MONTHS.reduce((s, m) => s + (tableData[m]?.[key] ?? 0), 0)

  const isSaving = saveMut.isPending

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

      {/* 상단 헤더 */}
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5" fontWeight={700}>
          해상 안전보건 예산 및 실적
        </Typography>
        <Button
          variant="outlined"
          startIcon={<OpenInNewIcon />}
          href={POS_SM_URL}
          target="_blank"
          rel="noopener"
          size="small"
        >
          POS-SM 바로가기
        </Button>
      </Stack>

      {/* 조회 조건 */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
            조회 선박 선택 :
          </Typography>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>선박 선택</InputLabel>
            <Select
              label="선박 선택"
              value={selectedVesselId}
              onChange={(e) => {
                setSelectedVesselId(e.target.value === '' ? '' : Number(e.target.value))
                setQueried(false)
              }}
            >
              <MenuItem value="">전체</MenuItem>
              {vessels.map((v) => (
                <MenuItem key={v.id} value={v.id}>
                  {v.name}{v.imoNumber ? ` (IMO ${v.imoNumber})` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ flexGrow: 1 }} />

          <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
            조회 연도 설정
          </Typography>
          <FormControl size="small" sx={{ minWidth: 90 }}>
            <Select value={selectedYear} onChange={(e) => { setSelectedYear(Number(e.target.value)); setQueried(false) }}>
              {yearOptions.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>
          </FormControl>
          <Typography variant="body2">년</Typography>
          <Button
            variant="contained"
            startIcon={listQuery.isFetching ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
            onClick={handleQuery}
            disabled={listQuery.isFetching}
          >
            조회
          </Button>
        </Stack>
      </Paper>

      {/* 데이터 테이블 */}
      {/* [2026-08-03] 목록 디자인 적용 — 제목을 Paper 밖으로, TableContainer 가 테두리 담당 */}
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Box sx={{ width: 4, height: 20, bgcolor: 'primary.main', borderRadius: 1 }} />
          <Typography variant="subtitle1" fontWeight={700}>
            해상 안전보건 예산 및 실적
            {selectedVessel ? ` - [${selectedVessel.name}]` : ''}
          </Typography>
          <Typography variant="caption" color="text.secondary">(단위: 건/척/일)</Typography>
        </Stack>

        {!queried ? (
          <Paper variant="outlined" sx={{ py: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">선박과 연도를 선택한 후 [조회] 버튼을 눌러주세요.</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small" sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 120 }}>구분 (항목)</TableCell>
                  <TableCell sx={{ width: 60, textAlign: 'center' }}>단위</TableCell>
                  {MONTHS.map((m) => (
                    <TableCell key={m} align="center" sx={{ minWidth: 72 }}>
                      {m}월
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ minWidth: 80, color: 'primary.main' }}>
                    합계
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ROW_DEFS.map((row) => (
                  <TableRow key={row.key} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{row.label}</TableCell>
                    <TableCell align="center" sx={{ color: 'text.secondary' }}>
                      {row.unit}
                    </TableCell>
                    {MONTHS.map((m) => (
                      <TableCell key={m} align="center" sx={{ p: 0.5 }}>
                        <TextField
                          size="small"
                          type="number"
                          value={tableData[m]?.[row.key] ?? 0}
                          onChange={(e) => updateCell(m, row.key, Number(e.target.value) || 0)}
                          inputProps={{
                            min: 0,
                            style: { textAlign: 'center', padding: '4px 6px', fontSize: '0.85rem' },
                          }}
                          sx={{ width: 64 }}
                        />
                      </TableCell>
                    ))}
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, color: 'primary.main' }}
                    >
                      {rowTotal(row.key).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {queried && (
          <>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  hidden
                  onChange={handleFilePick}
                />
                <Button
                  variant="outlined"
                  startIcon={importMut.isPending ? <CircularProgress size={16} /> : <UploadIcon />}
                  disabled={importMut.isPending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  엑셀 업로드
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={() => setSnack({ open: true, message: '엑셀 다운로드는 준비 중입니다.', severity: 'info' })}
                >
                  엑셀 다운로드
                </Button>
              </Stack>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={isSaving ? <CircularProgress size={16} /> : <SaveIcon />}
                  disabled={isSaving}
                  onClick={handleTempSave}
                >
                  임시 저장
                </Button>
                <Button
                  variant="contained"
                  startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlineIcon />}
                  disabled={isSaving}
                  onClick={handleFinalSave}
                  sx={{ bgcolor: 'primary.dark' }}
                >
                  최종 제출하기
                </Button>
              </Stack>
            </Stack>
          </>
        )}
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default SafetyPerformanceSeaPage
