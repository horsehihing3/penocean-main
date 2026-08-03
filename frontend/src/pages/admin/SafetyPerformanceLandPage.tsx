import { useMemo, useState } from 'react'
import {
  Box,
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
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  GridColDef,
  GridColumnVisibilityModel,
} from '@mui/x-data-grid'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import DownloadIcon from '@mui/icons-material/Download'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListTable from '../../components/common/ListTable'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { safetyPerformanceLandApi } from '../../api/safetyPerformanceApi'
import type {
  SafetyPerformanceLand,
  SafetyPerformanceLandUpsertPayload,
} from '../../types/safetyPerformance'

type SnackbarState = { open: boolean; message: string; severity: 'success' | 'error' }

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i)
const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1)

const SafetyPerformanceLandPage: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [periodYear, setPeriodYear] = useState<number | ''>(currentYear)
  const [periodMonth, setPeriodMonth] = useState<number | ''>('')
  const [departmentId, setDepartmentId] = useState<string>('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  const [upsertOpen, setUpsertOpen] = useState(false)
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  })

  const emptyForm: SafetyPerformanceLandUpsertPayload = {
    departmentId: 0,
    periodYear: currentYear,
    periodMonth: new Date().getMonth() + 1,
    manhours: 0,
    accidentCount: 0,
    lostTimeCount: 0,
    fatalityCount: 0,
    budgetPlanned: 0,
    budgetUsed: 0,
    fcmProjectCode: '',
    vbpProjectCode: '',
    comment: '',
  }
  const [form, setForm] = useState<SafetyPerformanceLandUpsertPayload>(emptyForm)

  const columnVisibilityModel: GridColumnVisibilityModel = useMemo(
    () =>
      isMobile
        ? {
            lostTimeCount: false,
            budgetPlanned: false,
            budgetUsed: false,
            fcmProjectCode: false,
            vbpProjectCode: false,
          }
        : {},
    [isMobile]
  )

  const listQuery = useQuery({
    queryKey: [
      'safetyPerformance',
      'land',
      { periodYear, periodMonth, departmentId, page, pageSize },
    ],
    queryFn: () =>
      safetyPerformanceLandApi.list({
        periodYear: periodYear === '' ? undefined : Number(periodYear),
        periodMonth: periodMonth === '' ? undefined : Number(periodMonth),
        departmentId: departmentId ? Number(departmentId) : undefined,
        page,
        size: pageSize,
      }),
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
    mutationFn: (payload: SafetyPerformanceLandUpsertPayload) =>
      safetyPerformanceLandApi.upsert(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['safetyPerformance', 'land'] })
      setSnackbar({ open: true, message: t('performance.saveSuccess'), severity: 'success' })
      setUpsertOpen(false)
      setForm(emptyForm)
    },
    onError: (err) => {
      setSnackbar({ open: true, message: extractErrorMessage(err), severity: 'error' })
    },
  })


  // [2026-08-03] 목록 필터 초기화 (새로고침 버튼)
  const resetFilters = () => {
    setDepartmentId('')
    setPeriodMonth('')
    setPeriodYear(currentYear)
    setPage(0)
  }

  const columns: GridColDef<SafetyPerformanceLand>[] = [
    {
      field: 'departmentName',
      headerName: t('performance.department'),
      flex: 1,
      minWidth: 140,
      valueGetter: (p) => p.row.departmentName || `#${p.row.departmentId}`,
    },
    {
      field: 'period',
      headerName: t('performance.period'),
      width: 110,
      sortable: false,
      valueGetter: (p) => `${p.row.periodYear}-${String(p.row.periodMonth).padStart(2, '0')}`,
    },
    { field: 'manhours', headerName: t('performance.manhours'), width: 120, type: 'number' },
    { field: 'accidentCount', headerName: t('performance.accidentCount'), width: 110, type: 'number' },
    { field: 'lostTimeCount', headerName: t('performance.lostTimeCount'), width: 110, type: 'number' },
    {
      field: 'trir',
      headerName: t('performance.trir'),
      width: 100,
      type: 'number',
      valueFormatter: (p) => (p.value != null ? Number(p.value).toFixed(2) : ''),
    },
    {
      field: 'ltir',
      headerName: t('performance.ltir'),
      width: 100,
      type: 'number',
      valueFormatter: (p) => (p.value != null ? Number(p.value).toFixed(2) : ''),
    },
    {
      field: 'budgetPlanned',
      headerName: t('performance.budgetPlanned'),
      width: 130,
      type: 'number',
    },
    {
      field: 'budgetUsed',
      headerName: t('performance.budgetUsed'),
      width: 130,
      type: 'number',
    },
    { field: 'fcmProjectCode', headerName: t('performance.fcm'), width: 110 },
    { field: 'vbpProjectCode', headerName: t('performance.vbp'), width: 110 },
  ]

  const submitUpsert = () => {
    if (!form.departmentId || !form.periodYear || !form.periodMonth) {
      setSnackbar({ open: true, message: t('errors.required'), severity: 'error' })
      return
    }
    upsertMut.mutate(form)
  }

  const handleExport = () => {
    const url = safetyPerformanceLandApi.exportUrl(
      periodYear === '' ? undefined : Number(periodYear),
      periodMonth === '' ? undefined : Number(periodMonth)
    )
    window.open(url, '_blank')
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
          {t('performance.land.pageTitle')}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            {t('performance.excelExport')}
          </Button>
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
        </Stack>
      </Stack>

      <Box>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <Select
              displayEmpty
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
            <Select
              displayEmpty
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
          <TextField
            size="small"
            label={t('performance.departmentId')}
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value.replace(/\D/g, ''))}
            sx={{ minWidth: 140 }}
          />
          <IconButton onClick={resetFilters} size="small">
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Box>

      {listQuery.isError && <Alert severity="error">{t('approval.loadError')}</Alert>}

      <ListTable
        rows={listQuery.data?.content ?? []}
        getRowId={(r) => r.id}
        columns={columns}
        columnVisibilityModel={columnVisibilityModel}
        loading={listQuery.isLoading || listQuery.isFetching}
        rowCount={listQuery.data?.totalElements ?? 0}
        paginationModel={{ page, pageSize }}
        onPaginationModelChange={(m) => {
          setPage(m.page)
          setPageSize(m.pageSize)
        }}
        showRowNumber={false}
        emptyMessage={t('approval.empty')}
      />

      {/* Upsert Dialog */}
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
              <TextField
                size="small"
                fullWidth
                type="number"
                label={t('performance.departmentId')}
                value={form.departmentId || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, departmentId: Number(e.target.value) || 0 }))
                }
              />
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
                label={t('performance.manhours')}
                value={form.manhours || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, manhours: Number(e.target.value) || 0 }))
                }
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                size="small"
                fullWidth
                type="number"
                label={t('performance.accidentCount')}
                value={form.accidentCount || ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    accidentCount: Number(e.target.value) || 0,
                  }))
                }
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                size="small"
                fullWidth
                type="number"
                label={t('performance.lostTimeCount')}
                value={form.lostTimeCount || ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    lostTimeCount: Number(e.target.value) || 0,
                  }))
                }
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                size="small"
                fullWidth
                type="number"
                label={t('performance.fatalityCount')}
                value={form.fatalityCount || ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    fatalityCount: Number(e.target.value) || 0,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small"
                fullWidth
                type="number"
                label={t('performance.budgetPlanned')}
                value={form.budgetPlanned || ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    budgetPlanned: Number(e.target.value) || 0,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small"
                fullWidth
                type="number"
                label={t('performance.budgetUsed')}
                value={form.budgetUsed || ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    budgetUsed: Number(e.target.value) || 0,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small"
                fullWidth
                label={t('performance.fcm')}
                value={form.fcmProjectCode || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fcmProjectCode: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small"
                fullWidth
                label={t('performance.vbp')}
                value={form.vbpProjectCode || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, vbpProjectCode: e.target.value }))
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

export default SafetyPerformanceLandPage
