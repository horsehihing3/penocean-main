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
  TableRow,
  TableHead,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import AppDatePicker from '../../components/common/AppDatePicker'
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
        {isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            {t('notice.write')}
          </Button>
        )}
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>{t('notice.categoryLabel')}</InputLabel>
            <Select
              label={t('notice.categoryLabel')}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as NoticeCategory | '')
                setPage(0)
              }}
            >
              <MenuItem value="">{t('approval.filterAll')}</MenuItem>
              {CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {categoryLabel(c)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label={t('approval.filterKeyword')}
            placeholder={t('notice.searchPlaceholder')}
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

      <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
        {listQuery.isError && (
          <Alert severity="error" sx={{ m: 2 }}>
            {t('approval.loadError')}
          </Alert>
        )}
        {listQuery.isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : isMobile ? (
          // 모바일: 카드 리스트 (한글 세로 밀림 방지)
          <Stack divider={<Divider />}>
            {sortedList.length === 0 && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('approval.empty')}
                </Typography>
              </Box>
            )}
            {sortedList.map((item) => (
              <Box
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                sx={{
                  p: 1.5,
                  cursor: 'pointer',
                  backgroundColor: item.pinned ? 'action.hover' : undefined,
                  '&:hover': { backgroundColor: 'action.hover' },
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                  <Chip
                    size="small"
                    label={categoryLabel(item.category)}
                    color={categoryColor(item.category)}
                    sx={{ fontWeight: 600 }}
                  />
                  {item.pinned && <PushPinIcon sx={{ fontSize: 14, color: 'warning.main' }} />}
                </Stack>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: item.pinned ? 700 : 500,
                    wordBreak: 'keep-all',
                    overflowWrap: 'break-word',
                    mb: 0.5,
                  }}
                >
                  {item.title}
                </Typography>
                <Stack direction="row" spacing={1.5} flexWrap="wrap">
                  <Typography variant="caption" color="text.secondary">
                    {item.authorUserName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(item.publishedAt)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('notice.viewCount')} {item.viewCount}
                  </Typography>
                </Stack>
              </Box>
            ))}
          </Stack>
        ) : (
          <Table size="small" sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 100, whiteSpace: 'nowrap' }}>
                  {t('notice.categoryLabel')}
                </TableCell>
                <TableCell>{t('notice.title')}</TableCell>
                <TableCell sx={{ width: 120, whiteSpace: 'nowrap' }}>
                  {t('notice.author')}
                </TableCell>
                <TableCell sx={{ width: 110, whiteSpace: 'nowrap' }}>
                  {t('notice.publishedAt')}
                </TableCell>
                <TableCell sx={{ width: 70, whiteSpace: 'nowrap' }} align="right">
                  {t('notice.viewCount')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('approval.empty')}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {sortedList.map((item) => (
                <TableRow
                  key={item.id}
                  hover
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: item.pinned ? 'action.hover' : undefined,
                  }}
                  onClick={() => setSelectedId(item.id)}
                >
                  <TableCell>
                    <Chip
                      size="small"
                      label={categoryLabel(item.category)}
                      color={categoryColor(item.category)}
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell sx={{ wordBreak: 'keep-all' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {item.pinned && (
                        <PushPinIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                      )}
                      <Typography variant="body2" sx={{ fontWeight: item.pinned ? 700 : 400 }}>
                        {item.title}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{item.authorUserName}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(item.publishedAt)}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {item.viewCount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Pagination (simple) */}
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
