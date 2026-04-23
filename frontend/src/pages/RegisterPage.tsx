import { useEffect, useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
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
  IconButton,
  InputAdornment,
} from '@mui/material'
import SecurityIcon from '@mui/icons-material/Security'
import LockIcon from '@mui/icons-material/LockOutlined'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { codeMasterApi, type CodeMaster, type Department } from '../api/codeMasterApi'
import LanguageSwitcher from '../components/common/LanguageSwitcher'
import ThemeToggle from '../components/common/ThemeToggle'

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
  { code: 'OPS_LOGISTICS', label: '운항물류팀' },
  { code: 'OPS_SUPPORT', label: '운항지원팀' },
  { code: 'MARINE_ENV', label: '해사환경팀' },
  { code: 'MARINE_MGMT', label: '해사관리팀' },
]

const RegisterPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { register: registerRequest } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // PPT slide 5-6: 로그인 → 회원가입 클릭 시 개인정보 수집·이용 동의서 먼저 뜨기
  const [consentOpen, setConsentOpen] = useState(true)
  const [consentRequired, setConsentGiven] = useState(false)

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
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      industryCodes: [],
      contractDepartments: [],
    },
  })

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
      const message = err instanceof Error ? err.message : t('register.submitError')
      setError(message)
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

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <TableContainer>
                <Table>
                  <TableBody>
                    {/* 아이디 + 중복확인 */}
                    <TableRow>
                      <TableCell sx={labelCellSx}>{required(t('register.username'))}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <TextField
                            size="small"
                            fullWidth
                            {...register('username')}
                            error={!!errors.username}
                            helperText={errors.username?.message}
                            autoComplete="username"
                          />
                          <Button variant="outlined" size="small" sx={{ flexShrink: 0 }}>
                            {t('register.checkDuplicate')}
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
                          <Stack direction="row" spacing={1}>
                            <TextField
                              size="small"
                              fullWidth
                              placeholder="000-00-00000"
                              {...register('businessNumber')}
                              error={!!errors.businessNumber}
                              helperText={errors.businessNumber?.message}
                            />
                            <Button variant="outlined" size="small" sx={{ flexShrink: 0 }}>
                              {t('register.checkDuplicate')}
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
                            />
                            <Button variant="outlined" size="small" sx={{ flexShrink: 0 }}>
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
