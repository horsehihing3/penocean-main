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
  CircularProgress,
  Link as MuiLink,
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
import { industrialAccidentApi } from '../../api/industrialAccidentApi'
import { lookupApi } from '../../api/lookupApi'
import { companyAdminApi } from '../../api/companyAdminApi'
import { useAuth } from '../../context/AuthContext'
import { getAccidentSeverityColor } from '../../utils/status'
import type {
  AccidentSeverity,
  AccidentType,
  IndustrialAccidentListItem,
  IndustrialAccidentPayload,
  VictimGender,
} from '../../types/industrialAccident'

type SnackbarState = { open: boolean; message: string; severity: 'success' | 'error' }

const ACCIDENT_TYPES: AccidentType[] = ['FALL', 'STRUCK', 'CUT', 'BURN', 'ELECTRIC', 'OTHER']
const SEVERITIES: AccidentSeverity[] = ['MINOR', 'SERIOUS', 'FATAL']

const IndustrialAccidentPage: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { user } = useAuth()

  const [businessNumber, setBusinessNumber] = useState('')
  const [severity, setSeverity] = useState<AccidentSeverity | ''>('')
  const [accidentType, setAccidentType] = useState<AccidentType | ''>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  })

  const emptyPayload: IndustrialAccidentPayload = {
    companyId: user?.companyId ?? 0,
    vesselId: null,
    accidentDate: '',
    accidentLocation: '',
    victimName: '',
    victimAge: 0,
    victimGender: 'MALE',
    victimRole: '',
    accidentType: 'FALL',
    severity: 'MINOR',
    description: '',
    treatmentDays: 0,
    absenceDays: 0,
  }
  const [form, setForm] = useState<IndustrialAccidentPayload>(emptyPayload)

  const canCreate = user?.role === 'ADMIN' || user?.role === 'CONTRACT_DEPT'

  const vesselsQuery = useQuery({
    queryKey: ['lookup', 'vessels'],
    queryFn: () => lookupApi.vessels(),
    enabled: canCreate,
  })
  const vessels = vesselsQuery.data ?? []

  const companiesQuery = useQuery({
    queryKey: ['admin', 'companies', 'all'],
    queryFn: () => companyAdminApi.list({ page: 0, size: 500, status: 'ACTIVE' }),
    enabled: canCreate,
  })
  const companies = companiesQuery.data?.content ?? []

  const columnVisibilityModel: GridColumnVisibilityModel = useMemo(
    () =>
      isMobile
        ? {
            businessNumber: false,
            vesselName: false,
            accidentLocation: false,
            createdAt: false,
          }
        : {},
    [isMobile]
  )

  const listQuery = useQuery({
    queryKey: [
      'industrialAccidents',
      { businessNumber, severity, accidentType, dateFrom, dateTo, page, pageSize },
    ],
    queryFn: () =>
      industrialAccidentApi.list({
        businessNumber: businessNumber || undefined,
        severity: severity || undefined,
        accidentType: accidentType || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        size: pageSize,
      }),
    placeholderData: (prev) => prev,
  })

  const detailQuery = useQuery({
    queryKey: ['industrialAccidents', 'detail', selectedId],
    queryFn: () => industrialAccidentApi.detail(selectedId as number),
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
    mutationFn: (payload: IndustrialAccidentPayload) =>
      industrialAccidentApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['industrialAccidents'] })
      setSnackbar({ open: true, message: t('accident.createSuccess'), severity: 'success' })
      setCreateOpen(false)
      setForm(emptyPayload)
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

  const typeLabel = (v: AccidentType) => t(`accident.types.${v}`)
  const severityLabel = (v: AccidentSeverity) => t(`accident.severity.${v}`)

  const columns: GridColDef<IndustrialAccidentListItem>[] = [
    {
      field: 'accidentNo',
      headerName: t('accident.accidentNo'),
      width: 150,
    },
    {
      field: 'companyName',
      headerName: t('approval.colCompany'),
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'businessNumber',
      headerName: t('approval.colBusinessNumber'),
      width: 130,
    },
    {
      field: 'vesselName',
      headerName: t('accessRequest.vessel'),
      width: 120,
    },
    {
      field: 'accidentDate',
      headerName: t('accident.accidentDate'),
      width: 120,
      valueFormatter: (p) => (p.value ? formatDate(p.value as string) : ''),
    },
    {
      field: 'accidentLocation',
      headerName: t('accident.accidentLocation'),
      width: 140,
    },
    {
      field: 'victimName',
      headerName: t('accident.victim'),
      width: 110,
    },
    {
      field: 'accidentType',
      headerName: t('accident.accidentType'),
      width: 100,
      renderCell: (p) => (
        <Chip size="small" label={typeLabel(p.value as AccidentType)} />
      ),
    },
    {
      field: 'severity',
      headerName: t('accident.severityCol'),
      width: 100,
      renderCell: (p) => (
        <Chip
          size="small"
          label={severityLabel(p.value as AccidentSeverity)}
          color={getAccidentSeverityColor(p.value as AccidentSeverity)}
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: t('approval.colCreatedAt'),
      width: 120,
      valueFormatter: (p) => (p.value ? formatDate(p.value as string) : ''),
    },
  ]

  const handleRowClick = (params: GridRowParams<IndustrialAccidentListItem>) => {
    setSelectedId(params.row.id)
  }

  const closeDetail = () => setSelectedId(null)

  const submitCreate = () => {
    if (
      !form.accidentDate ||
      !form.accidentLocation.trim() ||
      !form.victimName.trim() ||
      !form.description.trim()
    ) {
      setSnackbar({ open: true, message: t('errors.required'), severity: 'error' })
      return
    }
    createMut.mutate(form)
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
          {t('accident.pageTitle')}
        </Typography>
        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setForm({ ...emptyPayload, companyId: user?.companyId ?? 0 })
              setCreateOpen(true)
            }}
          >
            {t('accident.new')}
          </Button>
        )}
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <TextField
            size="small"
            label={t('approval.colBusinessNumber')}
            value={businessNumber}
            onChange={(e) => setBusinessNumber(e.target.value)}
            sx={{ minWidth: 150 }}
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>{t('accident.severityCol')}</InputLabel>
            <Select
              label={t('accident.severityCol')}
              value={severity}
              onChange={(e) => {
                setSeverity(e.target.value as AccidentSeverity | '')
                setPage(0)
              }}
            >
              <MenuItem value="">{t('approval.filterAll')}</MenuItem>
              {SEVERITIES.map((s) => (
                <MenuItem key={s} value={s}>
                  {severityLabel(s)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>{t('accident.accidentType')}</InputLabel>
            <Select
              label={t('accident.accidentType')}
              value={accidentType}
              onChange={(e) => {
                setAccidentType(e.target.value as AccidentType | '')
                setPage(0)
              }}
            >
              <MenuItem value="">{t('approval.filterAll')}</MenuItem>
              {ACCIDENT_TYPES.map((at) => (
                <MenuItem key={at} value={at}>
                  {typeLabel(at)}
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
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={() => setPage(0)}
          >
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

      {/* Detail dialog */}
      <Dialog
        open={selectedId != null}
        onClose={closeDetail}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {t('accident.detailTitle')}
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
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  {t('accident.accidentNo')}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {detail.accidentNo}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  {t('accident.accidentDate')}
                </Typography>
                <Typography variant="body1">{formatDate(detail.accidentDate)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  {t('approval.colCompany')}
                </Typography>
                <Typography variant="body1">{detail.companyName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  {t('approval.colBusinessNumber')}
                </Typography>
                <Typography variant="body1">{detail.businessNumber}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  {t('accessRequest.vessel')}
                </Typography>
                <Typography variant="body1">{detail.vesselName || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  {t('accident.accidentLocation')}
                </Typography>
                <Typography variant="body1">{detail.accidentLocation}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary">
                  {t('accident.victim')}
                </Typography>
                <Typography variant="body1">{detail.victimName}</Typography>
              </Grid>
              <Grid item xs={6} sm={2}>
                <Typography variant="caption" color="text.secondary">
                  {t('accident.victimAge')}
                </Typography>
                <Typography variant="body1">{detail.victimAge}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  {t('accident.victimGender')}
                </Typography>
                <Typography variant="body1">
                  {t(`accident.gender.${detail.victimGender}`)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  {t('accident.victimRole')}
                </Typography>
                <Typography variant="body1">{detail.victimRole}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  {t('accident.accidentType')}
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip size="small" label={typeLabel(detail.accidentType)} />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  {t('accident.severityCol')}
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    size="small"
                    label={severityLabel(detail.severity)}
                    color={getAccidentSeverityColor(detail.severity)}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  {t('accident.treatmentDays')}
                </Typography>
                <Typography variant="body1">{detail.treatmentDays}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  {t('accident.absenceDays')}
                </Typography>
                <Typography variant="body1">{detail.absenceDays}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  {t('accident.description')}
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, whiteSpace: 'pre-wrap', mt: 0.5 }}>
                  {detail.description}
                </Paper>
              </Grid>
              {detail.reportFileUrl && (
                <Grid item xs={12}>
                  <MuiLink
                    href={detail.reportFileUrl}
                    target="_blank"
                    rel="noopener"
                    underline="hover"
                  >
                    {t('accident.reportFile')}
                  </MuiLink>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeDetail}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>

      {/* Create dialog */}
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
          {t('accident.new')}
          <IconButton onClick={() => setCreateOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <FormControl size="small" fullWidth required>
                <InputLabel>{t('approval.colCompany')}</InputLabel>
                <Select
                  label={t('approval.colCompany')}
                  value={form.companyId || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, companyId: e.target.value === '' ? 0 : Number(e.target.value) }))
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
                  value={form.vesselId ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
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
            </Grid>
            <Grid item xs={12} sm={6}>
              <AppDatePicker
                label={t('accident.accidentDate')}
                value={form.accidentDate || null}
                onChange={(iso) =>
                  setForm((f) => ({ ...f, accidentDate: iso ?? '' }))
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small"
                fullWidth
                label={t('accident.accidentLocation')}
                value={form.accidentLocation}
                onChange={(e) =>
                  setForm((f) => ({ ...f, accidentLocation: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                size="small"
                fullWidth
                label={t('accident.victim')}
                value={form.victimName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, victimName: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                size="small"
                fullWidth
                type="number"
                label={t('accident.victimAge')}
                value={form.victimAge || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, victimAge: Number(e.target.value) || 0 }))
                }
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl size="small" fullWidth>
                <InputLabel>{t('accident.victimGender')}</InputLabel>
                <Select
                  label={t('accident.victimGender')}
                  value={form.victimGender}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, victimGender: e.target.value as VictimGender }))
                  }
                >
                  <MenuItem value="MALE">{t('accident.gender.MALE')}</MenuItem>
                  <MenuItem value="FEMALE">{t('accident.gender.FEMALE')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                size="small"
                fullWidth
                label={t('accident.victimRole')}
                value={form.victimRole}
                onChange={(e) =>
                  setForm((f) => ({ ...f, victimRole: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>{t('accident.accidentType')}</InputLabel>
                <Select
                  label={t('accident.accidentType')}
                  value={form.accidentType}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, accidentType: e.target.value as AccidentType }))
                  }
                >
                  {ACCIDENT_TYPES.map((at) => (
                    <MenuItem key={at} value={at}>
                      {typeLabel(at)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>{t('accident.severityCol')}</InputLabel>
                <Select
                  label={t('accident.severityCol')}
                  value={form.severity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, severity: e.target.value as AccidentSeverity }))
                  }
                >
                  {SEVERITIES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {severityLabel(s)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                size="small"
                fullWidth
                type="number"
                label={t('accident.treatmentDays')}
                value={form.treatmentDays || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, treatmentDays: Number(e.target.value) || 0 }))
                }
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                size="small"
                fullWidth
                type="number"
                label={t('accident.absenceDays')}
                value={form.absenceDays || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, absenceDays: Number(e.target.value) || 0 }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                size="small"
                fullWidth
                multiline
                minRows={4}
                label={t('accident.description')}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            disabled={createMut.isPending}
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

export default IndustrialAccidentPage
