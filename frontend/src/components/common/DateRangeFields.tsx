import { Stack } from '@mui/material'
import AppDatePicker from './AppDatePicker'

/**
 * 시작일/종료일 2-필드 래퍼.
 * - 시작일의 maxDate 를 현재 종료일로 제한
 * - 종료일의 minDate 를 현재 시작일로 제한
 *   → 종료일이 시작일보다 앞에 있을 수 없고, 그 반대도 성립
 */
export interface DateRangeFieldsProps {
  fromValue: string | null | undefined
  toValue: string | null | undefined
  onFromChange: (iso: string | null) => void
  onToChange: (iso: string | null) => void
  fromLabel?: string
  toLabel?: string
  size?: 'small' | 'medium'
  required?: boolean
  direction?: 'row' | 'column'
  spacing?: number
}

export const DateRangeFields: React.FC<DateRangeFieldsProps> = ({
  fromValue,
  toValue,
  onFromChange,
  onToChange,
  fromLabel,
  toLabel,
  size = 'small',
  required,
  direction = 'row',
  spacing = 1,
}) => {
  return (
    <Stack direction={direction} spacing={spacing} alignItems={direction === 'row' ? 'center' : 'stretch'}>
      <AppDatePicker
        label={fromLabel}
        value={fromValue}
        onChange={onFromChange}
        maxIsoDate={toValue}
        size={size}
        required={required}
      />
      <AppDatePicker
        label={toLabel}
        value={toValue}
        onChange={onToChange}
        minIsoDate={fromValue}
        size={size}
        required={required}
      />
    </Stack>
  )
}

export default DateRangeFields
