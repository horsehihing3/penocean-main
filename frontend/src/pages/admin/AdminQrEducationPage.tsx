// [2026-04-27] 관리자 QR 안전교육 이수 관리 페이지
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '../../api/axiosInstance'
import { QRCodeSVG } from 'qrcode.react'
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Tooltip, Alert, Collapse, Stack,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import ListAltIcon from '@mui/icons-material/ListAlt'
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'

interface QrItem {
  id: number
  token: string
  title: string
  isActive: boolean
  createdBy: string
  createdAt: string
  expiresAt: string | null
  recordCount: number
}

interface QrRecord {
  id: number
  workerName: string
  vesselName: string
  workDate: string
  phone: string
  completedAt: string
}

// [2026-04-27] VITE_APP_URL 설정 시 ngrok/외부 URL 사용, 없으면 현재 origin
const APP_ORIGIN = import.meta.env.VITE_APP_URL ?? window.location.origin
// [2026-04-27] ngrok 인터스티셜 우회: 루트(/?qr=TOKEN) → index.html 스크립트 → /qr/TOKEN 리다이렉트
const qrUrl = (token: string) => `${APP_ORIGIN}/?qr=${token}`

export default function AdminQrEducationPage() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [qrDialogToken, setQrDialogToken] = useState<string | null>(null)
  const [expandedRecords, setExpandedRecords] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  const [form, setForm] = useState({ title: '', content: '', expiresAt: '' })

  const { data: list = [], isLoading } = useQuery<QrItem[]>({
    queryKey: ['safety-qr'],
    queryFn: () => axiosInstance.get('/admin/safety-qr').then(r => r.data.data),
  })

  const { data: records = [] } = useQuery<QrRecord[]>({
    queryKey: ['safety-qr-records', expandedRecords],
    queryFn: () => axiosInstance.get(`/admin/safety-qr/${expandedRecords}/records`).then(r => r.data.data),
    enabled: !!expandedRecords,
  })

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) =>
      axiosInstance.post('/admin/safety-qr', {
        ...payload,
        expiresAt: payload.expiresAt ? payload.expiresAt + 'T23:59:59' : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-qr'] })
      setCreateOpen(false)
      setForm({ title: '', content: '', expiresAt: '' })
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => axiosInstance.post(`/admin/safety-qr/${id}/deactivate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['safety-qr'] }),
  })

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(qrUrl(token))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight={700}>QR 안전교육 이수 관리</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          QR 생성
        </Button>
      </Box>

      {copied && <Alert severity="success" sx={{ py: 0.5 }}>URL이 클립보드에 복사되었습니다.</Alert>}

      <TableContainer component={Paper} elevation={1}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>제목</TableCell>
              <TableCell>상태</TableCell>
              <TableCell align="center">이수 건수</TableCell>
              <TableCell>생성일</TableCell>
              <TableCell>만료일</TableCell>
              <TableCell align="center">작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={6} align="center">로딩 중...</TableCell></TableRow>
            )}
            {!isLoading && list.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center" sx={{ color: 'text.secondary' }}>생성된 QR코드가 없습니다.</TableCell></TableRow>
            )}
            {list.map(item => (
              <>
                <TableRow key={item.id} hover>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>
                    <Chip label={item.isActive ? '활성' : '비활성'} color={item.isActive ? 'success' : 'default'} size="small" />
                  </TableCell>
                  <TableCell align="center">{item.recordCount}건</TableCell>
                  <TableCell>{item.createdAt?.slice(0, 10)}</TableCell>
                  <TableCell>{item.expiresAt ? item.expiresAt.slice(0, 10) : '무기한'}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="QR코드 보기">
                        <IconButton size="small" onClick={() => setQrDialogToken(item.token)}>
                          <QrCode2Icon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="URL 복사">
                        <IconButton size="small" onClick={() => handleCopy(item.token)}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="이수 기록 보기">
                        <IconButton size="small" onClick={() => setExpandedRecords(expandedRecords === item.id ? null : item.id)}>
                          {expandedRecords === item.id ? <ExpandLessIcon fontSize="small" /> : <ListAltIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      {item.isActive && (
                        <Tooltip title="비활성화">
                          <IconButton size="small" color="error" onClick={() => deactivateMutation.mutate(item.id)}>
                            <PowerSettingsNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
                {/* 이수 기록 펼치기 */}
                {expandedRecords === item.id && (
                  <TableRow key={`records-${item.id}`}>
                    <TableCell colSpan={6} sx={{ p: 0 }}>
                      <Collapse in={true}>
                        <Box sx={{ bgcolor: '#f9fafb', px: 3, py: 2 }}>
                          <Typography variant="subtitle2" gutterBottom fontWeight={600}>이수 기록 ({records.length}건)</Typography>
                          {records.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">이수 기록이 없습니다.</Typography>
                          ) : (
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>성함</TableCell>
                                  <TableCell>선박명</TableCell>
                                  <TableCell>작업일자</TableCell>
                                  <TableCell>전화번호</TableCell>
                                  <TableCell>이수일시</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {records.map(r => (
                                  <TableRow key={r.id}>
                                    <TableCell>{r.workerName}</TableCell>
                                    <TableCell>{r.vesselName}</TableCell>
                                    <TableCell>{r.workDate}</TableCell>
                                    <TableCell>{r.phone || '-'}</TableCell>
                                    <TableCell>{r.completedAt?.slice(0, 16).replace('T', ' ')}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* QR 생성 다이얼로그 */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>QR 안전교육 생성</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="제목 *" fullWidth value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <TextField label="안전교육 내용" fullWidth multiline rows={6} value={form.content}
            onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
            placeholder="작업자에게 보여줄 안전교육 내용을 입력하세요." />
          <TextField label="만료일 (선택)" type="date" fullWidth value={form.expiresAt}
            onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
            InputLabelProps={{ shrink: true }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>취소</Button>
          <Button variant="contained" disabled={!form.title || createMutation.isPending}
            onClick={() => createMutation.mutate(form)}>
            생성
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR코드 다이얼로그 */}
      <Dialog open={!!qrDialogToken} onClose={() => setQrDialogToken(null)}>
        <DialogTitle>QR코드</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 3 }}>
          {qrDialogToken && (
            <>
              <QRCodeSVG value={qrUrl(qrDialogToken)} size={220} />
              <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all', textAlign: 'center' }}>
                {qrUrl(qrDialogToken)}
              </Typography>
              <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={() => handleCopy(qrDialogToken)}>
                URL 복사
              </Button>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialogToken(null)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
