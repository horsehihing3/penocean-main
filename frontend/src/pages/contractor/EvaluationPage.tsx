import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  DataGrid,
  GridColDef,
  GridRowParams,
  GridColumnVisibilityModel,
} from '@mui/x-data-grid'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { evaluationApi } from '../../api/evaluationApi'
import { useAuth } from '../../context/AuthContext'
import { getEvaluationStatusColor } from '../../utils/status'
import type {
  EvaluationListItem,
  EvaluationStatus,
  PeriodHalf,
} from '../../types/evaluation'
import EvaluationDetailDialog from './EvaluationDetailDialog'

type StatusFilter = EvaluationStatus | ''
type PeriodFilter = PeriodHalf | ''

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i)

const EvaluationPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { user } = useAuth()

  const [status, setStatus] = useState<StatusFilter>('')
  const [periodYear, setPeriodYear] = useState<number | ''>('')
  const [periodHalf, setPeriodHalf] = useState<PeriodFilter>('')
  const [keyword, setKeyword] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  const [selectedId, setSelectedId] = useState<number | null>(null)

  const columnVisibilityModel: GridColumnVisibilityModel = useMemo(
    () =>
      isMobile
        ? {
            businessNumber: false,
            submittedAt: false,
            evaluationType: false,
          }
        : {},
    [isMobile]
  )

  const listQuery = useQuery({
    queryKey: [
      'evaluations',
      { status, periodYear, periodHalf, keyword, page, pageSize },
    ],
    queryFn: () =>
      evaluationApi.list({
        status: status || undefined,
        periodYear: periodYear === '' ? undefined : periodYear,
        periodHalf: periodHalf || undefined,
        keyword: keyword || undefined,
        page,
        size: pageSize,
      }),
    placeholderData: (prev) => prev,
  })

  const formatDate = (iso: string) => {
    try {
      return format(parseISO(iso), 'yyyy-MM-dd')
    } catch {
      return iso
    }
  }

  const statusLabel = (s: EvaluationStatus) => t(`evaluation.status.${s}`)

  const canCreate = user?.role === 'ADMIN' || user?.role === 'CONTRACT_DEPT'

  const columns: GridColDef<EvaluationListItem>[] = [
    {
      field: 'evaluationNo',
      headerName: t('evaluation.evaluationNo'),
      width: 160,
    },
    {
      field: 'period',
      headerName: t('evaluation.period'),
      width: 120,
      sortable: false,
      valueGetter: (p) => `${p.row.periodYear} ${p.row.periodHalf}`,
    },
    {
      field: 'companyName',
      headerName: t('evaluation.company'),
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'businessNumber',
      headerName: t('evaluation.businessNumber'),
      width: 140,
    },
    {
      field: 'score',
      headerName: t('evaluation.score'),
      width: 160,
      sortable: false,
      valueGetter: (p) => {
        const total = p.row.totalScore
        const max = p.row.maxTotalScore
        const pct = p.row.scorePercentage
        if (total == null || max == null) return '-'
        const pctStr = pct != null ? `${Number(pct).toFixed(1)}%` : '-'
        return `${total}/${max} (${pctStr})`
      },
    },
    {
      field: 'qualified',
      headerName: t('evaluation.qualifiedCol'),
      width: 100,
      renderCell: (p) => (
        <Chip
          size="small"
          label={p.value ? t('evaluation.qualified') : t('evaluation.notQualified')}
          color={p.value ? 'success' : 'error'}
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'attachmentCount',
      headerName: t('evaluation.attachments'),
      width: 110,
      sortable: false,
      valueGetter: (p) => {
        const n = p.row.attachmentCount ?? 0
        return `📎 ${n}건`
      },
    },
    {
      field: 'status',
      headerName: t('evaluation.colStatus'),
      width: 120,
      renderCell: (p) => (
        <Chip
          size="small"
          label={statusLabel(p.value as EvaluationStatus)}
          color={getEvaluationStatusColor(p.value as EvaluationStatus)}
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'submittedAt',
      headerName: t('evaluation.submittedAt'),
      width: 130,
      valueFormatter: (p) => (p.value ? formatDate(p.value as string) : ''),
    },
    {
      field: 'actions',
      headerName: t('approval.colActions'),
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (p) => (
        <Button
          size="small"
          variant="outlined"
          onClick={(e) => {
            e.stopPropagation()
            setSelectedId(p.row.id)
          }}
        >
          {t('approval.detail')}
        </Button>
      ),
    },
  ]

  const applyKeyword = () => {
    setKeyword(keywordInput.trim())
    setPage(0)
  }

  const handleRowClick = (params: GridRowParams<EvaluationListItem>) => {
    setSelectedId(params.row.id)
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
          {t('evaluation.pageTitle')}
        </Typography>
        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/contractor/evaluation/new')}
          >
            {t('evaluation.create')}
          </Button>
        )}
      </Stack>

      {/* Filter bar */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel>{t('evaluation.periodYear')}</InputLabel>
            <Select
              label={t('evaluation.periodYear')}
              value={periodYear}
              onChange={(e) => {
                setPeriodYear(e.target.value === '' ? '' : Number(e.target.value))
                setPage(0)
              }}
            >
              <MenuItem value="">{t('approval.filterAll')}</MenuItem>
              {yearOptions.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel>{t('evaluation.periodHalf')}</InputLabel>
            <Select
              label={t('evaluation.periodHalf')}
              value={periodHalf}
              onChange={(e) => {
                setPeriodHalf(e.target.value as PeriodFilter)
                setPage(0)
              }}
            >
              <MenuItem value="">{t('approval.filterAll')}</MenuItem>
              <MenuItem value="H1">H1</MenuItem>
              <MenuItem value="H2">H2</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>{t('approval.filterStatus')}</InputLabel>
            <Select
              label={t('approval.filterStatus')}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as StatusFilter)
                setPage(0)
              }}
            >
              <MenuItem value="">{t('approval.filterAll')}</MenuItem>
              <MenuItem value="DRAFT">{t('evaluation.status.DRAFT')}</MenuItem>
              <MenuItem value="SUBMITTED">{t('evaluation.status.SUBMITTED')}</MenuItem>
              <MenuItem value="APPROVED">{t('evaluation.status.APPROVED')}</MenuItem>
              <MenuItem value="REJECTED">{t('evaluation.status.REJECTED')}</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            label={t('approval.filterKeyword')}
            placeholder={`${t('evaluation.company')} / ${t('evaluation.businessNumber')}`}
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

      {/* DataGrid */}
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
          rows={listQuery.data?.content ?? []}
          getRowId={(r) => r.id}
          columns={columns}
          columnVisibilityModel={columnVisibilityModel}
          loading={listQuery.isLoading || listQuery.isFetching}
          onRowClick={handleRowClick}
          paginationMode="server"
          rowCount={listQuery.data?.totalElements ?? 0}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(m) => {
            setPage(m.page)
            setPageSize(m.pageSize)
          }}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
          localeText={{ noRowsLabel: t('approval.empty') }}
          sx={{
            border: 0,
            flex: 1,
            '& .MuiDataGrid-row': { cursor: 'pointer' },
          }}
        />
      </Paper>

      <EvaluationDetailDialog
        evaluationId={selectedId}
        open={selectedId != null}
        onClose={() => setSelectedId(null)}
      />
    </Box>
  )
}

export default EvaluationPage
