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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Tabs,
  Tab,
  FormControl,
  Select,
  MenuItem,
  Snackbar,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import DownloadIcon from '@mui/icons-material/Download'
import UploadIcon from '@mui/icons-material/Upload'
import EmailIcon from '@mui/icons-material/Email'
import EditNoteIcon from '@mui/icons-material/EditNote'
import SaveIcon from '@mui/icons-material/Save'

const HOSPITALS = ['우리원', '중앙', '하나로', '강북삼성']

interface HealthRecord {
  id: number
  checkupPeriod: string
  hospital: string
  department: string
  name: string
  age: number
  bpCategory: string
  bpMed: boolean
  bpValue: string
  dmCategory: string
  dmMed: boolean
  bst: number | null
  dlCategory: string
  dlMed: boolean
  tc: number | null
  tg: number | null
  ldl: number | null
  hdl: number | null
  followupOpinion: string
  workFitness: string
  note: string
}

const SAMPLE_DATA: HealthRecord[] = [
  { id: 1, checkupPeriod: '10-12월', hospital: '하나로', department: '총무팀', name: '김안전', age: 35, bpCategory: 'A', bpMed: false, bpValue: '120/80', dmCategory: 'A', dmMed: false, bst: 95, dlCategory: 'B', dlMed: false, tc: 195, tg: 120, ldl: 130, hdl: 55, followupOpinion: '필요없음', workFitness: '가', note: '꾸준한 운동중' },
  { id: 2, checkupPeriod: '10-12월', hospital: '중앙', department: '운항팀', name: '이보건', age: 42, bpCategory: 'C', bpMed: true, bpValue: '145/90', dmCategory: 'A', dmMed: false, bst: 88, dlCategory: 'C', dlMed: true, tc: 221, tg: 78, ldl: 133, hdl: 72, followupOpinion: '추적관리 필요', workFitness: '가', note: '' },
  { id: 3, checkupPeriod: '10-12월', hospital: '우리원', department: '안전팀', name: '박건강', age: 28, bpCategory: 'A', bpMed: false, bpValue: '115/75', dmCategory: 'A', dmMed: false, bst: 85, dlCategory: 'A', dlMed: false, tc: 170, tg: 60, ldl: 100, hdl: 65, followupOpinion: '필요없음', workFitness: '가', note: '' },
  { id: 4, checkupPeriod: '10-12월', hospital: '강북삼성', department: '기관팀', name: '최해양', age: 51, bpCategory: 'D', bpMed: true, bpValue: '155/95', dmCategory: 'C', dmMed: true, bst: 130, dlCategory: 'D', dlMed: true, tc: 240, tg: 200, ldl: 160, hdl: 38, followupOpinion: '전문의 상담 필요', workFitness: '나', note: '정밀검사 권고' },
  { id: 5, checkupPeriod: '10-12월', hospital: '하나로', department: '갑판팀', name: '정선박', age: 39, bpCategory: 'B', bpMed: false, bpValue: '130/85', dmCategory: 'B', dmMed: false, bst: 105, dlCategory: 'B', dlMed: false, tc: 205, tg: 140, ldl: 135, hdl: 48, followupOpinion: '경과관찰', workFitness: '가', note: '' },
]

const YEAR_STATS_ROWS = [
  { label: '고혈압%' },
  { label: 'HTN medi' },
  { label: 'BP' },
  { label: '이상지질' },
  { label: '총콜레스테롤' },
  { label: '총콜레스테롤%' },
  { label: 'HDL' },
  { label: 'LDL' },
  { label: 'DL medi' },
  { label: '혈당(BS)' },
  { label: 'DM medi' },
  { label: '간정밀' },
  { label: 'GOT/GPT' },
  { label: '사후관리소견' },
  { label: '업무적합' },
  { label: '비고' },
]

const categoryColor = (cat: string) => {
  if (cat === 'A') return 'success'
  if (cat === 'B') return 'warning'
  if (cat === 'C' || cat === 'D') return 'error'
  return 'default'
}

const AdminHealthPage: React.FC = () => {
  const [hospital, setHospital] = useState(0)
  const [filter, setFilter] = useState<'전체' | '추적관리' | '정상'>('전체')
  const [keyword, setKeyword] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null)
  const [compareOpen, setCompareOpen] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'info' })

  const notify = (message: string, severity: 'success' | 'info' = 'info') =>
    setSnackbar({ open: true, message, severity })

  const filtered = SAMPLE_DATA.filter(r => {
    const kw = keyword.toLowerCase()
    const matchKw = !kw || r.name.includes(kw) || r.department.includes(kw)
    const matchFilter =
      filter === '전체' ||
      (filter === '추적관리' && r.followupOpinion !== '필요없음') ||
      (filter === '정상' && r.followupOpinion === '필요없음')
    return matchKw && matchFilter
  })

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        보건파트 — 임직원 건강검진 사후관리
      </Typography>

      {/* PDF 업로드 */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', whiteSpace: 'nowrap' }}>
            ≡ 병원 PDF 결과지<br />자동 변환 업로드
          </Typography>
          <Tabs
            value={hospital}
            onChange={(_, v) => setHospital(v)}
            sx={{ minHeight: 36 }}
            TabIndicatorProps={{ sx: { height: 3 } }}
          >
            {HOSPITALS.map((h, i) => (
              <Tab key={h} label={h} value={i} sx={{ minHeight: 36, py: 0.5, px: 2, fontSize: '0.85rem' }} />
            ))}
          </Tabs>
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
            ← 업로드할 병원 양식을 선택하고 PDF를 끌어다 놓으세요. 하단 표에 수치가 자동 기입됩니다.
          </Typography>
          <Button variant="contained" startIcon={<UploadIcon />} onClick={() => notify('PDF 업로드 기능은 준비 중입니다.')}>
            파일 선택
          </Button>
        </Stack>
      </Paper>

      {/* 목록 */}
      <Paper variant="outlined">
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" sx={{ px: 2, pt: 1.5, pb: 1 }} spacing={1}>
          <Typography variant="body2" color="text.secondary">
            총 {filtered.length}건의 데이터 (필터 적용 {filter !== '전체' ? '후' : '전'})
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
                <MenuItem value="전체">전체 보기</MenuItem>
                <MenuItem value="추적관리">추적관리</MenuItem>
                <MenuItem value="정상">정상</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              placeholder="성명, 부서명 또는 사번 입력"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            <Button variant="contained" size="small" startIcon={<SearchIcon />}>검색</Button>
          </Stack>
        </Stack>

        <Alert severity="info" sx={{ mx: 2, mb: 1, py: 0 }}>
          행을 클릭하면 3개년 비교/조회 화면이 팝업으로 열립니다.
        </Alert>

        <TableContainer sx={{ maxHeight: 420 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell rowSpan={2} sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>No</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>검진시기</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>병원명</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>부서명</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>성명</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>연령</TableCell>
                <TableCell colSpan={2} align="center" sx={{ fontWeight: 700, bgcolor: 'blue.50', color: 'primary.main', borderBottom: '1px solid #ddd' }}>고혈압</TableCell>
                <TableCell colSpan={3} align="center" sx={{ fontWeight: 700, bgcolor: 'green.50', color: 'success.dark', borderBottom: '1px solid #ddd' }}>당뇨병</TableCell>
                <TableCell colSpan={6} align="center" sx={{ fontWeight: 700, bgcolor: 'orange.50', color: 'warning.dark', borderBottom: '1px solid #ddd' }}>이상지질혈증</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>사후관리소견</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>업무적합</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>비고</TableCell>
              </TableRow>
              <TableRow>
                {['건강구분', '약복용'].map(h => <TableCell key={h} sx={{ fontWeight: 600, fontSize: '0.75rem', bgcolor: 'grey.50' }}>{h}</TableCell>)}
                {['BP', '건강구분', '약복용'].map(h => <TableCell key={h} sx={{ fontWeight: 600, fontSize: '0.75rem', bgcolor: 'grey.50' }}>{h}</TableCell>)}
                {['건강구분', '약복용', 'T.C', 'TG', 'LDL', 'HDL'].map(h => <TableCell key={h} sx={{ fontWeight: 600, fontSize: '0.75rem', bgcolor: 'grey.50' }}>{h}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((r, idx) => (
                <TableRow
                  key={r.id}
                  hover
                  sx={{ bgcolor: r.workFitness === '나' ? 'error.50' : 'inherit', cursor: 'pointer' }}
                  onClick={() => { setSelectedRecord(r); setCompareOpen(true) }}
                >
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{r.checkupPeriod}</TableCell>
                  <TableCell>{r.hospital}</TableCell>
                  <TableCell>{r.department}</TableCell>
                  <TableCell sx={{ color: 'primary.main', fontWeight: 600 }}>
                    {r.name}
                  </TableCell>
                  <TableCell>{r.age}</TableCell>
                  <TableCell align="center">
                    <Chip size="small" label={r.bpCategory} color={categoryColor(r.bpCategory) as any} sx={{ fontWeight: 700, minWidth: 28 }} />
                  </TableCell>
                  <TableCell align="center">{r.bpMed ? '복용' : '-'}</TableCell>
                  <TableCell align="center">{r.bpValue}</TableCell>
                  <TableCell align="center">
                    <Chip size="small" label={r.dmCategory} color={categoryColor(r.dmCategory) as any} sx={{ fontWeight: 700, minWidth: 28 }} />
                  </TableCell>
                  <TableCell align="center">{r.dmMed ? '복용' : '-'}</TableCell>
                  <TableCell align="center">
                    <Chip size="small" label={r.dlCategory} color={categoryColor(r.dlCategory) as any} sx={{ fontWeight: 700, minWidth: 28 }} />
                  </TableCell>
                  <TableCell align="center">{r.dlMed ? '복용' : '-'}</TableCell>
                  <TableCell align="right" sx={{ color: r.tc && r.tc > 220 ? 'error.main' : 'text.primary' }}>{r.tc ?? '-'}</TableCell>
                  <TableCell align="right">{r.tg ?? '-'}</TableCell>
                  <TableCell align="right" sx={{ color: r.ldl && r.ldl > 150 ? 'error.main' : 'text.primary' }}>{r.ldl ?? '-'}</TableCell>
                  <TableCell align="right">{r.hdl ?? '-'}</TableCell>
                  <TableCell>
                    <Typography variant="caption" color={r.followupOpinion === '필요없음' ? 'success.main' : 'error.main'} sx={{ fontWeight: 600 }}>
                      {r.followupOpinion}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">{r.workFitness}</TableCell>
                  <TableCell>{r.note || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 하단 버튼 */}
        <Stack direction="row" justifyContent="space-between" sx={{ p: 2 }}>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => notify('엑셀 다운로드 기능은 준비 중입니다.')}>
              엑셀 다운로드
            </Button>
            <Button variant="outlined" color="success" startIcon={<EmailIcon />} onClick={() => notify('건강상담 메일 발송 기능은 준비 중입니다.')}>
              건강상담 메일발송
            </Button>
            <Button variant="outlined" startIcon={<EditNoteIcon />} onClick={() => notify('상담내역 작성 기능은 준비 중입니다.')}>
              상담내역 작성하기
            </Button>
          </Stack>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={() => notify('저장되었습니다.', 'success')}>
            DB 저장하기
          </Button>
        </Stack>
      </Paper>

      {/* 3개년 비교 팝업 — health_checkup_compare.html iframe */}
      <Dialog open={compareOpen} onClose={() => setCompareOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5 }}>
          임직원 건강검진 3개년 비교/조회 — {selectedRecord?.name}
          <IconButton size="small" onClick={() => setCompareOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, height: '75vh' }}>
          <iframe
            src="/health_checkup_compare.html"
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="건강검진 3개년 비교"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompareOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

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

export default AdminHealthPage
