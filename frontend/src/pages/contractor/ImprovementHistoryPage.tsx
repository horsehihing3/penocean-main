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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
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
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import axios from 'axios'
import { improvementApi } from '../../api/improvementApi'
import { useAuth } from '../../context/AuthContext'
import { getImprovementStatusColor } from '../../utils/status'
import type {
  EvaluationImprovement,
  ImprovementStatus,
} from '../../types/evaluation'

type StatusFilter = ImprovementStatus | ''
type SnackbarState = { open: boolean; message: string; severity: 'success' | 'error' }

const ImprovementHistoryPage: React.FC = () => {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const qc = useQueryClient()
  const { user } = useAuth()

  const [status, setStatus] = useState<StatusFilter>('')
  const [keyword, setKeyword] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  const [selected, setSelected] = useState<EvaluationImprovement | null>(null)
  const [respondContent, setRespondContent] = useState('')
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  })

  const listQuery = useQuery({
    queryKey: ['evaluation-improvements', { status, page, pageSize }],
    queryFn: () =>
      improvementApi.list({
        status: status || undefined,
        page,
        size: pageSize,
      }),
    placeholderData: (prev) => prev,
  })

  const filteredRows = useMemo(() => {
    const rows = listQuery.data?.content ?? []
    if (!keyword) return rows
    const k = keyword.toLowerCase()
    return rows.filter(
      (r) =>
        r.evaluationNo.toLowerCase().includes(k) ||
        r.companyName.toLowerCase().includes(k) ||
        r.requestContent.toLowerCase().includes(k)
    )
  }, [listQuery.data, keyword])

  const extractErrorMessage = (err: unknown): string => {
    if (axios.isAxiosError(err)) {
      const m = (err.response?.data as { message?: string } | undefined)?.message
      if (m) return m
    }
    return t('approval.actionFailed')
  }
  const notifySuccess = (msg: string) =>
    setSnackbar({ open: true, message: msg, severity: 'success' })
  const notifyError = (err: unknown) =>
    setSnackbar({ open: true, message: extractErrorMessage(err), severity: 'error' })

  const respondMut = useMutation({
    mutationFn: () =>
      improvementApi.respond(selected!.id, { responseContent: respondContent }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evaluation-improvements'] })
      notifySuccess(t('improvement.respondSuccess'))
      setSelected(null)
      setRespondContent('')
    },
    onError: notifyError,
  })

  const closeMut = useMutation({
    mutationFn: (id: number) => improvementApi.close(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evaluation-improvements'] })
      notifySuccess(t('improvement.closeSuccess'))
      setSelected(null)
    },
    onError: notifyError,
  })

  const formatDate = (iso: string) => {
    try {
      return format(parseISO(iso), 'yyyy-MM-dd')
    } catch {
      return iso
    }
  }
  const statusLabel = (s: ImprovementStatus) => t(`improvement.status.${s}`)

  const columnVisibilityModel: GridColumnVisibilityModel = useMemo(
    () =>
      isMobile
        ? {
            companyName: false,
            itemTitle: false,
            requestedAt: false,
          }
        : {},
    [isMobile]
  )

  const columns: GridColDef<EvaluationImprovement>[] = [
    {
      field: 'requestedAt',
      headerName: t('improvement.requestedAt'),
      width: 130,
      valueFormatter: (p) => (p.value ? formatDate(p.value as string) : ''),
    },
    {
      field: 'evaluationNo',
      headerName: t('evaluation.evaluationNo'),
      width: 160,
    },
    {
      field: 'companyName',
      headerName: t('evaluation.company'),
      flex: 1,
      minWidth: 140,
    },
    {
      field: 'itemTitle',
      headerName: t('improvement.itemTarget'),
      flex: 1,
      minWidth: 140,
      valueGetter: (p) => p.row.itemTitle ?? '-',
    },
    {
      field: 'requestContent',
      headerName: t('improvement.requestContent'),
      flex: 2,
      minWidth: 200,
    },
    {
      field: 'responseDueDate',
      headerName: t('improvement.responseDueDate'),
      width: 130,
      valueFormatter: (p) => (p.value ? formatDate(p.value as string) : ''),
    },
    {
      field: 'status',
      headerName: t('approval.colStatus'),
      width: 120,
      renderCell: (p) => (
        <Chip
          size="small"
          label={statusLabel(p.value as ImprovementStatus)}
          color={getImprovementStatusColor(p.value as ImprovementStatus)}
          sx={{ fontWeight: 600 }}
        />
      ),
    },
  ]

  const applyKeyword = () => {
    setKeyword(keywordInput.trim())
  }
  const handleRowClick = (params: GridRowParams<EvaluationImprovement>) => {
    setSelected(params.row)
    setRespondContent('')
  }

  const canRespond = selected?.status === 'OPEN' && user?.role === 'CONTRACTOR'
  const canClose =
    selected?.status === 'RESPONDED' &&
    (user?.role === 'ADMIN' || user?.role === 'CONTRACT_DEPT')

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        {t('improvement.pageTitle')}
      </Typography>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>{t('approval.filterStatus')}</InputLabel>
            <Select
              label={t('approval.filterStatus')}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as StatusFilter)
                setPage(0)
              }}
            >
              <MenuItem value="">{t('approval.filterAll')}</MenuItem>
              <MenuItem value="OPEN">{t('improvement.status.OPEN')}</MenuItem>
              <MenuItem value="RESPONDED">{t('improvement.status.RESPONDED')}</MenuItem>
              <MenuItem value="CLOSED">{t('improvement.status.CLOSED')}</MenuItem>
              <MenuItem value="OVERDUE">{t('improvement.status.OVERDUE')}</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            label={t('approval.filterKeyword')}
            placeholder={t('evaluation.evaluationNo')}
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyKeyword()
            }}
            sx={{ flex: 1 }}
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
          rows={filteredRows}
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
        open={selected != null}
        onClose={() => setSelected(null)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {selected?.evaluationNo}
          <IconButton onClick={() => setSelected(null)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selected && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip
                  size="small"
                  label={statusLabel(selected.status)}
                  color={getImprovementStatusColor(selected.status)}
                  sx={{ fontWeight: 600 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {selected.companyName} · {formatDate(selected.requestedAt)}
                </Typography>
              </Stack>

              {selected.itemTitle && (
                <Typography variant="body2">
                  <strong>{t('improvement.itemTarget')}:</strong> {selected.itemTitle}
                </Typography>
              )}
              <Typography variant="body2">
                <strong>{t('improvement.requestContent')}:</strong>{' '}
                {selected.requestContent}
              </Typography>
              <Typography variant="body2">
                <strong>{t('improvement.responseDueDate')}:</strong>{' '}
                {formatDate(selected.responseDueDate)}
              </Typography>
              {selected.responseContent && (
                <Typography variant="body2">
                  <strong>{t('improvement.responseContent')}:</strong>{' '}
                  {selected.responseContent}
                </Typography>
              )}

              {canRespond && (
                <TextField
                  label={t('improvement.responseContent')}
                  multiline
                  minRows={3}
                  value={respondContent}
                  onChange={(e) => setRespondContent(e.target.value)}
                  fullWidth
                />
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {canRespond && (
            <Button
              variant="contained"
              disabled={!respondContent.trim() || respondMut.isPending}
              onClick={() => respondMut.mutate()}
            >
              {respondMut.isPending ? <CircularProgress size={20} /> : t('improvement.respond')}
            </Button>
          )}
          {canClose && selected && (
            <Button
              variant="contained"
              color="success"
              onClick={() => closeMut.mutate(selected.id)}
              disabled={closeMut.isPending}
            >
              {closeMut.isPending ? <CircularProgress size={20} /> : t('improvement.close')}
            </Button>
          )}
          <Button onClick={() => setSelected(null)}>{t('common.close')}</Button>
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

export default ImprovementHistoryPage
