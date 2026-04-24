import { useState } from 'react'
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
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import SaveIcon from '@mui/icons-material/Save'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'

const DEPARTMENTS = ['총무팀', '운항팀', '안전팀', '기관팀', '갑판팀']
const THIS_YEAR = new Date().getFullYear()

interface BudgetRow {
  id: number
  description: string
  budget: number
  actual: number
}

const INITIAL_ROWS: BudgetRow[] = [
  { id: 1, description: '방선자(화물감독 포함) 안전장구 구입비', budget: 7100000, actual: 4877629 },
  { id: 2, description: '직원휴게실 비품 등', budget: 72720000, actual: 44544933 },
  { id: 3, description: '공기청정기 구입/보수 등', budget: 12000000, actual: 15053163 },
  { id: 4, description: '건물화재 보험', budget: 1000000, actual: 855700 },
]

const fmt = (n: number) => n.toLocaleString('ko-KR')

const execRate = (budget: number, actual: number) => {
  if (!budget) return '-'
  const rate = (actual / budget) * 100
  return `${rate.toFixed(1)}%`
}

const execColor = (budget: number, actual: number) => {
  if (!budget) return 'text.primary'
  const rate = (actual / budget) * 100
  if (rate > 100) return 'error.main'
  if (rate >= 80) return 'success.main'
  return 'warning.main'
}

const LandBudgetPage: React.FC = () => {
  const [dept, setDept] = useState('총무팀')
  const [year, setYear] = useState(THIS_YEAR)
  const [rows, setRows] = useState<BudgetRow[]>(INITIAL_ROWS)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'info' })

  const updateActual = (id: number, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, actual: Number(value.replace(/,/g, '')) || 0 } : r))
  }

  const totalBudget = rows.reduce((s, r) => s + r.budget, 0)
  const totalActual = rows.reduce((s, r) => s + r.actual, 0)

  const handleExcel = () => {
    setSnackbar({ open: true, message: '엑셀 다운로드 기능은 준비 중입니다.', severity: 'info' })
  }

  const handleTempSave = () => {
    setSnackbar({ open: true, message: '임시 저장되었습니다.', severity: 'success' })
  }

  const handleSubmit = () => {
    setSnackbar({ open: true, message: '최종 제출되었습니다.', severity: 'success' })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        육상안전보건 예산 및 실적
      </Typography>

      {/* 조회 조건 */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          조회하실 부서(팀)를 선택하시면 해당 팀의 예산 항목만 나타납니다. 실적을 입력해 주세요.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>조회 부서 선택</InputLabel>
            <Select
              label="조회 부서 선택"
              value={dept}
              onChange={(e) => setDept(e.target.value)}
            >
              {DEPARTMENTS.map(d => (
                <MenuItem key={d} value={d}>{d}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" color="text.secondary">조회 연도 설정</Typography>
            <FormControl size="small" sx={{ minWidth: 90 }}>
              <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {[THIS_YEAR - 1, THIS_YEAR, THIS_YEAR + 1].map(y => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body2">년</Typography>
            <Button variant="contained" size="small">조회</Button>
          </Stack>
        </Stack>
      </Paper>

      {/* 테이블 */}
      <Paper variant="outlined">
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              육상 안전보건 예산 및 실적 - [{dept}]
            </Typography>
            <Typography variant="body2" color="text.secondary">(단위: 원)</Typography>
          </Stack>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700 }}>비용 상세 (예산 항목)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{year - 1}년 예산</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{year - 1}년 실적 입력</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>집행량</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.description}</TableCell>
                  <TableCell align="right">{fmt(row.budget)}</TableCell>
                  <TableCell align="right" sx={{ width: 180 }}>
                    <TextField
                      size="small"
                      value={row.actual.toLocaleString('ko-KR')}
                      onChange={(e) => updateActual(row.id, e.target.value)}
                      inputProps={{ style: { textAlign: 'right' } }}
                      sx={{ width: 160 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ color: execColor(row.budget, row.actual), fontWeight: 600 }}>
                      {execRate(row.budget, row.actual)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {/* 합계 */}
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700 }}>합계</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(totalBudget)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(totalActual)}</TableCell>
                <TableCell align="right">
                  <Typography variant="body2" sx={{ color: execColor(totalBudget, totalActual), fontWeight: 700 }}>
                    {execRate(totalBudget, totalActual)}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* 버튼 */}
        <Stack direction="row" justifyContent="space-between" sx={{ p: 2 }}>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExcel}>
            엑셀 다운로드
          </Button>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<SaveIcon />} onClick={handleTempSave}>
              임시 저장
            </Button>
            <Button variant="contained" startIcon={<CheckCircleOutlineIcon />} onClick={handleSubmit}>
              최종 제출하기
            </Button>
          </Stack>
        </Stack>
      </Paper>

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
  )
}

export default LandBudgetPage
