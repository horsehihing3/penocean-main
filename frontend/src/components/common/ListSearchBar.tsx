// 목록 화면 공용 검색 입력 컴포넌트 (돋보기 클릭·Enter 시 검색 실행)
import { KeyboardEvent } from 'react'
import { TextField, InputAdornment, IconButton } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import type { SxProps, Theme } from '@mui/material/styles'

type Props = {
  /** 사용자가 타이핑하는 값 (입력 상태) */
  value: string
  /** 타이핑 시 호출 */
  onChange: (v: string) => void
  /** 돋보기 클릭 또는 Enter 키 입력 시 호출 — 실제 검색 적용 */
  onSearch: () => void
  placeholder?: string
  fullWidth?: boolean
  size?: 'small' | 'medium'
  sx?: SxProps<Theme>
  disabled?: boolean
  autoFocus?: boolean
}

const ListSearchBar: React.FC<Props> = ({
  value, onChange, onSearch,
  placeholder, fullWidth, size = 'small', sx, disabled, autoFocus,
}) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSearch()
    }
  }
  return (
    <TextField
      size={size}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      fullWidth={fullWidth}
      sx={sx}
      disabled={disabled}
      autoFocus={autoFocus}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton size="small" onClick={onSearch} disabled={disabled} edge="end">
              <SearchIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  )
}

export default ListSearchBar
