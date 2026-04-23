import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Stack,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  IconButton,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Paper,
  Link,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/DeleteOutline'
import UploadIcon from '@mui/icons-material/UploadFile'
import SendIcon from '@mui/icons-material/Send'
import SaveIcon from '@mui/icons-material/Save'
import CheckIcon from '@mui/icons-material/CheckCircleOutline'
import BlockIcon from '@mui/icons-material/Block'
import BuildIcon from '@mui/icons-material/Build'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import AppDatePicker from '../../components/common/AppDatePicker'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import axios from 'axios'
import { evaluationApi } from '../../api/evaluationApi'
import { improvementApi } from '../../api/improvementApi'
import { useAuth } from '../../context/AuthContext'
import {
  getEvaluationStatusColor,
  getImprovementStatusColor,
} from '../../utils/status'
import type {
  EvaluationImprovement,
  EvaluationItemScore,
  EvaluationStatus,
  ImprovementStatus,
} from '../../types/evaluation'

type SnackbarState = { open: boolean; message: string; severity: 'success' | 'error' }

interface Props {
  evaluationId: number | null
  open: boolean
  onClose: () => void
}

const EvaluationDetailDialog: React.FC<Props> = ({ evaluationId, open, onClose }) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const qc = useQueryClient()
  const { user } = useAuth()

  const [editScores, setEditScores] = useState<Record<number, { score: number; comment?: string }>>({})
  const [editComment, setEditComment] = useState<string>('')
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [improvementOpen, setImprovementOpen] = useState(false)
  const [improvementContent, setImprovementContent] = useState('')
  const [improvementDue, setImprovementDue] = useState('')
  const [improvementItemId, setImprovementItemId] = useState<number | ''>('')
  const [respondTarget, setRespondTarget] = useState<EvaluationImprovement | null>(null)
  const [respondContent, setRespondContent] = useState('')

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  })
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const detailQuery = useQuery({
    queryKey: ['evaluations', 'detail', evaluationId],
    queryFn: () => evaluationApi.detail(evaluationId as number),
    enabled: open && evaluationId != null,
  })
  const detail = detailQuery.data

  const improvementsQuery = useQuery({
    queryKey: ['evaluation-improvements', { evaluationId }],
    queryFn: () =>
      improvementApi.list({ evaluationId: evaluationId as number, size: 50 }),
    enabled: open && evaluationId != null,
  })

  // PPT slide 25: 증빙서류 클릭 → PDF/이미지 인라인 미리보기
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; mime?: string } | null>(null)

  const historyQuery = useQuery({
    queryKey: ['evaluations', 'history', evaluationId],
    queryFn: () => evaluationApi.history(evaluationId as number),
    enabled: open && evaluationId != null,
  })

  // initialize local edits whenever detail loads
  useEffect(() => {
    if (detail) {
      const initial: Record<number, { score: number; comment?: string }> = {}
      for (const s of detail.itemScores) {
        initial[s.itemId] = { score: s.score, comment: s.comment ?? '' }
      }
      setEditScores(initial)
      setEditComment(detail.comment ?? '')
    } else {
      setEditScores({})
      setEditComment('')
    }
  }, [detail])

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

  // -------- mutations --------

  const saveMut = useMutation({
    mutationFn: () => {
      if (!detail) throw new Error('no detail')
      return evaluationApi.update(detail.id, {
        companyId: detail.companyId,
        businessNumber: detail.businessNumber,
        periodYear: detail.periodYear,
        periodHalf: detail.periodHalf,
        evaluationType: detail.evaluationType,
        evaluatorName: detail.evaluatorName ?? undefined,
        comment: editComment,
        itemScores: detail.itemScores.map((s) => ({
          itemId: s.itemId,
          score: editScores[s.itemId]?.score ?? s.score,
          comment: editScores[s.itemId]?.comment ?? s.comment ?? undefined,
        })),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evaluations'] })
      qc.invalidateQueries({ queryKey: ['evaluations', 'detail', evaluationId] })
      notifySuccess(t('common.save'))
    },
    onError: notifyError,
  })

  const submitMut = useMutation({
    mutationFn: () => evaluationApi.submit(evaluationId as number),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evaluations'] })
      qc.invalidateQueries({ queryKey: ['evaluations', 'detail', evaluationId] })
      notifySuccess(t('common.submit'))
    },
    onError: notifyError,
  })

  const reviewMut = useMutation({
    mutationFn: (payload: { action: 'APPROVE' | 'REJECT'; reason?: string }) =>
      evaluationApi.review(evaluationId as number, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evaluations'] })
      qc.invalidateQueries({ queryKey: ['evaluations', 'detail', evaluationId] })
      notifySuccess(t('common.confirm'))
      setRejectOpen(false)
      setRejectReason('')
    },
    onError: notifyError,
  })

  const uploadMut = useMutation({
    mutationFn: ({ file }: { file: File }) =>
      evaluationApi.uploadAttachment(evaluationId as number, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evaluations', 'detail', evaluationId] })
      notifySuccess(t('accessRequest.attachment.upload'))
    },
    onError: notifyError,
  })

  const deleteAttachmentMut = useMutation({
    mutationFn: (attachmentId: number) =>
      evaluationApi.deleteAttachment(evaluationId as number, attachmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evaluations', 'detail', evaluationId] })
      notifySuccess(t('common.delete'))
    },
    onError: notifyError,
  })

  const createImprovementMut = useMutation({
    mutationFn: () =>
      improvementApi.create({
        evaluationId: evaluationId as number,
        itemId: improvementItemId === '' ? undefined : Number(improvementItemId),
        content: improvementContent,
        responseDueDate: improvementDue,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evaluation-improvements'] })
      notifySuccess(t('improvement.createSuccess'))
      setImprovementOpen(false)
      setImprovementContent('')
      setImprovementDue('')
      setImprovementItemId('')
    },
    onError: notifyError,
  })

  const respondImprovementMut = useMutation({
    mutationFn: () =>
      improvementApi.respond(respondTarget!.id, { responseContent: respondContent }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evaluation-improvements'] })
      notifySuccess(t('improvement.respondSuccess'))
      setRespondTarget(null)
      setRespondContent('')
    },
    onError: notifyError,
  })

  const closeImprovementMut = useMutation({
    mutationFn: (id: number) => improvementApi.close(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evaluation-improvements'] })
      notifySuccess(t('improvement.closeSuccess'))
    },
    onError: notifyError,
  })

  // -------- computed --------

  const liveTotals = useMemo(() => {
    if (!detail) return { total: 0, max: 0, percentage: 0, qualified: false }
    let total = 0
    let max = 0
    for (const s of detail.itemScores) {
      const score = editScores[s.itemId]?.score ?? s.score
      const weighted = (Number(score) || 0) * (s.weight || 1)
      const maxWeighted = s.maxScore * (s.weight || 1)
      total += weighted
      max += maxWeighted
    }
    const percentage = max > 0 ? (total / max) * 100 : 0
    return { total, max, percentage, qualified: percentage >= 70 }
  }, [detail, editScores])

  const scoresByCategory = useMemo(() => {
    if (!detail) return new Map<string, EvaluationItemScore[]>()
    const m = new Map<string, EvaluationItemScore[]>()
    for (const s of detail.itemScores) {
      const arr = m.get(s.itemCategory) ?? []
      arr.push(s)
      m.set(s.itemCategory, arr)
    }
    return m
  }, [detail])

  const status: EvaluationStatus | undefined = detail?.status
  const isEditable =
    status === 'DRAFT' ||
    (status === 'REJECTED' && (user?.role === 'ADMIN' || user?.role === 'CONTRACT_DEPT'))
  const canReview =
    status === 'SUBMITTED' && (user?.role === 'ADMIN' || user?.role === 'CONTRACT_DEPT')
  const canAddImprovement =
    (status === 'APPROVED' || status === 'REJECTED') &&
    (user?.role === 'ADMIN' || user?.role === 'CONTRACT_DEPT')

  const formatDate = (iso: string) => {
    try {
      return format(parseISO(iso), 'yyyy-MM-dd HH:mm')
    } catch {
      return iso
    }
  }
  const formatDay = (iso: string) => {
    try {
      return format(parseISO(iso), 'yyyy-MM-dd')
    } catch {
      return iso
    }
  }

  const statusLabel = (s: EvaluationStatus) => t(`evaluation.status.${s}`)
  const improvementStatusLabel = (s: ImprovementStatus) => t(`improvement.status.${s}`)

  const handleScoreChange = (itemId: number, maxScore: number, raw: string) => {
    const parsed = Number(raw)
    if (Number.isNaN(parsed)) return
    const clamped = Math.max(0, Math.min(maxScore, parsed))
    setEditScores((prev) => ({
      ...prev,
      [itemId]: { score: clamped, comment: prev[itemId]?.comment },
    }))
  }
  const handleItemCommentChange = (itemId: number, value: string) => {
    setEditScores((prev) => ({
      ...prev,
      [itemId]: { score: prev[itemId]?.score ?? 0, comment: value },
    }))
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadMut.mutate({ file })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth fullScreen={isMobile}>
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {detail?.evaluationNo ?? t('evaluation.detailTitle')}
            </Typography>
            {detail && (
              <>
                <Chip
                  size="small"
                  label={statusLabel(detail.status)}
                  color={getEvaluationStatusColor(detail.status)}
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  size="small"
                  label={
                    liveTotals.qualified
                      ? t('evaluation.qualified')
                      : t('evaluation.notQualified')
                  }
                  color={liveTotals.qualified ? 'success' : 'error'}
                  sx={{ fontWeight: 600 }}
                />
              </>
            )}
          </Stack>
          <IconButton onClick={onClose} size="small">
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
              {/* Header info */}
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    {t('evaluation.period')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {detail.periodYear} {detail.periodHalf}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    {t('evaluation.company')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {detail.companyName}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    {t('evaluation.businessNumber')}
                  </Typography>
                  <Typography variant="body1">{detail.businessNumber}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    {t('evaluation.totalScore')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {liveTotals.total.toFixed(1)} / {liveTotals.max.toFixed(1)} (
                    {liveTotals.percentage.toFixed(1)}%)
                  </Typography>
                </Grid>
              </Grid>

              {detail.rejectedReason && (
                <Alert severity="error">{detail.rejectedReason}</Alert>
              )}

              <Divider />

              {/* Comment */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  {t('evaluation.comment')}
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  disabled={!isEditable}
                />
              </Box>

              <Divider />

              {/* Item scores */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                  {t('evaluation.itemScores')}
                </Typography>

                {[...scoresByCategory.entries()].map(([category, items]) => (
                  <Box key={category} sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}
                    >
                      {category}
                    </Typography>

                    {isMobile ? (
                      <Stack spacing={1.5}>
                        {items.map((s) => (
                          <Card key={s.itemId} variant="outlined">
                            <CardContent>
                              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                {s.itemTitle}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                                sx={{ mb: 1 }}
                              >
                                {t('evaluationItem.maxScore')}: {s.maxScore} · {t('evaluationItem.weight')}: {s.weight}
                              </Typography>
                              <TextField
                                type="number"
                                size="small"
                                label={t('evaluation.score')}
                                inputProps={{ min: 0, max: s.maxScore, step: 0.5 }}
                                value={editScores[s.itemId]?.score ?? s.score}
                                onChange={(e) =>
                                  handleScoreChange(s.itemId, s.maxScore, e.target.value)
                                }
                                disabled={!isEditable}
                                sx={{ mb: 1 }}
                                fullWidth
                              />
                              <TextField
                                size="small"
                                label={t('evaluation.itemComment')}
                                value={editScores[s.itemId]?.comment ?? ''}
                                onChange={(e) =>
                                  handleItemCommentChange(s.itemId, e.target.value)
                                }
                                disabled={!isEditable}
                                fullWidth
                                multiline
                                minRows={2}
                              />
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    ) : (
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>{t('evaluationItem.title')}</TableCell>
                              <TableCell align="right" sx={{ width: 80 }}>
                                {t('evaluationItem.maxScore')}
                              </TableCell>
                              <TableCell align="right" sx={{ width: 80 }}>
                                {t('evaluationItem.weight')}
                              </TableCell>
                              <TableCell align="right" sx={{ width: 120 }}>
                                {t('evaluation.score')}
                              </TableCell>
                              <TableCell align="right" sx={{ width: 100 }}>
                                {t('evaluation.weightedScore')}
                              </TableCell>
                              <TableCell>{t('evaluation.itemComment')}</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {items.map((s) => {
                              const liveScore = editScores[s.itemId]?.score ?? s.score
                              return (
                                <TableRow key={s.itemId}>
                                  <TableCell>{s.itemTitle}</TableCell>
                                  <TableCell align="right">{s.maxScore}</TableCell>
                                  <TableCell align="right">{s.weight}</TableCell>
                                  <TableCell align="right">
                                    <TextField
                                      type="number"
                                      size="small"
                                      inputProps={{
                                        min: 0,
                                        max: s.maxScore,
                                        step: 0.5,
                                      }}
                                      value={liveScore}
                                      onChange={(e) =>
                                        handleScoreChange(
                                          s.itemId,
                                          s.maxScore,
                                          e.target.value
                                        )
                                      }
                                      disabled={!isEditable}
                                      sx={{ width: 100 }}
                                    />
                                  </TableCell>
                                  <TableCell align="right">
                                    {((Number(liveScore) || 0) * (s.weight || 1)).toFixed(1)}
                                  </TableCell>
                                  <TableCell>
                                    <TextField
                                      size="small"
                                      value={editScores[s.itemId]?.comment ?? ''}
                                      onChange={(e) =>
                                        handleItemCommentChange(s.itemId, e.target.value)
                                      }
                                      disabled={!isEditable}
                                      fullWidth
                                    />
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                ))}
              </Box>

              <Divider />

              {/* Attachments */}
              <Box>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {t('accessRequest.tabAttachments')}
                  </Typography>
                  {isEditable && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        hidden
                        onChange={handleUpload}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<UploadIcon />}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadMut.isPending}
                      >
                        {t('accessRequest.attachment.upload')}
                      </Button>
                    </>
                  )}
                </Stack>

                {detail.attachments.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t('common.noData')}
                  </Typography>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>{t('accessRequest.attachment.fileName')}</TableCell>
                          <TableCell align="right" sx={{ width: 120 }}>
                            {t('accessRequest.attachment.size')}
                          </TableCell>
                          <TableCell sx={{ width: 180 }}>
                            {t('accessRequest.attachment.uploadedAt')}
                          </TableCell>
                          {isEditable && <TableCell sx={{ width: 60 }} />}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detail.attachments.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell>
                              <Link
                                component="button"
                                type="button"
                                underline="hover"
                                onClick={() => setPreviewFile({ url: a.filePath, name: a.fileName, mime: a.mimeType })}
                              >
                                {a.fileName}
                              </Link>
                            </TableCell>
                            <TableCell align="right">
                              {a.fileSize != null ? `${(Number(a.fileSize) / 1024).toFixed(1)} KB` : '-'}
                            </TableCell>
                            <TableCell>{formatDate(a.uploadedAt)}</TableCell>
                            {isEditable && (
                              <TableCell>
                                <IconButton
                                  size="small"
                                  onClick={() => deleteAttachmentMut.mutate(a.id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>

              <Divider />

              {/* Improvements */}
              <Accordion defaultExpanded={false}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {t('improvement.pageTitle')}
                    {improvementsQuery.data?.content?.length
                      ? ` (${improvementsQuery.data.content.length})`
                      : ''}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    {canAddImprovement && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<BuildIcon />}
                        onClick={() => setImprovementOpen(true)}
                        sx={{ alignSelf: 'flex-start' }}
                      >
                        {t('evaluation.addImprovement')}
                      </Button>
                    )}

                    {(improvementsQuery.data?.content ?? []).length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        {t('common.noData')}
                      </Typography>
                    ) : (
                      (improvementsQuery.data!.content).map((imp) => (
                        <Card key={imp.id} variant="outlined">
                          <CardContent>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              sx={{ mb: 1 }}
                              flexWrap="wrap"
                            >
                              <Chip
                                size="small"
                                label={improvementStatusLabel(imp.status)}
                                color={getImprovementStatusColor(imp.status)}
                                sx={{ fontWeight: 600 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(imp.requestedAt)} · {imp.requestedByName}
                              </Typography>
                              {imp.itemTitle && (
                                <Typography variant="caption" color="text.secondary">
                                  · {imp.itemTitle}
                                </Typography>
                              )}
                            </Stack>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>{t('improvement.requestContent')}:</strong>{' '}
                              {imp.requestContent}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {t('improvement.responseDueDate')}: {formatDay(imp.responseDueDate)}
                            </Typography>
                            {imp.responseContent && (
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                <strong>{t('improvement.responseContent')}:</strong>{' '}
                                {imp.responseContent}
                              </Typography>
                            )}

                            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                              {imp.status === 'OPEN' &&
                                user?.role === 'CONTRACTOR' && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => {
                                      setRespondTarget(imp)
                                      setRespondContent('')
                                    }}
                                  >
                                    {t('improvement.respond')}
                                  </Button>
                                )}
                              {imp.status === 'RESPONDED' &&
                                (user?.role === 'ADMIN' ||
                                  user?.role === 'CONTRACT_DEPT') && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="success"
                                    onClick={() => closeImprovementMut.mutate(imp.id)}
                                  >
                                    {t('improvement.close')}
                                  </Button>
                                )}
                            </Stack>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* PPT slide 26: 수정 History */}
              <Accordion defaultExpanded={false}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {t('evaluation.history')}
                    {historyQuery.data?.length ? ` (${historyQuery.data.length})` : ''}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {(historyQuery.data ?? []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      {t('common.noData')}
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      {(historyQuery.data ?? []).map((h) => (
                        <Box
                          key={h.id}
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '160px 140px 1fr' },
                            columnGap: 2,
                            rowGap: 0.5,
                            p: 1,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(h.createdAt)}
                          </Typography>
                          <Chip
                            size="small"
                            label={t(`evaluation.historyAction.${h.action}`, { defaultValue: h.action })}
                            variant="outlined"
                            sx={{ width: 'fit-content' }}
                          />
                          <Typography variant="body2">
                            {h.detail || '-'}
                            {h.actorName ? (
                              <Typography
                                component="span"
                                variant="caption"
                                color="text.secondary"
                                sx={{ ml: 1 }}
                              >
                                — {h.actorName}
                              </Typography>
                            ) : null}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </AccordionDetails>
              </Accordion>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1, flexWrap: 'wrap' }}>
          {isEditable && (
            <>
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={() => saveMut.mutate()}
                disabled={saveMut.isPending}
              >
                {saveMut.isPending ? <CircularProgress size={20} /> : t('common.save')}
              </Button>
              {status === 'DRAFT' && (
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={async () => {
                    await saveMut.mutateAsync()
                    submitMut.mutate()
                  }}
                  disabled={submitMut.isPending || saveMut.isPending}
                >
                  {submitMut.isPending ? (
                    <CircularProgress size={20} />
                  ) : (
                    t('common.submit')
                  )}
                </Button>
              )}
            </>
          )}
          {canReview && !rejectOpen && (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<BlockIcon />}
                onClick={() => setRejectOpen(true)}
              >
                {t('evaluation.reject')}
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckIcon />}
                onClick={() => reviewMut.mutate({ action: 'APPROVE' })}
                disabled={reviewMut.isPending}
              >
                {reviewMut.isPending ? <CircularProgress size={20} /> : t('evaluation.approve')}
              </Button>
            </>
          )}
          {canReview && rejectOpen && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: '100%' }}>
              <TextField
                size="small"
                label={t('evaluation.rejectReasonLabel')}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                sx={{ flex: 1 }}
              />
              <Button
                onClick={() => {
                  setRejectOpen(false)
                  setRejectReason('')
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() =>
                  reviewMut.mutate({
                    action: 'REJECT',
                    reason: rejectReason.trim() || undefined,
                  })
                }
                disabled={reviewMut.isPending}
              >
                {reviewMut.isPending ? <CircularProgress size={20} /> : t('common.confirm')}
              </Button>
            </Stack>
          )}
          <Button onClick={onClose}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>

      {/* Add Improvement Dialog */}
      <Dialog
        open={improvementOpen}
        onClose={() => setImprovementOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('evaluation.addImprovement')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              size="small"
              label={t('improvement.itemTarget')}
              value={improvementItemId}
              onChange={(e) =>
                setImprovementItemId(e.target.value === '' ? '' : Number(e.target.value))
              }
              SelectProps={{ native: true }}
              InputLabelProps={{ shrink: true }}
            >
              <option value="">{t('improvement.itemTargetAll')}</option>
              {detail?.itemScores.map((s) => (
                <option key={s.itemId} value={s.itemId}>
                  {s.itemTitle}
                </option>
              ))}
            </TextField>
            <TextField
              label={t('improvement.requestContent')}
              multiline
              minRows={3}
              value={improvementContent}
              onChange={(e) => setImprovementContent(e.target.value)}
              fullWidth
              required
            />
            <AppDatePicker
              label={t('improvement.responseDueDate')}
              value={improvementDue || null}
              onChange={(iso) => setImprovementDue(iso ?? '')}
              required
              size="medium"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImprovementOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={() => createImprovementMut.mutate()}
            disabled={
              !improvementContent.trim() ||
              !improvementDue ||
              createImprovementMut.isPending
            }
          >
            {createImprovementMut.isPending ? (
              <CircularProgress size={20} />
            ) : (
              t('common.save')
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Respond Improvement Dialog */}
      <Dialog
        open={respondTarget != null}
        onClose={() => setRespondTarget(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('improvement.respond')}</DialogTitle>
        <DialogContent dividers>
          {respondTarget && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2">
                <strong>{t('improvement.requestContent')}:</strong>{' '}
                {respondTarget.requestContent}
              </Typography>
              <TextField
                label={t('improvement.responseContent')}
                multiline
                minRows={3}
                value={respondContent}
                onChange={(e) => setRespondContent(e.target.value)}
                fullWidth
                required
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRespondTarget(null)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={() => respondImprovementMut.mutate()}
            disabled={!respondContent.trim() || respondImprovementMut.isPending}
          >
            {respondImprovementMut.isPending ? (
              <CircularProgress size={20} />
            ) : (
              t('common.submit')
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* PPT slide 25: 증빙서류 인라인 미리보기 */}
      <Dialog
        open={previewFile != null}
        onClose={() => setPreviewFile(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" fontWeight={700} noWrap>
            {previewFile?.name}
          </Typography>
          <IconButton onClick={() => setPreviewFile(null)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, height: '80vh' }}>
          {previewFile && (
            previewFile.mime?.startsWith('image/') ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <Box component="img" src={previewFile.url} alt={previewFile.name} sx={{ maxWidth: '100%' }} />
              </Box>
            ) : (
              <Box
                component="iframe"
                src={previewFile.url}
                title={previewFile.name}
                sx={{ width: '100%', height: '100%', border: 0 }}
              />
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => previewFile && window.open(previewFile.url, '_blank', 'noopener,noreferrer')}
          >
            {t('common.print')}
          </Button>
          <Button onClick={() => setPreviewFile(null)}>{t('common.close')}</Button>
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
    </>
  )
}

export default EvaluationDetailDialog
