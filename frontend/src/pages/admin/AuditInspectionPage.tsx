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
  IconButton,
  Snackbar,
  Alert,
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
import AppDatePicker from '../../components/common/AppDatePicker'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { format, parseISO } from 'date-fns'
import { auditInspectionApi } from '../../api/auditInspectionApi'
import { lookupApi } from '../../api/lookupApi'
import { companyAdminApi } from '../../api/companyAdminApi'
import type {
  AuditInspectionListItem,
  AuditInspectionPayload,
  AuditInspectionStatus,
  AuditInspectionType,
} from '../../types/auditInspection'

type SnackbarState = { open: boolean; message: string; severity: 'success' | 'error' }

const TYPES: AuditInspectionType[] = ['REGULAR', 'SPECIAL', 'FOLLOW_UP']
const STATUSES: AuditInspectionStatus[] = ['OPEN', 'CLOSED']

const statusColor = (s: AuditInspectionStatus): 'warning' | 'success' => {
  return s === 'OPEN' ? 'warning' : 'success'
}

const AuditInspectionPage: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [inspectionType, setInspectionType] = useState<AuditInspectionType | ''>('')
  const [status, setStatus] = useState<AuditInspectionStatus | ''>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const emptyPayload: AuditInspectionPayload = {
    inspectionType: 'REGULAR',
    targetCompanyId: null,
    targetVesselId: null,
    inspectionDate: '',
    findings: '',
    actionItems: '',
  }
  const [form, setForm] = useState<AuditInspectionPayload>(emptyPayload)

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  })

  const columnVisibilityModel: GridColumnVisibilityModel = useMemo(
    () =>
      isMobile
        ? {
            targetVesselName: false,
            inspectorName: false,
          }
        : {},
    [isMobile]
  )

  const vesselsQuery = useQuery({
    queryKey: ['lookup', 'vessels'],
    queryFn: () => lookupApi.vessels(),
  })
  const vessels = vesselsQuery.data ?? []

  const companiesQuery = useQuery({
    queryKey: ['admin', 'companies', 'all'],
    queryFn: () => companyAdminApi.list({ page: 0, size: 500, status: 'ACTIVE' }),
  })
  const companies = companiesQuery.data?.content ?? []

  const listQuery = useQuery({
    queryKey: [
      'audit-inspections',
      { inspectionType, status, dateFrom, dateTo, page, pageSize },
    ],
    queryFn: () =>
      auditInspectionApi.list({
        inspectionType: inspectionType || undefined,
        status: status || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        size: pageSize,
      }),
    placeholderData: (prev) => prev,
  })

  const detailQuery = useQuery({
    queryKey: ['audit-inspections', 'detail', selectedId],
    queryFn: () => auditInspectionApi.detail(selectedId as number),
    enabled: selectedId != null,
  })

  const extractErrorMessage = (err: unknown): string => {
    if (axios.isAxiosError(err)) {
      const m = (err.response?.data as { message?: string } | undefined)?.message
      if (m) return m
    }
    return t('approval.actionFailed')
  }

  const createMut = useMutation({
    mutationFn: () => auditInspectionApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audit-inspections'] })
      setSnackbar({ open: true, message: t('audit.createSuccess'), severity: 'success' })
      setCreateOpen(false)
      setForm(emptyPayload)
    },
    onError: (err) => {
      setSnackbar({ open: true, message: extractErrorMessage(err), severity: 'error' })
    },
  })

  const statusMut = useMutation({
    mutationFn: ({ id, s }: { id: number; s: AuditInspectionStatus }) =>
      auditInspectionApi.changeStatus(id, s),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audit-inspections'] })
      setSnackbar({ open: true, message: t('audit.statusChanged'), severity: 'success' })
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

  const typeLabel = (v: AuditInspectionType) => t(`audit.types.${v}`)
  const statusLabel = (v: AuditInspectionStatus) => t(`audit.status.${v}`)

  const columns: GridColDef<AuditInspectionListItem>[] = [
    {
      field: 'inspectionDate',
      headerName: t('audit.inspectionDate'),
      width: 110,
      valueFormatter: (p) => (p.value ? formatDate(p.value as string) : ''),
    },
    {
      field: 'inspectionType',
      headerName: t('audit.type'),
      width: 100,
      renderCell: (p) => (
        <Chip size="small" label={typeLabel(p.value as AuditInspectionType)} />
      ),
    },
    {
      field: 'targetCompanyName',
      headerName: t('approval.colCompany'),
      flex: 1,
      minWidth: 140,
    },
    {
      field: 'targetVesselName',
      headerName: t('accessRequest.vessel'),
      width: 130,
    },
    {
      field: 'inspectorName',
      headerName: t('audit.inspector'),
      width: 110,
    },
    {
      field: 'findings',
      headerName: t('audit.findings'),
      flex: 1,
      minWidth: 180,
      renderCell: (p) => (
        <Typography
          variant="body2"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {p.value}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: t('approval.colStatus'),
      width: 100,
      renderCell: (p) => (
        <Chip
          size="small"
          label={statusLabel(p.value as AuditInspectionStatus)}
          color={statusColor(p.value as AuditInspectionStatus)}
          sx={{ fontWeight: 600 }}
        />
      ),
    },
  ]

  const handleRowClick = (params: GridRowParams<AuditInspectionListItem>) => {
    setSelectedId(params.row.id)
  }

  const submitCreate = () => {
    if (
      !form.inspectionDate ||
      !form.findings.trim() ||
      !form.actionItems.trim()
    ) {
      setSnackbar({ open: true, message: t('errors.required'), severity: 'error' })
      return
    }
    createMut.mutate()
  }

  const detail = detailQuery.data

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        spacing={1}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t('audit.pageTitle')}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          {t('audit.new')}
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>{t('audit.type')}</InputLabel>
            <Select
              label={t('audit.type')}
              value={inspectionType}
              onChange={(e) => {
                setInspectionType(e.target.value as AuditInspectionType | '')
                setPage(0)
              }}
            >
              <MenuItem value="">{t('approval.filterAll')}</MenuItem>
              {TYPES.map((v) => (
                <MenuItem key={v} value={v}>
                  {typeLabel(v)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>{t('approval.filterStatus')}</InputLabel>
            <Select
              label={t('approval.filterStatus')}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as AuditInspectionStatus | '')
                setPage(0)
              }}
            >
              <MenuItem value="">{t('approval.filterAll')}</MenuItem>
              {STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {statusLabel(s)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <AppDatePicker
            label={t('accident.dateFrom')}
            value={dateFrom || null}
            onChange={(iso) => setDateFrom(iso ?? '')}
            maxIsoDate={dateTo || null}
          />
          <AppDatePicker
            label={t('accident.dateTo')}
            value={dateTo || null}
            onChange={(iso) => setDateTo(iso ?? '')}
            minIsoDate={dateFrom || null}
          />
          <Button variant="contained" startIcon={<SearchIcon />} onClick={() => setPage(0)}>
            {t('common.search')}
          </Button>
        </Stack>
      </Paper>

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
        open={selectedId != null}
        onClose={() => setSelectedId(null)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {t('audit.detailTitle')}
          <IconButton onClick={() => setSelectedId(null)} size="small">
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
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  {t('audit.type')}
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip size="small" label={typeLabel(detail.inspectionType)} />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  {t('audit.inspectionDate')}
                </Typography>
                <Typography variant="body1">{formatDate(detail.inspectionDate)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  {t('approval.colCompany')}
                </Typography>
                <Typography variant="body1">{detail.targetCompanyName || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  {t('accessRequest.vessel')}
                </Typography>
                <Typography variant="body1">{detail.targetVesselName || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  {t('audit.inspector')}
                </Typography>
                <Typography variant="body1">{detail.inspectorName || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  {t('approval.colStatus')}
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    size="small"
                    label={statusLabel(detail.status)}
                    color={statusColor(detail.status)}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  {t('audit.findings')}
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, whiteSpace: 'pre-wrap', mt: 0.5 }}>
                  {detail.findings}
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  {t('audit.actionItems')}
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, whiteSpace: 'pre-wrap', mt: 0.5 }}>
                  {detail.actionItems}
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          {detail && (
            <Button
              size="small"
              variant={detail.status === 'OPEN' ? 'contained' : 'outlined'}
              color={detail.status === 'OPEN' ? 'success' : 'warning'}
              disabled={statusMut.isPending}
              onClick={() =>
                statusMut.mutate({
                  id: detail.id,
                  s: detail.status === 'OPEN' ? 'CLOSED' : 'OPEN',
                })
              }
            >
              {detail.status === 'OPEN' ? t('audit.close') : t('audit.reopen')}
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setSelectedId(null)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>

      {/* Create Dialog */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {t('audit.new')}
          <IconButton onClick={() => setCreateOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>{t('audit.type')}</InputLabel>
                <Select
                  label={t('audit.type')}
                  value={form.inspectionType}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      inspectionType: e.target.value as AuditInspectionType,
                    }))
                  }
                >
                  {TYPES.map((v) => (
                    <MenuItem key={v} value={v}>
                      {typeLabel(v)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <AppDatePicker
                label={t('audit.inspectionDate')}
                value={form.inspectionDate || null}
                onChange={(iso) =>
                  setForm((f) => ({ ...f, inspectionDate: iso ?? '' }))
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>{t('approval.colCompany')}</InputLabel>
                <Select
                  label={t('approval.colCompany')}
                  value={form.targetCompanyId ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      targetCompanyId: e.target.value === '' ? null : Number(e.target.value),
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
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>{t('accessRequest.vessel')}</InputLabel>
                <Select
                  label={t('accessRequest.vessel')}
                  value={form.targetVesselId ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      targetVesselId: e.target.value === '' ? null : Number(e.target.value),
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
            </Grid>
            <Grid item xs={12}>
              <TextField
                size="small"
                fullWidth
                multiline
                minRows={4}
                label={t('audit.findings')}
                value={form.findings}
                onChange={(e) => setForm((f) => ({ ...f, findings: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                size="small"
                fullWidth
                multiline
                minRows={3}
                label={t('audit.actionItems')}
                value={form.actionItems}
                onChange={(e) => setForm((f) => ({ ...f, actionItems: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" disabled={createMut.isPending} onClick={submitCreate}>
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

export default AuditInspectionPage
