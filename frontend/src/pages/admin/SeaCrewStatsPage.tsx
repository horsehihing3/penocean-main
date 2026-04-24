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
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Divider,
} from '@mui/material'
import UploadIcon from '@mui/icons-material/Upload'
import DownloadIcon from '@mui/icons-material/Download'
import SaveIcon from '@mui/icons-material/Save'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'

const THIS_YEAR = new Date().getFullYear()

// 연도별 누적 통계 (PPT 29 기준)
const YEARLY_STATS = [
  { year: '2022년', vessels: 103, accidents: 16, rate: 0.66 },
  { year: '2023년', vessels: 103, accidents: 9,  rate: 0.40 },
  { year: '2024년', vessels: 109, accidents: 10, rate: 0.42 },
  { year: `${THIS_YEAR - 1}년(현재)`, vessels: 113, accidents: 18, rate: 0.71 },
]

const SeaCrewStatsPage: React.FC = () => {
  const [year, setYear] = useState(THIS_YEAR)
  const [disease, setDisease] = useState(5)
  const [injury, setInjury] = useState(1)
  const [vessels, setVessels] = useState(114)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'info' })

  // 재해율 자동 계산: (질병+부상) / 관리척수 * 100 / 100 (간략 공식)
  const rate = vessels > 0 ? ((disease + injury) / vessels * 100 * 0.01).toFixed(2) : '0.00'

  const handleExcelUpload = () => {
    setSnackbar({ open: true, message: '엑셀 업로드 기능은 준비 중입니다.', severity: 'info' })
  }

  const handleExcelDownload = () => {
    setSnackbar({ open: true, message: '엑셀 다운로드 기능은 준비 중입니다.', severity: 'info' })
  }

  const handleTempSave = () => {
    setSnackbar({ open: true, message: '임시 저장되었습니다.', severity: 'success' })
  }

  const handleConfirmSave = () => {
    setSnackbar({ open: true, message: '데이터 확정 저장되었습니다.', severity: 'success' })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        해상직원 질병/부상 누적건수 및 재해율
      </Typography>

      {/* Section 1: 당해연도 원본 데이터 입력 */}
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            1. 당해연도 원본 데이터 입력 (실시간 반영)
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" color="text.secondary">조회 연도 설정</Typography>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {[THIS_YEAR - 2, THIS_YEAR - 1, THIS_YEAR].map(y => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body2">년</Typography>
            <Button variant="contained" size="small">조회</Button>
          </Stack>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <Box>
            <Typography variant="caption" color="text.secondary">질병 발생 (건)</Typography>
            <TextField
              size="small"
              type="number"
              value={disease}
              onChange={(e) => setDisease(Number(e.target.value) || 0)}
              inputProps={{ min: 0, style: { textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' } }}
              sx={{ mt: 0.5, width: 110 }}
            />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">부상 사고 (건)</Typography>
            <TextField
              size="small"
              type="number"
              value={injury}
              onChange={(e) => setInjury(Number(e.target.value) || 0)}
              inputProps={{ min: 0, style: { textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' } }}
              sx={{ mt: 0.5, width: 110 }}
            />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">재해율 (%)</Typography>
            <TextField
              size="small"
              value={rate}
              InputProps={{ readOnly: true }}
              inputProps={{ style: { textAlign: 'center', fontWeight: 700, fontSize: '1.1rem', color: '#1976d2' } }}
              sx={{ mt: 0.5, width: 110, '& .MuiInputBase-input': { bgcolor: 'grey.50' } }}
            />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">관리 척수 (척)</Typography>
            <TextField
              size="small"
              type="number"
              value={vessels}
              onChange={(e) => setVessels(Number(e.target.value) || 0)}
              inputProps={{ min: 0, style: { textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' } }}
              sx={{ mt: 0.5, width: 110 }}
            />
          </Box>
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
          ≡ 시스템 안내: '질병'과 '부상사고' 건수는 하단 테이블의 [인사사고 건수] 항목으로 자동 합산({disease}건+{injury}건={disease + injury}건)되어 기록됩니다.
        </Typography>

        <Box sx={{ mt: 1.5 }}>
          <Typography
            variant="body2"
            color="primary"
            sx={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
          >
            ▼ 데이터 자동 집계 및 연도별 포맷 변환
          </Typography>
        </Box>
      </Paper>

      {/* Section 2: 연도별 누적 통계 */}
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          2. 연도별 누적 통계 요약 (최종 보고용)
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700 }}>구분 (항목)</TableCell>
                {YEARLY_STATS.map(y => (
                  <TableCell key={y.year} align="center" sx={{ fontWeight: 700 }}>{y.year}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow hover>
                <TableCell sx={{ fontWeight: 600 }}>관리척수</TableCell>
                {YEARLY_STATS.map((y, i) => (
                  <TableCell key={y.year} align="center"
                    sx={{ color: i === YEARLY_STATS.length - 1 ? 'primary.main' : 'text.primary', fontWeight: i === YEARLY_STATS.length - 1 ? 700 : 400 }}>
                    {y.vessels}척
                  </TableCell>
                ))}
              </TableRow>
              <TableRow hover>
                <TableCell sx={{ fontWeight: 600 }}>인사사고 건수</TableCell>
                {YEARLY_STATS.map((y, i) => (
                  <TableCell key={y.year} align="center"
                    sx={{ color: i === YEARLY_STATS.length - 1 ? 'primary.main' : 'text.primary', fontWeight: i === YEARLY_STATS.length - 1 ? 700 : 400 }}>
                    {y.accidents}건
                  </TableCell>
                ))}
              </TableRow>
              <TableRow hover>
                <TableCell sx={{ fontWeight: 600 }}>재해율</TableCell>
                {YEARLY_STATS.map((y, i) => (
                  <TableCell key={y.year} align="center"
                    sx={{ color: i === YEARLY_STATS.length - 1 ? 'primary.main' : 'text.primary', fontWeight: i === YEARLY_STATS.length - 1 ? 700 : 400 }}>
                    {y.rate.toFixed(2)}%
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ my: 2 }} />

        {/* 버튼 */}
        <Stack direction="row" justifyContent="space-between">
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<UploadIcon />} onClick={handleExcelUpload}>
              엑셀 업로드
            </Button>
            <Button variant="outlined" color="success" startIcon={<DownloadIcon />} onClick={handleExcelDownload}>
              엑셀 다운로드
            </Button>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<SaveIcon />} onClick={handleTempSave}>
              임시 저장
            </Button>
            <Button variant="contained" startIcon={<CheckCircleOutlineIcon />} onClick={handleConfirmSave}>
              데이터 확정 저장
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

export default SeaCrewStatsPage
