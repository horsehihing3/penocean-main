import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
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
import AppDatePicker from '../../components/common/AppDatePicker'
import { useConfirm } from '../../components/common/ConfirmDialogProvider'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { format, parseISO } from 'date-fns'
import { healthApi } from '../../api/healthApi'
import { useAuth } from '../../context/AuthContext'
import type {
  HealthCheckupListItem,
  HealthCheckupPayload,
  HealthCheckupType,
  HealthVitalPayload,
} from '../../types/health'

type SnackbarState = { open: boolean; message: string; severity: 'success' | 'error' }

const CHECKUP_TYPES: HealthCheckupType[] = ['GENERAL', 'SPECIAL', 'PRE_EMPLOYMENT']

const HealthCheckupPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const qc = useQueryClient()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { user } = useAuth()

  const isAdmin = user?.role === 'ADMIN'

  const [keyword, setKeyword] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [userIdFilter, setUserIdFilter] = useState<number | ''>('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  })

  const emptyPayload: HealthCheckupPayload = {
    userId: isAdmin ? 0 : user?.id ?? 0,
    checkupDate: '',
    hospitalName: '',
    checkupType: 'GENERAL',
    summary: '',
  }
  const emptyVital: HealthVitalPayload = {
    measuredDate: '',
    systolicBp: null,
    diastolicBp: null,
    fastingGlucose: null,
    hba1c: null,
    totalCholesterol: null,
    ldl: null,
    hdl: null,
    triglyceride: null,
    bmi: null,
    waistCm: null,
    isHypertension: false,
    isDiabetes: false,
    isDyslipidemia: false,
  }
  const [form, setForm] = useState<HealthCheckupPayload>(emptyPayload)
  const [vital, setVital] = useState<HealthVitalPayload>(emptyVital)
  const [file, setFile] = useState<File | null>(null)

  const columnVisibilityModel: GridColumnVisibilityModel = useMemo(
    () =>
      isMobile
        ? {
            hospitalName: false,
            summary: false,
          }
        : {},
    [isMobile]
  )

  const listQuery = useQuery({
    queryKey: ['health', 'checkups', { keyword, userIdFilter, page, pageSize }],
    queryFn: () =>
      healthApi.list({
        keyword: keyword || undefined,
        userId: isAdmin
          ? userIdFilter === ''
            ? undefined
            : userIdFilter
          : user?.id,
        page,
        size: pageSize,
      }),
    placeholderData: (prev) => prev,
  })

  const detailQuery = useQuery({
    queryKey: ['health', 'checkups', 'detail', selectedId],
    queryFn: () => healthApi.detail(selectedId as number),
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
    mutationFn: () => healthApi.create(form, vital, file ?? undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['health', 'checkups'] })
      setSnackbar({ open: true, message: t('health.checkup.createSuccess'), severity: 'success' })
      setCreateOpen(false)
      setForm(emptyPayload)
      setVital(emptyVital)
      setFile(null)
    },
    onError: (err) => {
      setSnackbar({ open: true, message: extractErrorMessage(err), severity: 'error' })
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => healthApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['health', 'checkups'] })
      setSelectedId(null)
    },
  })

  const formatDate = (iso: string) => {
    try {
      return format(parseISO(iso), 'yyyy-MM-dd')
    } catch {
      return iso
    }
  }

  const typeLabel = (v: HealthCheckupType) => t(`health.checkup.types.${v}`)

  const columns: GridColDef<HealthCheckupListItem>[] = [
    {
      field: 'checkupDate',
      headerName: t('health.checkup.checkupDate'),
      width: 120,
      valueFormatter: (p) => (p.value ? formatDate(p.value as string) : ''),
    },
    {
      field: 'userName',
      headerName: t('approval.colName'),
      width: 120,
    },
    {
      field: 'hospitalName',
      headerName: t('health.checkup.hospital'),
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'checkupType',
      headerName: t('health.checkup.checkupType'),
      width: 120,
      renderCell: (p) => (
        <Chip size="small" label={typeLabel(p.value as HealthCheckupType)} />
      ),
    },
    {
      field: 'summary',
      headerName: t('health.checkup.summary'),
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
      field: 'reportFileUrl',
      headerName: 'PDF',
      width: 80,
      sortable: false,
      renderCell: (p) =>
        p.value ? (
          <MuiLink
            href={p.value as string}
            target="_blank"
            rel="noopener"
            onClick={(e) => e.stopPropagation()}
          >
            PDF
          </MuiLink>
        ) : (
          '-'
        ),
    },
  ]

  const handleRowClick = (params: GridRowParams<HealthCheckupListItem>) => {
    setSelectedId(params.row.id)
  }

  const closeDetail = () => setSelectedId(null)

  const applyKeyword = () => {
    setKeyword(keywordInput.trim())
    setPage(0)
  }

  const submitCreate = () => {
    if (!form.checkupDate || !form.hospitalName.trim() || !form.summary.trim()) {
      setSnackbar({ open: true, message: t('errors.required'), severity: 'error' })
      return
    }
    if (isAdmin && !form.userId) {
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
          {t('health.checkup.pageTitle')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setForm({ ...emptyPayload, userId: isAdmin ? 0 : user?.id ?? 0 })
            setVital(emptyVital)
            setFile(null)
            setCreateOpen(true)
          }}
        >
          {t('health.checkup.create')}
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          {isAdmin && (
            <TextField
              size="small"
              type="number"
              label={t('health.checkup.userId')}
              value={userIdFilter}
              onChange={(e) =>
                setUserIdFilter(e.target.value === '' ? '' : Number(e.target.value))
              }
              sx={{ minWidth: 140 }}
            />
          )}
          <TextField
            size="small"
            label={t('approval.filterKeyword')}
            placeholder={t('health.checkup.hospital')}
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
          {t('health.checkup.detailTitle')}
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
            <Stack spacing={3}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    {t('approval.colName')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {detail.userName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    {t('health.checkup.checkupDate')}
                  </Typography>
                  <Typography variant="body1">{formatDate(detail.checkupDate)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    {t('health.checkup.hospital')}
                  </Typography>
                  <Typography variant="body1">{detail.hospitalName}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    {t('health.checkup.checkupType')}
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip size="small" label={typeLabel(detail.checkupType)} />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    {t('health.checkup.summary')}
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, whiteSpace: 'pre-wrap', mt: 0.5 }}>
                    {detail.summary}
                  </Paper>
                </Grid>
                {detail.reportFileUrl && (
                  <Grid item xs={12}>
                    <MuiLink href={detail.reportFileUrl} target="_blank" rel="noopener">
                      {t('health.checkup.reportFile')}
                    </MuiLink>
                  </Grid>
                )}
              </Grid>

              <Divider />

              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  {t('health.vitals.title')}
                </Typography>
                {(detail.vitals ?? []).length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t('common.noData')}
                  </Typography>
                ) : (
                  <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>{t('health.vitals.measuredDate')}</TableCell>
                          <TableCell>{t('health.vitals.bp')}</TableCell>
                          <TableCell>{t('health.vitals.glucose')}</TableCell>
                          <TableCell>{t('health.vitals.ldl')}</TableCell>
                          <TableCell>BMI</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(detail.vitals ?? []).map((v) => (
                          <TableRow key={v.id}>
                            <TableCell>{formatDate(v.measuredDate)}</TableCell>
                            <TableCell>
                              {v.systolicBp ?? '-'} / {v.diastolicBp ?? '-'}
                            </TableCell>
                            <TableCell>{v.fastingGlucose ?? '-'}</TableCell>
                            <TableCell>{v.ldl ?? '-'}</TableCell>
                            <TableCell>{v.bmi ?? '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Paper>
                )}
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  {t('health.consultation.title')}
                </Typography>
                {(detail.consultations ?? []).length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t('common.noData')}
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {(detail.consultations ?? []).map((c) => (
                      <Paper key={c.id} variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(c.consultationDate)} — {c.counselor}
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>
                          {c.content}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          {isAdmin && detail && (
            <Button
              color="error"
              onClick={async () => {
                if (await confirm({
                  title: t('common.delete'),
                  message: t('health.checkup.deleteConfirm'),
                  severity: 'error',
                  confirmText: t('common.delete'),
                })) {
                  deleteMut.mutate(detail.id)
                }
              }}
            >
              {t('common.delete')}
            </Button>
          )}
          {detail && (
            <Button
              variant="outlined"
              onClick={() => {
                closeDetail()
                navigate(`/health/trend?userId=${detail.userId}`)
              }}
            >
              {t('health.trend.openBtn')}
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
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
          {t('health.checkup.create')}
          <IconButton onClick={() => setCreateOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {isAdmin && (
              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  fullWidth
                  type="number"
                  label={t('health.checkup.userId')}
                  value={form.userId || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, userId: Number(e.target.value) || 0 }))
                  }
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <AppDatePicker
                label={t('health.checkup.checkupDate')}
                value={form.checkupDate || null}
                onChange={(iso) => setForm((f) => ({ ...f, checkupDate: iso ?? '' }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small"
                fullWidth
                label={t('health.checkup.hospital')}
                value={form.hospitalName}
                onChange={(e) => setForm((f) => ({ ...f, hospitalName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>{t('health.checkup.checkupType')}</InputLabel>
                <Select
                  label={t('health.checkup.checkupType')}
                  value={form.checkupType}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      checkupType: e.target.value as HealthCheckupType,
                    }))
                  }
                >
                  {CHECKUP_TYPES.map((v) => (
                    <MenuItem key={v} value={v}>
                      {typeLabel(v)}
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
                minRows={3}
                label={t('health.checkup.summary')}
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('health.vitals.title')}
                </Typography>
              </Divider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <AppDatePicker
                label={t('health.vitals.measuredDate')}
                value={vital.measuredDate || null}
                onChange={(iso) => setVital((v) => ({ ...v, measuredDate: iso ?? '' }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                size="small"
                fullWidth
                type="number"
                label={t('health.vitals.systolic')}
                value={vital.systolicBp ?? ''}
                onChange={(e) =>
                  setVital((v) => ({
                    ...v,
                    systolicBp: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                size="small"
                fullWidth
                type="number"
                label={t('health.vitals.diastolic')}
                value={vital.diastolicBp ?? ''}
                onChange={(e) =>
                  setVital((v) => ({
                    ...v,
                    diastolicBp: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                size="small"
                fullWidth
                type="number"
                label={t('health.vitals.fastingGlucose')}
                value={vital.fastingGlucose ?? ''}
                onChange={(e) =>
                  setVital((v) => ({
                    ...v,
                    fastingGlucose: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                size="small"
                fullWidth
                type="number"
                label="HbA1c"
                value={vital.hba1c ?? ''}
                onChange={(e) =>
                  setVital((v) => ({
                    ...v,
                    hba1c: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                size="small"
                fullWidth
                type="number"
                label="LDL"
                value={vital.ldl ?? ''}
                onChange={(e) =>
                  setVital((v) => ({
                    ...v,
                    ldl: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                size="small"
                fullWidth
                type="number"
                label="HDL"
                value={vital.hdl ?? ''}
                onChange={(e) =>
                  setVital((v) => ({
                    ...v,
                    hdl: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                size="small"
                fullWidth
                type="number"
                label="BMI"
                value={vital.bmi ?? ''}
                onChange={(e) =>
                  setVital((v) => ({
                    ...v,
                    bmi: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              />
            </Grid>

            <Grid item xs={12}>
              <Button variant="outlined" component="label" size="small">
                {t('health.checkup.reportFile')}
                <input
                  hidden
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </Button>
              {file && (
                <Typography variant="caption" sx={{ ml: 2 }}>
                  {file.name}
                </Typography>
              )}
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

export default HealthCheckupPage
