import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Stack,
  Typography,
  Grid,
  TextField,
  Button,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SaveIcon from '@mui/icons-material/Save'
import SendIcon from '@mui/icons-material/Send'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { evaluationApi, evaluationItemApi } from '../../api/evaluationApi'
import { somApi } from '../../api/somApi'
import { companyAdminApi } from '../../api/companyAdminApi'
import type {
  EvaluationCreatePayload,
  EvaluationType,
  PeriodHalf,
} from '../../types/evaluation'
import type { SomCompanyLookup } from '../../types/som'

type SnackbarState = { open: boolean; message: string; severity: 'success' | 'error' | 'info' }

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i)

const EvaluationCreatePage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  })

  // step 1: basic info
  const [companyId, setCompanyId] = useState<number | ''>('')
  const [lookupInfo, setLookupInfo] = useState<SomCompanyLookup | null>(null)
  const [periodYear, setPeriodYear] = useState<number>(currentYear)
  const [periodHalf, setPeriodHalf] = useState<PeriodHalf>('H1')
  const [evaluationType, setEvaluationType] = useState<EvaluationType>('REGULAR')
  const [evaluatorName, setEvaluatorName] = useState('')

  const companiesQuery = useQuery({
    queryKey: ['admin', 'companies', 'all'],
    queryFn: () => companyAdminApi.list({ page: 0, size: 500, status: 'ACTIVE' }),
  })
  const companies = companiesQuery.data?.content ?? []
  const selectedCompany = companies.find((c) => c.id === companyId) ?? null
  const businessNumber = selectedCompany?.businessNumber ?? ''
  const companyName = selectedCompany?.name ?? ''

  // step 2: scores
  const itemsQuery = useQuery({
    queryKey: ['evaluation-items', { activeOnly: true }],
    queryFn: () => evaluationItemApi.list(true),
  })
  const items = itemsQuery.data ?? []

  // [2026-05-01] 구분(category) 병합을 위한 rowSpan 계산
  const categorySpans = useMemo(() => {
    const spans: (number | null)[] = new Array(items.length).fill(null)
    let i = 0
    while (i < items.length) {
      let j = i + 1
      while (j < items.length && items[j].category === items[i].category) j++
      spans[i] = j - i
      i = j
    }
    return spans
  }, [items])

  const [scores, setScores] = useState<Record<number, number>>({})
  const [comment, setComment] = useState('')
  // [2026-04-24] PPT 슬라이드 20: 평가항목별 첨부파일
  const [itemFiles, setItemFiles] = useState<Record<number, File | null>>({})
  const itemFileRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const extractErrorMessage = (err: unknown): string => {
    if (axios.isAxiosError(err)) {
      const m = (err.response?.data as { message?: string } | undefined)?.message
      if (m) return m
    }
    return t('approval.actionFailed')
  }
  const notifySuccess = (msg: string) =>
    setSnackbar({ open: true, message: msg, severity: 'success' })
  const notifyInfo = (msg: string) =>
    setSnackbar({ open: true, message: msg, severity: 'info' })
  const notifyError = (err: unknown) =>
    setSnackbar({ open: true, message: extractErrorMessage(err), severity: 'error' })

  // SOM lookup — 업체 선택 시 참고용 스냅샷(인원/매출 등)을 자동 조회
  const lookupMut = useMutation({
    mutationFn: (bizNo: string) => somApi.lookup(bizNo),
    onSuccess: (data) => {
      if (!data) {
        notifyInfo(t('som.lookupFail'))
        setLookupInfo(null)
        return
      }
      setLookupInfo(data)
      notifySuccess(t('som.lookupSuccess'))
    },
    onError: notifyError,
  })

  const handleCompanyChange = (newCompanyId: number | '') => {
    setCompanyId(newCompanyId)
    setLookupInfo(null)
    const c = companies.find((x) => x.id === newCompanyId)
    if (c?.businessNumber) {
      lookupMut.mutate(c.businessNumber)
    }
  }

  // create
  const createMut = useMutation({
    mutationFn: async (submitAfter: boolean) => {
      const payload: EvaluationCreatePayload = {
        businessNumber,
        periodYear,
        periodHalf,
        evaluationType,
        evaluatorName: evaluatorName || undefined,
        comment: comment || undefined,
        itemScores: items.map((it) => ({
          itemId: it.id,
          score: scores[it.id] ?? 0,
        })),
      }
      const { id } = await evaluationApi.create(payload)
      // [2026-04-24] PPT 슬라이드 20: 평가항목별 첨부파일 업로드
      for (const [itemIdStr, file] of Object.entries(itemFiles)) {
        if (file) await evaluationApi.uploadAttachment(id, file, Number(itemIdStr))
      }
      if (submitAfter) await evaluationApi.submit(id)
      return id
    },
    onSuccess: () => {
      notifySuccess(t('common.save'))
      setTimeout(() => navigate('/contractor/evaluation'), 400)
    },
    onError: notifyError,
  })

  const liveTotals = useMemo(() => {
    let total = 0
    let max = 0
    for (const it of items) {
      const score = Number(scores[it.id] ?? 0)
      total += score
      max += it.maxScore
    }
    const pct = max > 0 ? (total / max) * 100 : 0
    return { total, max, pct, qualified: pct >= 70 }
  }, [items, scores])


  const canNext = businessNumber.trim().length > 0 && companyId !== ''

  const handleNext = () => {
    if (!canNext) return
    setStep(1)
  }

  const handleScoreChange = (itemId: number, maxScore: number, raw: string) => {
    const parsed = Number(raw)
    if (Number.isNaN(parsed)) return
    const clamped = Math.max(0, Math.min(maxScore, parsed))
    setScores((prev) => ({ ...prev, [itemId]: clamped }))
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton onClick={() => navigate('/contractor/evaluation')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {t('evaluation.create')}
          </Typography>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stepper activeStep={step} alternativeLabel>
          <Step>
            <StepLabel>{t('evaluation.step1')}</StepLabel>
          </Step>
          <Step>
            <StepLabel>{t('evaluation.step2')}</StepLabel>
          </Step>
        </Stepper>
      </Paper>

      {step === 0 && (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <FormControl fullWidth required>
                <InputLabel>{t('evaluation.company')}</InputLabel>
                <Select
                  label={t('evaluation.company')}
                  value={companyId}
                  onChange={(e) =>
                    handleCompanyChange(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  renderValue={(selected) => {
                    if (selected === '') return ''
                    const c = companies.find((c) => c.id === selected)
                    return c ? c.name : ''
                  }}
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
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label={t('evaluation.businessNumber')}
                value={businessNumber}
                fullWidth
                InputProps={{ readOnly: true }}
                placeholder="000-00-00000"
              />
            </Grid>

            {lookupInfo && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 1 }}>
                  <Stack
                    direction="row"
                    spacing={2}
                    flexWrap="wrap"
                    sx={{ rowGap: 0.5 }}
                  >
                    <span>
                      <strong>{lookupInfo.companyName}</strong>
                    </span>
                    {lookupInfo.ceoName && (
                      <span>{t('som.ceo')}: {lookupInfo.ceoName}</span>
                    )}
                    {lookupInfo.industry && (
                      <span>{t('som.industry')}: {lookupInfo.industry}</span>
                    )}
                    {lookupInfo.employeeCount != null && (
                      <span>
                        {t('som.employeeCount')}: {lookupInfo.employeeCount}
                      </span>
                    )}
                  </Stack>
                </Alert>
              </Grid>
            )}

            <Grid item xs={6} sm={3}>
              <TextField
                select
                label={t('evaluation.periodYear')}
                value={periodYear}
                onChange={(e) => setPeriodYear(Number(e.target.value))}
                fullWidth
                required
              >
                {yearOptions.map((y) => (
                  <MenuItem key={y} value={y}>
                    {y}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                select
                label={t('evaluation.periodHalf')}
                value={periodHalf}
                onChange={(e) => setPeriodHalf(e.target.value as PeriodHalf)}
                fullWidth
                required
              >
                <MenuItem value="H1">상반기</MenuItem>
                <MenuItem value="H2">하반기</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                select
                label={t('evaluation.evaluationType')}
                value={evaluationType}
                onChange={(e) => setEvaluationType(e.target.value as EvaluationType)}
                fullWidth
                required
              >
                <MenuItem value="REGULAR">{t('evaluation.typeRegular')}</MenuItem>
                <MenuItem value="SPECIAL">{t('evaluation.typeSpecial')}</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                label={t('evaluation.evaluator')}
                value={evaluatorName}
                onChange={(e) => setEvaluatorName(e.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>

          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button variant="contained" onClick={handleNext} disabled={!canNext}>
              {t('common.next')}
            </Button>
          </Stack>
        </Paper>
      )}

      {step === 1 && (
        <>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ sm: 'center' }}
              justifyContent="space-between"
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {t('evaluation.totalScore')}: {liveTotals.total.toFixed(1)} /{' '}
                {liveTotals.max.toFixed(1)} ({liveTotals.pct.toFixed(1)}%)
              </Typography>
              <Chip
                label={
                  liveTotals.qualified
                    ? t('evaluation.qualified')
                    : t('evaluation.notQualified')
                }
                color={liveTotals.qualified ? 'success' : 'error'}
                sx={{ fontWeight: 600 }}
              />
            </Stack>
          </Paper>

          {itemsQuery.isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={32} />
            </Box>
          )}

          {/* [2026-04-24] PPT 슬라이드 20: 구분|평가항목|평가내용|배점|평가점수|첨부파일 */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 110, fontWeight: 700 }}>구분</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>평가항목</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>평가내용</TableCell>
                    <TableCell align="right" sx={{ width: 70, fontWeight: 700 }}>배점</TableCell>
                    <TableCell align="right" sx={{ width: 120, fontWeight: 700 }}>평가점수</TableCell>
                    <TableCell sx={{ width: 160, fontWeight: 700 }}>첨부파일</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((it, idx) => (
                    <TableRow key={it.id}>
                      {categorySpans[idx] !== null && (
                        <TableCell
                          rowSpan={categorySpans[idx]!}
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            verticalAlign: 'middle',
                            textAlign: 'center',
                            bgcolor: 'grey.50',
                            borderRight: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          {it.category.length > 5 ? (
                            <>{it.category.slice(0, 5)}<br />{it.category.slice(5)}</>
                          ) : it.category}
                        </TableCell>
                      )}
                      <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'keep-all' }}>{it.title}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem', whiteSpace: 'normal', wordBreak: 'keep-all' }}>
                        {it.description ?? '-'}
                      </TableCell>
                      <TableCell align="right">{it.maxScore}</TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          size="small"
                          inputProps={{ min: 0, max: it.maxScore, step: 0.5 }}
                          value={scores[it.id] ?? ''}
                          onChange={(e) =>
                            handleScoreChange(it.id, it.maxScore, e.target.value)
                          }
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="file"
                          hidden
                          ref={(el) => { itemFileRefs.current[it.id] = el }}
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null
                            setItemFiles((prev) => ({ ...prev, [it.id]: file }))
                          }}
                        />
                        <Button
                          size="small"
                          variant="text"
                          sx={{ fontSize: '0.75rem', p: '2px 6px' }}
                          onClick={() => itemFileRefs.current[it.id]?.click()}
                        >
                          {itemFiles[it.id] ? itemFiles[it.id]!.name : '파일선택'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              {t('evaluation.comment')}
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              justifyContent="space-between"
            >
              <Button onClick={() => setStep(0)}>{t('common.prev')}</Button>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<SaveIcon />}
                  onClick={() => createMut.mutate(false)}
                  disabled={createMut.isPending}
                >
                  {createMut.isPending ? (
                    <CircularProgress size={20} />
                  ) : (
                    t('accessRequest.action.saveDraft')
                  )}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={() => createMut.mutate(true)}
                  disabled={createMut.isPending}
                >
                  {createMut.isPending ? (
                    <CircularProgress size={20} />
                  ) : (
                    t('accessRequest.action.saveSubmit')
                  )}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </>
      )}

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

export default EvaluationCreatePage
