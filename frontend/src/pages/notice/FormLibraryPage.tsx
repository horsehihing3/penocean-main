import { useState } from 'react'
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
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import DownloadIcon from '@mui/icons-material/Download'
import DescriptionIcon from '@mui/icons-material/Description'
import DeleteIcon from '@mui/icons-material/Delete'
import { useTranslation } from 'react-i18next'
import ListSearchBar from '../../components/common/ListSearchBar'
import { useConfirm } from '../../components/common/ConfirmDialogProvider'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { formTemplateApi } from '../../api/formTemplateApi'
import { useAuth } from '../../context/AuthContext'

type SnackbarState = { open: boolean; message: string; severity: 'success' | 'error' }

const CATEGORIES = ['안전', '건강', '계약', '작업', '기타']

const FormLibraryPage: React.FC = () => {
  const { t } = useTranslation()
  const confirm = useConfirm()
  const qc = useQueryClient()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [category, setCategory] = useState('')
  const [keyword, setKeyword] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 40

  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({
    category: '안전',
    title: '',
    description: '',
    version: '1.0',
  })
  const [file, setFile] = useState<File | null>(null)

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  })

  const listQuery = useQuery({
    queryKey: ['form-templates', { category, keyword, page, pageSize }],
    queryFn: () =>
      formTemplateApi.list({
        category: category || undefined,
        keyword: keyword || undefined,
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

  const createMut = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('file required')
      return formTemplateApi.create(form, file)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['form-templates'] })
      setSnackbar({ open: true, message: t('form.createSuccess'), severity: 'success' })
      setCreateOpen(false)
      setForm({ category: '안전', title: '', description: '', version: '1.0' })
      setFile(null)
    },
    onError: (err) => {
      setSnackbar({ open: true, message: extractErrorMessage(err), severity: 'error' })
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => formTemplateApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['form-templates'] })
    },
  })

  const applyKeyword = () => {
    setKeyword(keywordInput.trim())
    setPage(0)
  }

  // [2026-08-03] PC 테이블·모바일 카드 양쪽에서 호출 — 다운로드 URL 조립 일원화
  const handleDownload = (id: number) => {
    window.open(`${import.meta.env.VITE_API_URL || '/api'}/form-templates/${id}/download`, '_blank')
    qc.invalidateQueries({ queryKey: ['form-templates'] })
  }

  const resetFilters = () => {
    setCategory('')
    setKeywordInput('')
    setKeyword('')
    setPage(0)
  }

  const submitCreate = () => {
    if (!form.title.trim() || !file) {
      setSnackbar({ open: true, message: t('errors.required'), severity: 'error' })
      return
    }
    createMut.mutate()
  }

  const items = listQuery.data?.content ?? []

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        spacing={1}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t('form.pageTitle')}
        </Typography>
      </Stack>

      {/* Filters - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={category}
              displayEmpty
              onChange={(e) => {
                setCategory(e.target.value)
                setPage(0)
              }}
            >
              <MenuItem value="">{t('form.category')}</MenuItem>
              {CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <ListSearchBar
            placeholder={t('form.searchPlaceholder')}
            value={keywordInput}
            onChange={setKeywordInput}
            onSearch={applyKeyword}
            sx={{ width: 300 }}
          />
          <IconButton onClick={resetFilters} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>
        {isAdmin && (
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            {t('form.addForm')}
          </Button>
        )}
      </Box>

      {/* Filters - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
        <FormControl size="small" fullWidth>
          <Select
            value={category}
            displayEmpty
            onChange={(e) => {
              setCategory(e.target.value)
              setPage(0)
            }}
          >
            <MenuItem value="">{t('form.category')}</MenuItem>
            {CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ListSearchBar
            placeholder={t('form.searchPlaceholder')}
            value={keywordInput}
            onChange={setKeywordInput}
            onSearch={applyKeyword}
            fullWidth
          />
          <IconButton onClick={resetFilters} size="small" sx={{ flexShrink: 0 }}>
            <RefreshIcon />
          </IconButton>
        </Box>
        {isAdmin && (
          <Button variant="contained" size="small" fullWidth startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            {t('form.addForm')}
          </Button>
        )}
      </Box>

      {listQuery.isError && <Alert severity="error">{t('approval.loadError')}</Alert>}

      {listQuery.isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Table - PC */}
          <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Table size="small" sx={{ minWidth: 750 }}>
              <TableHead>
                <TableRow>
                  <TableCell align="center" sx={{ width: 60 }}>{t('common.rowNo')}</TableCell>
                  <TableCell align="center" sx={{ width: 90 }}>{t('form.category')}</TableCell>
                  <TableCell align="center">{t('form.title')}</TableCell>
                  <TableCell align="center" sx={{ width: 70 }}>{t('form.version')}</TableCell>
                  <TableCell align="center" sx={{ width: 90 }}>{t('form.downloadCount')}</TableCell>
                  <TableCell align="center" sx={{ width: 140 }}>{t('common.manage')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">{t('approval.empty')}</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((it, idx) => (
                    <TableRow key={it.id} hover>
                      <TableCell align="center">{page * pageSize + idx + 1}</TableCell>
                      <TableCell align="center">
                        <Chip size="small" label={it.category} />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <DescriptionIcon color="primary" fontSize="small" />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {it.title}
                            </Typography>
                            {it.description && (
                              <Typography variant="caption" color="text.secondary">
                                {it.description}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">v{it.version}</TableCell>
                      <TableCell align="center">{it.downloadCount}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            handleDownload(it.id)
                          }}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                        {isAdmin && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={async () => {
                              if (await confirm({
                                title: t('common.delete'),
                                message: t('form.deleteConfirm'),
                                severity: 'error',
                                confirmText: t('common.delete'),
                              })) {
                                deleteMut.mutate(it.id)
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Mobile Card List */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
            {items.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">{t('approval.empty')}</Typography>
              </Paper>
            ) : (
              items.map((it) => (
                <Paper key={it.id} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                    <Chip size="small" label={it.category} />
                    <Chip size="small" label={`v${it.version}`} variant="outlined" />
                  </Box>
                  <Typography fontWeight="bold" sx={{ mb: 1, wordBreak: 'keep-all' }}>
                    {it.title}
                  </Typography>
                  {it.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {it.description}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                    <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 50 }}>
                      {t('form.downloadCount')}
                    </Typography>
                    <Typography variant="body2">{it.downloadCount}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={() => {
                        handleDownload(it.id)
                      }}
                    >
                      {t('form.download')}
                    </Button>
                    {isAdmin && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={async () => {
                          if (await confirm({
                            title: t('common.delete'),
                            message: t('form.deleteConfirm'),
                            severity: 'error',
                            confirmText: t('common.delete'),
                          })) {
                            deleteMut.mutate(it.id)
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Paper>
              ))
            )}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={listQuery.data?.totalPages || 1}
              page={page + 1}
              onChange={(_, newPage) => setPage(newPage - 1)}
              color="primary"
            />
          </Box>
        </>
      )}

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
          {t('form.addForm')}
          <IconButton onClick={() => setCreateOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>{t('form.category')}</InputLabel>
              <Select
                label={t('form.category')}
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              fullWidth
              label={t('form.title')}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <TextField
              size="small"
              fullWidth
              multiline
              minRows={2}
              label={t('form.description')}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <TextField
              size="small"
              fullWidth
              label={t('form.version')}
              value={form.version}
              onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
            />
            <Button variant="outlined" component="label" size="small">
              {t('form.uploadFile')}
              <input
                hidden
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </Button>
            {file && (
              <Typography variant="caption" color="text.secondary">
                {file.name}
              </Typography>
            )}
          </Stack>
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

export default FormLibraryPage
