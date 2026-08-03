import { useCallback, useMemo, useRef, useState } from 'react'
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
  ToggleButton,
  ToggleButtonGroup,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  GridColDef,
  GridRowParams,
  GridColumnVisibilityModel,
} from '@mui/x-data-grid'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import ListSearchBar from '../../components/common/ListSearchBar'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListTable from '../../components/common/ListTable'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { format, parseISO } from 'date-fns'
import { workerVoiceApi } from '../../api/workerVoiceApi'
import { useAuth } from '../../context/AuthContext'
import {
  getWorkerVoiceStatusColor,
  getWorkerVoiceTypeColor,
} from '../../utils/status'
import type {
  WorkerVoiceCreatePayload,
  WorkerVoiceListItem,
  WorkerVoiceStatus,
  WorkerVoiceType,
} from '../../types/workerVoice'

type SnackbarState = { open: boolean; message: string; severity: 'success' | 'error' }

const WorkerVoicePage: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { user } = useAuth()

  const [voiceType, setVoiceType] = useState<WorkerVoiceType | ''>('')
  const [status, setStatus] = useState<WorkerVoiceStatus | ''>('')
  const [keyword, setKeyword] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  })

  // Status change form state
  const [newStatus, setNewStatus] = useState<WorkerVoiceStatus | ''>('')
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [resolution, setResolution] = useState('')

  // Create form state (PPT 슬라이드 17 기준)
  type CreateForm = {
    voiceType: WorkerVoiceType
    reporterName: string
    reporterEmail: string
    companyName: string
    industryName: string
    phone: string
    captchaInput: string
    title: string
    content: string
  }
  const emptyCreateForm: CreateForm = {
    voiceType: 'NEAR_MISS',
    reporterName: '',
    reporterEmail: '',
    companyName: user?.name ?? '',
    industryName: '',
    phone: '',
    captchaInput: '',
    title: '',
    content: '',
  }
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreateForm)
  const [consentChecked, setConsentChecked] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const genCaptcha = useCallback(() => String(Math.floor(1000 + Math.random() * 9000)), [])
  const [captchaValue, setCaptchaValue] = useState(genCaptcha)

  const openCreate = () => {
    const code = genCaptcha()
    setCaptchaValue(code)
    setCreateForm({ ...emptyCreateForm, companyName: user?.name ?? '' })
    setConsentChecked(false)
    setPendingFile(null)
    setCreateOpen(true)
  }

  const canManage = user?.role === 'ADMIN' || user?.role === 'CONTRACT_DEPT'

  const columnVisibilityModel: GridColumnVisibilityModel = useMemo(
    () =>
      isMobile
        ? { companyName: false, severity: false, createdAt: false }
        : {},
    [isMobile]
  )

  const listQuery = useQuery({
    queryKey: ['workerVoices', { voiceType, status, keyword, page, pageSize }],
    queryFn: () =>
      workerVoiceApi.list({
        voiceType: voiceType || undefined,
        status: status || undefined,
        keyword: keyword || undefined,
        page,
        size: pageSize,
      }),
    placeholderData: (prev) => prev,
  })

  const detailQuery = useQuery({
    queryKey: ['workerVoices', 'detail', selectedId],
    queryFn: () => workerVoiceApi.detail(selectedId as number),
    enabled: selectedId != null,
  })

  const extractErrorMessage = (err: unknown): string => {
    if (axios.isAxiosError(err)) {
      const m = (err.response?.data as { message?: string } | undefined)?.message
      if (m) return m
    }
    return t('workerVoice.actionFailed')
  }

  const createMut = useMutation({
    mutationFn: async (payload: WorkerVoiceCreatePayload) => {
      const { id } = await workerVoiceApi.create(payload)
      if (pendingFile) await workerVoiceApi.uploadAttachment(id, pendingFile)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workerVoices'] })
      setSnackbar({ open: true, message: t('workerVoice.createSuccess'), severity: 'success' })
      setCreateOpen(false)
    },
    onError: (err) => {
      setSnackbar({ open: true, message: extractErrorMessage(err), severity: 'error' })
    },
  })

  const statusMut = useMutation({
    mutationFn: (args: {
      id: number
      status: WorkerVoiceStatus
      assignedTo?: number | null
      resolution?: string | null
    }) =>
      workerVoiceApi.updateStatus(args.id, {
        status: args.status,
        assignedTo: args.assignedTo ?? null,
        resolution: args.resolution ?? null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workerVoices'] })
      setSnackbar({ open: true, message: t('workerVoice.updateSuccess'), severity: 'success' })
      setSelectedId(null)
      setNewStatus('')
      setAssignedTo('')
      setResolution('')
    },
    onError: (err) => {
      setSnackbar({ open: true, message: extractErrorMessage(err), severity: 'error' })
    },
  })

  const formatDate = (iso: string) => {
    try {
      return format(parseISO(iso), 'yyyy-MM-dd')
    } catch {
      return iso
    }
  }

  const typeLabel = (v: WorkerVoiceType) => t(`workerVoice.types.${v}`)
  const statusLabel = (v: WorkerVoiceStatus) => t(`workerVoice.status.${v}`)
  const severityLabel = (v: WorkerVoiceSeverity) => t(`workerVoice.severity.${v}`)

  // PPT 슬라이드 16: No | 분류 | 제목 | 댓글 | 등록일
  const columns: GridColDef<WorkerVoiceListItem>[] = [
    {
      field: '_no',
      headerName: 'No',
      width: 60,
      sortable: false,
      renderCell: (p) => {
        const idx = (listQuery.data?.content ?? []).findIndex((r) => r.id === p.row.id)
        return <span>{page * pageSize + idx + 1}</span>
      },
    },
    {
      field: 'voiceType',
      headerName: '분류',
      width: 130,
      renderCell: (p) => (
        <Chip
          size="small"
          label={typeLabel(p.value as WorkerVoiceType)}
          color={getWorkerVoiceTypeColor(p.value as WorkerVoiceType)}
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'title',
      headerName: '제목',
      flex: 1,
      minWidth: 200,
      renderCell: (p) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 0.5 }}>
          <Typography variant="body2">
            {p.row.reporterAnonymous ? '***** (비공개 처리)' : p.row.title}
          </Typography>
          {p.row.commentCount > 0 && (
            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
              A: 답변완료
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'commentCount',
      headerName: '댓글',
      width: 70,
      align: 'center',
      headerAlign: 'center',
      renderCell: (p) => (
        <Typography
          variant="body2"
          sx={{ color: p.row.commentCount > 0 ? 'error.main' : 'text.secondary', fontWeight: p.row.commentCount > 0 ? 700 : 400 }}
        >
          {p.row.commentCount}
        </Typography>
      ),
    },
    {
      field: 'createdAt',
      headerName: '등록일',
      width: 120,
      valueFormatter: (p) => (p.value ? formatDate(p.value as string) : ''),
    },
  ]

  const applyKeyword = () => {
    setKeyword(keywordInput.trim())
    setPage(0)
  }

  // [2026-08-03] 목록 필터 초기화 (새로고침 버튼)
  const resetFilters = () => {
    setKeywordInput('')
    setStatus('')
    setVoiceType('')
    setPage(0)
  }

  const handleRowClick = (params: GridRowParams<WorkerVoiceListItem>) => {
    setSelectedId(params.row.id)
  }

  const detail = detailQuery.data
  const detailOpen = selectedId != null

  const closeDetail = () => {
    setSelectedId(null)
    setNewStatus('')
    setAssignedTo('')
    setResolution('')
  }

  const submitCreate = () => {
    if (!createForm.title.trim() || !createForm.content.trim()) {
      setSnackbar({ open: true, message: t('errors.required'), severity: 'error' })
      return
    }
    if (createForm.captchaInput.trim() !== captchaValue) {
      setSnackbar({ open: true, message: '보안문자가 일치하지 않습니다.', severity: 'error' })
      setCaptchaValue(genCaptcha())
      setCreateForm((f) => ({ ...f, captchaInput: '' }))
      return
    }
    const payload: WorkerVoiceCreatePayload = {
      voiceType: createForm.voiceType,
      title: createForm.title,
      content: createForm.content,
      companyId: user?.companyId ?? null,
      vesselId: null,
      severity: null,
      reporterAnonymous: false,
    }
    createMut.mutate(payload)
  }

  const submitStatusChange = () => {
    if (!selectedId || !newStatus) return
    statusMut.mutate({
      id: selectedId,
      status: newStatus,
      assignedTo: assignedTo ? Number(assignedTo) : null,
      resolution: resolution || null,
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
          {t('workerVoice.pageTitle')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
        >
          {t('workerVoice.new')}
        </Button>
      </Stack>

      {/* Filter bar */}
      <Box>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <ToggleButtonGroup
            size="small"
            value={voiceType}
            exclusive
            onChange={(_, v) => {
              setVoiceType((v ?? '') as WorkerVoiceType | '')
              setPage(0)
            }}
          >
            <ToggleButton value="">{t('approval.filterAll')}</ToggleButton>
            <ToggleButton value="NEAR_MISS">{t('workerVoice.types.NEAR_MISS')}</ToggleButton>
            <ToggleButton value="INCIDENT">{t('workerVoice.types.INCIDENT')}</ToggleButton>
            <ToggleButton value="INQUIRY">{t('workerVoice.types.INQUIRY')}</ToggleButton>
          </ToggleButtonGroup>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              displayEmpty
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as WorkerVoiceStatus | '')
                setPage(0)
              }}
            >
              <MenuItem value="">{t('approval.filterAll')}</MenuItem>
              <MenuItem value="SUBMITTED">{t('workerVoice.status.SUBMITTED')}</MenuItem>
              <MenuItem value="TRIAGED">{t('workerVoice.status.TRIAGED')}</MenuItem>
              <MenuItem value="IN_PROGRESS">{t('workerVoice.status.IN_PROGRESS')}</MenuItem>
              <MenuItem value="RESOLVED">{t('workerVoice.status.RESOLVED')}</MenuItem>
              <MenuItem value="CLOSED">{t('workerVoice.status.CLOSED')}</MenuItem>
            </Select>
          </FormControl>

          <ListSearchBar
            value={keywordInput}
            onChange={setKeywordInput}
            onSearch={applyKeyword}
            sx={{ width: { xs: '100%', sm: 300 } }}
          />

          <IconButton onClick={resetFilters} size="small">
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* DataGrid */}
      {listQuery.isError && <Alert severity="error">{t('approval.loadError')}</Alert>}

      <ListTable
        rows={listQuery.data?.content ?? []}
        getRowId={(r) => r.id}
        columns={columns}
        columnVisibilityModel={columnVisibilityModel}
        loading={listQuery.isLoading || listQuery.isFetching}
        onRowClick={handleRowClick}
        rowCount={listQuery.data?.totalElements ?? 0}
        paginationModel={{ page, pageSize }}
        onPaginationModelChange={(m) => {
          setPage(m.page)
          setPageSize(m.pageSize)
        }}
        showRowNumber={false}
        emptyMessage={t('approval.empty')}
      />

      {/* Detail Dialog */}
      <Dialog
        open={detailOpen}
        onClose={closeDetail}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {t('workerVoice.detailTitle')}
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
            <Stack spacing={2}>
              {/* ■ 상세 내용 */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                ■ 상세 내용
              </Typography>

              {/* 제목 */}
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {detail.reporterAnonymous ? '***** (비공개 처리)' : detail.title}
              </Typography>

              {/* 메타 바: 작성자 | 분류 | 등록일 */}
              <Paper
                variant="outlined"
                sx={{
                  px: 2,
                  py: 1,
                  bgcolor: 'action.hover',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 2,
                  alignItems: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  작성자:{' '}
                  <strong>
                    {detail.reporterAnonymous
                      ? t('workerVoice.anonymous')
                      : detail.reporterName ?? detail.companyName}
                  </strong>
                </Typography>
                <Divider orientation="vertical" flexItem />
                <Typography variant="body2" color="text.secondary">
                  분류: <strong>{typeLabel(detail.voiceType)}</strong>
                </Typography>
                <Divider orientation="vertical" flexItem />
                <Typography variant="body2" color="text.secondary">
                  등록일: <strong>{detail.createdAt ? formatDate(detail.createdAt) : '-'}</strong>
                </Typography>
                {detail.status && (
                  <>
                    <Divider orientation="vertical" flexItem />
                    <Chip
                      size="small"
                      label={statusLabel(detail.status)}
                      color={getWorkerVoiceStatusColor(detail.status)}
                      sx={{ fontWeight: 600 }}
                    />
                  </>
                )}
              </Paper>

              {/* 본문 + 첨부파일 */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                  {detail.content}
                </Typography>
                {detail.attachments.length > 0 && (
                  <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary">
                      첨부파일 :{' '}
                      {detail.attachments.map((att, i) => (
                        <span key={att.id}>
                          {i > 0 && ', '}
                          {att.fileName} ({Math.ceil(att.fileSize / 1024)} KB)
                        </span>
                      ))}
                    </Typography>
                  </Box>
                )}
              </Paper>

              {/* ■ 의견 및 답변 */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                ■ 의견 및 답변 ({detail.resolution ? 1 : 0})
              </Typography>

              {/* 기존 답변 */}
              {detail.resolution && (
                <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      bgcolor: 'action.hover',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                      ↳ {detail.assigneeName ?? '안전경영팀'} &nbsp;|&nbsp;{' '}
                      {detail.resolvedAt
                        ? `${formatDate(detail.resolvedAt)} ${format(parseISO(detail.resolvedAt), 'HH:mm')}`
                        : detail.updatedAt
                        ? formatDate(detail.updatedAt)
                        : ''}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                      {detail.resolution}
                    </Typography>
                  </Box>
                </Paper>
              )}

              {/* 댓글 입력 (ADMIN/CONTRACT_DEPT) */}
              {canManage && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1}>
                      <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>{t('workerVoice.statusCol')}</InputLabel>
                        <Select
                          label={t('workerVoice.statusCol')}
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value as WorkerVoiceStatus)}
                        >
                          <MenuItem value="SUBMITTED">{t('workerVoice.status.SUBMITTED')}</MenuItem>
                          <MenuItem value="TRIAGED">{t('workerVoice.status.TRIAGED')}</MenuItem>
                          <MenuItem value="IN_PROGRESS">{t('workerVoice.status.IN_PROGRESS')}</MenuItem>
                          <MenuItem value="RESOLVED">{t('workerVoice.status.RESOLVED')}</MenuItem>
                          <MenuItem value="CLOSED">{t('workerVoice.status.CLOSED')}</MenuItem>
                        </Select>
                      </FormControl>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="flex-end">
                      <TextField
                        size="small"
                        fullWidth
                        multiline
                        minRows={2}
                        placeholder="댓글을 입력하세요..."
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                      />
                      <Button
                        variant="contained"
                        disabled={!newStatus || statusMut.isPending}
                        onClick={submitStatusChange}
                        sx={{ minWidth: 64, height: 56 }}
                      >
                        {statusMut.isPending ? <CircularProgress size={18} /> : '등록'}
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeDetail}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>

      {/* Create Dialog — PPT 슬라이드 17 */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {t('workerVoice.pageTitle')}
          <IconButton onClick={() => setCreateOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={0}>
            {/* 개인정보 동의 */}
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                개인정보 수집 및 이용 등에 대한 동의
              </Typography>
              <FormControlLabel
                control={<Checkbox size="small" checked={consentChecked} onChange={(e) => setConsentChecked(e.target.checked)} />}
                label={<Typography variant="caption">위 사항에 동의합니다.</Typography>}
                sx={{ mr: 0 }}
              />
            </Stack>
            <Box sx={{ p: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', borderRadius: 1, maxHeight: 160, overflowY: 'auto', mb: 2 }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: 'text.secondary', lineHeight: 1.7 }}>
                {t('workerVoice.consent.body')}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right', mb: 1 }}>
              * 표시는 필수입력 항목입니다.
            </Typography>

            {/* 폼 필드 — PPT 라벨|필드|구분선 스타일 */}
            {[
              /* 구분 */
              <Grid container alignItems="center" key="voiceType">
                <Grid item xs={2}><Typography variant="body2" fontWeight={600}>구분 <span style={{ color: 'red' }}>*</span></Typography></Grid>
                <Grid item xs={10}>
                  <FormControl size="small" sx={{ minWidth: 240 }}>
                    <Select
                      displayEmpty
                      value={createForm.voiceType}
                      onChange={(e) => setCreateForm((f) => ({ ...f, voiceType: e.target.value as WorkerVoiceType }))}
                    >
                      <MenuItem value="NEAR_MISS">{t('workerVoice.types.NEAR_MISS')}</MenuItem>
                      <MenuItem value="INCIDENT">{t('workerVoice.types.INCIDENT')}</MenuItem>
                      <MenuItem value="INQUIRY">{t('workerVoice.types.INQUIRY')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>,
              /* 이름 + 이메일 */
              <Grid container alignItems="center" spacing={2} key="name-email">
                <Grid item xs={2}><Typography variant="body2" fontWeight={600}>이름 <span style={{ color: 'red' }}>*</span></Typography></Grid>
                <Grid item xs={4}>
                  <TextField size="small" fullWidth placeholder="이름을 입력해주세요" value={createForm.reporterName} onChange={(e) => setCreateForm((f) => ({ ...f, reporterName: e.target.value }))} />
                </Grid>
                <Grid item xs={2} sx={{ textAlign: 'right' }}><Typography variant="body2" fontWeight={600}>이메일 <span style={{ color: 'red' }}>*</span></Typography></Grid>
                <Grid item xs={4}>
                  <TextField size="small" fullWidth placeholder="이메일을 입력해주세요" value={createForm.reporterEmail} onChange={(e) => setCreateForm((f) => ({ ...f, reporterEmail: e.target.value }))} />
                </Grid>
              </Grid>,
              /* 회사명 + 업종 */
              <Grid container alignItems="center" spacing={2} key="company-industry">
                <Grid item xs={2}><Typography variant="body2" fontWeight={600}>회사명 <span style={{ color: 'red' }}>*</span></Typography></Grid>
                <Grid item xs={4}>
                  <TextField size="small" fullWidth placeholder="회사명을 입력해주세요" value={createForm.companyName} onChange={(e) => setCreateForm((f) => ({ ...f, companyName: e.target.value }))} />
                </Grid>
                <Grid item xs={2} sx={{ textAlign: 'right' }}><Typography variant="body2" fontWeight={600}>업종 <span style={{ color: 'red' }}>*</span></Typography></Grid>
                <Grid item xs={4}>
                  <TextField size="small" fullWidth placeholder="업종을 입력해주세요" value={createForm.industryName} onChange={(e) => setCreateForm((f) => ({ ...f, industryName: e.target.value }))} />
                </Grid>
              </Grid>,
              /* 연락처 + 보안문자 */
              <Grid container alignItems="center" spacing={2} key="phone-captcha">
                <Grid item xs={2}><Typography variant="body2" fontWeight={600}>연락처 <span style={{ color: 'red' }}>*</span></Typography></Grid>
                <Grid item xs={4}>
                  <TextField size="small" fullWidth placeholder="연락처를 입력해주세요" value={createForm.phone} onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))} />
                </Grid>
                <Grid item xs={2} sx={{ textAlign: 'right' }}><Typography variant="body2" fontWeight={600}>보안문자 <span style={{ color: 'red' }}>*</span></Typography></Grid>
                <Grid item xs={4}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ px: 2, py: 1, bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 1, fontWeight: 700, fontSize: 18, letterSpacing: 4, minWidth: 72, textAlign: 'center' }}>
                      {captchaValue}
                    </Box>
                    <TextField size="small" placeholder="보안문자를 입력해주세요" value={createForm.captchaInput} onChange={(e) => setCreateForm((f) => ({ ...f, captchaInput: e.target.value }))} sx={{ flex: 1 }} />
                  </Stack>
                </Grid>
              </Grid>,
              /* 제목 */
              <Grid container alignItems="center" spacing={2} key="title">
                <Grid item xs={2}><Typography variant="body2" fontWeight={600}>제목 <span style={{ color: 'red' }}>*</span></Typography></Grid>
                <Grid item xs={10}>
                  <TextField size="small" fullWidth placeholder="제목을 입력해주세요" value={createForm.title} onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))} />
                </Grid>
              </Grid>,
              /* 내용 + 파일 */
              <Grid container alignItems="flex-start" spacing={2} key="content">
                <Grid item xs={2} sx={{ pt: '12px !important' }}><Typography variant="body2" fontWeight={600}>내용 <span style={{ color: 'red' }}>*</span></Typography></Grid>
                <Grid item xs={10}>
                  <TextField size="small" fullWidth multiline minRows={5} placeholder="내용을 입력해주세요" value={createForm.content} onChange={(e) => setCreateForm((f) => ({ ...f, content: e.target.value }))} />
                  <Box sx={{ mt: 1 }}>
                    <Button variant="outlined" size="small" component="label" sx={{ mr: 1 }}>
                      파일 선택
                      <input ref={fileInputRef} type="file" hidden onChange={(e) => { setPendingFile(e.target.files?.[0] ?? null); e.target.value = '' }} />
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      {pendingFile ? pendingFile.name : '선택된 파일 없음'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>,
            ].map((row, i, arr) => (
              <Box key={i}>
                <Box sx={{ py: 2 }}>{row}</Box>
                {i < arr.length - 1 && <Divider />}
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            disabled={createMut.isPending || !consentChecked}
            onClick={submitCreate}
            sx={{ minWidth: 160 }}
          >
            {createMut.isPending ? <CircularProgress size={20} /> : '등록하기'}
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

export default WorkerVoicePage
