import { useMemo, useState } from 'react'
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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  IconButton,
  Snackbar,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Checkbox,
  FormControlLabel,
  CircularProgress,
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
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { format, parseISO } from 'date-fns'
import { workerVoiceApi } from '../../api/workerVoiceApi'
import { lookupApi } from '../../api/lookupApi'
import { companyAdminApi } from '../../api/companyAdminApi'
import { useAuth } from '../../context/AuthContext'
import {
  getWorkerVoiceStatusColor,
  getWorkerVoiceTypeColor,
  getWorkerVoiceSeverityColor,
} from '../../utils/status'
import type {
  WorkerVoiceCreatePayload,
  WorkerVoiceListItem,
  WorkerVoiceSeverity,
  WorkerVoiceStatus,
  WorkerVoiceType,
} from '../../types/workerVoice'

type SnackbarState = { open: boolean; message: string; severity: 'success' | 'error' }

const WorkerVoicePage: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { user } = useAuth()

  const [voiceType, setVoiceType] = useState<WorkerVoiceType | ''>('')
  const [status, setStatus] = useState<WorkerVoiceStatus | ''>('')
  const [keyword, setKeyword] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const vesselsQuery = useQuery({
    queryKey: ['lookup', 'vessels'],
    queryFn: () => lookupApi.vessels(),
  })
  const vessels = vesselsQuery.data ?? []

  const companiesQuery = useQuery({
    queryKey: ['admin', 'companies', 'all'],
    queryFn: () => companyAdminApi.list({ page: 0, size: 500, status: 'ACTIVE' }),
    enabled: user?.role !== 'CONTRACTOR',
  })
  const companies = companiesQuery.data?.content ?? []
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  })

  // Status change form state
  const [newStatus, setNewStatus] = useState<WorkerVoiceStatus | ''>('')
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [resolution, setResolution] = useState('')

  // Create form state
  const emptyCreate: WorkerVoiceCreatePayload = {
    voiceType: 'NEAR_MISS',
    title: '',
    content: '',
    companyId: user?.companyId ?? null,
    vesselId: null,
    severity: null,
    reporterAnonymous: false,
  }
  const [createForm, setCreateForm] = useState<WorkerVoiceCreatePayload>(emptyCreate)
  const [consentChecked, setConsentChecked] = useState(false)

  const canManage = user?.role === 'ADMIN' || user?.role === 'CONTRACT_DEPT'

  const columnVisibilityModel: GridColumnVisibilityModel = useMemo(
    () =>
      isMobile
        ? { companyName: false, severity: false, createdAt: false }
        : {},
    [isMobile]
  )

  const listQuery = useQuery({
    queryKey: ['workerVoices', { voiceType, status, keyword, page, pageSize }],
    queryFn: () =>
      workerVoiceApi.list({
        voiceType: voiceType || undefined,
        status: status || undefined,
        keyword: keyword || undefined,
        page,
        size: pageSize,
      }),
    placeholderData: (prev) => prev,
  })

  const detailQuery = useQuery({
    queryKey: ['workerVoices', 'detail', selectedId],
    queryFn: () => workerVoiceApi.detail(selectedId as number),
    enabled: selectedId != null,
  })

  const extractErrorMessage = (err: unknown): string => {
    if (axios.isAxiosError(err)) {
      const m = (err.response?.data as { message?: string } | undefined)?.message
      if (m) return m
    }
    return t('workerVoice.actionFailed')
  }

  const createMut = useMutation({
    mutationFn: (payload: WorkerVoiceCreatePayload) => workerVoiceApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workerVoices'] })
      setSnackbar({ open: true, message: t('workerVoice.createSuccess'), severity: 'success' })
      setCreateOpen(false)
      setCreateForm(emptyCreate)
      setConsentChecked(false)
    },
    onError: (err) => {
      setSnackbar({ open: true, message: extractErrorMessage(err), severity: 'error' })
    },
  })

  const statusMut = useMutation({
    mutationFn: (args: {
      id: number
      status: WorkerVoiceStatus
      assignedTo?: number | null
      resolution?: string | null
    }) =>
      workerVoiceApi.updateStatus(args.id, {
        status: args.status,
        assignedTo: args.assignedTo ?? null,
        resolution: args.resolution ?? null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workerVoices'] })
      setSnackbar({ open: true, message: t('workerVoice.updateSuccess'), severity: 'success' })
      setSelectedId(null)
      setNewStatus('')
      setAssignedTo('')
      setResolution('')
    },
    onError: (err) => {
      setSnackbar({ open: true, message: extractErrorMessage(err), severity: 'error' })
    },
  })

  const formatDate = (iso: string) => {
    try {
      return format(parseISO(iso), 'yyyy-MM-dd')
    } catch {
      return iso
    }
  }

  const typeLabel = (v: WorkerVoiceType) => t(`workerVoice.types.${v}`)
  const statusLabel = (v: WorkerVoiceStatus) => t(`workerVoice.status.${v}`)
  const severityLabel = (v: WorkerVoiceSeverity) => t(`workerVoice.severity.${v}`)

  const columns: GridColDef<WorkerVoiceListItem>[] = [
    {
      field: 'voiceNo',
      headerName: t('workerVoice.voiceNo'),
      width: 150,
    },
    {
      field: 'voiceType',
      headerName: t('workerVoice.voiceType'),
      width: 110,
      renderCell: (p) => (
        <Chip
          size="small"
          label={typeLabel(p.value as WorkerVoiceType)}
          color={getWorkerVoiceTypeColor(p.value as WorkerVoiceType)}
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'title',
      headerName: t('workerVoice.title'),
      flex: 1,
      minWidth: 180,
    },
    {
      field: 'companyName',
      headerName: t('workerVoice.company'),
      width: 150,
    },
    {
      field: 'severity',
      headerName: t('workerVoice.severityCol'),
      width: 100,
      renderCell: (p) =>
        p.value ? (
          <Chip
            size="small"
            label={severityLabel(p.value as WorkerVoiceSeverity)}
            color={getWorkerVoiceSeverityColor(p.value as WorkerVoiceSeverity)}
            sx={{ fontWeight: 600 }}
          />
        ) : (
          <span>-</span>
        ),
    },
    {
      field: 'status',
      headerName: t('workerVoice.statusCol'),
      width: 120,
      renderCell: (p) => (
        <Chip
          size="small"
          label={statusLabel(p.value as WorkerVoiceStatus)}
          color={getWorkerVoiceStatusColor(p.value as WorkerVoiceStatus)}
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: t('workerVoice.createdAt'),
      width: 120,
      valueFormatter: (p) => (p.value ? formatDate(p.value as string) : ''),
    },
    {
      field: 'actions',
      headerName: t('approval.colActions'),
      width: 90,
      sortable: false,
      filterable: false,
      renderCell: (p) => (
        <Button
          size="small"
          variant="outlined"
          onClick={(e) => {
            e.stopPropagation()
            setSelectedId(p.row.id)
          }}
        >
          {t('approval.detail')}
        </Button>
      ),
    },
  ]

  const applyKeyword = () => {
    setKeyword(keywordInput.trim())
    setPage(0)
  }

  const handleRowClick = (params: GridRowParams<WorkerVoiceListItem>) => {
    setSelectedId(params.row.id)
  }

  const detail = detailQuery.data
  const detailOpen = selectedId != null

  const closeDetail = () => {
    setSelectedId(null)
    setNewStatus('')
    setAssignedTo('')
    setResolution('')
  }

  const submitCreate = () => {
    if (!createForm.title.trim() || !createForm.content.trim()) {
      setSnackbar({ open: true, message: t('errors.required'), severity: 'error' })
      return
    }
    const payload: WorkerVoiceCreatePayload = {
      ...createForm,
      severity: createForm.voiceType === 'INCIDENT' ? createForm.severity : null,
    }
    createMut.mutate(payload)
  }

  const submitStatusChange = () => {
    if (!selectedId || !newStatus) return
    statusMut.mutate({
      id: selectedId,
      status: newStatus,
      assignedTo: assignedTo ? Number(assignedTo) : null,
      resolution: resolution || null,
    })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        spacing={1}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t('workerVoice.pageTitle')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setCreateForm({ ...emptyCreate, companyId: user?.companyId ?? null })
            setCreateOpen(true)
          }}
        >
          {t('workerVoice.new')}
        </Button>
      </Stack>

      {/* Filter bar */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <ToggleButtonGroup
            size="small"
            value={voiceType}
            exclusive
            onChange={(_, v) => {
              setVoiceType((v ?? '') as WorkerVoiceType | '')
              setPage(0)
            }}
          >
            <ToggleButton value="">{t('approval.filterAll')}</ToggleButton>
            <ToggleButton value="NEAR_MISS">{t('workerVoice.types.NEAR_MISS')}</ToggleButton>
            <ToggleButton value="INCIDENT">{t('workerVoice.types.INCIDENT')}</ToggleButton>
            <ToggleButton value="INQUIRY">{t('workerVoice.types.INQUIRY')}</ToggleButton>
          </ToggleButtonGroup>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>{t('approval.filterStatus')}</InputLabel>
            <Select
              label={t('approval.filterStatus')}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as WorkerVoiceStatus | '')
                setPage(0)
              }}
            >
              <MenuItem value="">{t('approval.filterAll')}</MenuItem>
              <MenuItem value="SUBMITTED">{t('workerVoice.status.SUBMITTED')}</MenuItem>
              <MenuItem value="TRIAGED">{t('workerVoice.status.TRIAGED')}</MenuItem>
              <MenuItem value="IN_PROGRESS">{t('workerVoice.status.IN_PROGRESS')}</MenuItem>
              <MenuItem value="RESOLVED">{t('workerVoice.status.RESOLVED')}</MenuItem>
              <MenuItem value="CLOSED">{t('workerVoice.status.CLOSED')}</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            label={t('approval.filterKeyword')}
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyKeyword()
            }}
            sx={{ flex: 1, minWidth: 160 }}
          />

          <Button variant="contained" startIcon={<SearchIcon />} onClick={applyKeyword}>
            {t('common.search')}
          </Button>
        </Stack>
      </Paper>

      {/* DataGrid */}
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
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {t('workerVoice.detailTitle')}
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
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    {t('workerVoice.voiceNo')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {detail.voiceNo}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    {t('workerVoice.voiceType')}
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      size="small"
                      label={typeLabel(detail.voiceType)}
                      color={getWorkerVoiceTypeColor(detail.voiceType)}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    {t('workerVoice.title')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {detail.title}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    {t('workerVoice.company')}
                  </Typography>
                  <Typography variant="body1">
                    {detail.reporterAnonymous
                      ? t('workerVoice.anonymous')
                      : detail.companyName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    {t('workerVoice.vessel')}
                  </Typography>
                  <Typography variant="body1">{detail.vesselName || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    {t('workerVoice.severityCol')}
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    {detail.severity ? (
                      <Chip
                        size="small"
                        label={severityLabel(detail.severity)}
                        color={getWorkerVoiceSeverityColor(detail.severity)}
                        sx={{ fontWeight: 600 }}
                      />
                    ) : (
                      <Typography variant="body1">-</Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    {t('workerVoice.statusCol')}
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      size="small"
                      label={statusLabel(detail.status)}
                      color={getWorkerVoiceStatusColor(detail.status)}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    {t('workerVoice.content')}
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, whiteSpace: 'pre-wrap', mt: 0.5 }}>
                    {detail.content}
                  </Paper>
                </Grid>
                {detail.resolution && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      {t('workerVoice.resolution')}
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, whiteSpace: 'pre-wrap', mt: 0.5 }}>
                      {detail.resolution}
                    </Paper>
                  </Grid>
                )}
              </Grid>

              {detail.attachments.length > 0 && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                      {t('accessRequest.tabAttachments')}
                    </Typography>
                    <Stack spacing={1}>
                      {detail.attachments.map((att) => (
                        <Stack key={att.id} direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2">{att.fileName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({Math.ceil(att.fileSize / 1024)} KB)
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                </>
              )}

              {canManage && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                      {t('workerVoice.changeStatus')}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl size="small" fullWidth>
                          <InputLabel>{t('workerVoice.statusCol')}</InputLabel>
                          <Select
                            label={t('workerVoice.statusCol')}
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value as WorkerVoiceStatus)}
                          >
                            <MenuItem value="SUBMITTED">{t('workerVoice.status.SUBMITTED')}</MenuItem>
                            <MenuItem value="TRIAGED">{t('workerVoice.status.TRIAGED')}</MenuItem>
                            <MenuItem value="IN_PROGRESS">{t('workerVoice.status.IN_PROGRESS')}</MenuItem>
                            <MenuItem value="RESOLVED">{t('workerVoice.status.RESOLVED')}</MenuItem>
                            <MenuItem value="CLOSED">{t('workerVoice.status.CLOSED')}</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          size="small"
                          fullWidth
                          label={t('workerVoice.assignedTo')}
                          value={assignedTo}
                          onChange={(e) => setAssignedTo(e.target.value.replace(/\D/g, ''))}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          size="small"
                          fullWidth
                          multiline
                          minRows={3}
                          label={t('workerVoice.resolution')}
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          {canManage && (
            <Button
              variant="contained"
              disabled={!newStatus || statusMut.isPending}
              onClick={submitStatusChange}
            >
              {statusMut.isPending ? <CircularProgress size={20} /> : t('common.save')}
            </Button>
          )}
          <Button onClick={closeDetail}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>

      {/* Create Dialog */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {t('workerVoice.new')}
          <IconButton onClick={() => setCreateOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box
              sx={{
                p: 2,
                bgcolor: 'action.hover',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                maxHeight: 180,
                overflowY: 'auto',
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                {t('workerVoice.consent.title')}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: 'text.secondary', lineHeight: 1.6 }}>
                {t('workerVoice.consent.body')}
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                />
              }
              label={t('workerVoice.consent.agree')}
            />

            <FormControl size="small" fullWidth>
              <InputLabel>{t('workerVoice.voiceType')}</InputLabel>
              <Select
                label={t('workerVoice.voiceType')}
                value={createForm.voiceType}
                onChange={(e) =>
                  setCreateForm((f) => ({
                    ...f,
                    voiceType: e.target.value as WorkerVoiceType,
                  }))
                }
              >
                <MenuItem value="NEAR_MISS">{t('workerVoice.types.NEAR_MISS')}</MenuItem>
                <MenuItem value="INCIDENT">{t('workerVoice.types.INCIDENT')}</MenuItem>
                <MenuItem value="INQUIRY">{t('workerVoice.types.INQUIRY')}</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              fullWidth
              label={t('workerVoice.title')}
              value={createForm.title}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, title: e.target.value }))
              }
            />

            <TextField
              size="small"
              fullWidth
              multiline
              minRows={4}
              label={t('workerVoice.content')}
              value={createForm.content}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, content: e.target.value }))
              }
            />

            {user?.role !== 'CONTRACTOR' && (
              <FormControl size="small" fullWidth>
                <InputLabel>{t('approval.colCompany')}</InputLabel>
                <Select
                  label={t('approval.colCompany')}
                  value={createForm.companyId ?? ''}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      companyId: e.target.value === '' ? null : Number(e.target.value),
                    }))
                  }
                >
                  <MenuItem value="">
                    <em>{t('common.selectPlaceholder', { defaultValue: '선택하세요' })}</em>
                  </MenuItem>
                  {companies.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name} ({c.businessNumber})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <FormControl size="small" fullWidth>
              <InputLabel>{t('accessRequest.vessel')}</InputLabel>
              <Select
                label={t('accessRequest.vessel')}
                value={createForm.vesselId ?? ''}
                onChange={(e) =>
                  setCreateForm((f) => ({
                    ...f,
                    vesselId: e.target.value === '' ? null : Number(e.target.value),
                  }))
                }
              >
                <MenuItem value="">
                  <em>{t('common.selectPlaceholder', { defaultValue: '선택하세요' })}</em>
                </MenuItem>
                {vessels.map((v) => (
                  <MenuItem key={v.id} value={v.id}>
                    {v.name}
                    {v.imoNumber ? ` (IMO ${v.imoNumber})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {createForm.voiceType === 'INCIDENT' && (
              <FormControl size="small" fullWidth>
                <InputLabel>{t('workerVoice.severityCol')}</InputLabel>
                <Select
                  label={t('workerVoice.severityCol')}
                  value={createForm.severity ?? ''}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      severity: (e.target.value as WorkerVoiceSeverity) || null,
                    }))
                  }
                >
                  <MenuItem value="LOW">{t('workerVoice.severity.LOW')}</MenuItem>
                  <MenuItem value="MEDIUM">{t('workerVoice.severity.MEDIUM')}</MenuItem>
                  <MenuItem value="HIGH">{t('workerVoice.severity.HIGH')}</MenuItem>
                  <MenuItem value="CRITICAL">{t('workerVoice.severity.CRITICAL')}</MenuItem>
                </Select>
              </FormControl>
            )}

            <FormControlLabel
              control={
                <Checkbox
                  checked={createForm.reporterAnonymous}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      reporterAnonymous: e.target.checked,
                    }))
                  }
                />
              }
              label={t('workerVoice.anonymous')}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            disabled={createMut.isPending || !consentChecked}
            onClick={submitCreate}
          >
            {createMut.isPending ? <CircularProgress size={20} /> : t('common.submit')}
          </Button>
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

export default WorkerVoicePage
