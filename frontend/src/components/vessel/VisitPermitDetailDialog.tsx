// [2026-04-30] 방문허가서 상세 팝업 — AccessRequestDetailPage에서 공유 사용
import { useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Stack, Typography, Chip, CircularProgress,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Paper, Checkbox, IconButton, TextField, Snackbar, Alert,
  useMediaQuery, useTheme,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import QrCodeIcon from '@mui/icons-material/QrCode2'
import BlockIcon from '@mui/icons-material/Block'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import axios from 'axios'
import { visitPermitApi } from '../../api/visitPermitApi'
import { accessRequestApi } from '../../api/accessRequestApi'
import { useAuth } from '../../context/AuthContext'
import { getVisitPermitStatusColor } from '../../utils/status'

interface Props {
  open: boolean
  accessRequestId: number
  onClose: () => void
}

const VisitPermitDetailDialog: React.FC<Props> = ({ open, accessRequestId, onClose }) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { user } = useAuth()
  const qc = useQueryClient()

  const [revokeOpen, setRevokeOpen] = useState(false)
  const [revokeReason, setRevokeReason] = useState('')
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  })
  const [pendingCheckIds, setPendingCheckIds] = useState<Set<number>>(new Set())

  const permitQuery = useQuery({
    queryKey: ['visit-permits', 'by-access-request', accessRequestId],
    queryFn: () => visitPermitApi.byAccessRequest(accessRequestId),
    enabled: open && !!accessRequestId,
    retry: false,
  })

  const accessReqQuery = useQuery({
    queryKey: ['access-requests', 'detail-for-permit', accessRequestId],
    queryFn: () => accessRequestApi.detail(accessRequestId),
    enabled: open && !!accessRequestId,
  })

  const canCheckByShip = user?.role === 'ADMIN' || user?.role === 'CONTRACT_DEPT'
  const canRevoke = user?.role === 'ADMIN'

  const checkMut = useMutation({
    mutationFn: ({ workerId, checked }: { workerId: number; checked: boolean }) =>
      accessRequestApi.setWorkerCheckByShip(workerId, checked),
    onMutate: async ({ workerId, checked }) => {
      const key = ['access-requests', 'detail-for-permit', accessRequestId] as const
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<typeof accessReqQuery.data>(key)
      qc.setQueryData<typeof accessReqQuery.data>(key, (old) => {
        if (!old) return old
        return {
          ...old,
          workers: (old.workers ?? []).map((w) =>
            w.id === workerId ? { ...w, checkByShip: checked } : w
          ),
        }
      })
      setPendingCheckIds((s) => { const n = new Set(s); n.add(workerId); return n })
      return { previous, key }
    },
    onError: (err, _vars, context) => {
      if (context?.previous) qc.setQueryData(context.key, context.previous)
      setSnackbar({ open: true, message: err instanceof Error ? err.message : String(err), severity: 'error' })
    },
    onSettled: (_d, _e, vars) => {
      setPendingCheckIds((s) => { const n = new Set(s); n.delete(vars.workerId); return n })
    },
  })

  const revokeMut = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      visitPermitApi.revoke(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visit-permits', 'by-access-request', accessRequestId] })
      setSnackbar({ open: true, message: t('common.confirm'), severity: 'success' })
      setRevokeOpen(false)
      setRevokeReason('')
    },
    onError: (err) => {
      let m = t('approval.actionFailed')
      if (axios.isAxiosError(err)) {
        const msg = (err.response?.data as { message?: string } | undefined)?.message
        if (msg) m = msg
      }
      setSnackbar({ open: true, message: m, severity: 'error' })
    },
  })

  const handleClose = () => {
    setRevokeOpen(false)
    setRevokeReason('')
    onClose()
  }

  const formatDate = (iso: string) => { try { return format(parseISO(iso), 'yyyy-MM-dd') } catch { return iso } }
  const formatDateTime = (iso: string) => { try { return format(parseISO(iso), 'yyyy-MM-dd HH:mm') } catch { return iso } }

  const detail = permitQuery.data

  const permitStatusLabel = () => {
    if (!detail) return ''
    if (detail.revoked) return t('visitPermit.revoked')
    try { if (new Date(detail.validTo).getTime() < Date.now()) return t('visitPermit.expired') } catch { /* */ }
    return t('visitPermit.valid')
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {t('visitPermit.pageTitle')}
          <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {(permitQuery.isLoading || accessReqQuery.isLoading) && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={32} />
            </Box>
          )}
          {permitQuery.isError && (
            <Alert severity="warning">발급된 방문허가서가 없습니다.</Alert>
          )}
          {detail && (
            <Stack spacing={2}>
              {/* 허가서 제목 + 상태 */}
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  방문 허가서 (Visit Permit)
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="caption" color="text.secondary">{detail.permitNo}</Typography>
                  <Chip
                    size="small"
                    label={permitStatusLabel()}
                    color={getVisitPermitStatusColor(detail.revoked, detail.validTo)}
                    sx={{ fontWeight: 600 }}
                  />
                </Stack>
              </Stack>

              {/* 허가서 항목 */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>■ 승선선박 (Vessel Name) :</strong> {detail.vesselName}
                  </Typography>
                  <Typography variant="body2">
                    <strong>■ 회사명 (Company Name) :</strong> {detail.companyName}
                  </Typography>
                  <Typography variant="body2">
                    <strong>■ 업종 (Business Type) :</strong> {detail.industryName ?? '-'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>■ 작업일정 (Working Period) :</strong>{' '}
                    {formatDate(detail.validFrom)} ~ {formatDate(detail.validTo)}
                  </Typography>
                </Stack>
              </Paper>

              {/* QR 코드 */}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('visitPermit.qrTitle')}
                </Typography>
                <Box sx={{
                  mt: 1, height: 160, width: 160,
                  border: '1px solid', borderColor: 'divider', borderRadius: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.disabled',
                }}>
                  {detail.qrCodeUrl
                    ? <img src={detail.qrCodeUrl} alt="QR" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                    : <QrCodeIcon sx={{ fontSize: 100 }} />
                  }
                </Box>
              </Box>

              {/* 작업자 리스트 */}
              {accessReqQuery.data && (
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                    ■ 작업자 리스트 (Worker List)
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                          <TableCell width={40}>No.</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Birth Date</TableCell>
                          <TableCell>Date of Education</TableCell>
                          <TableCell align="center">Check by ship</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {accessReqQuery.data.workers?.map((w, idx) => (
                          <TableRow key={w.id ?? idx}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{w.workerName}</TableCell>
                            <TableCell>{w.workerBirth ?? '-'}</TableCell>
                            <TableCell>
                              {w.safetyEduCompletedAt
                                ? formatDateTime(w.safetyEduCompletedAt)
                                : w.safetyEduCompleted ? '이수' : '-'}
                            </TableCell>
                            <TableCell align="center">
                              <Checkbox
                                size="small"
                                checked={!!w.checkByShip}
                                disabled={!canCheckByShip || !w.id || pendingCheckIds.has(w.id as number)}
                                onChange={(e) =>
                                  w.id && checkMut.mutate({ workerId: w.id, checked: e.target.checked })
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                        {(accessReqQuery.data.workers?.length ?? 0) === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              <Typography variant="body2" color="text.secondary">{t('common.noData')}</Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {revokeOpen && (
                <TextField
                  fullWidth multiline minRows={2}
                  label={t('visitPermit.revokeReasonLabel')}
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                />
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }} className="no-print">
          {detail && (
            <Button variant="outlined" onClick={() => window.print()}>
              {t('common.print')}
            </Button>
          )}
          {detail && !detail.revoked && canRevoke && !revokeOpen && (
            <Button color="error" variant="outlined" startIcon={<BlockIcon />} onClick={() => setRevokeOpen(true)}>
              {t('visitPermit.revokeBtn')}
            </Button>
          )}
          {detail && !detail.revoked && canRevoke && revokeOpen && (
            <>
              <Button onClick={() => { setRevokeOpen(false); setRevokeReason('') }} disabled={revokeMut.isPending}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="contained" color="error" disabled={revokeMut.isPending}
                onClick={() => revokeMut.mutate({ id: detail.id, reason: revokeReason.trim() || undefined })}
              >
                {revokeMut.isPending ? <CircularProgress size={20} /> : t('common.confirm')}
              </Button>
            </>
          )}
          {(!detail || detail.revoked || !canRevoke) && !revokeOpen && (
            <Button onClick={handleClose} variant="contained">{t('common.close')}</Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open} autoHideDuration={3500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default VisitPermitDetailDialog
