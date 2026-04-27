import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import axios from 'axios'
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
  InputAdornment,
} from '@mui/material'
import PersonIcon from '@mui/icons-material/PersonOutline'
import LockIcon from '@mui/icons-material/LockOutlined'
import LoginIcon from '@mui/icons-material/Login'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import LanguageSwitcher from '../components/common/LanguageSwitcher'
import ThemeToggle from '../components/common/ThemeToggle'

type AlertSeverity = 'error' | 'warning' | 'info'

const LoginPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [errorSeverity, setErrorSeverity] = useState<AlertSeverity>('error')
  const [isLoading, setIsLoading] = useState(false)

  const loginSchema = z.object({
    username: z.string().min(1, t('errors.required')),
    password: z.string().min(1, t('errors.required')),
  })

  type LoginFormData = z.infer<typeof loginSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  if (isAuthenticated) {
    navigate('/', { replace: true })
    return null
  }

  const resolveErrorMessage = (err: unknown): string => {
    if (axios.isAxiosError(err)) {
      const serverMessage =
        (err.response?.data as { message?: string } | undefined)?.message ?? ''
      if (serverMessage) return serverMessage
    }
    if (err instanceof Error && err.message) return err.message
    return t('auth.loginError')
  }

  const resolveSeverity = (message: string): AlertSeverity => {
    if (message.includes('승인 대기') || message.includes('pending')) return 'warning'
    if (message.includes('반려') || message.includes('rejected')) return 'error'
    if (message.includes('비활성') || message.includes('inactive')) return 'warning'
    return 'error'
  }

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    setIsLoading(true)
    try {
      await login(data)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const message = resolveErrorMessage(err)
      setError(message)
      setErrorSeverity(resolveSeverity(message))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        p: { xs: 2, sm: 3 },
        position: 'relative',
      }}
    >
      {/* Top-left tools */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          display: 'flex',
          gap: 1,
          zIndex: 1,
        }}
      >
        <LanguageSwitcher color="text.primary" />
        <ThemeToggle color="text.primary" />
      </Box>

      <Box
        sx={{
          width: '100%',
          maxWidth: 440,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {/* Official brand logo */}
        <Box
          component="img"
          src="/brand/logo.png"
          alt="PAN OCEAN"
          sx={{
            width: { xs: 260, sm: 320 },
            height: 'auto',
            mb: 1,
            userSelect: 'none',
          }}
        />

        {/* Login card */}
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            width: '100%',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          {/* ID 로그인 탭 */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 3,
              py: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              width: 'fit-content',
              borderTop: '3px solid',
              borderTopColor: 'primary.main',
              mt: '-1px',
              ml: '-1px',
            }}
          >
            <LoginIcon fontSize="small" color="primary" />
            <Typography variant="body2" fontWeight={700}>
              {t('auth.idLoginTab')}
            </Typography>
          </Box>

          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            {error && (
              <Alert severity={errorSeverity} sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  placeholder={t('auth.username')}
                  {...register('username')}
                  error={!!errors.username}
                  helperText={errors.username?.message}
                  autoFocus
                  autoComplete="username"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  placeholder={t('auth.password')}
                  type="password"
                  {...register('password')}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  autoComplete="current-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isLoading}
                  sx={{
                    py: 1.75,
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    bgcolor: 'primary.dark',
                    '&:hover': { bgcolor: 'primary.main' },
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  ) : (
                    t('auth.login')
                  )}
                </Button>
              </Stack>
            </Box>
          </Box>
        </Paper>

        {/* Bottom links (PPT: 비밀번호 찾기 | 아이디 찾기 | 회원가입) */}
        <Stack
          direction="row"
          divider={
            <Box sx={{ color: 'text.disabled', userSelect: 'none' }}>|</Box>
          }
          spacing={2}
          alignItems="center"
          sx={{ color: 'text.secondary' }}
        >
          <Link
            component="button"
            type="button"
            variant="body2"
            underline="hover"
            color="text.secondary"
            onClick={() => {
              /* TODO: 비밀번호 찾기 화면 연결 */
            }}
          >
            {t('auth.findPassword')}
          </Link>
          <Link
            component="button"
            type="button"
            variant="body2"
            underline="hover"
            color="text.secondary"
            onClick={() => {
              /* TODO: 아이디 찾기 화면 연결 */
            }}
          >
            {t('auth.findUsername')}
          </Link>
          <Link
            component={RouterLink}
            to="/register"
            variant="body2"
            underline="hover"
            color="text.secondary"
            sx={{ fontWeight: 600 }}
          >
            {t('auth.register')}
          </Link>
        </Stack>
      </Box>
    </Box>
  )
}

export default LoginPage
