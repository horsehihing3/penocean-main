import { useMemo, useState } from 'react'
import {
  Box,
  Stack,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  GridColDef,
  GridColumnVisibilityModel,
} from '@mui/x-data-grid'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import AppDatePicker from '../../components/common/AppDatePicker'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListTable from '../../components/common/ListTable'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import axios from 'axios'
import { dailySafetyLogApi } from '../../api/dailySafetyLogApi'
import { lookupApi } from '../../api/lookupApi'
import type {
  CreateDailySafetyLogPayload,
  DailySafetyLogResponse,
  ReceivedVia,
} from '../../types/dailySafetyLog'

type SnackbarState = { open: boolean; message: string; severity: 'success' | 'error' }

const initialForm: CreateDailySafetyLogPayload = {
  vesselId: 0,
  logDate: '',
  representativeName: '',
  attendeesCount: 0,
  trainingContent: '',
  receivedVia: 'UPLOAD',
}

const DailySafetyLogPage: React.FC = () => {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const qc = useQueryClient()

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState<CreateDailySafetyLogPayload>(initialForm)

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

  const columnVisibilityModel: GridColumnVisibilityModel = useMemo(
    () =>
      isMobile
        ? {
            companyName: false,
            attendeesCount: false,
            receivedVia: false,
          }
        : {},
    [isMobile]
  )

  const listQuery = useQuery({
    queryKey: ['daily-safety-logs', { page, pageSize, dateFrom, dateTo }],
    queryFn: () =>
      dailySafetyLogApi.list({
        page,
        size: pageSize,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
    placeholderData: (prev) => prev,
  })

  const createMut = useMutation({
    mutationFn: (payload: CreateDailySafetyLogPayload) => dailySafetyLogApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-safety-logs'] })
      setSnackbar({ open: true, message: t('common.save'), severity: 'success' })
      setCreateOpen(false)
      setForm(initialForm)
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


  // [2026-08-03] 목록 필터 초기화 (새로고침 버튼)
  const resetFilters = () => {
    setDateFrom('')
    setDateTo('')
    setPage(0)
  }

  const columns: GridColDef<DailySafetyLogResponse>[] = [
    {
      field: 'logDate',
      headerName: t('dailySafetyLog.logDate'),
      width: 130,
      valueFormatter: (p) => (p.value ? formatDate(p.value as string) : ''),
    },
    { field: 'vesselName', headerName: t('accessRequest.vessel'), flex: 1, minWidth: 140 },
    { field: 'companyName', headerName: t('accessRequest.company'), flex: 1, minWidth: 140 },
    {
      field: 'representativeName',
      headerName: t('dailySafetyLog.representative'),
      width: 140,
    },
    {
      field: 'attendeesCount',
      headerName: t('dailySafetyLog.attendees'),
      width: 100,
      type: 'number',
    },
    {
      field: 'trainingContent',
      headerName: t('dailySafetyLog.content'),
      flex: 2,
      minWidth: 200,
    },
    {
      field: 'receivedVia',
      headerName: t('dailySafetyLog.receivedVia'),
      width: 120,
      renderCell: (p) => (
        <Chip size="small" label={p.value as string} variant="outlined" />
      ),
    },
  ]

  const handleCreate = () => {
    createMut.mutate({
      ...form,
      vesselId: Number(form.vesselId),
      attendeesCount: Number(form.attendeesCount),
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
          {t('dailySafetyLog.pageTitle')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)}
        >
          {t('accessRequest.create')}
        </Button>
      </Stack>

      <Box>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <AppDatePicker
            label={t('accessRequest.plannedStart')}
            value={dateFrom || null}
            onChange={(iso) => {
              setDateFrom(iso ?? '')
              setPage(0)
            }}
            maxIsoDate={dateTo || null}
          />
          <AppDatePicker
            label={t('accessRequest.plannedEnd')}
            value={dateTo || null}
            onChange={(iso) => {
              setDateTo(iso ?? '')
              setPage(0)
            }}
            minIsoDate={dateFrom || null}
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

      {/* Create dialog */}
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
          {t('dailySafetyLog.pageTitle')} — {t('accessRequest.create')}
          <IconButton onClick={() => setCreateOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>{t('accessRequest.vessel')}</InputLabel>
                <Select
                  label={t('accessRequest.vessel')}
                  value={form.vesselId || ''}
                  onChange={(e) =>
                    setForm({ ...form, vesselId: e.target.value === '' ? 0 : Number(e.target.value) })
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
                label={t('dailySafetyLog.logDate')}
                value={form.logDate || null}
                onChange={(iso) => setForm({ ...form, logDate: iso ?? '' })}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={t('dailySafetyLog.representative')}
                fullWidth
                required
                value={form.representativeName}
                onChange={(e) =>
                  setForm({ ...form, representativeName: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={t('dailySafetyLog.attendees')}
                type="number"
                fullWidth
                required
                value={form.attendeesCount || ''}
                onChange={(e) =>
                  setForm({ ...form, attendeesCount: Number(e.target.value) })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label={t('dailySafetyLog.receivedVia')}
                fullWidth
                value={form.receivedVia}
                onChange={(e) =>
                  setForm({ ...form, receivedVia: e.target.value as ReceivedVia })
                }
              >
                <MenuItem value="KAKAO">KAKAO</MenuItem>
                <MenuItem value="EMAIL">EMAIL</MenuItem>
                <MenuItem value="UPLOAD">UPLOAD</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label={t('dailySafetyLog.content')}
                fullWidth
                required
                multiline
                minRows={3}
                value={form.trainingContent}
                onChange={(e) =>
                  setForm({ ...form, trainingContent: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                {t('dailySafetyLog.scan')}: {t('common.comingSoon')}
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={createMut.isPending}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={createMut.isPending}
          >
            {createMut.isPending ? <CircularProgress size={20} /> : t('common.save')}
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

export default DailySafetyLogPage
