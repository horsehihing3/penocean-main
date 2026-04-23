import { DatePicker, DatePickerProps } from '@mui/x-date-pickers/DatePicker'
import { parse, format, isValid } from 'date-fns'

/**
 * 프로젝트 공통 DatePicker.
 * - 값은 'yyyy-MM-dd' 문자열로 주고받음 (백엔드 LocalDate 호환).
 * - 내부적으로는 date-fns Date 로 변환.
 * - MUI X DatePicker 기반 — popup calendar + 키보드 입력 모두 지원.
 */
export interface AppDatePickerProps
  extends Omit<DatePickerProps<Date>, 'value' | 'onChange' | 'minDate' | 'maxDate'> {
  value: string | null | undefined
  onChange: (iso: string | null) => void
  minIsoDate?: string | null
  maxIsoDate?: string | null
  size?: 'small' | 'medium'
  fullWidth?: boolean
  required?: boolean
  error?: boolean
  helperText?: React.ReactNode
}

const ISO_FMT = 'yyyy-MM-dd'
const fromIso = (iso: string | null | undefined): Date | null => {
  if (!iso) return null
  const d = parse(iso, ISO_FMT, new Date())
  return isValid(d) ? d : null
}
const toIso = (d: Date | null): string | null =>
  d && isValid(d) ? format(d, ISO_FMT) : null

export const AppDatePicker: React.FC<AppDatePickerProps> = ({
  value,
  onChange,
  minIsoDate,
  maxIsoDate,
  size = 'small',
  fullWidth,
  required,
  error,
  helperText,
  slotProps,
  ...rest
}) => {
  return (
    <DatePicker
      {...rest}
      value={fromIso(value)}
      onChange={(d) => onChange(toIso(d ?? null))}
      format="yyyy-MM-dd"
      minDate={fromIso(minIsoDate) ?? undefined}
      maxDate={fromIso(maxIsoDate) ?? undefined}
      slotProps={{
        ...(slotProps || {}),
        textField: {
          size,
          fullWidth,
          required,
          error,
          helperText,
          ...(slotProps?.textField || {}),
        },
      }}
    />
  )
}

export default AppDatePicker
