// [2026-08-04] PPT 슬라이드 3 "첫 화면" — 수급업체 안전보건평가 현황 홈 대시보드
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import AnchorIcon from '@mui/icons-material/Anchor'
import PlaceIcon from '@mui/icons-material/Place'
import DescriptionIcon from '@mui/icons-material/Description'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'

// ─── 표시 데이터 ────────────────────────────────────────────────────────────
// PPT 기준 화면 구성. 집계 API 연동 전까지 화면 확인용 상수로 유지한다.
const PERIOD_TITLE = '2025 상반기 수급업체 안전보건평가 현황'
const BASE_DATE = '2025-08-04'

const COMPLETION_RATE = 55
const PREV_AVG_SCORE = 87.2
const CURR_AVG_SCORE = 84.5

const VISIT_TARGET_COUNT = 4
const MISSING_DOC_COUNT = 15

type FocusStatus = '자료 미흡' | '평가 지연' | '조치 미흡'

const FOCUS_ROWS: {
  team: string
  type: string
  company: string
  reason: string
  status: FocusStatus
}[] = [
  { team: '운항물류팀', type: '터미널', company: '부산항',   reason: '안전보건방침 미제출',        status: '자료 미흡' },
  { team: '운항물류팀', type: '터미널', company: '한국허치슨', reason: '산재율 확인서 미제출',        status: '자료 미흡' },
  { team: '해사환경팀', type: '수리',   company: '마린테크',  reason: '위험성평가 지연 (3주)',       status: '평가 지연' },
  { team: '운항지원팀', type: '선식',   company: '대동선식',  reason: '법령위반(1건) / 개선조치 미보고', status: '조치 미흡' },
]

const TEAM_PROGRESS: { team: string; done: number; total: number }[] = [
  { team: '운항지원팀',      done: 3,  total: 10 },
  { team: '해사관리/환경팀', done: 15, total: 22 },
  { team: '운항물류팀',      done: 8,  total: 12 },
]

// severity 는 색상 단독이 아니라 좌측 점 + 문구로 함께 전달한다.
type OpSeverity = 'alert' | 'ok' | 'none'
const TODAY_OPERATIONS: { text: string; severity: OpSeverity }[] = [
  { text: '[팬오션 1호] (마린테크) 엔진 수리 — ▲ 평가 미흡 업체 투입 (특별점검)', severity: 'alert' },
  { text: '[부산항] (한국허치슨) 컨테이너 하역 — ▲ 안전방침 미제출 상태 투입',      severity: 'alert' },
  { text: '[팬오션 2호] (대동선식) 부식 선적 — 승인 완료 (13:00 투입 예정)',        severity: 'ok' },
  { text: '[인천항] 터미널 보수 — 대동엔지니어링 외 4명 투입 완료',                 severity: 'none' },
]

// ─── 공용 조각 ──────────────────────────────────────────────────────────────
const SectionLabel: React.FC<{ eyebrow: string; title: string; desc?: string }> = ({
  eyebrow,
  title,
  desc,
}) => (
  <Box sx={{ mt: 1 }}>
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
      <Box sx={{ width: 24, height: 2, bgcolor: 'primary.main', borderRadius: 1 }} />
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, letterSpacing: '0.08em', color: 'primary.main' }}
      >
        {eyebrow}
      </Typography>
    </Stack>
    <Typography variant="h6" sx={{ fontWeight: 700 }}>
      {title}
    </Typography>
    {desc && (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {desc}
      </Typography>
    )}
  </Box>
)

/** 배경에 옅게 깔리는 장식 아이콘 */
const WatermarkIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    sx={{
      position: 'absolute',
      right: 16,
      bottom: 8,
      opacity: 0.08,
      fontSize: 88,
      lineHeight: 1,
      pointerEvents: 'none',
      '& svg': { fontSize: 88 },
    }}
  >
    {children}
  </Box>
)

const statusChipColor = (s: FocusStatus): 'error' | 'warning' =>
  s === '자료 미흡' ? 'error' : 'warning'

const HomePage: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* ─── 헤더 ─── */}
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {PERIOD_TITLE}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          전 선종·터미널 수급업체를 대상으로 반기 안전보건평가를 시행하며, 증빙자료 수신 및 검토 완료 기준으로 집계합니다.
        </Typography>
      </Box>

      {/* ─── KPI 3종 ─── */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch">
        {/* 평가 완료율 — 단일 색상 진척도 meter */}
        <Paper variant="outlined" sx={{ p: 2.5, flex: 2, position: 'relative', overflow: 'hidden' }}>
          <Stack direction="row" alignItems="baseline" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              평가 완료율 (수신 완료 / 전체 대상)
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {COMPLETION_RATE}%
            </Typography>
          </Stack>

          <Box
            sx={{
              mt: 1.5,
              height: 10,
              borderRadius: 5,
              bgcolor: 'action.hover',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                width: `${COMPLETION_RATE}%`,
                height: '100%',
                borderRadius: 5,
                bgcolor: 'primary.main',
              }}
            />
          </Box>

          <Stack direction="row" spacing={2} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
            <Typography variant="caption" color="text.secondary">
              전회차 평균 <strong>{PREV_AVG_SCORE}점</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              25년 상반기 현재 <strong>{CURR_AVG_SCORE}점</strong>{' '}
              <Box component="span" sx={{ color: 'error.main', fontWeight: 700 }}>
                ▼ {(PREV_AVG_SCORE - CURR_AVG_SCORE).toFixed(1)}
              </Box>
            </Typography>
          </Stack>

          <WatermarkIcon><AnchorIcon /></WatermarkIcon>
        </Paper>

        {/* 현장 방문 점검 대상 */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            textAlign: 'center',
            bgcolor: (th) => (th.palette.mode === 'dark' ? 'rgba(239,68,68,0.08)' : '#fef5f5'),
          }}
        >
          <Typography variant="body2" color="text.secondary">
            현장 방문 점검 대상
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main', my: 0.5 }}>
            {VISIT_TARGET_COUNT}
            <Box component="span" sx={{ fontSize: '0.5em', ml: 0.5 }}>개사</Box>
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            협조 지연 업체
            <br />
            특별점검 대상
          </Typography>
          <WatermarkIcon><PlaceIcon /></WatermarkIcon>
        </Paper>

        {/* 평가/증빙자료 미수신 */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            textAlign: 'center',
            bgcolor: (th) => (th.palette.mode === 'dark' ? 'rgba(249,115,22,0.08)' : '#fffaf0'),
          }}
        >
          <Typography variant="body2" color="text.secondary">
            평가/증빙자료 미수신
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main', my: 0.5 }}>
            {MISSING_DOC_COUNT}
            <Box component="span" sx={{ fontSize: '0.5em', ml: 0.5 }}>건</Box>
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            제출 기한 경과
            <br />
            독촉 필요
          </Typography>
          <WatermarkIcon><DescriptionIcon /></WatermarkIcon>
        </Paper>
      </Stack>

      {/* ─── 집중 관리 대상 ─── */}
      <SectionLabel
        eyebrow="FOCUS MANAGEMENT"
        title="집중 관리 대상 수급업체 (현장 방문 및 독촉 필요)"
        desc="안전보건평가 증빙자료 상습 누락, 법령위반, 평가점수 미달 등 협조가 지연되는 업체입니다."
      />

      <Box>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1 }}
          flexWrap="wrap"
          useFlexGap
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            관리 대상 <Box component="span" sx={{ color: 'error.main' }}>{FOCUS_ROWS.length}개사</Box>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            엑셀 데이터 연동 · 기준일 {BASE_DATE}
          </Typography>
        </Stack>

        <TableContainer component={Paper}>
          {/* 이 표는 PPT 원안대로 좌측 정렬 헤더를 쓴다 (테마 기본은 중앙정렬) */}
          <Table
            size="small"
            sx={{
              minWidth: 900,
              '& .MuiTableCell-head': { textAlign: 'left', textTransform: 'none', letterSpacing: 0 },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 120 }}>담당 팀</TableCell>
                <TableCell sx={{ width: 90 }}>구분</TableCell>
                <TableCell sx={{ width: 140 }}>수급업체명</TableCell>
                <TableCell>주요 미흡/미협조 사유</TableCell>
                <TableCell sx={{ width: 110 }}>현재 상태</TableCell>
                <TableCell sx={{ width: 180 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {FOCUS_ROWS.map((r) => (
                <TableRow key={`${r.team}-${r.company}`} hover>
                  <TableCell>{r.team}</TableCell>
                  <TableCell>{r.type}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{r.company}</TableCell>
                  <TableCell sx={{ color: 'error.main' }}>{r.reason}</TableCell>
                  <TableCell>
                    <Chip size="small" variant="outlined" label={r.status} color={statusChipColor(r.status)} />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<EventAvailableIcon />}
                      sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                      현장방문 일정등록
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* ─── 일일 운영 현황 ─── */}
      <SectionLabel eyebrow="DAILY OPERATION" title="팀별 진척도 및 금일 투입 현황" />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch">
        {/* 팀별 진척도 — 단일 색상 magnitude meter */}
        <Paper variant="outlined" sx={{ p: 2.5, flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
            팀별 수급업체 평가 진척도 (수신율)
          </Typography>

          <Stack spacing={1.5}>
            {TEAM_PROGRESS.map((p) => (
              <Stack key={p.team} direction="row" alignItems="center" spacing={1.5}>
                <Typography
                  variant="body2"
                  sx={{ width: 108, flexShrink: 0, textAlign: 'right', whiteSpace: 'nowrap' }}
                >
                  {p.team}
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    height: 22,
                    borderRadius: 0.5,
                    bgcolor: 'action.hover',
                    overflow: 'hidden',
                    minWidth: 0,
                  }}
                >
                  <Box
                    sx={{
                      width: `${(p.done / p.total) * 100}%`,
                      minWidth: 32,
                      height: '100%',
                      borderRadius: 0.5,
                      bgcolor: 'primary.main',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      pl: 1,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    {p.done}
                  </Box>
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ width: 52, flexShrink: 0, whiteSpace: 'nowrap' }}
                >
                  {p.total}개사
                </Typography>
              </Stack>
            ))}
          </Stack>

          {/* 계열이 2개(전체 대상 / 수신 완료)이므로 범례를 둔다 */}
          <Stack
            direction="row"
            spacing={2}
            justifyContent="flex-end"
            alignItems="center"
            sx={{ mt: 2, pt: 1.5, borderTop: 1, borderColor: 'divider' }}
          >
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: 'action.hover' }} />
              <Typography variant="caption" color="text.secondary">전체 대상</Typography>
            </Stack>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: 'primary.main' }} />
              <Typography variant="caption" color="text.secondary">수신/검토 완료</Typography>
            </Stack>
          </Stack>
        </Paper>

        {/* 금일 투입 현황 */}
        <Paper variant="outlined" sx={{ p: 2.5, flex: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              금일 선박 방선 및 하역 투입 현황
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {BASE_DATE.slice(5)} 기준
            </Typography>
          </Stack>

          <Stack spacing={1}>
            {TODAY_OPERATIONS.map((op) => (
              <Stack
                key={op.text}
                direction="row"
                alignItems="flex-start"
                spacing={1}
                sx={{
                  p: 1.25,
                  borderRadius: 1,
                  bgcolor: (th) => {
                    if (op.severity === 'alert')
                      return th.palette.mode === 'dark' ? 'rgba(239,68,68,0.10)' : '#fef5f5'
                    if (op.severity === 'ok')
                      return th.palette.mode === 'dark' ? 'rgba(34,197,94,0.10)' : '#f2fbf5'
                    return 'action.hover'
                  },
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    mt: 0.6,
                    flexShrink: 0,
                    bgcolor:
                      op.severity === 'alert'
                        ? 'error.main'
                        : op.severity === 'ok'
                          ? 'success.main'
                          : 'text.disabled',
                  }}
                />
                <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'keep-all' }}>
                  {op.text}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  )
}

export default HomePage
