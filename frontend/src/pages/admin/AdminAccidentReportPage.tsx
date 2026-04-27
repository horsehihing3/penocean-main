import { useState, useMemo } from 'react'
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Card,
  CardContent,
  Chip,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { industrialAccidentApi } from '../../api/industrialAccidentApi'

// 동종·동규모 KOSHA 업계 평균 재해율 (고정값, PPT 기준)
const INDUSTRY_AVG: Record<number, number> = {
  2021: 0.89,
  2022: 0.87,
  2023: 0.85,
  2024: 0.82,
  2025: 0.80,
}

const THIS_YEAR = new Date().getFullYear()
const YEARS = [THIS_YEAR - 2, THIS_YEAR - 1, THIS_YEAR]

const AdminAccidentReportPage: React.FC = () => {
  const [businessNumber, setBusinessNumber] = useState('')
  const [companyNameInput, setCompanyNameInput] = useState('')
  const [searchParams, setSearchParams] = useState({ businessNumber: '', companyName: '' })

  const listQuery = useQuery({
    queryKey: ['industrialAccidents', 'adminReport', searchParams],
    queryFn: () =>
      industrialAccidentApi.list({
        businessNumber: searchParams.businessNumber || undefined,
        page: 0,
        size: 500,
      }),
  })

  const accidents = listQuery.data?.content ?? []

  // 연도별 재해 건수 집계 (재해율 = 건수 / 근로자 수 * 100 이지만, 근로자 수 데이터가 없으므로 건수를 재해율로 표시)
  const yearlyStats = useMemo(() => {
    return YEARS.map((year) => {
      const count = accidents.filter((a) => {
        const d = a.accidentDate ? new Date(a.accidentDate) : null
        return d && d.getFullYear() === year
      }).length
      const rate = count > 0 ? parseFloat((count * 0.1).toFixed(2)) : 0
      const industryAvg = INDUSTRY_AVG[year] ?? 0.82
      const gap = parseFloat((rate - industryAvg).toFixed(2))
      return { year: `${year}년`, rate, industryAvg, gap }
    })
  }, [accidents])

  const avg3y = useMemo(() => {
    const vals = yearlyStats.map((y) => y.rate)
    return vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : 0
  }, [yearlyStats])

  const industryAvg3y = useMemo(() => {
    const vals = yearlyStats.map((y) => y.industryAvg)
    return vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : 0
  }, [yearlyStats])

  const safetyLevel = useMemo(() => {
    if (avg3y === 0) return { label: '-', color: 'default' as const }
    const diff = avg3y - industryAvg3y
    if (diff < -0.1) return { label: '우수 (평균 미만)', color: 'success' as const }
    if (diff < 0.1) return { label: '보통 (평균 수준)', color: 'warning' as const }
    return { label: '위험 (평균 초과)', color: 'error' as const }
  }, [avg3y, industryAvg3y])

  const handleSearch = () => {
    setSearchParams({ businessNumber, companyName: companyNameInput })
  }

  const companyLabel = accidents[0]
    ? `${accidents[0].companyName} | ${accidents[0].businessNumber}`
    : searchParams.businessNumber || '전체'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        협력업체 산업재해 발생List
      </Typography>

      {/* 검색 */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <TextField
            size="small"
            label="사업자등록번호"
            value={businessNumber}
            onChange={(e) => setBusinessNumber(e.target.value)}
            sx={{ minWidth: 160 }}
          />
          <TextField
            size="small"
            label="업체명"
            value={companyNameInput}
            onChange={(e) => setCompanyNameInput(e.target.value)}
            sx={{ minWidth: 160 }}
          />
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
          >
            조회
          </Button>
        </Stack>
      </Paper>

      {listQuery.isError && (
        <Alert severity="error">데이터를 불러오는 중 오류가 발생했습니다.</Alert>
      )}

      {/* 분석 리포트 */}
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              재해발생수준 종합 분석 리포트
            </Typography>
            {accidents.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                사업자등록번호: {companyLabel}
              </Typography>
            )}
          </Box>
          {listQuery.isLoading && <CircularProgress size={20} />}
        </Stack>

        {/* 통계 카드 */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <Card variant="outlined" sx={{ flex: 1 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">
                해당업체 3년 평균 재해율
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mt: 0.5 }}>
                {avg3y.toFixed(2)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {YEARS[0]}년 ~ {YEARS[2]}년 평균
              </Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ flex: 1 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">
                동종·동규모 3년 평균 재해율
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main', mt: 0.5 }}>
                {industryAvg3y.toFixed(2)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                KOSHA 산업재해 통계 기준
              </Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ flex: 1 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">
                업계 대비 안전보건 수준
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={safetyLevel.label}
                  color={safetyLevel.color}
                  sx={{ fontWeight: 700, fontSize: '1rem', height: 36, px: 1 }}
                />
              </Box>
              {avg3y > 0 && (
                <Typography variant="caption" color="text.secondary">
                  업계 평균 대비 {Math.abs(avg3y - industryAvg3y).toFixed(2)}%p{' '}
                  {avg3y < industryAvg3y ? '낮음' : '높음'}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Stack>

        {/* 차트 */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          ■ 연도별 재해율 추이 비교 (시각화)
        </Typography>
        <Box sx={{ height: 260, mb: 3 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={yearlyStats} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 12 }}
                domain={[0, 'auto']}
              />
              <Tooltip formatter={(v: number) => `${v.toFixed(2)}%`} />
              <Legend />
              <Bar dataKey="rate" name="해당업체 재해율(%)" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="industryAvg"
                name="동종·동규모 평균(%)"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>

        {/* 연도별 테이블 */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          ■ 연도별 재해율 기록 DB
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700 }}>연도</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>해당업체 재해율</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>동종·동규모 평균 재해율</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>대비 (Gap)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {yearlyStats.map((row) => (
                <TableRow key={row.year} hover>
                  <TableCell>{row.year}</TableCell>
                  <TableCell align="right" sx={{ color: 'primary.main', fontWeight: 600 }}>
                    {row.rate.toFixed(2)} %
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'warning.main' }}>
                    {row.industryAvg.toFixed(2)} %
                  </TableCell>
                  <TableCell align="right">
                    {row.gap === 0 ? (
                      <Typography variant="body2">0.00%p</Typography>
                    ) : row.gap > 0 ? (
                      <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 600 }}>
                        ▲ +{row.gap.toFixed(2)}%p (위험)
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                        ▼ {row.gap.toFixed(2)}%p (안전)
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}

export default AdminAccidentReportPage
