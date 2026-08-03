import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Stack,
  Typography,
  MenuItem,
  FormControl,
  Select,
  Button,
  IconButton,
  Chip,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  GridColDef,
  GridRowParams,
  GridColumnVisibilityModel,
} from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import ListSearchBar from '../../components/common/ListSearchBar'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListTable from '../../components/common/ListTable'
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
            evaluatorName: false,
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

  // [2026-05-01] 이미지 기준 컬럼 순서/명칭 정렬, H1→상반기/H2→하반기
  const halfLabel = (h: string) => (h === 'H1' ? '상반기' : '하반기')

  const columns: GridColDef<EvaluationListItem>[] = [
    {
      field: 'rowNo',
      headerName: 'No',
      width: 60,
      sortable: false,
      renderCell: (p) => {
        const idx = (listQuery.data?.content ?? []).findIndex((r) => r.id === p.row.id)
        return page * pageSize + idx + 1
      },
    },
    {
      field: 'period',
      headerName: '평가 연도/반기',
      width: 140,
      sortable: false,
      valueGetter: (p) => `${p.row.periodYear}년 ${halfLabel(p.row.periodHalf)}`,
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
      field: 'submittedAt',
      headerName: '평가일',
      width: 110,
      valueFormatter: (p) => (p.value ? formatDate(p.value as string) : ''),
    },
    {
      field: 'score',
      headerName: t('evaluation.totalScore'),
      width: 110,
      sortable: false,
      valueGetter: (p) => {
        const total = p.row.totalScore
        const max = p.row.maxTotalScore
        if (total == null || max == null) return '-'
        return `${total} / ${max}`
      },
    },
    {
      field: 'qualified',
      headerName: '점검결과',
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
      width: 90,
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
      field: 'evaluatorName',
      headerName: '검토자',
      width: 100,
      sortable: false,
      valueGetter: (p) => p.row.evaluatorName ?? '',
    },
  ]

  const applyKeyword = () => {
    setKeyword(keywordInput.trim())
    setPage(0)
  }

  // [2026-08-03] 목록 필터 초기화 (새로고침 버튼)
  const resetFilters = () => {
    setKeywordInput('')
    setPeriodHalf('')
    setPeriodYear('')
    setStatus('')
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
      <Box>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <Select
              displayEmpty
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
            <Select
              displayEmpty
              value={periodHalf}
              onChange={(e) => {
                setPeriodHalf(e.target.value as PeriodFilter)
                setPage(0)
              }}
            >
              <MenuItem value="">{t('approval.filterAll')}</MenuItem>
              <MenuItem value="H1">상반기</MenuItem>
              <MenuItem value="H2">하반기</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              displayEmpty
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

          <ListSearchBar
            placeholder={`${t('evaluation.company')} / ${t('evaluation.businessNumber')}`}
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

      <EvaluationDetailDialog
        evaluationId={selectedId}
        open={selectedId != null}
        onClose={() => setSelectedId(null)}
      />
    </Box>
  )
}

export default EvaluationPage
