import { useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Paper,
  Stack,
  Typography,
  Chip,
  Button,
  Tabs,
  Tab,
  Grid,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  Link,
  Stepper,
  Step,
  StepLabel,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteIcon from '@mui/icons-material/DeleteOutline'
import UploadIcon from '@mui/icons-material/UploadFile'
import BadgeIcon from '@mui/icons-material/Badge'
import SendIcon from '@mui/icons-material/Send'
import CheckIcon from '@mui/icons-material/CheckCircleOutline'
import BlockIcon from '@mui/icons-material/Block'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import EditIcon from '@mui/icons-material/Edit'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import FindInPageIcon from '@mui/icons-material/FindInPage'
import PrintIcon from '@mui/icons-material/Print'
import EventIcon from '@mui/icons-material/Event'
import { useConfirm } from '../../components/common/ConfirmDialogProvider'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import axios from 'axios'
import { accessRequestApi } from '../../api/accessRequestApi'
import { useAuth } from '../../context/AuthContext'
import { getAccessRequestStatusColor } from '../../utils/status'
import type {
  AccessRequestStatus,
  AttachmentType,
  ReviewAction,
} from '../../types/accessRequest'

type SnackbarState = { open: boolean; message: string; severity: 'success' | 'error' }

const attachmentTypes: AttachmentType[] = [
  'RISK_ASSESSMENT',
  'PLEDGE',
  'WORK_PLAN',
  'OTHER',
]

const AccessRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const numericId = Number(id)
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = location.pathname.startsWith('/vessel/access-permit')
    ? '/vessel/access-permit'
    : '/vessel/access-request'
  const { t } = useTranslation()
  const confirm = useConfirm()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const qc = useQueryClient()
  const { user } = useAuth()

  const [tab, setTab] = useState(0)
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  })

  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean
    action: ReviewAction | null
  }>({ open: false, action: null })
  const [reviewComment, setReviewComment] = useState('')

  const [uploadType, setUploadType] = useState<AttachmentType>('RISK_ASSESSMENT')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const detailQuery = useQuery({
    queryKey: ['access-requests', 'detail', numericId],
    queryFn: () => accessRequestApi.detail(numericId),
    enabled: !Number.isNaN(numericId),
  })

  const detail = detailQuery.data

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

  const submitMut = useMutation({
    mutationFn: () => accessRequestApi.submit(numericId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['access-requests'] })
      notifySuccess(t('accessRequest.action.submit'))
    },
    onError: notifyError,
  })

  const removeMut = useMutation({
    mutationFn: () => accessRequestApi.remove(numericId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['access-requests'] })
      notifySuccess(t('common.delete'))
      navigate(basePath)
    },
    onError: notifyError,
  })

  const cloneMut = useMutation({
    mutationFn: () => accessRequestApi.clone(numericId),
    onSuccess: ({ id: newId }) => {
      qc.invalidateQueries({ queryKey: ['access-requests'] })
      notifySuccess(t('accessRequest.action.cloned'))
      setTimeout(() => navigate(`${basePath}/${newId}`), 500)
    },
    onError: notifyError,
  })

  // PPT slide 13: 작업일정 iCal 내보내기 (브라우저 캘린더 import)
  const downloadIcs = (d: {
    id: number
    requestNo: string
    companyName?: string | null
    vesselName?: string | null
    workType?: string | null
    workDescription?: string | null
    plannedStartDate: string
    plannedEndDate: string
  }) => {
    const fmt = (iso: string) => iso.replace(/-/g, '')
    const nowStamp = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d+Z/, 'Z')
    const endPlusOne = new Date(d.plannedEndDate)
    endPlusOne.setDate(endPlusOne.getDate() + 1)
    const endStr = endPlusOne.toISOString().slice(0, 10).replace(/-/g, '')
    const summary = `[${d.companyName ?? ''}] ${d.vesselName ?? ''} ${d.workType ?? ''}`.trim()
    const esc = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')
    const desc = esc(
      [
        `신청번호: ${d.requestNo}`,
        d.workDescription ? `작업내용: ${d.workDescription}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    )
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PanOcean//EHS//KO',
      'BEGIN:VEVENT',
      `UID:access-${d.id}@penocean`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART;VALUE=DATE:${fmt(d.plannedStartDate)}`,
      `DTEND;VALUE=DATE:${endStr}`,
      `SUMMARY:${esc(summary)}`,
      `DESCRIPTION:${desc}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `access-${d.requestNo}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  // PPT slide 14: 이수증(개인) 출력
  const [certWorker, setCertWorker] = useState<null | {
    workerName: string
    workerBirth?: string
    workerRole?: string
    safetyEduCompletedAt?: string | null
  }>(null)

  // PPT slide 24: 서류 순차 팝업 (위험성평가 → 안전보건서약서 → 작업계획서)
  const [docReviewOpen, setDocReviewOpen] = useState(false)
  const [docReviewStep, setDocReviewStep] = useState(0)
  const DOC_STEPS: { type: AttachmentType; labelKey: string }[] = [
    { type: 'RISK_ASSESSMENT', labelKey: 'accessRequest.attachment.types.RISK_ASSESSMENT' },
    { type: 'PLEDGE', labelKey: 'accessRequest.attachment.types.PLEDGE' },
    { type: 'WORK_PLAN', labelKey: 'accessRequest.attachment.types.WORK_PLAN' },
  ]
  const openDocReview = () => {
    setDocReviewStep(0)
    setDocReviewOpen(true)
  }

  const reviewMut = useMutation({
    mutationFn: (payload: { action: ReviewAction; comment?: string }) =>
      accessRequestApi.review(numericId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['access-requests'] })
      notifySuccess(t('common.confirm'))
      setReviewDialog({ open: false, action: null })
      setReviewComment('')
    },
    onError: notifyError,
  })

  const uploadMut = useMutation({
    mutationFn: ({ file, type }: { file: File; type: AttachmentType }) =>
      accessRequestApi.uploadAttachment(numericId, file, type),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['access-requests', 'detail', numericId] })
      notifySuccess(t('accessRequest.attachment.upload'))
    },
    onError: notifyError,
  })

  const deleteAttachmentMut = useMutation({
    mutationFn: (attachmentId: number) =>
      accessRequestApi.deleteAttachment(numericId, attachmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['access-requests', 'detail', numericId] })
      notifySuccess(t('common.delete'))
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

  const formatDateTime = (iso: string) => {
    try {
      return format(parseISO(iso), 'yyyy-MM-dd HH:mm')
    } catch {
      return iso
    }
  }

  const statusLabel = (s: AccessRequestStatus) => t(`accessRequest.status.${s}`)

  const isContractor = user?.role === 'CONTRACTOR'
  const isAdminOrDept = user?.role === 'ADMIN' || user?.role === 'CONTRACT_DEPT'

  const canEdit =
    (isContractor || isAdminOrDept) &&
    detail &&
    (detail.status === 'DRAFT' || detail.status === 'IMPROVEMENT_REQUESTED')
  const baseCanSubmit =
    (isContractor || isAdminOrDept) &&
    detail &&
    (detail.status === 'DRAFT' || detail.status === 'IMPROVEMENT_REQUESTED')

  // PPT slide 14 요구: 파일첨부 및 교육이수 완료해야 '승선 신청' 버튼 활성화
  const submitRequirements = (() => {
    if (!detail) return { allEduDone: false, hasRequiredAttachments: false, hasAnyWorker: false }
    const workers = detail.workers ?? []
    const allEduDone = workers.length > 0 && workers.every((w) => !!w.safetyEduCompleted)
    const reqTypes: AttachmentType[] = detail.noRiskAssessment
      ? ['PLEDGE', 'WORK_PLAN']
      : ['RISK_ASSESSMENT', 'PLEDGE', 'WORK_PLAN']
    const hasRequiredAttachments = reqTypes.every((tp) =>
      (detail.attachments ?? []).some((a) => a.attachmentType === tp)
    )
    return { allEduDone, hasRequiredAttachments, hasAnyWorker: workers.length > 0 }
  })()
  const canSubmit =
    baseCanSubmit &&
    submitRequirements.allEduDone &&
    submitRequirements.hasRequiredAttachments
  const showSubmitBlocked =
    baseCanSubmit && !canSubmit
  const canDelete = (isContractor || isAdminOrDept) && detail && detail.status === 'DRAFT'

  const canStartReview =
    isAdminOrDept && detail && detail.status === 'SUBMITTED'
  const canRequestImprovement =
    isAdminOrDept && detail && detail.status === 'IN_REVIEW'
  const canApproveReject =
    isAdminOrDept && detail && detail.status === 'IN_REVIEW'

  const showViewPermit = detail && detail.status === 'APPROVED'

  const openReview = (action: ReviewAction) => {
    setReviewDialog({ open: true, action })
    setReviewComment('')
  }

  const confirmReview = () => {
    if (!reviewDialog.action) return
    reviewMut.mutate({
      action: reviewDialog.action,
      comment: reviewComment.trim() || undefined,
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadMut.mutate({ file, type: uploadType })
    }
    // reset so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const triggerUpload = (type: AttachmentType) => {
    setUploadType(type)
    setTimeout(() => fileInputRef.current?.click(), 0)
  }

  if (detailQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!detail) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{t('approval.loadError')}</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate(basePath)}>
          {t('common.back')}
        </Button>
      </Box>
    )
  }

  const lastImprovementReason = detail.reviewLogs
    .slice()
    .reverse()
    .find((log) => log.action === 'IMPROVEMENT')?.comment

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton onClick={() => navigate(basePath)}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="overline" color="text.secondary">
                {t('accessRequest.requestNo')}
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {detail.requestNo}
                </Typography>
                <Chip
                  size="small"
                  label={statusLabel(detail.status)}
                  color={getAccessRequestStatusColor(detail.status)}
                  sx={{ fontWeight: 600 }}
                />
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {showViewPermit && (
              <Button
                variant="outlined"
                startIcon={<BadgeIcon />}
                onClick={() =>
                  navigate(`/vessel/visit-permit?accessRequestId=${detail.id}`)
                }
              >
                {t('accessRequest.viewPermit')}
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={() => cloneMut.mutate()}
              disabled={cloneMut.isPending}
            >
              {t('accessRequest.action.clone')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<EventIcon />}
              onClick={() => downloadIcs(detail)}
            >
              {t('accessRequest.action.addToCalendar')}
            </Button>
            {canEdit && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/vessel/access-request/${detail.id}/edit`)}
              >
                {t('common.edit')}
              </Button>
            )}
            {(canSubmit || showSubmitBlocked) && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<SendIcon />}
                onClick={() => submitMut.mutate()}
                disabled={!canSubmit || submitMut.isPending}
              >
                {t('accessRequest.action.submit')}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={async () => {
                  if (await confirm({
                    title: t('common.delete'),
                    message: t('common.delete') + '?',
                    severity: 'error',
                    confirmText: t('common.delete'),
                  })) {
                    removeMut.mutate()
                  }
                }}
                disabled={removeMut.isPending}
              >
                {t('common.delete')}
              </Button>
            )}
            {canStartReview && (
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={() => openReview('START')}
              >
                {t('accessRequest.action.startReview')}
              </Button>
            )}
            {(canStartReview || canRequestImprovement || canApproveReject) && (
              <Button
                variant="outlined"
                startIcon={<FindInPageIcon />}
                onClick={openDocReview}
              >
                {t('accessRequest.action.docReview')}
              </Button>
            )}
            {canRequestImprovement && (
              <Button
                variant="outlined"
                color="warning"
                startIcon={<ReportProblemIcon />}
                onClick={() => openReview('IMPROVEMENT')}
              >
                {t('accessRequest.action.requestImprovement')}
              </Button>
            )}
            {canApproveReject && (
              <>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<BlockIcon />}
                  onClick={() => openReview('REJECT')}
                >
                  {t('accessRequest.action.reject')}
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckIcon />}
                  onClick={() => openReview('APPROVE')}
                >
                  {t('accessRequest.action.approve')}
                </Button>
              </>
            )}
          </Stack>
        </Stack>

        {detail.status === 'IMPROVEMENT_REQUESTED' && lastImprovementReason && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <strong>{t('accessRequest.improvementReasonLabel')}:</strong>{' '}
            {lastImprovementReason}
          </Alert>
        )}
        {showSubmitBlocked && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>{t('accessRequest.submitBlocked')}</strong>
            <ul style={{ marginTop: 4, marginBottom: 0, paddingLeft: 20 }}>
              {!submitRequirements.hasAnyWorker && (
                <li>{t('accessRequest.submitBlockedNoWorker')}</li>
              )}
              {!submitRequirements.allEduDone && (
                <li>{t('accessRequest.submitBlockedEdu')}</li>
              )}
              {!submitRequirements.hasRequiredAttachments && (
                <li>{t('accessRequest.submitBlockedAttach')}</li>
              )}
            </ul>
          </Alert>
        )}
      </Paper>

      {/* Tabs */}
      <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant={isMobile ? 'fullWidth' : 'standard'}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={t('accessRequest.tabBasic')} />
          <Tab label={t('accessRequest.tabWorkers')} />
          <Tab label={t('accessRequest.tabAttachments')} />
        </Tabs>

        {/* Basic tab */}
        {tab === 0 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  {t('accessRequest.company')}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {detail.companyName}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  {t('accessRequest.vessel')}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {detail.vesselName}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  {t('accessRequest.workType')}
                </Typography>
                <Typography variant="body1">{detail.workType}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  {t('accessRequest.workerCount')}
                </Typography>
                <Typography variant="body1">{detail.workerCount}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  {t('accessRequest.plannedStart')}
                </Typography>
                <Typography variant="body1">
                  {formatDate(detail.plannedStartDate)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  {t('accessRequest.plannedEnd')}
                </Typography>
                <Typography variant="body1">
                  {formatDate(detail.plannedEndDate)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  {t('accessRequest.workDescription')}
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  {detail.workDescription}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
              {t('accessRequest.tabBasic')} — Review Log
            </Typography>
            {detail.reviewLogs.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {t('common.noData')}
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {detail.reviewLogs.map((log) => (
                  <Paper
                    key={log.id}
                    variant="outlined"
                    sx={{ p: 1.5, borderLeft: 4, borderColor: 'primary.main' }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={1}
                    >
                      <Chip
                        size="small"
                        label={log.action}
                        color={
                          log.action === 'APPROVE'
                            ? 'success'
                            : log.action === 'REJECT'
                              ? 'error'
                              : log.action === 'IMPROVEMENT'
                                ? 'warning'
                                : 'info'
                        }
                      />
                      <Typography variant="caption" color="text.secondary">
                        {log.actorUserName} · {formatDateTime(log.actedAt)}
                      </Typography>
                    </Stack>
                    {log.comment && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {log.comment}
                      </Typography>
                    )}
                  </Paper>
                ))}
              </Stack>
            )}
          </Box>
        )}

        {/* Workers tab */}
        {tab === 1 && (
          <Box sx={{ p: 3 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 2 }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {t('accessRequest.tabWorkers')} ({detail.workers.length})
              </Typography>
              {canEdit && (
                <Button variant="outlined" size="small" disabled>
                  {t('accessRequest.worker.uploadExcel')}
                </Button>
              )}
            </Stack>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('accessRequest.worker.name')}</TableCell>
                    <TableCell>{t('accessRequest.worker.birth')}</TableCell>
                    <TableCell>{t('accessRequest.worker.phone')}</TableCell>
                    <TableCell>{t('accessRequest.worker.role')}</TableCell>
                    <TableCell align="center">
                      {t('accessRequest.worker.eduCompleted')}
                    </TableCell>
                    <TableCell align="center">
                      {t('accessRequest.worker.certBtn')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detail.workers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="text.secondary">
                          {t('common.noData')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {detail.workers.map((w, idx) => (
                    <TableRow key={w.id ?? idx}>
                      <TableCell>{w.workerName}</TableCell>
                      <TableCell>{w.workerBirth || '-'}</TableCell>
                      <TableCell>{w.workerPhone || '-'}</TableCell>
                      <TableCell>{w.workerRole || '-'}</TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={
                            w.safetyEduCompleted
                              ? t('accessRequest.worker.eduCompleted')
                              : t('accessRequest.worker.eduPending')
                          }
                          color={w.safetyEduCompleted ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={!w.safetyEduCompleted}
                          onClick={() => setCertWorker(w)}
                        >
                          {t('accessRequest.worker.certBtn')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Attachments tab */}
        {tab === 2 && (
          <Box sx={{ p: 3 }}>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {attachmentTypes.map((type) => {
              const files = detail.attachments.filter((a) => a.attachmentType === type)
              return (
                <Box key={type} sx={{ mb: 3 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 1 }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {t(`accessRequest.attachment.types.${type}`)}
                      </Typography>
                      {type === 'RISK_ASSESSMENT' && detail.noRiskAssessment && (
                        <Chip label="없음 처리" size="small" color="default" />
                      )}
                    </Stack>
                    {canEdit && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<UploadIcon />}
                        onClick={() => triggerUpload(type)}
                        disabled={uploadMut.isPending}
                      >
                        {t('accessRequest.attachment.upload')}
                      </Button>
                    )}
                  </Stack>
                  {files.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      {t('common.noData')}
                    </Typography>
                  ) : (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>{t('accessRequest.attachment.fileName')}</TableCell>
                            <TableCell>{t('accessRequest.attachment.size')}</TableCell>
                            <TableCell>{t('accessRequest.attachment.uploadedAt')}</TableCell>
                            <TableCell align="right" />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {files.map((f) => (
                            <TableRow key={f.id}>
                              <TableCell>
                                <Link
                                  href={f.filePath}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {f.fileName}
                                </Link>
                              </TableCell>
                              <TableCell>
                                {f.fileSize != null ? `${(Number(f.fileSize) / 1024).toFixed(1)} KB` : '-'}
                              </TableCell>
                              <TableCell>{formatDateTime(f.uploadedAt)}</TableCell>
                              <TableCell align="right">
                                {canEdit && (
                                  <IconButton
                                    size="small"
                                    onClick={() => deleteAttachmentMut.mutate(f.id)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )
            })}
          </Box>
        )}
      </Paper>

      {/* PPT slide 14: 개인 이수증 출력 (window.print 로 PDF 저장 가능) */}
      <Dialog
        open={certWorker != null}
        onClose={() => setCertWorker(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          {certWorker && (
            <Box
              sx={{
                p: 4,
                border: '2px solid',
                borderColor: 'primary.main',
                textAlign: 'center',
              }}
            >
              <Typography variant="overline" color="text.secondary">
                PAN OCEAN SAFETY
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 1, mb: 3 }}>
                안전보건 교육 이수증
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                아래 작업자는 당사 사업장 출입 전 안전보건 교육을 이수했음을 증명합니다.
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr',
                  gap: 1.5,
                  textAlign: 'left',
                  my: 3,
                  mx: 'auto',
                  maxWidth: 360,
                }}
              >
                <Typography color="text.secondary">성명</Typography>
                <Typography fontWeight={700}>{certWorker.workerName}</Typography>
                <Typography color="text.secondary">생년월일</Typography>
                <Typography>{certWorker.workerBirth || '-'}</Typography>
                <Typography color="text.secondary">직책/직위</Typography>
                <Typography>{certWorker.workerRole || '-'}</Typography>
                <Typography color="text.secondary">교육 이수일</Typography>
                <Typography>
                  {certWorker.safetyEduCompletedAt
                    ? formatDateTime(certWorker.safetyEduCompletedAt)
                    : '-'}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
                발급일: {new Date().toLocaleDateString('ko-KR')}
              </Typography>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 2 }}>
                PAN OCEAN 안전경영팀
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="no-print">
          <Button onClick={() => setCertWorker(null)}>{t('common.close')}</Button>
          <Button variant="contained" onClick={() => window.print()}>
            {t('common.print')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* PPT slide 24: 서류 순차 검토 다이얼로그 (위험성평가 → 서약서 → 작업계획서) */}
      <Dialog
        open={docReviewOpen}
        onClose={() => setDocReviewOpen(false)}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
      >
        <DialogTitle>
          {t('accessRequest.docReview.title')} ({docReviewStep + 1}/{DOC_STEPS.length})
        </DialogTitle>
        <DialogContent dividers>
          <Stepper activeStep={docReviewStep} alternativeLabel sx={{ mb: 3 }}>
            {DOC_STEPS.map((s) => (
              <Step key={s.type}>
                <StepLabel>{t(s.labelKey)}</StepLabel>
              </Step>
            ))}
          </Stepper>
          {(() => {
            if (!detail) return null
            const currentType = DOC_STEPS[docReviewStep].type
            const files = detail.attachments.filter((a) => a.attachmentType === currentType)
            if (files.length === 0) {
              return (
                <Alert severity="warning">
                  {t('accessRequest.docReview.missing', { type: t(DOC_STEPS[docReviewStep].labelKey) })}
                </Alert>
              )
            }
            return (
              <Stack spacing={1.5}>
                {files.map((f) => (
                  <Paper key={f.id} variant="outlined" sx={{ p: 2 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={1}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {f.fileName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {f.fileSize != null ? `${(Number(f.fileSize) / 1024).toFixed(1)} KB` : '-'}
                          {' · '}
                          {formatDateTime(f.uploadedAt)}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PrintIcon />}
                          onClick={() => window.open(f.filePath, '_blank', 'noopener,noreferrer')}
                        >
                          {t('common.print')}
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )
          })()}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, flexWrap: 'wrap' }}>
          <Button
            disabled={docReviewStep === 0}
            onClick={() => setDocReviewStep((s) => Math.max(0, s - 1))}
          >
            {t('common.prev')}
          </Button>
          {canRequestImprovement && (
            <Button
              color="warning"
              variant="outlined"
              startIcon={<ReportProblemIcon />}
              onClick={() => {
                setDocReviewOpen(false)
                openReview('IMPROVEMENT')
              }}
            >
              {t('accessRequest.action.requestImprovement')}
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          {docReviewStep < DOC_STEPS.length - 1 ? (
            <Button
              variant="contained"
              onClick={() => setDocReviewStep((s) => s + 1)}
            >
              {t('common.next')}
            </Button>
          ) : (
            <Button variant="contained" onClick={() => setDocReviewOpen(false)}>
              {t('accessRequest.docReview.finish')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Review comment dialog */}
      <Dialog
        open={reviewDialog.open}
        onClose={() => setReviewDialog({ open: false, action: null })}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
      >
        <DialogTitle>
          {reviewDialog.action === 'IMPROVEMENT' &&
            t('accessRequest.action.requestImprovement')}
          {reviewDialog.action === 'APPROVE' && t('accessRequest.action.approve')}
          {reviewDialog.action === 'REJECT' && t('accessRequest.action.reject')}
          {reviewDialog.action === 'START' && t('accessRequest.action.startReview')}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label={
              reviewDialog.action === 'IMPROVEMENT'
                ? t('accessRequest.improvementReasonLabel')
                : t('approval.rejectReasonLabel')
            }
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setReviewDialog({ open: false, action: null })}
            disabled={reviewMut.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={confirmReview}
            disabled={reviewMut.isPending}
          >
            {reviewMut.isPending ? <CircularProgress size={20} /> : t('common.confirm')}
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

export default AccessRequestDetailPage
