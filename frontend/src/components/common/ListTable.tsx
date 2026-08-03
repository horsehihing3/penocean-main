// 목록 화면 공용 테이블 (PC 테이블 + 모바일 카드 + 페이지네이션) — DataGrid 컬럼 정의 재사용
import { ReactNode, useState } from 'react'
import {
  Box,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Pagination,
  CircularProgress,
} from '@mui/material'
import type { GridColDef } from '@mui/x-data-grid'

export interface ListTableProps<T> {
  rows: T[]
  /** 기존 DataGrid 컬럼 정의를 그대로 전달 */
  columns: GridColDef<any>[]
  /** false 로 지정된 field 는 렌더에서 제외 (DataGrid columnVisibilityModel 과 동일) */
  columnVisibilityModel?: Record<string, boolean>
  getRowId?: (row: T) => string | number
  loading?: boolean
  /** DataGrid 의 GridRowParams 핸들러를 그대로 넘길 수 있도록 느슨하게 받음 */
  onRowClick?: (params: any) => void
  onRowDoubleClick?: (params: any) => void
  /** 서버 페이징 — 전체 건수. 미지정 시 rows 기준 클라이언트 페이징 */
  rowCount?: number
  paginationModel?: { page: number; pageSize: number }
  onPaginationModelChange?: (model: { page: number; pageSize: number }) => void
  emptyMessage?: string
  /** 좌측 번호 열 노출 (기본 true) */
  showRowNumber?: boolean
  minWidth?: number
  /** paginationModel 미지정(클라이언트 페이징) 시 페이지 크기 */
  defaultPageSize?: number
}

function ListTable<T extends Record<string, any>>({
  rows,
  columns,
  columnVisibilityModel,
  getRowId,
  loading,
  onRowClick,
  onRowDoubleClick,
  rowCount,
  paginationModel,
  onPaginationModelChange,
  emptyMessage = '데이터가 없습니다',
  showRowNumber = true,
  minWidth = 750,
  defaultPageSize = 20,
}: ListTableProps<T>) {
  // 상위에서 paginationModel 을 주지 않으면 내부 상태로 클라이언트 페이징
  const [innerModel, setInnerModel] = useState({ page: 0, pageSize: defaultPageSize })
  const model = paginationModel ?? innerModel
  const page = model.page
  const pageSize = model.pageSize

  const visibleColumns = columns.filter(
    (c) => columnVisibilityModel?.[c.field] !== false
  )

  // 서버 페이징이면 rows 를 그대로, 아니면 클라이언트에서 잘라 씀
  const isServerPaged = rowCount != null
  const pagedRows = isServerPaged ? rows : rows.slice(page * pageSize, (page + 1) * pageSize)
  const totalCount = isServerPaged ? (rowCount as number) : rows.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const keyOf = (row: T, idx: number): string | number =>
    getRowId ? getRowId(row) : (row.id ?? idx)

  // DataGrid 와 동일한 순서로 셀 값 해석 — valueGetter → renderCell → valueFormatter
  const renderCellContent = (col: GridColDef<any>, row: T, idx: number): ReactNode => {
    const id = keyOf(row, idx)
    const raw = (row as any)[col.field]
    const params: any = { row, value: raw, field: col.field, id }
    const value = col.valueGetter ? (col.valueGetter as any)(params) : raw
    if (col.renderCell) return (col.renderCell as any)({ ...params, value })
    if (col.valueFormatter) return (col.valueFormatter as any)({ value, field: col.field, id })
    return value == null ? '' : String(value)
  }

  const handlePageChange = (nextPage: number) => {
    const next = { page: nextPage, pageSize }
    if (onPaginationModelChange) onPaginationModelChange(next)
    else setInnerModel(next)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <>
      {/* Table - PC */}
      <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' } }}>
        <Table size="small" sx={{ minWidth }}>
          <TableHead>
            <TableRow>
              {showRowNumber && (
                <TableCell align="center" sx={{ width: 60, whiteSpace: 'nowrap' }}>번호</TableCell>
              )}
              {visibleColumns.map((c) => (
                <TableCell
                  key={c.field}
                  align="center"
                  // [2026-08-03] 헤더 라벨은 항상 한 줄 — 컬럼 최소 폭을 라벨 기준으로 확보
                  sx={{ width: c.width, minWidth: c.minWidth, whiteSpace: 'nowrap' }}
                >
                  {c.headerName ?? c.field}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + (showRowNumber ? 1 : 0)} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">{emptyMessage}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              pagedRows.map((row, idx) => {
                const id = keyOf(row, idx)
                return (
                  <TableRow
                    key={id}
                    hover
                    onClick={onRowClick ? () => onRowClick({ row, id }) : undefined}
                    onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick({ row, id }) : undefined}
                    sx={{ cursor: onRowClick || onRowDoubleClick ? 'pointer' : 'default' }}
                  >
                    {showRowNumber && (
                      <TableCell align="center">{page * pageSize + idx + 1}</TableCell>
                    )}
                    {/* 셀 nowrap 은 테마 MuiTableCell.body 가 전역 처리 */}
                    {visibleColumns.map((c) => (
                      <TableCell key={c.field} align={c.align ?? 'center'}>
                        {renderCellContent(c, row, idx)}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mobile Card List */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
        {pagedRows.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">{emptyMessage}</Typography>
          </Paper>
        ) : (
          pagedRows.map((row, idx) => {
            const id = keyOf(row, idx)
            const [first, ...rest] = visibleColumns
            return (
              <Paper
                key={id}
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  cursor: onRowClick || onRowDoubleClick ? 'pointer' : 'default',
                }}
                onClick={onRowClick ? () => onRowClick({ row, id }) : undefined}
                onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick({ row, id }) : undefined}
              >
                {first && (
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: 'action.selected',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {page * pageSize + idx + 1}
                    </Box>
                    <Box sx={{ fontWeight: 700, minWidth: 0, wordBreak: 'keep-all' }}>
                      {renderCellContent(first, row, idx)}
                    </Box>
                  </Stack>
                )}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {rest.map((c) => (
                    <Box key={c.field} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          bgcolor: 'grey.200',
                          px: 1,
                          py: 0.25,
                          borderRadius: 0.5,
                          minWidth: 72,
                          flexShrink: 0,
                        }}
                      >
                        {c.headerName ?? c.field}
                      </Typography>
                      <Box sx={{ fontSize: '0.875rem', wordBreak: 'break-word' }}>
                        {renderCellContent(c, row, idx)}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>
            )
          })
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination
          count={totalPages}
          page={page + 1}
          onChange={(_, p) => handlePageChange(p - 1)}
          color="primary"
        />
      </Box>
    </>
  )
}

export default ListTable
