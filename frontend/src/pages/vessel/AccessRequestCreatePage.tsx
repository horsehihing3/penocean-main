import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Paper,
  Stack,
  Typography,
  Grid,
  TextField,
  Button,
  IconButton,
  Divider,
  Snackbar,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/DeleteOutline'
import SaveIcon from '@mui/icons-material/Save'
import SendIcon from '@mui/icons-material/Send'
import DownloadIcon from '@mui/icons-material/Download'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { useTranslation } from 'react-i18next'
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { accessRequestApi } from '../../api/accessRequestApi'
import { companyAdminApi } from '../../api/companyAdminApi'
import { lookupApi } from '../../api/lookupApi'
import { useAuth } from '../../context/AuthContext'
import AppDatePicker from '../../components/common/AppDatePicker'

const schema = z.object({
  companyId: z.coerce.number().int().nullable().optional(),
  vesselId: z.coerce.number().int().positive({ message: 'required' }),
  portId: z.string().optional(),
  workType: z.string().min(1, 'required'),
  workDescription: z.string().min(1, 'required'),
  plannedStartDate: z.string().min(1, 'required'),
  plannedEndDate: z.string().min(1, 'required'),
  workers: z.array(
    z.object({
      workerName: z.string().min(1, 'required'),
      workerBirth: z.string().optional(),
      workerPhone: z.string().optional(),
      workerRole: z.string().optional(),
      safetyEduCompleted: z.boolean(),
    })
  ),
})

type FormValues = z.infer<typeof schema>

type SnackbarState = { open: boolean; message: string; severity: 'success' | 'error' }

const AccessRequestCreatePage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id: idParam } = useParams<{ id?: string }>()
  const editId = idParam ? Number(idParam) : null
  const isEditMode = editId != null && !Number.isNaN(editId)
  const { user } = useAuth()
  const isAdminOrDept = user?.role === 'ADMIN' || user?.role === 'CONTRACT_DEPT'

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

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  })

  const {
    register,
    control,
    handleSubmit,
    getValues,
    reset,
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
      workers: [],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'workers' })
  const [excelParsing, setExcelParsing] = useState(false)

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
      workers: (detail.workers ?? []).map((w) => ({
        workerName: w.workerName ?? '',
        workerBirth: w.workerBirth ?? '',
        workerPhone: w.workerPhone ?? '',
        workerRole: w.workerRole ?? '',
        safetyEduCompleted: !!w.safetyEduCompleted,
      })),
    })
  }, [detail, reset])

  const watchedStart = useWatch({ control, name: 'plannedStartDate' })
  const watchedEnd = useWatch({ control, name: 'plannedEndDate' })

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
      parsed.forEach((w) => {
        append({
          workerName: w.workerName ?? '',
          workerBirth: w.workerBirth ?? '',
          workerPhone: w.workerPhone ?? '',
          workerRole: w.workerRole ?? '',
          safetyEduCompleted: false,
        })
      })
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

  const extractErrorMessage = (err: unknown): string => {
    if (axios.isAxiosError(err)) {
      const m = (err.response?.data as { message?: string } | undefined)?.message
      if (m) return m
    }
    return t('approval.actionFailed')
  }

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
        workers: values.workers,
      }
      if (isEditMode) {
        await accessRequestApi.update(editId!, basePayload)
        if (submitAfter) await accessRequestApi.submit(editId!)
        return editId!
      }
      const { id } = await accessRequestApi.create({
        ...basePayload,
        companyId: values.companyId ?? undefined,
      })
      if (submitAfter) await accessRequestApi.submit(id)
      return id
    },
    onSuccess: (id) => {
      setSnackbar({
        open: true,
        message: t('common.save'),
        severity: 'success',
      })
      setTimeout(() => navigate(`/vessel/access-request/${id}`), 500)
    },
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
  const onSaveSubmit = handleSubmit(() => {
    if (!isEditMode && isAdminOrDept && !getValues('companyId')) {
      setSnackbar({ open: true, message: t('accessRequest.selectCompany'), severity: 'error' })
      return
    }
    saveMut.mutate(true)
  })

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
    if (msg === 'required') return t('errors.required')
    return String(msg)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header */}
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

      {/* Section: Basic info */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          {t('accessRequest.tabBasic')}
        </Typography>
        <Grid container spacing={2}>
          {isAdminOrDept && !isEditMode && (
            <Grid item xs={12} sm={6}>
              <Controller
                name="companyId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth required error={!!errors.companyId}>
                    <InputLabel>{t('accessRequest.company')}</InputLabel>
                    <Select
                      label={t('accessRequest.company')}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? null : Number(e.target.value))
                      }
                    >
                      <MenuItem value="">
                        <em>{t('common.selectPlaceholder', { defaultValue: '선택하세요' })}</em>
                      </MenuItem>
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
          )}
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
                    <MenuItem value="">
                      <em>{t('common.selectPlaceholder', { defaultValue: '선택하세요' })}</em>
                    </MenuItem>
                    {vessels.map((v) => (
                      <MenuItem key={v.id} value={v.id}>
                        {v.name}
                        {v.imoNumber ? ` (IMO ${v.imoNumber})` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                  {!!errors.vesselId && (
                    <FormHelperText>{errText('vesselId')}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </Grid>
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
                    onChange={(e) => field.onChange(e.target.value === '' ? '' : String(e.target.value))}
                  >
                    <MenuItem value="">
                      <em>{t('common.selectPlaceholder', { defaultValue: '선택하세요' })}</em>
                    </MenuItem>
                    {ports.map((p) => (
                      <MenuItem key={p.id} value={String(p.id)}>
                        {p.name}
                        {p.code ? ` (${p.code})` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                  {!!errors.portId && (
                    <FormHelperText>{errText('portId')}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
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

      {/* Section: Workers */}
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
            <Button
              size="small"
              variant="text"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadTemplate}
            >
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
              <input
                type="file"
                accept=".xlsx,.xls"
                hidden
                onChange={handleExcelUpload}
              />
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() =>
                append({
                  workerName: '',
                  workerBirth: '',
                  workerPhone: '',
                  workerRole: '',
                  safetyEduCompleted: false,
                })
              }
            >
              {t('accessRequest.worker.add')}
            </Button>
          </Stack>
        </Stack>

        {fields.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            {t('common.noData')}
          </Typography>
        )}

        <Stack spacing={2}>
          {fields.map((f, idx) => (
            <Box key={f.id}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <TextField
                    {...register(`workers.${idx}.workerName`)}
                    label={t('accessRequest.worker.name')}
                    fullWidth
                    required
                    size="small"
                    error={!!errors.workers?.[idx]?.workerName}
                    helperText={errText(`workers.${idx}.workerName`)}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    {...register(`workers.${idx}.workerBirth`)}
                    label={t('accessRequest.worker.birth')}
                    placeholder="YYYY-MM-DD"
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    {...register(`workers.${idx}.workerPhone`)}
                    label={t('accessRequest.worker.phone')}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    {...register(`workers.${idx}.workerRole`)}
                    label={t('accessRequest.worker.role')}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={10} sm={2}>
                  <Controller
                    control={control}
                    name={`workers.${idx}.safetyEduCompleted`}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                        }
                        label={t('accessRequest.worker.eduCompleted')}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={2} sm={1} sx={{ textAlign: 'right' }}>
                  <IconButton onClick={() => remove(idx)} size="small">
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
              {idx < fields.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}
        </Stack>
      </Paper>

      {/* Section: Attachments hint */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          {t('accessRequest.tabAttachments')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('accessRequest.attachment.drag')} — {t('common.noData')}
        </Typography>
      </Paper>

      {/* Actions */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          justifyContent="flex-end"
        >
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={onSaveDraft}
            disabled={saveMut.isPending}
          >
            {saveMut.isPending ? <CircularProgress size={20} /> : t('accessRequest.action.saveDraft')}
          </Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={onSaveSubmit}
            disabled={saveMut.isPending}
          >
            {saveMut.isPending ? <CircularProgress size={20} /> : t('accessRequest.action.saveSubmit')}
          </Button>
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
