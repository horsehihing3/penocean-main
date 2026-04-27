import { createContext, useCallback, useContext, useRef, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
} from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { useTranslation } from 'react-i18next'

/**
 * 전역 confirm/alert 다이얼로그.
 * - window.confirm / window.alert 대체.
 * - MUI 테마를 그대로 써서 라이트/다크 모드에 자동 대응.
 * - 사용 예:
 *     const confirm = useConfirm()
 *     if (await confirm('삭제하시겠습니까?')) ...
 *     if (await confirm({ title: '확인', message: '...', severity: 'error', confirmText: '삭제' })) ...
 *
 *     const alert = useAlert()
 *     await alert('저장되었습니다')
 */

export type DialogSeverity = 'warning' | 'error' | 'info' | 'success'

export interface ConfirmOptions {
  title?: string
  message: React.ReactNode
  description?: React.ReactNode
  confirmText?: string
  cancelText?: string
  severity?: DialogSeverity
  /** true 이면 확인 버튼만 표시 (alert 용) */
  alertMode?: boolean
}

type ConfirmInput = ConfirmOptions | string

export type ConfirmFn = (opts: ConfirmInput) => Promise<boolean>
export type AlertFn = (opts: ConfirmInput) => Promise<void>

const ConfirmContext = createContext<ConfirmFn>(async () => false)
const AlertContext = createContext<AlertFn>(async () => {})

const normalize = (opts: ConfirmInput): ConfirmOptions =>
  typeof opts === 'string' ? { message: opts } : opts

const severityColor = (s?: DialogSeverity) => {
  switch (s) {
    case 'error':
      return 'error.main'
    case 'warning':
      return 'warning.main'
    case 'success':
      return 'success.main'
    case 'info':
    default:
      return 'info.main'
  }
}

const SeverityIcon: React.FC<{ severity?: DialogSeverity; size?: number }> = ({
  severity,
  size = 28,
}) => {
  const sx = { fontSize: size, color: severityColor(severity) }
  switch (severity) {
    case 'error':
      return <ErrorOutlineIcon sx={sx} />
    case 'warning':
      return <WarningAmberIcon sx={sx} />
    case 'success':
      return <CheckCircleOutlineIcon sx={sx} />
    case 'info':
    default:
      return <InfoOutlinedIcon sx={sx} />
  }
}

interface InternalState {
  open: boolean
  options: ConfirmOptions
  resolve?: (v: boolean) => void
}

export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation()
  const [state, setState] = useState<InternalState>({ open: false, options: { message: '' } })
  const resolverRef = useRef<(v: boolean) => void>()

  const handleClose = useCallback((result: boolean) => {
    setState((s) => ({ ...s, open: false }))
    resolverRef.current?.(result)
    resolverRef.current = undefined
  }, [])

  const confirm: ConfirmFn = useCallback(
    (input) =>
      new Promise<boolean>((resolve) => {
        const options = normalize(input)
        resolverRef.current = resolve
        setState({ open: true, options, resolve })
      }),
    []
  )

  const alert: AlertFn = useCallback(
    async (input) => {
      const options = normalize(input)
      await confirm({ ...options, alertMode: true })
    },
    [confirm]
  )

  const { open, options } = state
  const severity = options.severity ?? (options.alertMode ? 'info' : 'warning')

  return (
    <ConfirmContext.Provider value={confirm}>
      <AlertContext.Provider value={alert}>
        {children}
        <Dialog
          open={open}
          onClose={() => handleClose(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <SeverityIcon severity={severity} />
              <Typography variant="h6" fontWeight={700}>
                {options.title ??
                  (options.alertMode ? t('common.notice') : t('common.confirmTitle'))}
              </Typography>
            </Stack>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ whiteSpace: 'pre-line' }}>
              <Typography variant="body1">{options.message}</Typography>
              {options.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {options.description}
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            {!options.alertMode && (
              <Button onClick={() => handleClose(false)} color="inherit">
                {options.cancelText ?? t('common.cancel')}
              </Button>
            )}
            <Button
              variant="contained"
              color={severity === 'error' ? 'error' : 'primary'}
              onClick={() => handleClose(true)}
              autoFocus
            >
              {options.confirmText ?? t('common.confirm')}
            </Button>
          </DialogActions>
        </Dialog>
      </AlertContext.Provider>
    </ConfirmContext.Provider>
  )
}

export const useConfirm = (): ConfirmFn => useContext(ConfirmContext)
export const useAlert = (): AlertFn => useContext(AlertContext)
