import { useEffect, useMemo, useState } from 'react'
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
import AppDatePicker from '../../components/common/AppDatePicker'
import { useConfirm } from '../../components/common/ConfirmDialogProvider'
import SearchIcon from '@mui/icons-material/Search'
import BlockIcon from '@mui/icons-material/Block'
import AddIcon from '@mui/icons-material/Add'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { format, parseISO } from 'date-fns'
import { companyAdminApi } from '../../api/companyAdminApi'
import type {
  Company,
  CompanyCreatePayload,
  CompanyPayload,
  CompanyStatus,
} from '../../types/company'

type SnackbarState = { open: boolean; message: string; severity: 'success' | 'error' }

const INDUSTRY_OPTIONS: { code: string; label: string }[] = [
  { code: 'INSPECTION', label: '검수업' },
  { code: 'LASHING', label: '고박업' },
  { code: 'STEVEDORING', label: '하역업' },
  { code: 'SURVEY', label: '검정업' },
  { code: 'SHIP_SUPPLY', label: '선용품공급업' },
  { code: 'REPAIR', label: '수리업' },
  { code: 'PAINTING', label: '도장업' },
  { code: 'WELDING', label: '용접업' },
  { code: 'ETC', label: '기타' },
]

const STATUSES: CompanyStatus[] = ['ACTIVE', 'INACTIVE', 'SUSPENDED']

const statusColor = (s: CompanyStatus): 'success' | 'default' | 'warning' => {
  switch (s) {
    case 'ACTIVE':
      return 'success'
    case 'INACTIVE':
      return 'default'
    case 'SUSPENDED':
      return 'warning'
  }
}

const CompanyManagePage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const qc = useQueryClient()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [keyword, setKeyword] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [industryCode, setIndustryCode] = useState('')
  const [status, setStatus] = useState<CompanyStatus | ''>('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [form, setForm] = useState<CompanyPayload | null>(null)

  const emptyCreateForm: CompanyCreatePayload = {
    businessNumber: '',
    name: '',
    ceoName: '',
    address: '',
    phone: '',
    email: '',
    industryCode: 'ETC',
    status: 'ACTIVE',
    contractStartDate: null,
    contractEndDate: null,
  }
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CompanyCreatePayload>(emptyCreateForm)

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  })

  const columnVisibilityModel: GridColumnVisibilityModel = useMemo(
    () =>
      isMobile
        ? {
            ceoName: false,
            industryName: false,
            contractPeriod: false,
          }
        : {},
    [isMobile]
  )

  const listQuery = useQuery({
    queryKey: ['admin', 'companies', { keyword, industryCode, status, page, pageSize }],
    queryFn: () =>
      companyAdminApi.list({
        keyword: keyword || undefined,
        industryCode: industryCode || undefined,
        status: status || undefined,
        page,
        size: pageSize,
      }),
    placeholderData: (prev) => prev,
  })

  const detailQuery = useQuery({
    queryKey: ['admin', 'companies', 'detail', selectedId],
    queryFn: () => companyAdminApi.detail(selectedId as number),
    enabled: selectedId != null,
  })

  // Load form from detail when opened
  useEffect(() => {
    const d = detailQuery.data
    if (d && form === null) {
      setForm({
        name: d.name,
        ceoName: d.ceoName,
        address: d.address,
        phone: d.phone,
        email: d.email,
        industryCode: d.industryCode,
        status: d.status,
        contractStartDate: d.contractStartDate ?? null,
        contractEndDate: d.contractEndDate ?? null,
      })
    }
  }, [detailQuery.data, form])

  const extractErrorMessage = (err: unknown): string => {
    if (axios.isAxiosError(err)) {
      const m = (err.response?.data as { message?: string } | undefined)?.message
      if (m) return m
    }
    return t('approval.actionFailed')
  }

  const updateMut = useMutation({
    mutationFn: () => {
      if (selectedId == null || !form) throw new Error('no id')
      return companyAdminApi.update(selectedId, form)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'companies'] })
      setSnackbar({ open: true, message: t('company.saveSuccess'), severity: 'success' })
      setSelectedId(null)
      setForm(null)
    },
    onError: (err) => {
      setSnackbar({ open: true, message: extractErrorMessage(err), severity: 'error' })
    },
  })

  const createMut = useMutation({
    mutationFn: () => companyAdminApi.create(createForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'companies'] })
      setSnackbar({ open: true, message: t('company.saveSuccess'), severity: 'success' })
      setCreateOpen(false)
      setCreateForm(emptyCreateForm)
    },
    onError: (err) => {
      setSnackbar({ open: true, message: extractErrorMessage(err), severity: 'error' })
    },
  })

  const inactivateMut = useMutation({
    mutationFn: (id: number) => companyAdminApi.inactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'companies'] })
      setSnackbar({ open: true, message: t('company.inactivateSuccess'), severity: 'success' })
      setSelectedId(null)
      setForm(null)
    },
    onError: (err) => {
      setSnackbar({ open: true, message: extractErrorMessage(err), severity: 'error' })
    },
  })

  const formatDate = (iso?: string | null) => {
    if (!iso) return ''
    try {
      return format(parseISO(iso), 'yyyy-MM-dd')
    } catch {
      return iso
    }
  }

  const statusLabel = (s: CompanyStatus) => t(`company.status.${s}`)

  const columns: GridColDef<Company>[] = [
    { field: 'businessNumber', headerName: t('approval.colBusinessNumber'), width: 140 },
    { field: 'name', headerName: t('approval.colCompany'), flex: 1, minWidth: 150 },
    { field: 'ceoName', headerName: t('som.ceo'), width: 110 },
    {
      field: 'industryName',
      headerName: t('som.industry'),
      width: 140,
      valueGetter: (p) => {
        const match = INDUSTRY_OPTIONS.find((o) => o.code === p.row.industryCode)
        return match?.label ?? p.row.industryCode
      },
    },
    {
      field: 'status',
      headerName: t('approval.colStatus'),
      width: 100,
      renderCell: (p) => (
        <Chip
          size="small"
          label={statusLabel(p.value as CompanyStatus)}
          color={statusColor(p.value as CompanyStatus)}
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'contractPeriod',
      headerName: t('company.contractPeriod'),
      width: 180,
      sortable: false,
      valueGetter: (p) =>
        `${formatDate(p.row.contractStartDate) || '-'} ~ ${formatDate(p.row.contractEndDate) || '-'}`,
    },
  ]

  const handleRowClick = (params: GridRowParams<Company>) => {
    setForm(null)
    setSelectedId(params.row.id)
  }

  const applyKeyword = () => {
    setKeyword(keywordInput.trim())
    setPage(0)
  }

  const detail = detailQuery.data

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent="space-between">
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t('company.pageTitle')}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate('/admin/approval')}
          >
            {t('company.goToApproval')}
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              setCreateForm(emptyCreateForm)
              setCreateOpen(true)
            }}
          >
            {t('company.create', { defaultValue: '신규 업체 등록' })}
          </Button>
        </Stack>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>{t('som.industry')}</InputLabel>
            <Select
              label={t('som.industry')}
              value={industryCode}
              onChange={(e) => {
                setIndustryCode(e.target.value)
                setPage(0)
              }}
            >
              <MenuItem value="">{t('approval.filterAll')}</MenuItem>
              {INDUSTRY_OPTIONS.map((o) => (
                <MenuItem key={o.code} value={o.code}>
                  {o.label}
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
                setStatus(e.target.value as CompanyStatus | '')
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
          <TextField
            size="small"
            label={t('approval.filterKeyword')}
            placeholder={t('approval.colCompany')}
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

      {/* Detail Dialog */}
      <Dialog
        open={selectedId != null}
        onClose={() => {
          setSelectedId(null)
          setForm(null)
        }}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {t('company.detailTitle')}
          <IconButton
            onClick={() => {
              setSelectedId(null)
              setForm(null)
            }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailQuery.isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={32} />
            </Box>
          )}
          {detail && form && (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  fullWidth
                  label={t('approval.colBusinessNumber')}
                  value={detail.businessNumber}
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  fullWidth
                  label={t('approval.colCompany')}
                  value={form.name}
                  onChange={(e) => setForm((f) => (f ? { ...f, name: e.target.value } : f))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  fullWidth
                  label={t('som.ceo')}
                  value={form.ceoName}
                  onChange={(e) =>
                    setForm((f) => (f ? { ...f, ceoName: e.target.value } : f))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl size="small" fullWidth>
                  <InputLabel>{t('som.industry')}</InputLabel>
                  <Select
                    label={t('som.industry')}
                    value={form.industryCode}
                    onChange={(e) =>
                      setForm((f) => (f ? { ...f, industryCode: e.target.value } : f))
                    }
                  >
                    {INDUSTRY_OPTIONS.map((o) => (
                      <MenuItem key={o.code} value={o.code}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  size="small"
                  fullWidth
                  label={t('company.address')}
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => (f ? { ...f, address: e.target.value } : f))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  fullWidth
                  label={t('approval.colPhone')}
                  value={form.phone}
                  onChange={(e) => setForm((f) => (f ? { ...f, phone: e.target.value } : f))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  fullWidth
                  label={t('approval.colEmail')}
                  value={form.email}
                  onChange={(e) => setForm((f) => (f ? { ...f, email: e.target.value } : f))}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl size="small" fullWidth>
                  <InputLabel>{t('approval.colStatus')}</InputLabel>
                  <Select
                    label={t('approval.colStatus')}
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => (f ? { ...f, status: e.target.value as CompanyStatus } : f))
                    }
                  >
                    {STATUSES.map((s) => (
                      <MenuItem key={s} value={s}>
                        {statusLabel(s)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={4}>
                <AppDatePicker
                  label={t('company.contractStart')}
                  value={form.contractStartDate ?? null}
                  onChange={(iso) =>
                    setForm((f) => (f ? { ...f, contractStartDate: iso } : f))
                  }
                  maxIsoDate={form.contractEndDate ?? null}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <AppDatePicker
                  label={t('company.contractEnd')}
                  value={form.contractEndDate ?? null}
                  onChange={(iso) =>
                    setForm((f) => (f ? { ...f, contractEndDate: iso } : f))
                  }
                  minIsoDate={form.contractStartDate ?? null}
                  fullWidth
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          {detail && detail.status !== 'INACTIVE' && (
            <Button
              color="error"
              startIcon={<BlockIcon />}
              disabled={inactivateMut.isPending}
              onClick={async () => {
                if (await confirm({
                  title: t('company.inactivate'),
                  message: t('company.inactivateConfirm'),
                  severity: 'warning',
                })) {
                  inactivateMut.mutate(detail.id)
                }
              }}
            >
              {t('company.inactivate')}
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Button
            onClick={() => {
              setSelectedId(null)
              setForm(null)
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={updateMut.isPending || !form}
            onClick={() => updateMut.mutate()}
          >
            {updateMut.isPending ? <CircularProgress size={20} /> : t('common.save')}
          </Button>
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
          {t('company.create', { defaultValue: '신규 업체 등록' })}
          <IconButton onClick={() => setCreateOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small"
                fullWidth
                required
                label={t('approval.colBusinessNumber')}
                value={createForm.businessNumber}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, businessNumber: e.target.value }))
                }
                placeholder="123-45-67890"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small"
                fullWidth
                required
                label={t('approval.colCompany')}
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small"
                fullWidth
                label={t('som.ceo')}
                value={createForm.ceoName}
                onChange={(e) => setCreateForm((f) => ({ ...f, ceoName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>{t('som.industry')}</InputLabel>
                <Select
                  label={t('som.industry')}
                  value={createForm.industryCode}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, industryCode: e.target.value }))
                  }
                >
                  {INDUSTRY_OPTIONS.map((o) => (
                    <MenuItem key={o.code} value={o.code}>
                      {o.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                size="small"
                fullWidth
                label={t('company.address')}
                value={createForm.address}
                onChange={(e) => setCreateForm((f) => ({ ...f, address: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small"
                fullWidth
                label={t('approval.colPhone')}
                value={createForm.phone}
                onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small"
                fullWidth
                label={t('approval.colEmail')}
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl size="small" fullWidth>
                <InputLabel>{t('approval.colStatus')}</InputLabel>
                <Select
                  label={t('approval.colStatus')}
                  value={createForm.status}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, status: e.target.value as CompanyStatus }))
                  }
                >
                  {STATUSES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {statusLabel(s)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={4}>
              <AppDatePicker
                label={t('company.contractStart')}
                value={createForm.contractStartDate ?? null}
                onChange={(iso) =>
                  setCreateForm((f) => ({ ...f, contractStartDate: iso }))
                }
                maxIsoDate={createForm.contractEndDate ?? null}
                fullWidth
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <AppDatePicker
                label={t('company.contractEnd')}
                value={createForm.contractEndDate ?? null}
                onChange={(iso) =>
                  setCreateForm((f) => ({ ...f, contractEndDate: iso }))
                }
                minIsoDate={createForm.contractStartDate ?? null}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            disabled={
              createMut.isPending ||
              !createForm.businessNumber.trim() ||
              !createForm.name.trim()
            }
            onClick={() => createMut.mutate()}
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

export default CompanyManagePage
