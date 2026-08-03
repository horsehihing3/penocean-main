// [2026-04-23] PPT 슬라이드 13 기준으로 컬럼 구조 수정
// No. / 상태 / 구분 / 업종 / 방문사업장/선박 / 지역/항구 / 작업일정 / 작업상세 / 출입신청인원
import { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import PrintIcon from '@mui/icons-material/Print'
import * as XLSX from 'xlsx'
import AppDatePicker from '../../components/common/AppDatePicker'
import ListSearchBar from '../../components/common/ListSearchBar'
import ListTable from '../../components/common/ListTable'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { accessRequestApi } from '../../api/accessRequestApi'
import { useAuth } from '../../context/AuthContext'
import { getAccessRequestStatusColor } from '../../utils/status'
import type {
  AccessRequestListItem,
  AccessRequestStatus,
} from '../../types/accessRequest'

type StatusFilter = AccessRequestStatus | ''

const AccessRequestPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const isPermitView = location.pathname.startsWith('/vessel/access-permit')
  const basePath = isPermitView ? '/vessel/access-permit' : '/vessel/access-request'
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { user } = useAuth()

  const [status, setStatus] = useState<StatusFilter>(isPermitView ? 'APPROVED' : '')
  const [keyword, setKeyword] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  // 모바일에서는 일부 컬럼 숨김
  const columnVisibilityModel: GridColumnVisibilityModel = useMemo(
    () =>
      isMobile
        ? ({
            siteType: false,
            industryName: false,
            portName: false,
            schedule: false,
          } as GridColumnVisibilityModel)
        : {},
    [isMobile]
  )

  const listQuery = useQuery({
    queryKey: [
      'access-requests',
      { status, keyword, dateFrom, dateTo, page, pageSize },
    ],
    queryFn: () =>
      accessRequestApi.list({
        status: status || undefined,
        keyword: keyword || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        size: pageSize,
      }),
    placeholderData: (prev) => prev,
  })

  const formatDate = (iso: string) => {
    try {
      return format(parseISO(iso), 'yyyy.MM.dd')
    } catch {
      return iso
    }
  }

  const statusLabel = (s: AccessRequestStatus) =>
    t(`accessRequest.status.${s}`)

  // PPT 슬라이드 13 기준 컬럼 순서
  const columns: GridColDef<AccessRequestListItem>[] = [
    {
      field: 'rowNo',
      headerName: 'No.',
      width: 60,
      sortable: false,
      renderCell: (p) => {
        const idx = (listQuery.data?.content ?? []).findIndex((r) => r.id === p.row.id)
        return page * pageSize + idx + 1
      },
    },
    {
      field: 'status',
      headerName: t('accessRequest.colStatus'),
      width: 120,
      renderCell: (p) => (
        <Chip
          size="small"
          label={statusLabel(p.value as AccessRequestStatus)}
          color={getAccessRequestStatusColor(p.value as AccessRequestStatus)}
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'siteType',
      headerName: t('accessRequest.siteType'),
      width: 80,
      sortable: false,
      valueGetter: () => t('accessRequest.siteTypeVessel'),  // 항상 "선박"
    },
    {
      field: 'industryName',
      headerName: t('accessRequest.industryType'),
      width: 120,
      valueGetter: (p) => p.value ?? '-',
    },
    {
      field: 'vesselName',
      headerName: t('accessRequest.vesselSite'),
      flex: 1,
      minWidth: 140,
    },
    {
      field: 'portName',
      headerName: t('accessRequest.portRegion'),
      width: 100,
      valueGetter: (p) => p.value ?? '-',
    },
    {
      field: 'schedule',
      headerName: t('accessRequest.workSchedule'),
      width: 180,
      sortable: false,
      renderCell: (p) => {
        const start = p.row.plannedStartDate ? formatDate(p.row.plannedStartDate) : ''
        const end = p.row.plannedEndDate ? formatDate(p.row.plannedEndDate) : ''
        return (
          <Box sx={{ lineHeight: 1.3 }}>
            <Typography variant="caption" display="block">{start}</Typography>
            <Typography variant="caption" display="block" color="text.secondary">~{end}</Typography>
          </Box>
        )
      },
    },
    {
      field: 'workType',
      headerName: t('accessRequest.workDetail'),
      width: 120,
    },
    {
      field: 'workerCount',
      headerName: t('accessRequest.workerCountCol'),
      width: 100,
      type: 'number',
    },
  ]

  const applyKeyword = () => {
    setKeyword(keywordInput.trim())
    setPage(0)
  }

  const resetFilters = () => {
    setStatus(isPermitView ? 'APPROVED' : '')
    setKeywordInput('')
    setKeyword('')
    setDateFrom('')
    setDateTo('')
    setPage(0)
  }

  // PPT 슬라이드 13: Excel 다운로드
  const handleExcelExport = () => {
    const rows = listQuery.data?.content ?? []
    const data = rows.map((r, i) => ({
      'No.': i + 1,
      '상태': r.status ?? '',
      '구분': '선박',
      '업종': r.industryName ?? '',
      '방문사업장/선박': r.vesselName ?? '',
      '지역/항구': r.portName ?? '',
      '작업시작일': r.plannedStartDate ?? '',
      '작업종료일': r.plannedEndDate ?? '',
      '작업상세': r.workType ?? '',
      '출입신청인원': r.workerCount ?? 0,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = [
      { wch: 6 }, { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 18 },
      { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, isPermitView ? '출입허가' : '출입신청')
    const ts = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `${isPermitView ? 'access_permits' : 'access_requests'}_${ts}.xlsx`)
  }

  const handlePrint = () => window.print()

  const handleRowClick = (params: GridRowParams<AccessRequestListItem>) => {
    navigate(`${basePath}/${params.row.id}`)
  }

  const canCreate = user?.role === 'CONTRACTOR' || user?.role === 'ADMIN'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* PPT 슬라이드 13: 상단 헤더 — 타이틀 + Excel/인쇄 버튼 */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t(isPermitView ? 'accessRequest.permitPageTitle' : 'accessRequest.pageTitle')}
        </Typography>
        <Stack direction="row" spacing={1}>
          {canCreate && !isPermitView && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/vessel/access-request/new')}
            >
              {t('accessRequest.create')}
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExcelExport}
            disabled={!(listQuery.data?.content?.length)}
          >
            Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            {t('common.print')}
          </Button>
        </Stack>
      </Stack>

      {/* 필터 영역 */}
      <Box>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', md: 'center' }}
          flexWrap="wrap"
          useFlexGap
        >
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              displayEmpty
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as StatusFilter)
                setPage(0)
              }}
            >
              <MenuItem value="">{t('approval.filterStatus')}</MenuItem>
              <MenuItem value="DRAFT">{t('accessRequest.status.DRAFT')}</MenuItem>
              <MenuItem value="SUBMITTED">{t('accessRequest.status.SUBMITTED')}</MenuItem>
              <MenuItem value="IN_REVIEW">{t('accessRequest.status.IN_REVIEW')}</MenuItem>
              <MenuItem value="IMPROVEMENT_REQUESTED">
                {t('accessRequest.status.IMPROVEMENT_REQUESTED')}
              </MenuItem>
              <MenuItem value="APPROVED">{t('accessRequest.status.APPROVED')}</MenuItem>
              <MenuItem value="REJECTED">{t('accessRequest.status.REJECTED')}</MenuItem>
            </Select>
          </FormControl>

          <ListSearchBar
            placeholder={t('accessRequest.vesselSite') + ' / ' + t('accessRequest.company')}
            value={keywordInput}
            onChange={setKeywordInput}
            onSearch={applyKeyword}
            sx={{ width: { xs: '100%', sm: 300 } }}
          />

          <AppDatePicker
            label={t('accessRequest.plannedStart')}
            value={dateFrom || null}
            onChange={(iso) => {
              setDateFrom(iso ?? '')
              setPage(0)
            }}
            maxIsoDate={dateTo || null}
          />
          <AppDatePicker
            label={t('accessRequest.plannedEnd')}
            value={dateTo || null}
            onChange={(iso) => {
              setDateTo(iso ?? '')
              setPage(0)
            }}
            minIsoDate={dateFrom || null}
          />

          <IconButton onClick={resetFilters} size="small">
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Box>

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
    </Box>
  )
}

export default AccessRequestPage
