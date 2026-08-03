// [2026-04-30] 하드코딩 → 실제 API 연결 (연도별 집계 통계)
import { useRef, useState } from 'react'
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  Skeleton,
} from '@mui/material'
import UploadIcon from '@mui/icons-material/Upload'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { safetyPerformanceSeaApi } from '../../api/safetyPerformanceApi'
import type { SeaYearlyStats } from '../../types/safetyPerformance'

const THIS_YEAR = new Date().getFullYear()
const YEARS_RANGE = 4
const POS_SM_URL = 'https://pos-sm.panocean.com'

const SeaCrewStatsPage: React.FC = () => {
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedYear, setSelectedYear] = useState(THIS_YEAR)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info',
  })

  const statsQuery = useQuery({
    queryKey: ['seaYearlyStats', YEARS_RANGE],
    queryFn: () => safetyPerformanceSeaApi.yearlyStats(YEARS_RANGE),
  })

  const stats: SeaYearlyStats[] = statsQuery.data ?? []

  // 선택 연도 데이터
  const currentStats = stats.find((s) => s.year === selectedYear)

  // 연도 선택 옵션 (최근 N년)
  const yearOptions = Array.from({ length: YEARS_RANGE }, (_, i) => THIS_YEAR - i).reverse()

  const importMut = useMutation({
    mutationFn: (file: File) => safetyPerformanceSeaApi.importExcel(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seaYearlyStats'] })
      setSnackbar({ open: true, message: '엑셀 업로드가 완료되었습니다.', severity: 'success' })
    },
    onError: () => {
      setSnackbar({ open: true, message: '업로드에 실패했습니다. 파일 형식을 확인해주세요.', severity: 'error' })
    },
  })

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      importMut.mutate(file)
      e.target.value = ''
    }
  }

  const statField = (label: string, value: React.ReactNode, unit = '') => (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Box sx={{ mt: 0.5 }}>
        {statsQuery.isLoading ? (
          <Skeleton width={110} height={40} />
        ) : (
          <TextField
            size="small"
            value={value ?? '-'}
            InputProps={{ readOnly: true }}
            inputProps={{
              style: { textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' },
            }}
            sx={{ width: 110 }}
            helperText={unit}
          />
        )}
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          해상직원 질병/부상 누적건수 및 재해율
        </Typography>
        <Button
          variant="outlined"
          startIcon={<OpenInNewIcon />}
          href={POS_SM_URL}
          target="_blank"
          rel="noopener"
        >
          POS-SM 바로가기
        </Button>
      </Stack>

      {/* Section 1: 당해연도 원본 데이터 */}
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            1. 당해연도 원본 데이터 (실시간 반영)
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" color="text.secondary">조회 연도</Typography>
            <FormControl size="small" sx={{ minWidth: 90 }}>
              <Select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                {yearOptions.map((y) => (
                  <MenuItem key={y} value={y}>{y}년</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        {statsQuery.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>데이터를 불러오지 못했습니다.</Alert>
        )}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
          {statField('질병 발생 (건)', currentStats?.illnessTotal ?? 0)}
          {statField('부상 사고 (건)', currentStats?.injuryTotal ?? 0)}
          {statField('인사사고 합계 (건)', currentStats?.incidentTotal ?? 0)}
          {statField(
            '재해율 (%)',
            currentStats ? currentStats.incidentRate.toFixed(2) : '0.00'
          )}
          {statField('관리 척수 (척)', currentStats?.vesselCount ?? 0)}
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
          ※ 해상 안전보건실적 월간 데이터를 자동 집계합니다.
          (질병건수 + 부상건수 = 인사사고 합계 / 재해율 = 인사사고 합계 ÷ 관리척수 × 100)
        </Typography>
      </Paper>

      {/* Section 2: 연도별 누적 통계 */}
      {/* [2026-08-03] 1번 섹션과 동일하게 Paper 박스로 감쌈 */}
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          2. 연도별 누적 통계 요약 (최종 보고용)
        </Typography>

        {statsQuery.isLoading ? (
          <Skeleton variant="rectangular" height={120} />
        ) : (
          <TableContainer
            // Paper 내부라 테마가 자체 테두리를 제거하므로 표 외곽선을 직접 지정
            sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>구분 (항목)</TableCell>
                  {stats.map((s) => (
                    <TableCell key={s.year} align="center">
                      {s.year === THIS_YEAR ? `${s.year}년(현재)` : `${s.year}년`}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  {
                    label: '관리척수',
                    getValue: (s: SeaYearlyStats) => `${s.vesselCount}척`,
                  },
                  {
                    label: '인사사고 건수',
                    getValue: (s: SeaYearlyStats) => `${s.incidentTotal}건`,
                  },
                  {
                    label: '재해율',
                    getValue: (s: SeaYearlyStats) => `${s.incidentRate.toFixed(2)}%`,
                  },
                ].map((row) => (
                  <TableRow hover key={row.label}>
                    <TableCell sx={{ fontWeight: 600 }}>{row.label}</TableCell>
                    {stats.map((s, i) => (
                      <TableCell
                        key={s.year}
                        align="center"
                        sx={{
                          color: i === stats.length - 1 ? 'primary.main' : 'text.primary',
                          fontWeight: i === stats.length - 1 ? 700 : 400,
                        }}
                      >
                        {row.getValue(s)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ sm: 'center' }}
          spacing={1}
          sx={{ mt: 2 }}
          flexWrap="wrap"
          useFlexGap
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            hidden
            onChange={handleFilePick}
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={importMut.isPending ? <CircularProgress size={16} /> : <UploadIcon />}
            disabled={importMut.isPending}
            onClick={() => fileInputRef.current?.click()}
            sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            엑셀 업로드
          </Button>
          <Typography variant="caption" color="text.secondary">
            ※ 엑셀 업로드 시 해상 안전보건실적이 갱신되며 통계가 자동 반영됩니다.
          </Typography>
        </Stack>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default SeaCrewStatsPage
