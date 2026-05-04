import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate, Link as RouterLink, useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link,
  Stack,
  FormControlLabel,
  Checkbox,
  FormHelperText,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  OutlinedInput,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  InputAdornment,
} from '@mui/material'
import SecurityIcon from '@mui/icons-material/Security'
import LockIcon from '@mui/icons-material/LockOutlined'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import axiosInstance from '../api/axiosInstance'
import { codeMasterApi, type CodeMaster, type Department } from '../api/codeMasterApi'
import LanguageSwitcher from '../components/common/LanguageSwitcher'
import ThemeToggle from '../components/common/ThemeToggle'

// 카카오 우편번호 API 타입
declare global {
  interface Window {
    daum: {
      Postcode: new (config: { oncomplete: (data: { zonecode: string; roadAddress: string; jibunAddress: string }) => void }) => { open: () => void }
    }
  }
}

// PPT 기본 값. 관리자 편집 UI 로 바뀌기 전까지 fallback.
const FALLBACK_INDUSTRY_OPTIONS: { code: string; label: string }[] = [
  { code: 'INSPECTION', label: '검수업 (Tally)' },
  { code: 'SURVEY', label: '검정업 (Surveyor)' },
  { code: 'LASHING', label: '고박업 (Lashing)' },
  { code: 'STEVEDORING', label: '하역업 (Stevedore)' },
  { code: 'TUG_BOAT', label: '예선업 (Tug boat)' },
  { code: 'LINE_HANDLING', label: '줄잡이업 (Line handling)' },
  { code: 'AGENCY', label: '대리점업' },
  { code: 'SHIP_MGMT', label: '선박관리업 (Ship Management)' },
  { code: 'ETC_VESSEL', label: '기타업종 (선박관련 업무)' },
  { code: 'ETC_OFFICE', label: '기타업종 (사무실관련 업무)' },
  { code: 'HULL_CLEANING', label: '선체청소업 (Hull Cleaning)' },
  { code: 'HOLD_CLEANING', label: '선창청소업 (Hold Cleaning)' },
]

const FALLBACK_DEPT_OPTIONS: { code: string; label: string }[] = [
  { code: 'SAFETY_MGMT', label: '안전경영팀' },
  { code: 'PURCHASING',  label: '구매팀' },
  { code: 'OPERATION',   label: '운영팀' },
  { code: 'VESSEL_MGMT', label: '선박관리팀' },
  { code: 'SALES',       label: '영업팀' },
]

const RegisterPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const reapplyToken = searchParams.get('reapply')
  const { register: registerRequest } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)

  // PPT slide 5-6: 로그인 → 회원가입 클릭 시 개인정보 수집·이용 동의서 먼저 뜨기
  // 재가입 링크 진입 시 동의서 건너뜀
  const [consentOpen, setConsentOpen] = useState(!reapplyToken)
  const [consentRequired, setConsentGiven] = useState(!!reapplyToken)

  // [2026-04-30] 중복확인 상태
  const [usernameCheck, setUsernameCheck] = useState<'idle' | 'available' | 'taken'>('idle')
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [bizCheck, setBizCheck] = useState<'idle' | 'available' | 'taken'>('idle')
  const [bizChecking, setBizChecking] = useState(false)

  // 관리자 편집 UI 연동: tb_code / tb_department 조회. 실패/비어 있을 시 fallback.
  const [industryOptions, setIndustryOptions] =
    useState<{ code: string; label: string }[]>(FALLBACK_INDUSTRY_OPTIONS)
  const [deptOptions, setDeptOptions] =
    useState<{ code: string; label: string }[]>(FALLBACK_DEPT_OPTIONS)

  useEffect(() => {
    ;(async () => {
      try {
        const [industries, departments] = await Promise.all([
          codeMasterApi.listByGroup('INDUSTRY', true).catch(() => [] as CodeMaster[]),
          codeMasterApi.listDepartments().catch(() => [] as Department[]),
        ])
        if (industries.length)
          setIndustryOptions(industries.map((i) => ({ code: i.code, label: i.name })))
        if (departments.length)
          setDeptOptions(departments.map((d) => ({ code: d.code, label: d.name })))
      } catch {
        // fallback 유지
      }
    })()
  }, [])

  // [2026-05-04] 반려 재가입 토큰이 있으면 기존 정보 pre-fill
  useEffect(() => {
    if (!reapplyToken) return
    ;(async () => {
      try {
        const res = await axiosInstance.get<{ data: Record<string, unknown> }>('/auth/reapply-info', {
          params: { token: reapplyToken },
        })
        const d = res.data.data
        if (d.username)             setValue('username',             d.username as string)
        if (d.companyName)          setValue('companyName',          d.companyName as string)
        if (d.companyNameEn)        setValue('companyNameEn',        d.companyNameEn as string)
        if (d.businessNumber)       setValue('businessNumber',       d.businessNumber as string)
        if (d.companyPhone)         setValue('companyPhone',         d.companyPhone as string)
        if (d.postalCode)           setValue('postalCode',           d.postalCode as string)
        if (d.address)              setValue('address',              d.address as string)
        if (d.addressDetail)        setValue('addressDetail',        d.addressDetail as string)
        if (d.contactName)          setValue('contactName',          d.contactName as string)
        if (d.contactTitle)         setValue('contactTitle',         d.contactTitle as string)
        if (d.email)                setValue('email',                d.email as string)
        if (d.phone)                setValue('phone',                d.phone as string)
        if (d.industryOther)        setValue('industryOther',        d.industryOther as string)
        if (Array.isArray(d.industryCodes) && d.industryCodes.length)
          setValue('industryCodes', d.industryCodes as string[])
        if (Array.isArray(d.contractDepartments) && d.contractDepartments.length)
          setValue('contractDepartments', d.contractDepartments as string[])
        if (d.rejectionReason)
          setRejectionReason(d.rejectionReason as string)
        // 아이디 중복확인은 REJECTED 상태라 통과 처리
        setUsernameCheck('available')
      } catch {
        setError('재가입 링크가 유효하지 않거나 만료되었습니다.')
      }
    })()
  }, [reapplyToken]) // eslint-disable-line react-hooks/exhaustive-deps

  const schema = z
    .object({
      username: z
        .string()
        .min(4, t('errors.minUsername'))
        .regex(/^[a-zA-Z0-9_.-]+$/, t('errors.invalidUsername')),
      password: z
        .string()
        .min(8, t('errors.minPassword'))
        .max(20)
        .regex(
          /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@!%#?&])[A-Za-z\d@!%#?&]{8,20}$/,
          t('errors.passwordComplexity')
        ),
      passwordConfirm: z.string().min(1, t('errors.required')),
      companyName: z.string().min(1, t('errors.required')),
      companyNameEn: z.string().optional(),
      businessNumber: z
        .string()
        .min(1, t('errors.required'))
        .regex(/^\d{3}-\d{2}-\d{5}$/, t('errors.invalidRegNo')),
      companyPhone: z.string().optional(),
      postalCode: z.string().optional(),
      address: z.string().optional(),
      addressDetail: z.string().optional(),
      industryCodes: z.array(z.string()).min(1, t('errors.selectOne')),
      industryOther: z.string().optional(),
      contractDepartments: z.array(z.string()).min(1, t('errors.selectOne')),
      contactTitle: z.string().min(1, t('errors.required')),
      contactName: z.string().min(1, t('errors.required')),
      phone: z
        .string()
        .min(1, t('errors.required'))
        .regex(/^[0-9-+() ]{7,}$/, t('errors.invalidPhone')),
      email: z.string().min(1, t('errors.required')).email(t('errors.invalidEmail')),
    })
    .refine((d) => d.password === d.passwordConfirm, {
      path: ['passwordConfirm'],
      message: t('errors.passwordMismatch'),
    })

  type FormData = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      industryCodes: [],
      contractDepartments: [],
    },
  })

  // [2026-04-30] 아이디 중복확인
  const handleCheckUsername = async () => {
    const username = getValues('username')
    if (!username || username.length < 4) return
    setUsernameChecking(true)
    try {
      const res = await axiosInstance.get<{ data: { available: boolean } }>('/auth/check-username', { params: { username } })
      setUsernameCheck(res.data.data.available ? 'available' : 'taken')
    } catch {
      setUsernameCheck('idle')
    } finally {
      setUsernameChecking(false)
    }
  }

  // [2026-04-30] 사업자번호 중복확인
  const handleCheckBizNumber = async () => {
    const businessNumber = getValues('businessNumber')
    if (!businessNumber || !/^\d{3}-\d{2}-\d{5}$/.test(businessNumber)) return
    setBizChecking(true)
    try {
      const res = await axiosInstance.get<{ data: { available: boolean } }>('/auth/check-business-number', { params: { businessNumber } })
      setBizCheck(res.data.data.available ? 'available' : 'taken')
    } catch {
      setBizCheck('idle')
    } finally {
      setBizChecking(false)
    }
  }

  // [2026-04-30] 카카오 우편번호 검색
  const handlePostcodeSearch = () => {
    if (!window.daum?.Postcode) return
    new window.daum.Postcode({
      oncomplete: (data) => {
        setValue('postalCode', data.zonecode)
        setValue('address', data.roadAddress || data.jibunAddress)
      },
    }).open()
  }

  const onSubmit = async (data: FormData) => {
    setError(null)
    setSuccess(null)
    setIsLoading(true)
    try {
      const { passwordConfirm: _pc, ...rest } = data
      void _pc
      await registerRequest({
        ...rest,
        privacyAgreed: consentRequired,
      })
      setSuccess(t('register.submitSuccessApproval'))
      setTimeout(() => navigate('/login', { replace: true }), 2500)
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? t('register.submitError'))
      } else {
        setError(err instanceof Error ? err.message : t('register.submitError'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 공통 테이블 셀 스타일 — PPT 표 레이아웃
  const labelCellSx = {
    width: { xs: 120, md: 160 },
    bgcolor: 'action.hover',
    fontWeight: 700,
    borderRight: '1px solid',
    borderColor: 'divider',
  }

  const required = (label: string) => (
    <>
      {label}{' '}
      <Box component="span" sx={{ color: 'error.main' }}>
        *
      </Box>
    </>
  )

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        p: { xs: 2, sm: 3 },
        position: 'relative',
      }}
    >
      <Box sx={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 1, zIndex: 1 }}>
        <LanguageSwitcher color="text.primary" />
        <ThemeToggle color="text.primary" />
      </Box>

      <Box sx={{ maxWidth: 960, mx: 'auto', pt: { xs: 4, md: 6 } }}>
        <Paper elevation={0} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <SecurityIcon color="primary" />
            <Typography variant="h6" fontWeight={700}>
              {t('register.title')}
            </Typography>
          </Box>

          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            {/* [2026-05-04] 반려 재가입: 반려사유 표시 */}
            {rejectionReason && (
              <Alert severity="error" sx={{ mb: 2, fontWeight: 500 }}>
                <strong>반려사유:</strong> {rejectionReason}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <TableContainer>
                <Table>
                  <TableBody>
                    {/* 아이디 + 중복확인 */}
                    <TableRow>
                      <TableCell sx={labelCellSx}>{required(t('register.username'))}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="flex-start">
                          <TextField
                            size="small"
                            fullWidth
                            {...register('username')}
                            error={!!errors.username || usernameCheck === 'taken'}
                            helperText={
                              errors.username?.message ??
                              (usernameCheck === 'available' ? '사용 가능한 아이디입니다.' :
                               usernameCheck === 'taken' ? '이미 사용 중인 아이디입니다.' : undefined)
                            }
                            onChange={(e) => { register('username').onChange(e); setUsernameCheck('idle') }}
                            autoComplete="username"
                            InputProps={{
                              endAdornment: usernameCheck !== 'idle' ? (
                                <InputAdornment position="end">
                                  {usernameCheck === 'available'
                                    ? <CheckCircleIcon fontSize="small" color="success" />
                                    : <CancelIcon fontSize="small" color="error" />}
                                </InputAdornment>
                              ) : undefined,
                            }}
                          />
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{ flexShrink: 0, mt: 0.25 }}
                            onClick={handleCheckUsername}
                            disabled={usernameChecking}
                          >
                            {usernameChecking ? <CircularProgress size={16} /> : t('register.checkDuplicate')}
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>

                    {/* 비밀번호 */}
                    <TableRow>
                      <TableCell sx={labelCellSx}>{required(t('register.password'))}</TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          type="password"
                          {...register('password')}
                          error={!!errors.password}
                          helperText={
                            errors.password?.message ?? t('register.passwordHint')
                          }
                          autoComplete="new-password"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LockIcon fontSize="small" color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </TableCell>
                    </TableRow>

                    {/* 비밀번호 확인 */}
                    <TableRow>
                      <TableCell sx={labelCellSx}>{required(t('register.passwordConfirm'))}</TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          type="password"
                          {...register('passwordConfirm')}
                          error={!!errors.passwordConfirm}
                          helperText={errors.passwordConfirm?.message}
                          autoComplete="new-password"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LockIcon fontSize="small" color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </TableCell>
                    </TableRow>

                    {/* 업체명 + 영문명 */}
                    <TableRow>
                      <TableCell sx={labelCellSx}>{required(t('register.companyName'))}</TableCell>
                      <TableCell>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                          <TextField
                            size="small"
                            fullWidth
                            {...register('companyName')}
                            error={!!errors.companyName}
                            helperText={errors.companyName?.message}
                          />
                          <TextField
                            size="small"
                            fullWidth
                            placeholder={t('register.companyNameEn')}
                            {...register('companyNameEn')}
                          />
                        </Stack>
                      </TableCell>
                    </TableRow>

                    {/* 사업자 등록번호 */}
                    <TableRow>
                      <TableCell sx={labelCellSx}>
                        {required(t('register.businessNumber'))}
                      </TableCell>
                      <TableCell>
                        <Stack spacing={1}>
                          <Stack direction="row" spacing={1} alignItems="flex-start">
                            <TextField
                              size="small"
                              fullWidth
                              placeholder="000-00-00000"
                              {...register('businessNumber')}
                              error={!!errors.businessNumber || bizCheck === 'taken'}
                              helperText={
                                errors.businessNumber?.message ??
                                (bizCheck === 'available' ? '사용 가능한 사업자번호입니다.' :
                                 bizCheck === 'taken' ? '이미 등록된 사업자번호입니다.' : undefined)
                              }
                              onChange={(e) => { register('businessNumber').onChange(e); setBizCheck('idle') }}
                              InputProps={{
                                endAdornment: bizCheck !== 'idle' ? (
                                  <InputAdornment position="end">
                                    {bizCheck === 'available'
                                      ? <CheckCircleIcon fontSize="small" color="success" />
                                      : <CancelIcon fontSize="small" color="error" />}
                                  </InputAdornment>
                                ) : undefined,
                              }}
                            />
                            <Button
                              variant="outlined"
                              size="small"
                              sx={{ flexShrink: 0, mt: 0.25 }}
                              onClick={handleCheckBizNumber}
                              disabled={bizChecking}
                            >
                              {bizChecking ? <CircularProgress size={16} /> : t('register.checkDuplicate')}
                            </Button>
                          </Stack>
                          <Button
                            component="label"
                            variant="text"
                            size="small"
                            startIcon={<AttachFileIcon />}
                            sx={{ alignSelf: 'flex-start' }}
                          >
                            {t('register.attachBusinessLicense')}
                            <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png" />
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>

                    {/* 회사전화번호 */}
                    <TableRow>
                      <TableCell sx={labelCellSx}>{required(t('register.companyPhone'))}</TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          placeholder="02-0000-0000"
                          {...register('companyPhone')}
                        />
                      </TableCell>
                    </TableRow>

                    {/* 주소 */}
                    <TableRow>
                      <TableCell sx={labelCellSx}>{t('register.address')}</TableCell>
                      <TableCell>
                        <Stack spacing={1}>
                          <Stack direction="row" spacing={1}>
                            <TextField
                              size="small"
                              sx={{ width: 160 }}
                              placeholder={t('register.postalCode')}
                              {...register('postalCode')}
                              inputProps={{ readOnly: true }}
                            />
                            <Button
                              variant="outlined"
                              size="small"
                              sx={{ flexShrink: 0 }}
                              onClick={handlePostcodeSearch}
                            >
                              {t('register.findPostalCode')}
                            </Button>
                          </Stack>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder={t('register.address')}
                            {...register('address')}
                          />
                          <TextField
                            size="small"
                            fullWidth
                            placeholder={t('register.addressDetail')}
                            {...register('addressDetail')}
                          />
                        </Stack>
                      </TableCell>
                    </TableRow>

                    {/* 업종 (복수) */}
                    <TableRow>
                      <TableCell sx={labelCellSx}>{required(t('register.industries'))}</TableCell>
                      <TableCell>
                        <Controller
                          name="industryCodes"
                          control={control}
                          render={({ field }) => (
                            <FormControl size="small" fullWidth error={!!errors.industryCodes}>
                              <InputLabel>{t('register.industryPlaceholder')}</InputLabel>
                              <Select
                                multiple
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                                input={<OutlinedInput label={t('register.industryPlaceholder')} />}
                                MenuProps={{
                                  anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
                                  transformOrigin: { vertical: 'top', horizontal: 'left' },
                                  disablePortal: true,
                                }}
                                renderValue={(selected) => (
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {(selected as string[]).map((code) => {
                                      const opt = industryOptions.find((o) => o.code === code)
                                      return (
                                        <Chip key={code} label={opt?.label ?? code} size="small" />
                                      )
                                    })}
                                  </Box>
                                )}
                              >
                                {industryOptions.map((o) => (
                                  <MenuItem key={o.code} value={o.code}>
                                    {o.label}
                                  </MenuItem>
                                ))}
                              </Select>
                              {errors.industryCodes && (
                                <FormHelperText>{errors.industryCodes.message}</FormHelperText>
                              )}
                            </FormControl>
                          )}
                        />
                      </TableCell>
                    </TableRow>

                    {/* 기타업종 */}
                    <TableRow>
                      <TableCell sx={labelCellSx}>{t('register.industryOther')}</TableCell>
                      <TableCell>
                        <TextField size="small" fullWidth {...register('industryOther')} />
                      </TableCell>
                    </TableRow>

                    {/* 팬오션 계약팀 (복수) */}
                    <TableRow>
                      <TableCell sx={labelCellSx}>
                        {required(t('register.contractDepartments'))}
                      </TableCell>
                      <TableCell>
                        <Controller
                          name="contractDepartments"
                          control={control}
                          render={({ field }) => (
                            <FormControl size="small" fullWidth error={!!errors.contractDepartments}>
                              <InputLabel>{t('register.deptPlaceholder')}</InputLabel>
                              <Select
                                multiple
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                                input={<OutlinedInput label={t('register.deptPlaceholder')} />}
                                MenuProps={{
                                  anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
                                  transformOrigin: { vertical: 'top', horizontal: 'left' },
                                  disablePortal: true,
                                }}
                                renderValue={(selected) => (
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {(selected as string[]).map((code) => {
                                      const opt = deptOptions.find((o) => o.code === code)
                                      return (
                                        <Chip key={code} label={opt?.label ?? code} size="small" />
                                      )
                                    })}
                                  </Box>
                                )}
                              >
                                {deptOptions.map((o) => (
                                  <MenuItem key={o.code} value={o.code}>
                                    {o.label}
                                  </MenuItem>
                                ))}
                              </Select>
                              {errors.contractDepartments && (
                                <FormHelperText>
                                  {errors.contractDepartments.message}
                                </FormHelperText>
                              )}
                            </FormControl>
                          )}
                        />
                      </TableCell>
                    </TableRow>

                    {/* 안전담당자 직책 / 성명 */}
                    <TableRow>
                      <TableCell sx={labelCellSx}>
                        {required(t('register.contactTitle'))}
                      </TableCell>
                      <TableCell>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder={t('register.contactTitle')}
                            {...register('contactTitle')}
                            error={!!errors.contactTitle}
                            helperText={errors.contactTitle?.message}
                          />
                          <TextField
                            size="small"
                            fullWidth
                            placeholder={t('register.contactName') + ' *'}
                            {...register('contactName')}
                            error={!!errors.contactName}
                            helperText={errors.contactName?.message}
                          />
                        </Stack>
                      </TableCell>
                    </TableRow>

                    {/* 안전담당자 휴대전화 / E-mail */}
                    <TableRow>
                      <TableCell sx={labelCellSx}>
                        {required(t('register.contactPhoneShort'))}
                      </TableCell>
                      <TableCell>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder="010-0000-0000"
                            {...register('phone')}
                            error={!!errors.phone}
                            helperText={errors.phone?.message}
                          />
                          <TextField
                            size="small"
                            fullWidth
                            type="email"
                            placeholder={t('register.contactEmailShort')}
                            {...register('email')}
                            error={!!errors.email}
                            helperText={errors.email?.message}
                          />
                        </Stack>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Stack direction="row" justifyContent="center" sx={{ mt: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isLoading || !consentRequired}
                  sx={{ minWidth: 160, py: 1.25, bgcolor: 'primary.dark' }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  ) : (
                    t('register.submit')
                  )}
                </Button>
              </Stack>
            </Box>
          </Box>
        </Paper>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Link component={RouterLink} to="/login" variant="body2">
            {t('auth.login')}
          </Link>
        </Box>
      </Box>

      {/* PPT slide 5-6: 개인정보 수집·이용 동의서 */}
      <ConsentDialog
        open={consentOpen}
        onClose={() => navigate('/login')}
        onAgree={() => {
          setConsentGiven(true)
          setConsentOpen(false)
        }}
      />
    </Box>
  )
}

// =====================================================================
// 개인정보 수집·이용 동의서 (PPT slide 5-6)
// =====================================================================
const ConsentDialog: React.FC<{
  open: boolean
  onClose: () => void
  onAgree: () => void
}> = ({ open, onClose, onAgree }) => {
  const { t } = useTranslation()
  const [mandatoryChecked, setMandatoryChecked] = useState(false)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SecurityIcon color="primary" />
        {t('register.consent.title')}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
              {t('register.consent.intro')}
            </Typography>
          </Box>

          <Typography variant="subtitle2" fontWeight={700} color="error">
            {t('register.consent.mandatoryTitle')}
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell align="center">{t('register.consent.purpose')}</TableCell>
                  <TableCell align="center">{t('register.consent.items')}</TableCell>
                  <TableCell align="center">{t('register.consent.retention')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ whiteSpace: 'pre-line' }}>
                    {t('register.consent.purposeBody')}
                  </TableCell>
                  <TableCell>{t('register.consent.itemsBody')}</TableCell>
                  <TableCell>{t('register.consent.retentionBody')}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {t('register.consent.footer')}
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={mandatoryChecked}
                onChange={(e) => setMandatoryChecked(e.target.checked)}
              />
            }
            label={t('register.consent.agree')}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button
          variant="contained"
          disabled={!mandatoryChecked}
          onClick={onAgree}
          sx={{ bgcolor: 'primary.dark' }}
        >
          {t('common.next')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default RegisterPage
