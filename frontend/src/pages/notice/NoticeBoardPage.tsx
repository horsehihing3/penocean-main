import { useEffect, useMemo, useRef, useState } from 'react'
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
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  OutlinedInput,
  Divider,
  Link as MuiLink,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TableHead,
  Pagination,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import AppDatePicker from '../../components/common/AppDatePicker'
import ListSearchBar from '../../components/common/ListSearchBar'
import { useConfirm } from '../../components/common/ConfirmDialogProvider'
import PushPinIcon from '@mui/icons-material/PushPin'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { format, parseISO } from 'date-fns'
import { noticeApi } from '../../api/noticeApi'
import { useAuth } from '../../context/AuthContext'
import type {
  NoticeCategory,
  NoticePayload,
} from '../../types/notice'

type SnackbarState = { open: boolean; message: string; severity: 'success' | 'error' }

const CATEGORIES: NoticeCategory[] = ['NOTICE', 'ANNOUNCEMENT', 'URGENT']

const categoryColor = (c: NoticeCategory): 'default' | 'info' | 'error' => {
  switch (c) {
    case 'NOTICE':
      return 'default'
    case 'ANNOUNCEMENT':
      return 'info'
    case 'URGENT':
      return 'error'
  }
}

const NoticeBoardPage: React.FC = () => {
  const { t } = useTranslation()
  const confirm = useConfirm()
  const qc = useQueryClient()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [category, setCategory] = useState<NoticeCategory | ''>('')
  const [keyword, setKeyword] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 20

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const emptyPayload: NoticePayload = {
    category: 'NOTICE',
    title: '',
    content: '',
    pinned: false,
    expiresAt: null,
  }
  const [form, setForm] = useState<NoticePayload>(emptyPayload)

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  })

  const listQuery = useQuery({
    queryKey: ['notices', { category, keyword, page, pageSize }],
    queryFn: () =>
      noticeApi.list({
        category: category || undefined,
        keyword: keyword || undefined,
        page,
        size: pageSize,
      }),
    placeholderData: (prev) => prev,
  })

  const detailQuery = useQuery({
    queryKey: ['notices', 'detail', selectedId],
    queryFn: () => noticeApi.detail(selectedId as number),
    enabled: selectedId != null,
  })

  const viewedIds = useRef<Set<number>>(new Set())
  useEffect(() => {
    if (detailQuery.isSuccess && selectedId != null && !viewedIds.current.has(selectedId)) {
      viewedIds.current.add(selectedId)
      qc.setQueriesData(
        { queryKey: ['notices', { category, keyword, page, pageSize }] },
        (old: any) => {
          if (!old?.content) return old
          return {
            ...old,
            content: old.content.map((item: any) =>
              item.id === selectedId
                ? { ...item, viewCount: (item.viewCount ?? 0) + 1 }
                : item
            ),
          }
        }
      )
    }
  }, [detailQuery.isSuccess, selectedId])

  const extractErrorMessage = (err: unknown): string => {
    if (axios.isAxiosError(err)) {
      const m = (err.response?.data as { message?: string } | undefined)?.message
      if (m) return m
    }
    return t('approval.actionFailed')
  }

  const createMut = useMutation({
    mutationFn: (payload: NoticePayload) =>
      editingId ? noticeApi.update(editingId, payload) : noticeApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notices'] })
      setSnackbar({ open: true, message: t('notice.saveSuccess'), severity: 'success' })
      setEditOpen(false)
      setEditingId(null)
      setForm(emptyPayload)
    },
    onError: (err) => {
      setSnackbar({ open: true, message: extractErrorMessage(err), severity: 'error' })
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => noticeApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notices'] })
      setSelectedId(null)
      setSnackbar({ open: true, message: t('notice.deleteSuccess'), severity: 'success' })
    },
  })

  const pinMut = useMutation({
    mutationFn: ({ id, pin }: { id: number; pin: boolean }) =>
      pin ? noticeApi.pin(id) : noticeApi.unpin(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notices'] })
    },
  })

  const formatDate = (iso: string) => {
    try {
      return format(parseISO(iso), 'yyyy-MM-dd')
    } catch {
      return iso
    }
  }

  const categoryLabel = (c: NoticeCategory) => t(`notice.category.${c}`)

  const applyKeyword = () => {
    setKeyword(keywordInput.trim())
    setPage(0)
  }

  const resetFilters = () => {
    setCategory('')
    setKeywordInput('')
    setKeyword('')
    setPage(0)
  }

  const sortedList = useMemo(() => {
    const items = listQuery.data?.content ?? []
    const pinned = items.filter((i) => i.pinned)
    const normal = items.filter((i) => !i.pinned)
    return [...pinned, ...normal]
  }, [listQuery.data])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyPayload)
    setEditOpen(true)
  }

  const submitForm = () => {
    if (!form.title.trim() || !form.content.trim()) {
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
          {t('notice.pageTitle')}
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
                setCategory(e.target.value as NoticeCategory | '')
                setPage(0)
              }}
            >
              <MenuItem value="">{t('notice.categoryLabel')}</MenuItem>
              {CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {categoryLabel(c)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <ListSearchBar
            placeholder={t('notice.searchPlaceholder')}
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
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate}>
            {t('notice.write')}
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
              setCategory(e.target.value as NoticeCategory | '')
              setPage(0)
            }}
          >
            <MenuItem value="">{t('notice.categoryLabel')}</MenuItem>
            {CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {categoryLabel(c)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ListSearchBar
            placeholder={t('notice.searchPlaceholder')}
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
          <Button variant="contained" size="small" fullWidth startIcon={<AddIcon />} onClick={openCreate}>
            {t('notice.write')}
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
          <TableContainer
            component={Paper}
            sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', overflowX: 'auto' }}
          >
            <Table
              size="small"
              sx={{
                minWidth: 750,
                '& .MuiTableCell-root': {
                  borderColor: (th: any) => (th.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider'),
                },
              }}
            >
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100', color: 'text.primary' }}>
                  <TableCell sx={{ fontWeight: 'bold', width: 60, borderRight: 1, borderColor: 'divider' }} align="center">
                    {t('common.rowNo')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 100, borderRight: 1, borderColor: 'divider' }} align="center">
                    {t('notice.categoryLabel')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider' }} align="center">
                    {t('notice.title')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 120, borderRight: 1, borderColor: 'divider' }} align="center">
                    {t('notice.author')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 70, borderRight: 1, borderColor: 'divider' }} align="center">
                    {t('notice.viewCount')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 160 }} align="center">
                    {t('notice.publishedAt')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">{t('approval.empty')}</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedList.map((item, idx) => (
                    <TableRow
                      key={item.id}
                      hover
                      onClick={() => setSelectedId(item.id)}
                      sx={{ cursor: 'pointer', backgroundColor: item.pinned ? 'action.hover' : undefined }}
                    >
                      <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>
                        {item.pinned ? (
                          <PushPinIcon sx={{ fontSize: 16, color: 'warning.main', verticalAlign: 'middle' }} />
                        ) : (
                          page * pageSize + idx + 1
                        )}
                      </TableCell>
                      <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>
                        <Chip
                          label={categoryLabel(item.category)}
                          color={categoryColor(item.category)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }}>
                        <Typography variant="body2" sx={{ fontWeight: item.pinned ? 700 : 400 }}>
                          {item.title}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>
                        {item.authorUserName}
                      </TableCell>
                      <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>
                        {item.viewCount}
                      </TableCell>
                      <TableCell align="center">{formatDate(item.publishedAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Mobile Card List */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
            {sortedList.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">{t('approval.empty')}</Typography>
              </Paper>
            ) : (
              sortedList.map((item) => (
                <Paper
                  key={item.id}
                  sx={{ p: 2, cursor: 'pointer', border: 1, borderColor: 'divider' }}
                  onClick={() => setSelectedId(item.id)}
                >
                  <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                    <Chip
                      label={categoryLabel(item.category)}
                      color={categoryColor(item.category)}
                      size="small"
                    />
                    {item.pinned && <PushPinIcon sx={{ fontSize: 16, color: 'warning.main' }} />}
                  </Box>
                  <Typography fontWeight="bold" sx={{ mb: 1, wordBreak: 'keep-all' }}>
                    {item.title}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 50 }}>
                        {t('notice.author')}
                      </Typography>
                      <Typography variant="body2">{item.authorUserName}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 50 }}>
                        {t('notice.publishedAt')}
                      </Typography>
                      <Typography variant="body2">{formatDate(item.publishedAt)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 50 }}>
                        {t('notice.viewCount')}
                      </Typography>
                      <Typography variant="body2">{item.viewCount}</Typography>
                    </Box>
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

      {/* Detail Dialog */}
      <Dialog
        open={selectedId != null && !editOpen}
        onClose={() => setSelectedId(null)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {t('notice.detailTitle')}
          <IconButton onClick={() => setSelectedId(null)} size="small">
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
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  size="small"
                  label={categoryLabel(detail.category)}
                  color={categoryColor(detail.category)}
                  sx={{ fontWeight: 600 }}
                />
                {detail.pinned && <Chip size="small" label={t('notice.pinned')} color="warning" />}
              </Stack>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {detail.title}
              </Typography>
              <Stack direction="row" spacing={2}>
                <Typography variant="caption" color="text.secondary">
                  {detail.authorUserName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(detail.publishedAt)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('notice.viewCount')} {detail.viewCount}
                </Typography>
              </Stack>
              <Divider />
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {detail.content}
              </Typography>
              {detail.attachmentUrl && (
                <MuiLink href={detail.attachmentUrl} target="_blank" rel="noopener">
                  {detail.attachmentName || t('accessRequest.attachment.fileName')}
                </MuiLink>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          {isAdmin && detail && (
            <>
              <Button
                size="small"
                onClick={() =>
                  pinMut.mutate({ id: detail.id, pin: !detail.pinned })
                }
              >
                {detail.pinned ? t('notice.unpin') : t('notice.pin')}
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setEditingId(detail.id)
                  setForm({
                    category: detail.category,
                    title: detail.title,
                    content: detail.content,
                    pinned: detail.pinned,
                    expiresAt: detail.expiresAt ?? null,
                  })
                  setEditOpen(true)
                }}
              >
                {t('common.edit')}
              </Button>
              <Button
                size="small"
                color="error"
                onClick={async () => {
                  if (await confirm({
                    title: t('common.delete'),
                    message: t('notice.deleteConfirm'),
                    severity: 'error',
                    confirmText: t('common.delete'),
                  })) {
                    deleteMut.mutate(detail.id)
                  }
                }}
              >
                {t('common.delete')}
              </Button>
            </>
          )}
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setSelectedId(null)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editOpen}
        onClose={() => {
          setEditOpen(false)
          setEditingId(null)
        }}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {editingId ? t('common.edit') : t('notice.write')}
          <IconButton
            onClick={() => {
              setEditOpen(false)
              setEditingId(null)
            }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>{t('notice.categoryLabel')}</InputLabel>
              <Select
                label={t('notice.categoryLabel')}
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value as NoticeCategory }))
                }
              >
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {categoryLabel(c)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              fullWidth
              label={t('notice.title')}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <TextField
              size="small"
              fullWidth
              multiline
              minRows={8}
              label={t('notice.content')}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.pinned ?? false}
                    onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))}
                  />
                }
                label={t('notice.pinned')}
              />
              <AppDatePicker
                label={t('notice.expiresAt')}
                value={form.expiresAt ?? null}
                onChange={(iso) =>
                  setForm((f) => ({ ...f, expiresAt: iso }))
                }
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => {
              setEditOpen(false)
              setEditingId(null)
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button variant="contained" disabled={createMut.isPending} onClick={submitForm}>
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

export default NoticeBoardPage
