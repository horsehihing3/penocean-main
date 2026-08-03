import { Fragment, useMemo, useState } from 'react'
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  Button,
  Alert,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
  CircularProgress,
  Grid,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/DeleteOutline'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import CloseIcon from '@mui/icons-material/Close'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { evaluationItemApi } from '../../api/evaluationApi'
import type {
  EvaluationItem,
  EvaluationItemSavePayload,
} from '../../types/evaluation'

type SnackbarState = { open: boolean; message: string; severity: 'success' | 'error' }

const emptyForm: EvaluationItemSavePayload = {
  code: '',
  category: '',
  title: '',
  description: '',
  referenceDoc: '',
  maxScore: 10,
  weight: 1,
  sortOrder: 0,
  active: true,
}

const EvaluationItemPage: React.FC = () => {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const qc = useQueryClient()

  const [editing, setEditing] = useState<EvaluationItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<EvaluationItemSavePayload>(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState<EvaluationItem | null>(null)
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  })

  const itemsQuery = useQuery({
    queryKey: ['evaluation-items', { activeOnly: false }],
    queryFn: () => evaluationItemApi.list(false),
  })
  const items = useMemo(
    () => (itemsQuery.data ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder),
    [itemsQuery.data]
  )

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

  const createMut = useMutation({
    mutationFn: (payload: EvaluationItemSavePayload) => evaluationItemApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evaluation-items'] })
      notifySuccess(t('common.save'))
      setDialogOpen(false)
    },
    onError: notifyError,
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: EvaluationItemSavePayload }) =>
      evaluationItemApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evaluation-items'] })
      notifySuccess(t('common.save'))
      setDialogOpen(false)
    },
    onError: notifyError,
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => evaluationItemApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evaluation-items'] })
      notifySuccess(t('common.delete'))
      setConfirmDelete(null)
    },
    onError: notifyError,
  })

  const reorderMut = useMutation({
    mutationFn: (entries: { id: number; sortOrder: number }[]) =>
      evaluationItemApi.reorder(entries),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evaluation-items'] })
    },
    onError: notifyError,
  })

  const handleAdd = () => {
    setEditing(null)
    setForm({ ...emptyForm, sortOrder: (items[items.length - 1]?.sortOrder ?? 0) + 10 })
    setDialogOpen(true)
  }

  const handleEdit = (item: EvaluationItem) => {
    setEditing(item)
    setForm({
      code: item.code,
      category: item.category,
      title: item.title,
      description: item.description ?? '',
      referenceDoc: item.referenceDoc ?? '',
      maxScore: item.maxScore,
      weight: item.weight,
      sortOrder: item.sortOrder,
      active: item.active,
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (editing) {
      updateMut.mutate({ id: editing.id, payload: form })
    } else {
      createMut.mutate(form)
    }
  }

  const handleToggleActive = (item: EvaluationItem) => {
    updateMut.mutate({
      id: item.id,
      payload: {
        code: item.code,
        category: item.category,
        title: item.title,
        description: item.description ?? '',
        referenceDoc: item.referenceDoc ?? '',
        maxScore: item.maxScore,
        weight: item.weight,
        sortOrder: item.sortOrder,
        active: !item.active,
      },
    })
  }

  const handleMove = (idx: number, direction: -1 | 1) => {
    const target = items[idx]
    const swap = items[idx + direction]
    if (!target || !swap) return
    reorderMut.mutate([
      { id: target.id, sortOrder: swap.sortOrder },
      { id: swap.id, sortOrder: target.sortOrder },
    ])
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
          {t('evaluationItem.pageTitle')}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          {t('evaluationItem.addBtn')}
        </Button>
      </Stack>

      {itemsQuery.isError && (
        <Alert severity="error">{t('approval.loadError')}</Alert>
      )}

      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 130 }}>{t('evaluationItem.category')}</TableCell>
                <TableCell sx={{ width: 130 }}>{t('evaluationItem.title')}</TableCell>
                <TableCell>{t('evaluationItem.description')}</TableCell>
                <TableCell sx={{ width: 200 }}>첨부파일</TableCell>
                <TableCell align="right" sx={{ width: 64 }}>{t('evaluationItem.maxScore')}</TableCell>
                <TableCell align="center" sx={{ width: 64 }}>{t('evaluationItem.active')}</TableCell>
                <TableCell sx={{ width: 100 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {itemsQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              )}
              {!itemsQuery.isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary">
                      {t('common.noData')}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {items.map((item, idx) => {
                const prevCategory = idx > 0 ? items[idx - 1].category : null
                const isNewCategory = item.category !== prevCategory
                return (
                  <Fragment key={item.id}>
                    {isNewCategory && (
                      <TableRow sx={{ bgcolor: 'primary.50' }}>
                        {/* [2026-08-03] py:0.5 로 눌려 있던 분류 구분행 높이를 일반 행 수준으로 확대 */}
                        <TableCell colSpan={7} sx={{ py: 1.25, fontWeight: 700, color: 'primary.dark', pl: 2 }}>
                          {item.category}
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow hover>
                      <TableCell sx={{ pl: 3, color: 'text.secondary' }}>
                        {item.category}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.title}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {item.description ?? '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {item.referenceDoc ?? '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{item.maxScore}</TableCell>
                      <TableCell align="center">
                        <Switch
                          size="small"
                          checked={item.active}
                          onChange={() => handleToggleActive(item)}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton size="small" onClick={() => handleEdit(item)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => setConfirmDelete(item)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" disabled={idx === 0 || reorderMut.isPending}
                            onClick={() => handleMove(idx, -1)}>
                            <ArrowUpwardIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" disabled={idx === items.length - 1 || reorderMut.isPending}
                            onClick={() => handleMove(idx, 1)}>
                            <ArrowDownwardIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
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
          {editing ? t('common.edit') : t('evaluationItem.addBtn')}
          <IconButton size="small" onClick={() => setDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label={t('evaluationItem.code')}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                fullWidth
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={t('evaluationItem.category')}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                fullWidth
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label={t('evaluationItem.title')}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                fullWidth
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label={t('evaluationItem.description')}
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                fullWidth
                multiline
                minRows={2}
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="첨부파일"
                value={form.referenceDoc ?? ''}
                onChange={(e) => setForm({ ...form, referenceDoc: e.target.value })}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                label={t('evaluationItem.maxScore')}
                type="number"
                value={form.maxScore}
                onChange={(e) =>
                  setForm({ ...form, maxScore: Number(e.target.value) || 0 })
                }
                fullWidth
                required
                size="small"
                inputProps={{ min: 0, step: 1 }}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                label={t('evaluationItem.weight')}
                type="number"
                value={form.weight}
                onChange={(e) =>
                  setForm({ ...form, weight: Number(e.target.value) || 0 })
                }
                fullWidth
                required
                size="small"
                inputProps={{ min: 0, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                label={t('evaluationItem.order')}
                type="number"
                value={form.sortOrder ?? 0}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: Number(e.target.value) || 0 })
                }
                fullWidth
                size="small"
                inputProps={{ step: 1 }}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2">{t('evaluationItem.active')}</Typography>
                <Switch
                  checked={form.active ?? true}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={
              !form.code.trim() ||
              !form.category.trim() ||
              !form.title.trim() ||
              createMut.isPending ||
              updateMut.isPending
            }
          >
            {createMut.isPending || updateMut.isPending ? (
              <CircularProgress size={20} />
            ) : (
              t('common.save')
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={confirmDelete != null} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>{t('common.delete')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {confirmDelete?.title} - {t('evaluationItem.deleteConfirm')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteMut.isPending}
            onClick={() => confirmDelete && deleteMut.mutate(confirmDelete.id)}
          >
            {deleteMut.isPending ? <CircularProgress size={20} /> : t('common.confirm')}
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

export default EvaluationItemPage
