import { useMemo, useRef, useState } from 'react'
import {
  Box,
  Paper,
  Stack,
  Typography,
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
  TextField,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  DataGrid,
  GridColDef,
  GridRowParams,
} from '@mui/x-data-grid'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import { useTranslation } from 'react-i18next'
import { useConfirm } from '../../components/common/ConfirmDialogProvider'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { safetyRuleApi } from '../../api/safetyRuleApi'
import { useAuth } from '../../context/AuthContext'
import type {
  SafetyRule,
  SafetyRulePayload,
  SafetyRuleSeverity,
} from '../../types/safetyRule'

type SnackbarState = { open: boolean; message: string; severity: 'success' | 'error' }

const INDUSTRY_OPTIONS: { code: string; label: string }[] = [
  { code: 'INSPECTION', label: '검수업' },
  { code: 'LASHING', label: '고박업' },
  { code: 'STEVEDORING', label: '하역업' },
  { code: 'SURVEY', label: '검정업' },
  { code: 'SHIP_SUPPLY', label: '선용품공급업' },
  { code: 'REPAIR', label: '수리업' },
  { code: 'PAINTING', label: '도장업' },
  { code: 'WELDING', label: '용접업' },
  { code: 'ETC', label: '기타' },
]

const SEVERITIES: SafetyRuleSeverity[] = ['NORMAL', 'CAUTION', 'WARNING', 'CRITICAL']

const severityColor = (
  s: SafetyRuleSeverity
): 'default' | 'info' | 'warning' | 'error' => {
  switch (s) {
    case 'NORMAL':
      return 'default'
    case 'CAUTION':
      return 'info'
    case 'WARNING':
      return 'warning'
    case 'CRITICAL':
      return 'error'
  }
}

const SafetyRulePage: React.FC = () => {
  const { t } = useTranslation()
  const confirm = useConfirm()
  const qc = useQueryClient()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [industryCode, setIndustryCode] = useState<string>('INSPECTION')
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selectedRule, setSelectedRule] = useState<SafetyRule | null>(null)

  const emptyPayload: SafetyRulePayload = {
    industryCode,
    ruleNo: '',
    title: '',
    content: '',
    severity: 'NORMAL',
    sortOrder: 0,
    active: true,
  }
  const [form, setForm] = useState<SafetyRulePayload>(emptyPayload)

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  })

  const listQuery = useQuery({
    queryKey: ['safety-rules', industryCode],
    queryFn: () => safetyRuleApi.list({ industryCode }),
    placeholderData: (prev) => prev,
  })

  const extractErrorMessage = (err: unknown): string => {
    if (axios.isAxiosError(err)) {
      const m = (err.response?.data as { message?: string } | undefined)?.message
      if (m) return m
    }
    return t('approval.actionFailed')
  }

  // PPT slide 27: 안전수칙 입력 시 Display Line 추가. 연속 등록 모드를 위해
  // 저장 성공 후 Dialog 를 유지할지 여부를 ref 로 넘긴다.
  const keepOpenAfterSaveRef = useRef(false)

  const saveMut = useMutation({
    mutationFn: (payload: SafetyRulePayload) =>
      editingId != null
        ? safetyRuleApi.update(editingId, payload)
        : safetyRuleApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['safety-rules'] })
      setSnackbar({ open: true, message: t('safetyRule.saveSuccess'), severity: 'success' })
      if (keepOpenAfterSaveRef.current && editingId == null) {
        // 신규 등록 + 연속 모드 → Dialog 유지하고 form 일부만 리셋
        setForm((f) => ({ ...f, ruleNo: '', title: '', content: '' }))
      } else {
        setEditOpen(false)
        setEditingId(null)
      }
      keepOpenAfterSaveRef.current = false
    },
    onError: (err) => {
      setSnackbar({ open: true, message: extractErrorMessage(err), severity: 'error' })
      keepOpenAfterSaveRef.current = false
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => safetyRuleApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['safety-rules'] })
      setViewOpen(false)
    },
  })

  const severityLabel = (s: SafetyRuleSeverity) => t(`safetyRule.severity.${s}`)

  const columns: GridColDef<SafetyRule>[] = useMemo(
    () => [
      { field: 'ruleNo', headerName: t('safetyRule.ruleNo'), width: 120 },
      { field: 'title', headerName: t('safetyRule.title'), flex: 1, minWidth: 200 },
      {
        field: 'severity',
        headerName: t('safetyRule.severityCol'),
        width: 110,
        renderCell: (p) => (
          <Chip
            size="small"
            label={severityLabel(p.value as SafetyRuleSeverity)}
            color={severityColor(p.value as SafetyRuleSeverity)}
            sx={{ fontWeight: 600 }}
          />
        ),
      },
      { field: 'sortOrder', headerName: t('safetyRule.sortOrder'), width: 100, type: 'number' },
      {
        field: 'active',
        headerName: t('evaluationItem.active'),
        width: 90,
        renderCell: (p) => (p.value ? 'Y' : 'N'),
      },
    ],
    [t]
  )

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyPayload, industryCode })
    setEditOpen(true)
  }

  const openEdit = (r: SafetyRule) => {
    setEditingId(r.id)
    setForm({
      industryCode: r.industryCode,
      ruleNo: r.ruleNo,
      title: r.title,
      content: r.content,
      severity: r.severity,
      sortOrder: r.sortOrder,
      active: r.active,
    })
    setViewOpen(false)
    setEditOpen(true)
  }

  const handleRowClick = (params: GridRowParams<SafetyRule>) => {
    setSelectedRule(params.row)
    setViewOpen(true)
  }

  const submitForm = (keepOpen = false) => {
    if (!form.ruleNo.trim() || !form.title.trim() || !form.content.trim()) {
      setSnackbar({ open: true, message: t('errors.required'), severity: 'error' })
      return
    }
    keepOpenAfterSaveRef.current = keepOpen
    saveMut.mutate(form)
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
          {t('safetyRule.pageTitle')}
        </Typography>
        {isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            {t('safetyRule.addRule')}
          </Button>
        )}
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>{t('register.industries')}</InputLabel>
          <Select
            label={t('register.industries')}
            value={industryCode}
            onChange={(e) => setIndustryCode(e.target.value)}
          >
            {INDUSTRY_OPTIONS.map((o) => (
              <MenuItem key={o.code} value={o.code}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 480,
          height: { xs: '60vh', md: '65vh' },
        }}
      >
        {listQuery.isError && (
          <Alert severity="error" sx={{ m: 2 }}>
            {t('approval.loadError')}
          </Alert>
        )}
        <DataGrid
          rows={listQuery.data ?? []}
          getRowId={(r) => r.id}
          columns={columns}
          loading={listQuery.isLoading || listQuery.isFetching}
          onRowClick={handleRowClick}
          disableRowSelectionOnClick
          localeText={{ noRowsLabel: t('approval.empty') }}
          sx={{
            border: 0,
            flex: 1,
            '& .MuiDataGrid-row': { cursor: 'pointer' },
          }}
        />
      </Paper>

      {/* View Dialog */}
      <Dialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {selectedRule?.ruleNo} — {selectedRule?.title}
          <IconButton onClick={() => setViewOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedRule && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1}>
                <Chip
                  size="small"
                  label={severityLabel(selectedRule.severity)}
                  color={severityColor(selectedRule.severity)}
                  sx={{ fontWeight: 600 }}
                />
                {!selectedRule.active && (
                  <Chip size="small" label="INACTIVE" variant="outlined" />
                )}
              </Stack>
              <Paper variant="outlined" sx={{ p: 2, whiteSpace: 'pre-wrap' }}>
                {selectedRule.content}
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          {isAdmin && selectedRule && (
            <>
              <Button onClick={() => openEdit(selectedRule)}>{t('common.edit')}</Button>
              <Button
                color="error"
                onClick={async () => {
                  if (await confirm({
                    title: t('common.delete'),
                    message: t('safetyRule.deleteConfirm'),
                    severity: 'error',
                    confirmText: t('common.delete'),
                  })) {
                    deleteMut.mutate(selectedRule.id)
                  }
                }}
              >
                {t('common.delete')}
              </Button>
            </>
          )}
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setViewOpen(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {editingId ? t('common.edit') : t('safetyRule.addRule')}
          <IconButton onClick={() => setEditOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>{t('register.industries')}</InputLabel>
              <Select
                label={t('register.industries')}
                value={form.industryCode}
                onChange={(e) => setForm((f) => ({ ...f, industryCode: e.target.value }))}
              >
                {INDUSTRY_OPTIONS.map((o) => (
                  <MenuItem key={o.code} value={o.code}>
                    {o.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                size="small"
                fullWidth
                label={t('safetyRule.ruleNo')}
                value={form.ruleNo}
                onChange={(e) => setForm((f) => ({ ...f, ruleNo: e.target.value }))}
              />
              <TextField
                size="small"
                fullWidth
                type="number"
                label={t('safetyRule.sortOrder')}
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))
                }
              />
            </Stack>
            <TextField
              size="small"
              fullWidth
              label={t('safetyRule.title')}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>{t('safetyRule.severityCol')}</InputLabel>
              <Select
                label={t('safetyRule.severityCol')}
                value={form.severity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, severity: e.target.value as SafetyRuleSeverity }))
                }
              >
                {SEVERITIES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {severityLabel(s)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              fullWidth
              multiline
              minRows={6}
              label={t('safetyRule.content')}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                />
              }
              label={t('evaluationItem.active')}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
          {editingId == null && (
            <Button
              variant="outlined"
              disabled={saveMut.isPending}
              onClick={() => submitForm(true)}
            >
              {t('safetyRule.saveAndAdd')}
            </Button>
          )}
          <Button
            variant="contained"
            disabled={saveMut.isPending}
            onClick={() => submitForm(false)}
          >
            {saveMut.isPending ? <CircularProgress size={20} /> : t('common.save')}
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

export default SafetyRulePage
