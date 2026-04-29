// [2026-04-23] PPT 슬라이드 14 기준 전면 재작성
// 안전담당자 필드 추가 / 작업자 테이블 형식 / 첨부파일 업로드 UI / 7개 하단 버튼
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/DeleteOutline'
import SaveIcon from '@mui/icons-material/Save'
import SendIcon from '@mui/icons-material/Send'
import DownloadIcon from '@mui/icons-material/Download'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import PrintIcon from '@mui/icons-material/Print'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import SearchIcon from '@mui/icons-material/Search'
import SchoolIcon from '@mui/icons-material/School'
import { useTranslation } from 'react-i18next'
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { format, parseISO } from 'date-fns'
import { accessRequestApi } from '../../api/accessRequestApi'
import { companyAdminApi } from '../../api/companyAdminApi'
import { lookupApi } from '../../api/lookupApi'
import { useAuth } from '../../context/AuthContext'
import AppDatePicker from '../../components/common/AppDatePicker'
import type { AttachmentType } from '../../types/accessRequest'

const ATTACHMENT_TYPES: AttachmentType[] = ['RISK_ASSESSMENT', 'PLEDGE', 'WORK_PLAN']

const schema = z.object({
  companyId: z.coerce.number().int().nullable().optional(),
  vesselId: z.coerce.number().int().positive({ message: 'required' }),
  portId: z.string().optional(),
  workType: z.string().min(1, 'required'),
  workDescription: z.string().min(1, 'required'),
  plannedStartDate: z.string().min(1, 'required'),
  plannedEndDate: z.string().min(1, 'required'),
  safetyManagerName: z.string().optional(),
  safetyManagerTel: z.string().optional(),
  safetyManagerEmail: z.string().optional(),
  workers: z.array(
    z.object({
      workerName: z.string().min(1, 'required'),
      workerBirth: z.string().optional(),
      workerPhone: z.string().optional(),
      workerRole: z.string().optional(),
      safetyEduCompleted: z.boolean(),
      safetyEduCompletedAt: z.string().optional(),
    })
  ),
})

type FormValues = z.infer<typeof schema>
type SnackbarState = { open: boolean; message: string; severity: 'success' | 'error' }

const AccessRequestCreatePage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id: idParam } = useParams<{ id?: string }>()
  const editId = idParam ? Number(idParam) : null
  const isEditMode = editId != null && !Number.isNaN(editId)
  const { user } = useAuth()
  const isAdminOrDept = user?.role === 'ADMIN' || user?.role === 'CONTRACT_DEPT'

  // ─── Server data queries ──────────────────────────────────────────────────
  const detailQuery = useQuery({
    queryKey: ['access-requests', 'detail', editId],
    queryFn: () => accessRequestApi.detail(editId!),
    enabled: isEditMode,
  })
  const detail = detailQuery.data

  const companiesQuery = useQuery({
    queryKey: ['admin', 'companies', 'all'],
    queryFn: () => companyAdminApi.list({ page: 0, size: 500, status: 'ACTIVE' }),
    enabled: isAdminOrDept,
  })
  const companies = companiesQuery.data?.content ?? []

  const vesselsQuery = useQuery({
    queryKey: ['lookup', 'vessels'],
    queryFn: () => lookupApi.vessels(),
  })
  const vessels = vesselsQuery.data ?? []

  const portsQuery = useQuery({
    queryKey: ['lookup', 'ports'],
    queryFn: () => lookupApi.ports(),
  })
  const ports = portsQuery.data ?? []

  // ─── Form state ───────────────────────────────────────────────────────────
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false, message: '', severity: 'success',
  })
  const [noRiskAssessment, setNoRiskAssessment] = useState(false)
  // pending file uploads: type -> File
  const [pendingFiles, setPendingFiles] = useState<Partial<Record<AttachmentType, File>>>({})
  const fileInputRefs = useRef<Partial<Record<AttachmentType, HTMLInputElement | null>>>({})
  const [excelParsing, setExcelParsing] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    getValues,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyId: null,
      vesselId: 0,
      portId: '',
      workType: '',
      workDescription: '',
      plannedStartDate: '',
      plannedEndDate: '',
      safetyManagerName: '',
      safetyManagerTel: '',
      safetyManagerEmail: '',
      workers: [],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'workers' })

  // ─── Load edit data into form ─────────────────────────────────────────────
  useEffect(() => {
    if (!detail) return
    reset({
      companyId: detail.companyId ?? null,
      vesselId: detail.vesselId ?? 0,
      portId: detail.portId != null ? String(detail.portId) : '',
      workType: detail.workType ?? '',
      workDescription: detail.workDescription ?? '',
      plannedStartDate: detail.plannedStartDate ?? '',
      plannedEndDate: detail.plannedEndDate ?? '',
      safetyManagerName: detail.safetyManagerName ?? '',
      safetyManagerTel: detail.safetyManagerTel ?? '',
      safetyManagerEmail: detail.safetyManagerEmail ?? '',
      workers: (detail.workers ?? []).map((w) => ({
        workerName: w.workerName ?? '',
        workerBirth: w.workerBirth ?? '',
        workerPhone: w.workerPhone ?? '',
        workerRole: w.workerRole ?? '',
        safetyEduCompleted: !!w.safetyEduCompleted,
        safetyEduCompletedAt: w.safetyEduCompletedAt ? w.safetyEduCompletedAt.substring(0, 10) : '',
      })),
    })
    // [2026-04-29] 위험성평가표 없음 체크 복원
    setNoRiskAssessment(!!detail.noRiskAssessment)
  }, [detail, reset])

  // ─── Industry name (auto-fill from company selection) ────────────────────
  const watchedCompanyId = watch('companyId')
  const industryName = useMemo(() => {
    if (isEditMode && detail?.industryName) return detail.industryName
    if (isAdminOrDept && watchedCompanyId) {
      const co = companies.find((c) => c.id === Number(watchedCompanyId))
      return co?.industryName ?? '-'
    }
    return '-'
  }, [isEditMode, detail, isAdminOrDept, watchedCompanyId, companies])

  const watchedStart       = useWatch({ control, name: 'plannedStartDate' })
  const watchedEnd         = useWatch({ control, name: 'plannedEndDate' })
  const watchedWorkers     = useWatch({ control, name: 'workers' })
  const watchedVesselId    = useWatch({ control, name: 'vesselId' })
  const watchedWorkType    = useWatch({ control, name: 'workType' })
  const watchedWorkDesc    = useWatch({ control, name: 'workDescription' })

  // ─── 승선신청 활성화 조건 ────────────────────────────────────────────────
  const missingItems = useMemo(() => {
    const hasAtt = (type: AttachmentType) =>
      !!pendingFiles[type] || !!detail?.attachments?.find((a) => a.attachmentType === type)
    const items: string[] = []
    // 필수 입력값
    if (!watchedVesselId || Number(watchedVesselId) <= 0) items.push('방문선박')
    if (!watchedWorkType?.trim())  items.push('작업종류')
    if (!watchedWorkDesc?.trim())  items.push('작업내용')
    if (!watchedStart)             items.push('작업시작일')
    if (!watchedEnd)               items.push('작업종료일')
    // 작업자 1명 이상
    if (!watchedWorkers || watchedWorkers.length === 0) {
      items.push('작업자 1명 이상 등록')
    } else {
      if (watchedWorkers.some((w) => !w.safetyEduCompleted || !w.safetyEduCompletedAt))
        items.push('작업자 교육이수 미완료')
    }
    // 필수 첨부파일
    if (!hasAtt('PLEDGE'))    items.push('안전보건서약서')
    if (!hasAtt('WORK_PLAN')) items.push('작업계획서')
    if (!noRiskAssessment && !hasAtt('RISK_ASSESSMENT')) items.push('위험성평가표')
    return items
  }, [pendingFiles, detail, noRiskAssessment, watchedWorkers,
      watchedVesselId, watchedWorkType, watchedWorkDesc, watchedStart, watchedEnd])

  const canSubmit = missingItems.length === 0

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const extractErrorMessage = (err: unknown): string => {
    if (axios.isAxiosError(err)) {
      const m = (err.response?.data as { message?: string } | undefined)?.message
      if (m) return m
    }
    return t('approval.actionFailed')
  }

  const errText = (path: string): string | undefined => {
    const keys = path.split('.')
    let node: unknown = errors
    for (const k of keys) {
      if (!node || typeof node !== 'object') return undefined
      node = (node as Record<string, unknown>)[k]
    }
    if (!node || typeof node !== 'object') return undefined
    const msg = (node as { message?: unknown }).message
    if (!msg) return undefined
    return msg === 'required' ? t('errors.required') : String(msg)
  }

  const formatDate = (iso?: string | null) => {
    if (!iso) return '-'
    try { return format(parseISO(iso), 'yyyy-MM-dd') } catch { return iso }
  }

  // ─── Attachment helpers ───────────────────────────────────────────────────
  const existingAttachment = (type: AttachmentType) =>
    detail?.attachments?.find((a) => a.attachmentType === type) ?? null

  const handleFileSelect = (type: AttachmentType, file: File | null) => {
    setPendingFiles((prev) => {
      const next = { ...prev }
      if (file) next[type] = file
      else delete next[type]
      return next
    })
  }

  const handleDeleteExistingAttachment = async (attachmentId: number) => {
    if (!editId) return
    try {
      await accessRequestApi.deleteAttachment(editId, attachmentId)
      detailQuery.refetch()
    } catch (err) {
      setSnackbar({ open: true, message: extractErrorMessage(err), severity: 'error' })
    }
  }

  const uploadPendingFiles = async (requestId: number) => {
    for (const [type, file] of Object.entries(pendingFiles) as [AttachmentType, File][]) {
      await accessRequestApi.uploadAttachment(requestId, file, type)
    }
    setPendingFiles({})
  }

  // ─── Excel helpers ────────────────────────────────────────────────────────
  const handleDownloadTemplate = async () => {
    try {
      const blob = await accessRequestApi.downloadWorkerExcelTemplate()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'access_workers_template.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setSnackbar({ open: true, message: extractErrorMessage(e), severity: 'error' })
    }
  }

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setExcelParsing(true)
    try {
      const parsed = await accessRequestApi.parseWorkerExcel(file)
      parsed.forEach((w) => append({
        workerName: w.workerName ?? '',
        workerBirth: w.workerBirth ?? '',
        workerPhone: w.workerPhone ?? '',
        workerRole: w.workerRole ?? '',
        safetyEduCompleted: false,
        safetyEduCompletedAt: '',
      }))
      setSnackbar({
        open: true,
        message: t('accessRequest.worker.excelImportedCount', { count: parsed.length }),
        severity: 'success',
      })
    } catch (err) {
      setSnackbar({ open: true, message: extractErrorMessage(err), severity: 'error' })
    } finally {
      setExcelParsing(false)
    }
  }

  // ─── Save / Submit mutation ───────────────────────────────────────────────
  const saveMut = useMutation({
    mutationFn: async (submitAfter: boolean) => {
      const values = getValues()
      const basePayload = {
        vesselId: Number(values.vesselId),
        portId: values.portId ? Number(values.portId) : undefined,
        workType: values.workType,
        workDescription: values.workDescription,
        plannedStartDate: values.plannedStartDate,
        plannedEndDate: values.plannedEndDate,
        safetyManagerName: values.safetyManagerName || null,
        safetyManagerTel: values.safetyManagerTel || null,
        safetyManagerEmail: values.safetyManagerEmail || null,
        noRiskAssessment: noRiskAssessment,
        workers: values.workers,
      }
      let requestId: number
      if (isEditMode) {
        await accessRequestApi.update(editId!, basePayload)
        requestId = editId!
      } else {
        const { id } = await accessRequestApi.create({
          ...basePayload,
          companyId: values.companyId ?? undefined,
        })
        requestId = id
      }
      if (Object.keys(pendingFiles).length > 0) {
        await uploadPendingFiles(requestId)
      }
      if (submitAfter) await accessRequestApi.submit(requestId)
      return requestId
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] })
      setSnackbar({ open: true, message: t('common.save'), severity: 'success' })
      setTimeout(() => navigate(`/vessel/access-request/${id}`), 500)
    },
    onError: (err) =>
      setSnackbar({ open: true, message: extractErrorMessage(err), severity: 'error' }),
  })

  // ─── Clone mutation ───────────────────────────────────────────────────────
  const cloneMut = useMutation({
    mutationFn: () => accessRequestApi.clone(editId!),
    onSuccess: ({ id }) => {
      setSnackbar({ open: true, message: t('accessRequest.action.cloned'), severity: 'success' })
      setTimeout(() => navigate(`/vessel/access-request/${id}/edit`), 500)
    },
    onError: (err) =>
      setSnackbar({ open: true, message: extractErrorMessage(err), severity: 'error' }),
  })

  // ─── Delete mutation ──────────────────────────────────────────────────────
  const deleteMut = useMutation({
    mutationFn: () => accessRequestApi.remove(editId!),
    onSuccess: () => navigate('/vessel/access-request'),
    onError: (err) =>
      setSnackbar({ open: true, message: extractErrorMessage(err), severity: 'error' }),
  })

  const onSaveDraft = handleSubmit(() => {
    if (!isEditMode && isAdminOrDept && !getValues('companyId')) {
      setSnackbar({ open: true, message: t('accessRequest.selectCompany'), severity: 'error' })
      return
    }
    saveMut.mutate(false)
  })

  const onBoardingRequest = handleSubmit(() => {
    if (!isEditMode && isAdminOrDept && !getValues('companyId')) {
      setSnackbar({ open: true, message: t('accessRequest.selectCompany'), severity: 'error' })
      return
    }
    saveMut.mutate(true)
  })

  const isBusy = saveMut.isPending || cloneMut.isPending || deleteMut.isPending

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* ── Header ── */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton
            onClick={() =>
              navigate(isEditMode ? `/vessel/access-request/${editId}` : '/vessel/access-request')
            }
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {isEditMode ? t('common.edit') : t('accessRequest.create')}
          </Typography>
        </Stack>
      </Paper>

      {/* ── Section 1: 기본 정보 ── */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          {t('accessRequest.tabBasic')}
        </Typography>
        <Grid container spacing={2}>
          {/* 1. 방문선박 */}
          <Grid item xs={12} sm={6}>
            <Controller
              name="vesselId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth required error={!!errors.vesselId}>
                  <InputLabel>{t('accessRequest.vessel')}</InputLabel>
                  <Select
                    label={t('accessRequest.vessel')}
                    value={field.value || ''}
                    onChange={(e) =>
                      field.onChange(e.target.value === '' ? 0 : Number(e.target.value))
                    }
                  >
                    <MenuItem value=""><em>{t('common.selectPlaceholder', { defaultValue: '선택하세요' })}</em></MenuItem>
                    {vessels.map((v) => (
                      <MenuItem key={v.id} value={v.id}>
                        {v.name}{v.imoNumber ? ` (IMO ${v.imoNumber})` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                  {!!errors.vesselId && <FormHelperText>{errText('vesselId')}</FormHelperText>}
                </FormControl>
              )}
            />
          </Grid>
          {/* 2. 지역/항구 */}
          <Grid item xs={12} sm={6}>
            <Controller
              name="portId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.portId}>
                  <InputLabel>{t('accessRequest.port')}</InputLabel>
                  <Select
                    label={t('accessRequest.port')}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(String(e.target.value))}
                  >
                    <MenuItem value=""><em>{t('common.selectPlaceholder', { defaultValue: '선택하세요' })}</em></MenuItem>
                    {ports.map((p) => (
                      <MenuItem key={p.id} value={String(p.id)}>
                        {p.name}{p.code ? ` (${p.code})` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
          {/* 3. 회사명 */}
          {isAdminOrDept && !isEditMode ? (
            <Grid item xs={12} sm={6}>
              <Controller
                name="companyId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth required error={!!errors.companyId}>
                    <InputLabel>{t('accessRequest.companyNameLabel')}</InputLabel>
                    <Select
                      label={t('accessRequest.companyNameLabel')}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? null : Number(e.target.value))
                      }
                    >
                      <MenuItem value=""><em>{t('common.selectPlaceholder', { defaultValue: '선택하세요' })}</em></MenuItem>
                      {companies.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name} ({c.businessNumber})
                        </MenuItem>
                      ))}
                    </Select>
                    {!!errors.companyId && (
                      <FormHelperText>{errText('companyId')}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
          ) : (
            <Grid item xs={12} sm={6}>
              <TextField
                label={t('accessRequest.companyNameLabel')}
                value={detail?.companyName ?? user?.name ?? '-'}
                fullWidth
                InputProps={{ readOnly: true }}
                sx={{ '& .MuiInputBase-input': { color: 'text.secondary' } }}
              />
            </Grid>
          )}
          {/* 4. 업종 (자동입력, 읽기전용) */}
          <Grid item xs={12} sm={6}>
            <TextField
              label={t('accessRequest.industryName')}
              value={industryName}
              fullWidth
              InputProps={{ readOnly: true }}
              sx={{ '& .MuiInputBase-input': { color: 'text.secondary' } }}
            />
          </Grid>

          {/* 안전담당자 구분선 */}
          <Grid item xs={12}>
            <Divider textAlign="left">
              <Typography variant="caption" color="text.secondary">
                {t('accessRequest.safetyManager')}
              </Typography>
            </Divider>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              {...register('safetyManagerName')}
              label={t('accessRequest.safetyManagerName')}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              {...register('safetyManagerTel')}
              label={t('accessRequest.safetyManagerTel')}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              {...register('safetyManagerEmail')}
              label={t('accessRequest.safetyManagerEmail')}
              fullWidth
            />
          </Grid>

          {/* 작업 정보 구분선 */}
          <Grid item xs={12}>
            <Divider textAlign="left">
              <Typography variant="caption" color="text.secondary">
                {t('accessRequest.workType')}
              </Typography>
            </Divider>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              {...register('workType')}
              label={t('accessRequest.workType')}
              fullWidth
              required
              error={!!errors.workType}
              helperText={errText('workType')}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Controller
              name="plannedStartDate"
              control={control}
              render={({ field }) => (
                <AppDatePicker
                  label={t('accessRequest.plannedStart')}
                  value={field.value || null}
                  onChange={(iso) => field.onChange(iso ?? '')}
                  maxIsoDate={watchedEnd || null}
                  fullWidth
                  required
                  size="medium"
                  error={!!errors.plannedStartDate}
                  helperText={errText('plannedStartDate')}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Controller
              name="plannedEndDate"
              control={control}
              render={({ field }) => (
                <AppDatePicker
                  label={t('accessRequest.plannedEnd')}
                  value={field.value || null}
                  onChange={(iso) => field.onChange(iso ?? '')}
                  minIsoDate={watchedStart || null}
                  fullWidth
                  required
                  size="medium"
                  error={!!errors.plannedEndDate}
                  helperText={errText('plannedEndDate')}
                />
              )}
            />
          </Grid>
          {/* 작업 일수 */}
          <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center' }}>
            {watchedStart && watchedEnd ? (
              <Typography variant="body2" color="text.secondary">
                {(() => {
                  try {
                    const days = Math.round(
                      (new Date(watchedEnd).getTime() - new Date(watchedStart).getTime()) /
                      (1000 * 60 * 60 * 24)
                    ) + 1
                    return days > 0 ? `${days}일` : '-'
                  } catch { return '-' }
                })()}
              </Typography>
            ) : null}
          </Grid>
          <Grid item xs={12}>
            <TextField
              {...register('workDescription')}
              label={t('accessRequest.workDescription')}
              fullWidth
              multiline
              minRows={3}
              required
              error={!!errors.workDescription}
              helperText={errText('workDescription')}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* ── Section 2: 작업자 ── */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ md: 'center' }}
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: 2 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {t('accessRequest.tabWorkers')}{' '}
            <Typography component="span" variant="caption" color="text.secondary">
              ({t('accessRequest.worker.firstRowIsRep')})
            </Typography>
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button size="small" variant="text" startIcon={<DownloadIcon />} onClick={handleDownloadTemplate}>
              {t('accessRequest.worker.excelTemplate')}
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<UploadFileIcon />}
              component="label"
              disabled={excelParsing}
            >
              {excelParsing ? <CircularProgress size={18} /> : t('accessRequest.worker.excelUpload')}
              <input type="file" accept=".xlsx,.xls" hidden onChange={handleExcelUpload} />
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => append({ workerName: '', workerBirth: '', workerPhone: '', workerRole: '', safetyEduCompleted: false, safetyEduCompletedAt: '' })}
            >
              {t('accessRequest.worker.add')}
            </Button>
          </Stack>
        </Stack>

        {fields.length === 0 ? (
          <Typography variant="body2" color="text.secondary">{t('common.noData')}</Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 760 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell width={36} align="center">No.</TableCell>
                  <TableCell>{t('accessRequest.worker.name')}<span style={{ color: 'red' }}> *</span></TableCell>
                  <TableCell>{t('accessRequest.worker.role')}</TableCell>
                  <TableCell>{t('accessRequest.worker.birth')}</TableCell>
                  <TableCell>{t('accessRequest.worker.phone')}</TableCell>
                  <TableCell align="center">{t('accessRequest.worker.eduDate')}</TableCell>
                  <TableCell align="center">{t('accessRequest.worker.eduStatus')}</TableCell>
                  <TableCell align="center">{t('accessRequest.worker.certBtn')}</TableCell>
                  <TableCell width={40} />
                </TableRow>
              </TableHead>
              <TableBody>
                {fields.map((f, idx) => {
                  const certUrl = isEditMode ? (detail?.workers?.[idx]?.safetyEduCertificateUrl ?? null) : null

                  return (
                    <TableRow key={f.id} hover>
                      <TableCell align="center">
                        <Typography variant="caption">{idx + 1}</Typography>
                      </TableCell>
                      <TableCell>
                        <TextField
                          {...register(`workers.${idx}.workerName`)}
                          size="small"
                          required
                          error={!!errors.workers?.[idx]?.workerName}
                          helperText={errText(`workers.${idx}.workerName`)}
                          sx={{ minWidth: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          {...register(`workers.${idx}.workerRole`)}
                          size="small"
                          sx={{ minWidth: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          {...register(`workers.${idx}.workerBirth`)}
                          size="small"
                          placeholder="YYMMDD"
                          sx={{ minWidth: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          {...register(`workers.${idx}.workerPhone`)}
                          size="small"
                          sx={{ minWidth: 110 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Controller
                          name={`workers.${idx}.safetyEduCompletedAt`}
                          control={control}
                          render={({ field }) => (
                            <AppDatePicker
                              label=""
                              value={field.value || null}
                              onChange={(iso) => {
                                field.onChange(iso ?? '')
                                setValue(`workers.${idx}.safetyEduCompleted`, !!iso)
                              }}
                              size="small"
                              fullWidth={false}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Controller
                          name={`workers.${idx}.safetyEduCompleted`}
                          control={control}
                          render={({ field }) => {
                            const dateVal = watch(`workers.${idx}.safetyEduCompletedAt`) ?? ''
                            const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(dateVal) && !isNaN(Date.parse(dateVal))
                            // 날짜가 유효하면 이수 강제
                            const effectiveValue = isValidDate ? true : field.value
                            return (
                              <FormControl size="small" sx={{ minWidth: 80 }}>
                                <Select
                                  value={effectiveValue ? 'Y' : 'N'}
                                  onChange={(e) => field.onChange(e.target.value === 'Y')}
                                  disabled={isValidDate}
                                >
                                  <MenuItem value="N">{t('accessRequest.worker.eduStatusPending')}</MenuItem>
                                  <MenuItem value="Y">{t('accessRequest.worker.eduStatusCompleted')}</MenuItem>
                                </Select>
                              </FormControl>
                            )
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {certUrl ? (
                          <Tooltip title={t('accessRequest.worker.certBtn')}>
                            <IconButton
                              size="small"
                              onClick={() => window.open(certUrl, '_blank')}
                            >
                              <PrintIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.disabled">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => remove(idx)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      {/* ── Section 3: 첨부파일 ── */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          {t('accessRequest.tabAttachments')}
        </Typography>

        <Stack spacing={1.5}>
          {ATTACHMENT_TYPES.map((type) => {
            const existing = existingAttachment(type)
            const pending = pendingFiles[type]
            const label = t(`accessRequest.attachment.types.${type}`)

            return (
              <Box key={type}>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={12} sm={2}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {label}
                      {type !== 'RISK_ASSESSMENT' && (
                        <Typography component="span" variant="caption" color="error"> *</Typography>
                      )}
                    </Typography>
                    {type === 'RISK_ASSESSMENT' && (
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            checked={noRiskAssessment}
                            onChange={(e) => {
                              setNoRiskAssessment(e.target.checked)
                              if (e.target.checked) handleFileSelect('RISK_ASSESSMENT', null)
                            }}
                          />
                        }
                        label={
                          <Typography variant="caption">
                            {t('accessRequest.attachment.noRiskAssessment')}
                          </Typography>
                        }
                        sx={{ ml: 0, mt: 0.5 }}
                      />
                    )}
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    {pending ? (
                      <Typography variant="body2" sx={{ color: 'primary.main' }}>
                        {pending.name}
                      </Typography>
                    ) : existing ? (
                      <Typography variant="body2">{existing.fileName}</Typography>
                    ) : (
                      <Typography variant="body2" color="text.disabled">
                        {t('common.noData')}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<UploadFileIcon />}
                        component="label"
                        disabled={type === 'RISK_ASSESSMENT' && noRiskAssessment}
                      >
                        {t('accessRequest.attachment.upload')}
                        <input
                          type="file"
                          hidden
                          ref={(el) => { fileInputRefs.current[type] = el }}
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null
                            e.target.value = ''
                            handleFileSelect(type, file)
                          }}
                        />
                      </Button>
                      {(pending || existing) && !(type === 'RISK_ASSESSMENT' && noRiskAssessment) && (
                        <Button
                          size="small"
                          variant="text"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => {
                            if (pending) {
                              handleFileSelect(type, null)
                            } else if (existing) {
                              handleDeleteExistingAttachment(existing.id)
                            }
                          }}
                        >
                          {t('common.delete')}
                        </Button>
                      )}
                    </Stack>
                  </Grid>
                </Grid>
                <Divider sx={{ mt: 1.5 }} />
              </Box>
            )
          })}
        </Stack>
      </Paper>

      {/* ── Section 4: 하단 액션 버튼 (PPT 슬라이드 14: 7개) ── */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          justifyContent={{ xs: 'stretch', sm: 'flex-end' }}
        >
          {/* 신청서 재사용 — edit mode only */}
          {isEditMode && (
            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={() => cloneMut.mutate()}
              disabled={isBusy}
            >
              {t('accessRequest.action.clone')}
            </Button>
          )}

          {/* 교육이수 조회 */}
          <Button
            variant="outlined"
            startIcon={<SearchIcon />}
            onClick={() =>
              setSnackbar({ open: true, message: t('common.comingSoon'), severity: 'success' })
            }
            disabled={isBusy}
          >
            {t('accessRequest.action.queryEdu')}
          </Button>

          {/* 교육 신청 */}
          <Button
            variant="outlined"
            startIcon={<SchoolIcon />}
            onClick={() =>
              setSnackbar({ open: true, message: t('common.comingSoon'), severity: 'success' })
            }
            disabled={isBusy}
          >
            {t('accessRequest.action.applyEdu')}
          </Button>

          {/* 임시저장 */}
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={onSaveDraft}
            disabled={isBusy}
          >
            {isBusy ? <CircularProgress size={20} /> : t('accessRequest.action.saveDraft')}
          </Button>

          {/* 이수증(개인) 출력 */}
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            disabled={isBusy}
          >
            {t('accessRequest.action.printCertPersonal')}
          </Button>

          {/* 승선 신청 */}
          <Tooltip
            title={missingItems.length > 0 ? `미완료: ${missingItems.join(', ')}` : ''}
            arrow
          >
            <span>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SendIcon />}
                onClick={onBoardingRequest}
                disabled={isBusy || !canSubmit}
              >
                {isBusy ? <CircularProgress size={20} /> : t('accessRequest.action.boardingRequest')}
              </Button>
            </span>
          </Tooltip>

          {/* 삭제 — edit mode only (DRAFT 상태) */}
          {isEditMode && detail?.status === 'DRAFT' && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => {
                if (window.confirm(t('common.confirmTitle') + '?')) deleteMut.mutate()
              }}
              disabled={isBusy}
            >
              {t('common.delete')}
            </Button>
          )}
        </Stack>
      </Paper>

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

export default AccessRequestCreatePage
