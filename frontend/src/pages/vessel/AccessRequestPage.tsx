import { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import * as XLSX from 'xlsx'
import AppDatePicker from '../../components/common/AppDatePicker'
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

  const columnVisibilityModel: GridColumnVisibilityModel = useMemo(
    () =>
      isMobile
        ? {
            companyName: false,
            plannedStartDate: false,
            plannedEndDate: false,
            workerCount: false,
          }
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
      return format(parseISO(iso), 'yyyy-MM-dd')
    } catch {
      return iso
    }
  }

  const statusLabel = (s: AccessRequestStatus) =>
    t(`accessRequest.status.${s}`)

  const columns: GridColDef<AccessRequestListItem>[] = [
    {
      field: 'requestNo',
      headerName: t('accessRequest.requestNo'),
      width: 160,
    },
    {
      field: 'companyName',
      headerName: t('accessRequest.company'),
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'vesselName',
      headerName: t('accessRequest.vessel'),
      flex: 1,
      minWidth: 140,
    },
    {
      field: 'workType',
      headerName: t('accessRequest.workType'),
      width: 140,
    },
    {
      field: 'plannedStartDate',
      headerName: t('accessRequest.plannedStart'),
      width: 130,
      valueFormatter: (p) => (p.value ? formatDate(p.value as string) : ''),
    },
    {
      field: 'plannedEndDate',
      headerName: t('accessRequest.plannedEnd'),
      width: 130,
      valueFormatter: (p) => (p.value ? formatDate(p.value as string) : ''),
    },
    {
      field: 'workerCount',
      headerName: t('accessRequest.workerCount'),
      width: 90,
      type: 'number',
    },
    {
      field: 'status',
      headerName: t('accessRequest.colStatus'),
      width: 140,
      renderCell: (p) => (
        <Chip
          size="small"
          label={statusLabel(p.value as AccessRequestStatus)}
          color={getAccessRequestStatusColor(p.value as AccessRequestStatus)}
          sx={{ fontWeight: 600 }}
        />
      ),
    },
  ]

  const applyKeyword = () => {
    setKeyword(keywordInput.trim())
    setPage(0)
  }

  // PPT slide 13/24: 출입신청(허가) 목록 Excel 다운로드
  const handleExcelExport = () => {
    const rows = listQuery.data?.content ?? []
    const data = rows.map((r) => ({
      '신청번호': r.requestNo ?? '',
      '상태': r.status ?? '',
      '회사': r.companyName ?? '',
      '사업자등록번호': r.businessNumber ?? '',
      '선박': r.vesselName ?? '',
      '항구': r.portName ?? '',
      '작업유형': r.workType ?? '',
      '작업 시작': r.plannedStartDate ?? '',
      '작업 종료': r.plannedEndDate ?? '',
      '작업자 수': r.workerCount ?? 0,
      '제출일': r.submittedAt ?? '',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = [
      { wch: 14 }, { wch: 10 }, { wch: 20 }, { wch: 16 }, { wch: 16 },
      { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 18 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, isPermitView ? '출입허가' : '출입신청')
    const ts = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `${isPermitView ? 'access_permits' : 'access_requests'}_${ts}.xlsx`)
  }

  const handleRowClick = (params: GridRowParams<AccessRequestListItem>) => {
    navigate(`${basePath}/${params.row.id}`)
  }

  const canCreate = user?.role === 'CONTRACTOR' || user?.role === 'ADMIN'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        spacing={1}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t(isPermitView ? 'accessRequest.permitPageTitle' : 'accessRequest.pageTitle')}
        </Typography>
        {canCreate && !isPermitView && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/vessel/access-request/new')}
          >
            {t('accessRequest.create')}
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
          <FormControl size="small" sx={{ minWidth: 160 }}>
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

          <TextField
            size="small"
            label={t('approval.filterKeyword')}
            placeholder={t('accessRequest.vessel') + ' / ' + t('accessRequest.company')}
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyKeyword()
            }}
            sx={{ flex: 1, minWidth: 160 }}
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

          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={applyKeyword}
          >
            {t('common.search')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExcelExport}
            disabled={!(listQuery.data?.content?.length)}
          >
            Excel
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
    </Box>
  )
}

export default AccessRequestPage
