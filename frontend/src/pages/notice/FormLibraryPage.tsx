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
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import DownloadIcon from '@mui/icons-material/Download'
import DescriptionIcon from '@mui/icons-material/Description'
import DeleteIcon from '@mui/icons-material/Delete'
import { useTranslation } from 'react-i18next'
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
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
          >
            {t('form.addForm')}
          </Button>
        )}
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('form.category')}</InputLabel>
            <Select
              label={t('form.category')}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                setPage(0)
              }}
            >
              <MenuItem value="">{t('approval.filterAll')}</MenuItem>
              {CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label={t('approval.filterKeyword')}
            placeholder={t('form.searchPlaceholder')}
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

      {listQuery.isError && <Alert severity="error">{t('approval.loadError')}</Alert>}

      {listQuery.isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">{t('approval.empty')}</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {items.map((it) => (
            <Grid key={it.id} item xs={12} sm={6} md={4} lg={3}>
              <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <DescriptionIcon color="primary" />
                    <Chip size="small" label={it.category} />
                    <Chip size="small" label={`v${it.version}`} variant="outlined" />
                  </Stack>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {it.title}
                  </Typography>
                  {it.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {it.description}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    {t('form.downloadCount')}: {it.downloadCount}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => {
                      window.open(`${import.meta.env.VITE_API_URL || '/api'}/form-templates/${it.id}/download`, '_blank')
                      qc.invalidateQueries({ queryKey: ['form-templates'] })
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
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {listQuery.data && listQuery.data.totalPages > 1 && (
        <Stack direction="row" justifyContent="center" spacing={1}>
          <Button
            size="small"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            {t('common.prev')}
          </Button>
          <Typography variant="body2" sx={{ alignSelf: 'center' }}>
            {page + 1} / {listQuery.data.totalPages}
          </Typography>
          <Button
            size="small"
            disabled={page + 1 >= listQuery.data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('common.next')}
          </Button>
        </Stack>
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
