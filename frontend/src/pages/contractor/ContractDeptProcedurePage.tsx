import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  Grid,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
} from '@mui/material'
import FlagIcon from '@mui/icons-material/Flag'
import HandshakeIcon from '@mui/icons-material/Handshake'
import WorkIcon from '@mui/icons-material/Work'
import ReplayIcon from '@mui/icons-material/Replay'
import CloseIcon from '@mui/icons-material/Close'
import ArticleIcon from '@mui/icons-material/Article'

const PHASES: { icon: React.ReactNode; title: string; color: string; items: string[] }[] = [
  {
    icon: <FlagIcon />,
    title: '업체선정 후 도급계약 기획',
    color: '#1d4ed8',
    items: ['① 안전보건 평가 (계약담당팀 시행)', '② 위험성 평가 자료 요청'],
  },
  {
    icon: <HandshakeIcon />,
    title: '계약 체결',
    color: '#0891b2',
    items: ['① 안전보건 PORTAL 가입', '② 안전서약서 작성 요청 (업체 작성 후 제출)', '③ 안전수칙 제공'],
  },
  {
    icon: <WorkIcon />,
    title: '업무 진행',
    color: '#059669',
    items: ['① 안전보건 평가 (반기평가)', '② 협력업체 안전점검 (당사 사업장에서 업무 시)', '③ 도급협의체 운영 (당사 사업장에서 업무 시)'],
  },
  {
    icon: <ReplayIcon />,
    title: '업무 종료 / 재계약',
    color: '#b45309',
    items: ['① 재계약 시 평가 결과 등 반영하여 진행'],
  },
]

// ─── 흐름도 박스 + 연결선 컴포넌트 ───────────────────────────────
const BOX_BG = '#d6edf7'
const BOX_BORDER = '#8cbfdc'
const LINE = '#555'

type HConn = 'right' | 'left' | 'through' | null

interface FlowCellProps {
  text: string
  connectDown?: boolean   // 아래로 연결선
  hConn?: HConn           // 좌우 연결선 유형
  colSpan?: number
}

const FlowCell: React.FC<FlowCellProps> = ({ text, connectDown, hConn, colSpan }) => {
  const hasBox = !!text

  return (
    <TableCell
      colSpan={colSpan}
      sx={{
        border: '1px solid #ccc',
        p: '8px 6px',
        verticalAlign: 'middle',
        position: 'relative',
        height: 64,
      }}
    >
      {/* 가로 관통선 (빈 셀을 지나가는 연결선) */}
      {hConn === 'through' && !hasBox && (
        <Box sx={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, bgcolor: LINE, transform: 'translateY(-50%)' }} />
      )}

      {hasBox && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', position: 'relative' }}>
          {/* 왼쪽에서 오는 연결선 (박스 왼쪽까지) */}
          {hConn === 'left' && (
            <Box sx={{ position: 'absolute', top: '50%', left: -6, width: '50%', height: 2, bgcolor: LINE, transform: 'translateY(-50%)', zIndex: 0 }} />
          )}

          {/* 하늘색 박스 */}
          <Box sx={{
            backgroundColor: BOX_BG,
            border: `1px solid ${BOX_BORDER}`,
            borderRadius: '4px',
            px: 1.2, py: 0.6,
            fontSize: '0.75rem',
            textAlign: 'center',
            whiteSpace: 'pre-line',
            lineHeight: 1.4,
            zIndex: 1,
            minWidth: 72,
            width: 'fit-content',
          }}>
            {text}
          </Box>

          {/* 박스 오른쪽으로 나가는 연결선 */}
          {hConn === 'right' && (
            <Box sx={{ position: 'absolute', top: '50%', right: -6, width: '50%', height: 2, bgcolor: LINE, transform: 'translateY(-50%)', zIndex: 0 }} />
          )}

          {/* 아래로 내려가는 연결선 */}
          {connectDown && (
            <Box sx={{ width: 2, flex: 1, minHeight: 10, bgcolor: LINE, mt: 0.5 }} />
          )}
        </Box>
      )}
    </TableCell>
  )
}

// ─── 흐름도 데이터 ───────────────────────────────────────────────
// [text, connectDown, hConn]
type CellData = [string, boolean, HConn]

const PROC_ROWS: {
  stage?: string; stageSpan?: number
  main: CellData; safety: CellData; contractor: CellData
  note: string
  lastRow?: boolean  // 마지막 행: 3열 병합
}[] = [
  {
    stage: '사업설계\n단계', stageSpan: 3,
    main:       ['사업 설계',         false, null],
    safety:     ['사전 검토\n및 안내', false, null],
    contractor: ['',                  false, null],
    note: '• 유해위험요인 사전 확인\n• 안전보건 정보 사전 제공',
  },
  {
    main:       ['',                  false, null],
    safety:     ['',                  false, null],
    contractor: ['',                  false, null],
    note: '• 안전관련 사항 사전 검토\n  (도급업무 안전보건관련 사항)',
  },
  {
    main:       ['사업 품의\n및 시행', false, null],
    safety:     ['',                  false, null],
    contractor: ['',                  false, null],
    note: '• 업체 선정시 업체평가 시행',
  },
  {
    stage: '계약\n단계', stageSpan: 3,
    main:       ['계약서 작성',        true, null],
    safety:     ['',                  false, null],
    contractor: ['',                  false, null],
    note: '',
  },
  {
    main:       ['',                          false, null],
    safety:     ['안전보건\n조항 검토',        false, 'right'],
    contractor: ['현장실사\n(필요시)',         false, 'left'],
    note: '• 안전보건관련 계약 조항 검토\n• 현장 위험정보 제공(수급인)',
  },
  {
    main:       ['계약 체결',  false, null],
    safety:     ['',          false, null],
    contractor: ['',          false, null],
    note: '• 안전관련 사항 사전 검토',
  },
  {
    stage: '도급\n전단계', stageSpan: 4,
    main:       ['안전관리계획서\n접수', true, 'right'],
    safety:     ['',                   false, 'through'],
    contractor: ['안전관리계획서\n제출', false, 'left'],
    note: '',
  },
  {
    main:       ['안전관리계획서\n검토', true,  null],
    safety:     ['',                   false, null],
    contractor: ['',                   false, null],
    note: '',
  },
  {
    main:       ['안전관리계획서\n승인', true,  null],
    safety:     ['',                   false, null],
    contractor: ['',                   false, null],
    note: '',
  },
  {
    main:       ['도급·용역·위탁 전 회의', false, null],
    safety:     ['', false, null],
    contractor: ['', false, null],
    note: '',
    lastRow: true,
  },
]

const HDR = { backgroundColor: '#1a2e4a', color: 'white', fontWeight: 700, fontSize: '0.8rem',
  border: '1px solid #ccc', textAlign: 'center' as const, p: '8px 6px', verticalAlign: 'middle' as const }

const ContractDeptProcedurePage: React.FC = () => {
  const [procOpen, setProcOpen] = useState(false)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>협력업체 안전보건평가</Typography>

      <Alert severity="info">
        협력업체 선정부터 계약·업무 진행·재계약까지 4단계 안전보건 절차입니다.
      </Alert>

      <Grid container spacing={2}>
        {PHASES.map((p, idx) => (
          <Grid item xs={12} sm={6} md={3} key={p.title}>
            <Paper variant="outlined" sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5, borderTop: '4px solid', borderTopColor: p.color }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: p.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.icon}
                </Box>
                <Chip size="small" label={`STEP ${idx + 1}`} sx={{ fontWeight: 700 }} />
              </Stack>
              <Typography variant="subtitle1" fontWeight={700}>{p.title}</Typography>
              <Stack component="ul" spacing={1} sx={{ pl: 2, m: 0 }}>
                {p.items.map((it) => (
                  <Typography key={it} component="li" variant="body2" sx={{ lineHeight: 1.6 }}>{it}</Typography>
                ))}
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Stack direction="row" sx={{ mt: 1 }}>
        <Button variant="outlined" startIcon={<ArticleIcon />} onClick={() => setProcOpen(true)}>
          안전보건 절차
        </Button>
      </Stack>

      {/* 안전보건 절차 팝업 */}
      <Dialog open={procOpen} onClose={() => setProcOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700 }}>
          협력업체 안전보건 절차
          <IconButton size="small" onClick={() => setProcOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <TableContainer>
            <Table size="small" sx={{ tableLayout: 'fixed', borderCollapse: 'collapse' }}>
              <TableHead>
                <TableRow>
                  <TableCell rowSpan={2} sx={{ ...HDR, width: 72 }}>구분<br />(단계)</TableCell>
                  <TableCell colSpan={2} sx={{ ...HDR }}>PANOCEAN (도급인)</TableCell>
                  <TableCell rowSpan={2} sx={{ ...HDR, width: 100 }}>협력사<br />(수급인)</TableCell>
                  <TableCell rowSpan={2} sx={{ ...HDR }}>비고</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ ...HDR, width: 110 }}>도급주관부서</TableCell>
                  <TableCell sx={{ ...HDR, width: 110 }}>안전부서</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {PROC_ROWS.map((row, idx) => (
                  <TableRow key={idx}>
                    {row.stage !== undefined && (
                      <TableCell rowSpan={row.stageSpan} sx={{
                        border: '1px solid #ccc', fontWeight: 700, fontSize: '0.78rem',
                        textAlign: 'center', whiteSpace: 'pre-line', verticalAlign: 'middle',
                        backgroundColor: '#f0f4ff', width: 72,
                      }}>
                        {row.stage}
                      </TableCell>
                    )}

                    {row.lastRow ? (
                      /* 마지막 행: 3열 병합 */
                      <FlowCell text={row.main[0]} colSpan={3} />
                    ) : (
                      <>
                        <FlowCell text={row.main[0]} connectDown={row.main[1]} hConn={row.main[2]} />
                        <FlowCell text={row.safety[0]} connectDown={row.safety[1]} hConn={row.safety[2]} />
                        <FlowCell text={row.contractor[0]} connectDown={row.contractor[1]} hConn={row.contractor[2]} />
                      </>
                    )}

                    <TableCell sx={{ border: '1px solid #ccc', fontSize: '0.75rem', whiteSpace: 'pre-line', verticalAlign: 'middle', p: '6px 8px', color: '#333' }}>
                      {row.note}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default ContractDeptProcedurePage
