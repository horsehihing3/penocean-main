import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Box,
  Paper,
  Stack,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  DataGrid,
  GridColDef,
  GridRowParams,
  GridColumnVisibilityModel,
} from '@mui/x-data-grid'
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
import type { VisitPermitResponse } from '../../types/visitPermit'

type SnackbarState = { open: boolean; message: string; severity: 'success' | 'error' }

const VisitPermitPage: React.FC = () => {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const qc = useQueryClient()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [revokeOpen, setRevokeOpen] = useState(false)
  const [revokeReason, setRevokeReason] = useState('')
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  })

  const columnVisibilityModel: GridColumnVisibilityModel = useMemo(
    () =>
      isMobile
        ? {
            issuedAt: false,
            companyName: false,
          }
        : {},
    [isMobile]
  )

  const listQuery = useQuery({
    queryKey: ['visit-permits', { page, pageSize }],
    queryFn: () => visitPermitApi.list({ page, size: pageSize }),
    placeholderData: (prev) => prev,
  })

  const detailQuery = useQuery({
    queryKey: ['visit-permits', 'detail', selectedId],
    queryFn: () => visitPermitApi.detail(selectedId as number),
    enabled: selectedId != null,
  })

  const accessReqQuery = useQuery({
    queryKey: ['access-requests', 'detail-for-permit', detailQuery.data?.accessRequestId],
    queryFn: () => accessRequestApi.detail(detailQuery.data!.accessRequestId),
    enabled: !!detailQuery.data?.accessRequestId,
  })

  const canCheckByShip = user?.role === 'ADMIN' || user?.role === 'CONTRACT_DEPT'
  const [pendingCheckIds, setPendingCheckIds] = useState<Set<number>>(new Set())

  // Optimistic: 체크박스 즉시 토글하고 서버는 백그라운드로. 실패 시 롤백.
  const checkMut = useMutation({
    mutationFn: ({ workerId, checked }: { workerId: number; checked: boolean }) =>
      accessRequestApi.setWorkerCheckByShip(workerId, checked),
    onMutate: async ({ workerId, checked }) => {
      const key = [
        'access-requests',
        'detail-for-permit',
        detailQuery.data?.accessRequestId,
      ] as const
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
      setPendingCheckIds((s) => {
        const next = new Set(s)
        next.add(workerId)
        return next
      })
      return { previous, key }
    },
    onError: (err, _vars, context) => {
      if (context?.previous) qc.setQueryData(context.key, context.previous)
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : String(err),
        severity: 'error',
      })
    },
    onSettled: (_d, _e, vars) => {
      setPendingCheckIds((s) => {
        const next = new Set(s)
        next.delete(vars.workerId)
        return next
      })
    },
  })

  // Auto-open via ?accessRequestId=N
  const accessRequestIdParam = searchParams.get('accessRequestId')
  useEffect(() => {
    if (!accessRequestIdParam) return
    let cancelled = false
    ;(async () => {
      try {
        const vp = await visitPermitApi.byAccessRequest(Number(accessRequestIdParam))
        if (!cancelled) setSelectedId(vp.id)
      } catch {
        // ignore — no permit yet
      }
    })()
    return () => {
      cancelled = true
    }
  }, [accessRequestIdParam])

  const revokeMut = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      visitPermitApi.revoke(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visit-permits'] })
      setSnackbar({ open: true, message: t('common.confirm'), severity: 'success' })
      setRevokeOpen(false)
      setRevokeReason('')
    },
    onError: (err) => {
      let m: string = t('approval.actionFailed')
      if (axios.isAxiosError(err)) {
        const msg = (err.response?.data as { message?: string } | undefined)?.message
        if (msg) m = msg
      }
      setSnackbar({ open: true, message: m, severity: 'error' })
    },
  })

  const formatDate = (iso: string) => {
    try {
      return format(parseISO(iso), 'yyyy-MM-dd')
    } catch {
      return iso
    }
  }

  const formatDateTime = (iso: string) => {
    try {
      return format(parseISO(iso), 'yyyy-MM-dd HH:mm')
    } catch {
      return iso
    }
  }

  const permitStatusLabel = (vp: VisitPermitResponse): string => {
    if (vp.revoked) return t('visitPermit.revoked')
    try {
      if (new Date(vp.validTo).getTime() < Date.now()) return t('visitPermit.expired')
    } catch {
      // ignore
    }
    return t('visitPermit.valid')
  }

  const columns: GridColDef<VisitPermitResponse>[] = [
    { field: 'permitNo', headerName: t('visitPermit.permitNo'), width: 160 },
    { field: 'vesselName', headerName: '승선선박', flex: 1, minWidth: 140 },
    { field: 'companyName', headerName: '회사명', flex: 1, minWidth: 150 },
    {
      field: 'industryName',
      headerName: '업종',
      width: 130,
      renderCell: (p) => <span>{p.row.industryName ?? '-'}</span>,
    },
    {
      field: 'validFrom',
      headerName: '작업일정',
      width: 220,
      sortable: false,
      renderCell: (p) => (
        <span>
          {p.row.validFrom && p.row.validTo
            ? `${formatDate(p.row.validFrom)} ~ ${formatDate(p.row.validTo)}`
            : '-'}
        </span>
      ),
    },
    {
      field: 'status',
      headerName: t('approval.colStatus'),
      width: 110,
      sortable: false,
      renderCell: (p) => (
        <Chip
          size="small"
          label={permitStatusLabel(p.row)}
          color={getVisitPermitStatusColor(p.row.revoked, p.row.validTo)}
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'issuedAt',
      headerName: t('visitPermit.issuedAt'),
      width: 160,
      valueFormatter: (p) => (p.value ? formatDateTime(p.value as string) : ''),
    },
  ]

  const handleRowClick = (params: GridRowParams<VisitPermitResponse>) => {
    setSelectedId(params.row.id)
  }

  const closeDetail = () => {
    setSelectedId(null)
    setRevokeOpen(false)
    setRevokeReason('')
  }

  const detail = detailQuery.data
  const detailOpen = selectedId != null

  const canRevoke = user?.role === 'ADMIN'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        {t('visitPermit.pageTitle')}
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 480,
          height: { xs: '60vh', md: '65vh' },
        }}
      >
        {listQuery.isError && (
          <Alert severity="error" sx={{ m: 2 }}>
            {t('approval.loadError')}
          </Alert>
        )}
        <DataGrid
          rows={listQuery.data?.content ?? []}
          getRowId={(r) => r.id}
          columns={columns}
          columnVisibilityModel={columnVisibilityModel}
          loading={listQuery.isLoading || listQuery.isFetching}
          onRowClick={handleRowClick}
          paginationMode="server"
          rowCount={listQuery.data?.totalElements ?? 0}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(m) => {
            setPage(m.page)
            setPageSize(m.pageSize)
          }}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
          localeText={{ noRowsLabel: t('approval.empty') }}
          sx={{
            border: 0,
            flex: 1,
            '& .MuiDataGrid-row': { cursor: 'pointer' },
          }}
        />
      </Paper>

      {/* Detail Dialog */}
      <Dialog
        open={detailOpen}
        onClose={closeDetail}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {t('visitPermit.pageTitle')}
          <IconButton onClick={closeDetail} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailQuery.isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={32} />
            </Box>
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
                    label={permitStatusLabel(detail)}
                    color={getVisitPermitStatusColor(detail.revoked, detail.validTo)}
                    sx={{ fontWeight: 600 }}
                  />
                </Stack>
              </Stack>

              {/* PPT 방문허가서 항목 (■ 형식) */}
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
                <Box
                  sx={{
                    mt: 1,
                    height: 160,
                    width: 160,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.disabled',
                  }}
                >
                  {detail.qrCodeUrl ? (
                    <img src={detail.qrCodeUrl} alt="QR" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                  ) : (
                    <QrCodeIcon sx={{ fontSize: 100 }} />
                  )}
                </Box>
              </Box>

              {/* 작업자 리스트 (Worker List) — PPT 슬라이드 15 */}
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
                  fullWidth
                  multiline
                  minRows={2}
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
            <Button
              variant="outlined"
              onClick={() => window.print()}
            >
              {t('common.print')}
            </Button>
          )}
          {detail && !detail.revoked && canRevoke && !revokeOpen && (
            <Button
              color="error"
              variant="outlined"
              startIcon={<BlockIcon />}
              onClick={() => setRevokeOpen(true)}
            >
              {t('visitPermit.revokeBtn')}
            </Button>
          )}
          {detail && !detail.revoked && canRevoke && revokeOpen && (
            <>
              <Button
                onClick={() => {
                  setRevokeOpen(false)
                  setRevokeReason('')
                }}
                disabled={revokeMut.isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="contained"
                color="error"
                disabled={revokeMut.isPending}
                onClick={() =>
                  revokeMut.mutate({
                    id: detail.id,
                    reason: revokeReason.trim() || undefined,
                  })
                }
              >
                {revokeMut.isPending ? <CircularProgress size={20} /> : t('common.confirm')}
              </Button>
            </>
          )}
          {(detail?.revoked || !canRevoke) && !revokeOpen && (
            <Button onClick={closeDetail} variant="contained">
              {t('common.close')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

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

export default VisitPermitPage
