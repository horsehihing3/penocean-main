import { useMemo, useRef, useState } from 'react'
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  DataGrid,
  GridColDef,
  GridColumnVisibilityModel,
} from '@mui/x-data-grid'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import UploadIcon from '@mui/icons-material/Upload'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { format, parseISO } from 'date-fns'
import {
  safetyPerformanceSeaApi,
  seaCrewIncidentApi,
} from '../../api/safetyPerformanceApi'
import { lookupApi } from '../../api/lookupApi'
import type {
  SafetyPerformanceSea,
  SafetyPerformanceSeaUpsertPayload,
  SeaCrewIncident,
  SeaCrewIncidentType,
} from '../../types/safetyPerformance'

type SnackbarState = { open: boolean; message: string; severity: 'success' | 'error' }

const POS_SM_URL = 'https://pos-sm.panocean.com'
const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i)
const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1)

const SafetyPerformanceSeaPage: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [tab, setTab] = useState(0)
  const [periodYear, setPeriodYear] = useState<number | ''>(currentYear)
  const [periodMonth, setPeriodMonth] = useState<number | ''>('')
  const [vesselId, setVesselId] = useState<string>('')
  const [incidentType, setIncidentType] = useState<SeaCrewIncidentType | ''>('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  const [upsertOpen, setUpsertOpen] = useState(false)

  const vesselsQuery = useQuery({
    queryKey: ['lookup', 'vessels'],
    queryFn: () => lookupApi.vessels(),
  })
  const vessels = vesselsQuery.data ?? []
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const emptyForm: SafetyPerformanceSeaUpsertPayload = {
    vesselId: 0,
    periodYear: currentYear,
    periodMonth: new Date().getMonth() + 1,
    crewCount: 0,
    illnessCount: 0,
    injuryCount: 0,
    evacuationCount: 0,
    sickLeaveDays: 0,
    comment: '',
  }
  const [form, setForm] = useState<SafetyPerformanceSeaUpsertPayload>(emptyForm)

  const monthlyColumnVisibility: GridColumnVisibilityModel = useMemo(
    () =>
      isMobile
        ? { evacuationCount: false, sickLeaveDays: false, posSmSyncedAt: false }
        : {},
    [isMobile]
  )

  const monthlyQuery = useQuery({
    queryKey: [
      'safetyPerformance',
      'sea',
      { periodYear, periodMonth, vesselId, page, pageSize },
    ],
    queryFn: () =>
      safetyPerformanceSeaApi.list({
        periodYear: periodYear === '' ? undefined : Number(periodYear),
        periodMonth: periodMonth === '' ? undefined : Number(periodMonth),
        vesselId: vesselId ? Number(vesselId) : undefined,
        page,
        size: pageSize,
      }),
    enabled: tab === 0,
    placeholderData: (prev) => prev,
  })

  const crewQuery = useQuery({
    queryKey: [
      'seaCrewIncidents',
      { periodYear, periodMonth, vesselId, incidentType, page, pageSize },
    ],
    queryFn: () =>
      seaCrewIncidentApi.list({
        periodYear: periodYear === '' ? undefined : Number(periodYear),
        periodMonth: periodMonth === '' ? undefined : Number(periodMonth),
        vesselId: vesselId ? Number(vesselId) : undefined,
        incidentType: incidentType || undefined,
        page,
        size: pageSize,
      }),
    enabled: tab === 1,
    placeholderData: (prev) => prev,
  })

  const extractErrorMessage = (err: unknown): string => {
    if (axios.isAxiosError(err)) {
      const m = (err.response?.data as { message?: string } | undefined)?.message
      if (m) return m
    }
    return t('approval.actionFailed')
  }

  const upsertMut = useMutation({
    mutationFn: (payload: SafetyPerformanceSeaUpsertPayload) =>
      safetyPerformanceSeaApi.upsert(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['safetyPerformance', 'sea'] })
      setSnackbar({ open: true, message: t('performance.saveSuccess'), severity: 'success' })
      setUpsertOpen(false)
      setForm(emptyForm)
    },
    onError: (err) =>
      setSnackbar({ open: true, message: extractErrorMessage(err), severity: 'error' }),
  })

  const importMut = useMutation({
    mutationFn: (file: File) => safetyPerformanceSeaApi.importExcel(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seaCrewIncidents'] })
      qc.invalidateQueries({ queryKey: ['safetyPerformance', 'sea'] })
      setSnackbar({ open: true, message: t('performance.importSuccess'), severity: 'success' })
    },
    onError: (err) =>
      setSnackbar({ open: true, message: extractErrorMessage(err), severity: 'error' }),
  })

  const formatDate = (iso: string) => {
    try {
      return format(parseISO(iso), 'yyyy-MM-dd')
    } catch {
      return iso
    }
  }

  const monthlyColumns: GridColDef<SafetyPerformanceSea>[] = [
    {
      field: 'vesselName',
      headerName: t('accessRequest.vessel'),
      flex: 1,
      minWidth: 140,
      valueGetter: (p) => p.row.vesselName || `#${p.row.vesselId}`,
    },
    {
      field: 'period',
      headerName: t('performance.period'),
      width: 110,
      sortable: false,
      valueGetter: (p) => `${p.row.periodYear}-${String(p.row.periodMonth).padStart(2, '0')}`,
    },
    { field: 'crewCount', headerName: t('performance.crewCount'), width: 100, type: 'number' },
    { field: 'illnessCount', headerName: t('performance.illnessCount'), width: 100, type: 'number' },
    { field: 'injuryCount', headerName: t('performance.injuryCount'), width: 100, type: 'number' },
    { field: 'evacuationCount', headerName: t('performance.evacuationCount'), width: 110, type: 'number' },
    { field: 'sickLeaveDays', headerName: t('performance.sickLeaveDays'), width: 120, type: 'number' },
    {
      field: 'posSmSyncedAt',
      headerName: t('performance.posSmSyncedAt'),
      width: 140,
      valueFormatter: (p) => (p.value ? formatDate(p.value as string) : ''),
    },
  ]

  const crewColumns: GridColDef<SeaCrewIncident>[] = [
    {
      field: 'vesselName',
      headerName: t('accessRequest.vessel'),
      width: 140,
      valueGetter: (p) => p.row.vesselName || `#${p.row.vesselId}`,
    },
    {
      field: 'period',
      headerName: t('performance.period'),
      width: 100,
      sortable: false,
      valueGetter: (p) => `${p.row.periodYear}-${String(p.row.periodMonth).padStart(2, '0')}`,
    },
    { field: 'crewName', headerName: t('performance.crewName'), width: 130 },
    { field: 'crewRole', headerName: t('performance.crewRole'), width: 120 },
    {
      field: 'incidentType',
      headerName: t('performance.incidentType'),
      width: 110,
      renderCell: (p) => (
        <Chip
          size="small"
          label={t(`performance.incidentTypes.${p.value as SeaCrewIncidentType}`)}
          color={(p.value as SeaCrewIncidentType) === 'ILLNESS' ? 'info' : 'warning'}
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'incidentDate',
      headerName: t('performance.incidentDate'),
      width: 120,
      valueFormatter: (p) => (p.value ? formatDate(p.value as string) : ''),
    },
    { field: 'diagnosis', headerName: t('performance.diagnosis'), flex: 1, minWidth: 180 },
    {
      field: 'evacuationRequired',
      headerName: t('performance.evacRequired'),
      width: 110,
      type: 'boolean',
    },
    {
      field: 'returnToDutyDate',
      headerName: t('performance.returnToDutyDate'),
      width: 140,
      valueFormatter: (p) => (p.value ? formatDate(p.value as string) : ''),
    },
  ]

  const submitUpsert = () => {
    if (!form.vesselId || !form.periodYear || !form.periodMonth) {
      setSnackbar({ open: true, message: t('errors.required'), severity: 'error' })
      return
    }
    upsertMut.mutate(form)
  }

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      importMut.mutate(file)
      e.target.value = ''
    }
  }

  const isMonthlyTab = tab === 0

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        spacing={1}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t('performance.sea.pageTitle')}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<OpenInNewIcon />}
            href={POS_SM_URL}
            target="_blank"
            rel="noopener"
          >
            {t('performance.posSm')}
          </Button>
          {!isMonthlyTab && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                hidden
                onChange={handleFilePick}
              />
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                disabled={importMut.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                {importMut.isPending ? (
                  <CircularProgress size={18} />
                ) : (
                  t('performance.excelImport')
                )}
              </Button>
            </>
          )}
          {isMonthlyTab && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setForm({
                  ...emptyForm,
                  periodYear: periodYear === '' ? currentYear : Number(periodYear),
                  periodMonth:
                    periodMonth === ''
                      ? new Date().getMonth() + 1
                      : Number(periodMonth),
                })
                setUpsertOpen(true)
              }}
            >
              {t('performance.monthlyEntry')}
            </Button>
          )}
        </Stack>
      </Stack>

      <Paper variant="outlined">
        <Tabs
          value={tab}
          onChange={(_, v) => {
            setTab(v)
            setPage(0)
          }}
          sx={{ px: 2 }}
        >
          <Tab label={t('performance.tabMonthly')} />
          <Tab label={t('performance.tabCrew')} />
        </Tabs>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel>{t('performance.year')}</InputLabel>
            <Select
              label={t('performance.year')}
              value={periodYear}
              onChange={(e) => {
                setPeriodYear(e.target.value === '' ? '' : Number(e.target.value))
                setPage(0)
              }}
            >
              <MenuItem value="">{t('approval.filterAll')}</MenuItem>
              {yearOptions.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel>{t('performance.month')}</InputLabel>
            <Select
              label={t('performance.month')}
              value={periodMonth}
              onChange={(e) => {
                setPeriodMonth(e.target.value === '' ? '' : Number(e.target.value))
                setPage(0)
              }}
            >
              <MenuItem value="">{t('approval.filterAll')}</MenuItem>
              {monthOptions.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>{t('accessRequest.vessel')}</InputLabel>
            <Select
              label={t('accessRequest.vessel')}
              value={vesselId}
              onChange={(e) => {
                setVesselId(String(e.target.value))
                setPage(0)
              }}
            >
              <MenuItem value="">{t('approval.filterAll')}</MenuItem>
              {vessels.map((v) => (
                <MenuItem key={v.id} value={String(v.id)}>
                  {v.name}
                  {v.imoNumber ? ` (IMO ${v.imoNumber})` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {!isMonthlyTab && (
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>{t('performance.incidentType')}</InputLabel>
              <Select
                label={t('performance.incidentType')}
                value={incidentType}
                onChange={(e) => {
                  setIncidentType(e.target.value as SeaCrewIncidentType | '')
                  setPage(0)
                }}
              >
                <MenuItem value="">{t('approval.filterAll')}</MenuItem>
                <MenuItem value="ILLNESS">{t('performance.incidentTypes.ILLNESS')}</MenuItem>
                <MenuItem value="INJURY">{t('performance.incidentTypes.INJURY')}</MenuItem>
              </Select>
            </FormControl>
          )}
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
        {isMonthlyTab ? (
          <>
            {monthlyQuery.isError && (
              <Alert severity="error" sx={{ m: 2 }}>
                {t('approval.loadError')}
              </Alert>
            )}
            <DataGrid
              rows={monthlyQuery.data?.content ?? []}
              getRowId={(r) => r.id}
              columns={monthlyColumns}
              columnVisibilityModel={monthlyColumnVisibility}
              loading={monthlyQuery.isLoading || monthlyQuery.isFetching}
              paginationMode="server"
              rowCount={monthlyQuery.data?.totalElements ?? 0}
              paginationModel={{ page, pageSize }}
              onPaginationModelChange={(m) => {
                setPage(m.page)
                setPageSize(m.pageSize)
              }}
              pageSizeOptions={[10, 20, 50]}
              disableRowSelectionOnClick
              localeText={{ noRowsLabel: t('approval.empty') }}
              sx={{ border: 0, flex: 1 }}
            />
          </>
        ) : (
          <>
            {crewQuery.isError && (
              <Alert severity="error" sx={{ m: 2 }}>
                {t('approval.loadError')}
              </Alert>
            )}
            <DataGrid
              rows={crewQuery.data?.content ?? []}
              getRowId={(r) => r.id}
              columns={crewColumns}
              loading={crewQuery.isLoading || crewQuery.isFetching}
              paginationMode="server"
              rowCount={crewQuery.data?.totalElements ?? 0}
              paginationModel={{ page, pageSize }}
              onPaginationModelChange={(m) => {
                setPage(m.page)
                setPageSize(m.pageSize)
              }}
              pageSizeOptions={[10, 20, 50]}
              disableRowSelectionOnClick
              localeText={{ noRowsLabel: t('approval.empty') }}
              sx={{ border: 0, flex: 1 }}
            />
          </>
        )}
      </Paper>

      <Dialog
        open={upsertOpen}
        onClose={() => setUpsertOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {t('performance.monthlyEntry')}
          <IconButton onClick={() => setUpsertOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={4}>
              <FormControl size="small" fullWidth required>
                <InputLabel>{t('accessRequest.vessel')}</InputLabel>
                <Select
                  label={t('accessRequest.vessel')}
                  value={form.vesselId || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, vesselId: e.target.value === '' ? 0 : Number(e.target.value) }))
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
            <Grid item xs={6} sm={4}>
              <FormControl size="small" fullWidth>
                <InputLabel>{t('performance.year')}</InputLabel>
                <Select
                  label={t('performance.year')}
                  value={form.periodYear}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, periodYear: Number(e.target.value) }))
                  }
                >
                  {yearOptions.map((y) => (
                    <MenuItem key={y} value={y}>
                      {y}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={4}>
              <FormControl size="small" fullWidth>
                <InputLabel>{t('performance.month')}</InputLabel>
                <Select
                  label={t('performance.month')}
                  value={form.periodMonth}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, periodMonth: Number(e.target.value) }))
                  }
                >
                  {monthOptions.map((m) => (
                    <MenuItem key={m} value={m}>
                      {m}
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
                label={t('performance.crewCount')}
                value={form.crewCount || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, crewCount: Number(e.target.value) || 0 }))
                }
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                size="small"
                fullWidth
                type="number"
                label={t('performance.illnessCount')}
                value={form.illnessCount || ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    illnessCount: Number(e.target.value) || 0,
                  }))
                }
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                size="small"
                fullWidth
                type="number"
                label={t('performance.injuryCount')}
                value={form.injuryCount || ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    injuryCount: Number(e.target.value) || 0,
                  }))
                }
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                size="small"
                fullWidth
                type="number"
                label={t('performance.evacuationCount')}
                value={form.evacuationCount || ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    evacuationCount: Number(e.target.value) || 0,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small"
                fullWidth
                type="number"
                label={t('performance.sickLeaveDays')}
                value={form.sickLeaveDays || ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    sickLeaveDays: Number(e.target.value) || 0,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                size="small"
                fullWidth
                multiline
                minRows={2}
                label={t('performance.comment')}
                value={form.comment || ''}
                onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setUpsertOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            disabled={upsertMut.isPending}
            onClick={submitUpsert}
          >
            {upsertMut.isPending ? <CircularProgress size={20} /> : t('common.save')}
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

export default SafetyPerformanceSeaPage
