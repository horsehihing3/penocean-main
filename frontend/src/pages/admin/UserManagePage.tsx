// [2026-08-04] 관리자 전체 사용자 관리 — 검색·정보수정·비밀번호 변경·탈퇴
import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import type { GridColDef } from '@mui/x-data-grid'
import RefreshIcon from '@mui/icons-material/Refresh'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import LockResetIcon from '@mui/icons-material/LockReset'
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import CloseIcon from '@mui/icons-material/Close'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import ListSearchBar from '../../components/common/ListSearchBar'
import ListTable from '../../components/common/ListTable'
import { useConfirm } from '../../components/common/ConfirmDialogProvider'
import {
  userAdminApi,
  type AdminUser,
  type AdminUserRole,
  type AdminUserStatus,
} from '../../api/userAdminApi'

type SnackbarState = { open: boolean; message: string; severity: 'success' | 'error' }

const ROLE_OPTIONS: { value: AdminUserRole; label: string }[] = [
  { value: 'ADMIN', label: '관리자' },
  { value: 'CONTRACTOR', label: '협력업체' },
  { value: 'CONTRACT_DEPT', label: '계약부서' },
]

const STATUS_OPTIONS: { value: AdminUserStatus; label: string }[] = [
  { value: 'PENDING', label: '승인대기' },
  { value: 'APPROVED', label: '승인완료' },
  { value: 'REJECTED', label: '반려' },
  { value: 'INACTIVE', label: '비활성' },
]

const roleLabel = (r: AdminUserRole) => ROLE_OPTIONS.find((o) => o.value === r)?.label ?? r
const statusLabel = (s: AdminUserStatus) => STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s

const statusColor = (s: AdminUserStatus): 'default' | 'warning' | 'success' | 'error' => {
  switch (s) {
    case 'PENDING': return 'warning'
    case 'APPROVED': return 'success'
    case 'REJECTED': return 'error'
    default: return 'default'
  }
}

// 가입 화면과 동일한 비밀번호 정책
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@!%#?&])[A-Za-z\d@!%#?&]{8,20}$/

const fmtDate = (d: string | null) => (d ? d.slice(0, 10).replace(/-/g, '.') : '-')

const UserManagePage: React.FC = () => {
  const qc = useQueryClient()
  const confirm = useConfirm()

  const [roleFilter, setRoleFilter] = useState<'' | AdminUserRole>('')
  const [statusFilter, setStatusFilter] = useState<'' | AdminUserStatus>('')
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 20

  const [editTarget, setEditTarget] = useState<AdminUser | null>(null)
  const [pwdTarget, setPwdTarget] = useState<AdminUser | null>(null)
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' })

  const listQuery = useQuery({
    queryKey: ['admin', 'users', { roleFilter, statusFilter, keyword, page, pageSize }],
    queryFn: () =>
      userAdminApi.search({
        roleCode: roleFilter || undefined,
        status: statusFilter || undefined,
        keyword: keyword || undefined,
        page,
        size: pageSize,
      }),
    placeholderData: (prev) => prev,
  })

  const errMsg = (err: unknown, fallback: string) => {
    if (axios.isAxiosError(err)) {
      const m = (err.response?.data as { message?: string } | undefined)?.message
      if (m) return m
    }
    return fallback
  }

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'users'] })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof userAdminApi.update>[1] }) =>
      userAdminApi.update(id, payload),
    onSuccess: () => {
      invalidate()
      setEditTarget(null)
      setSnackbar({ open: true, message: '사용자 정보를 수정했습니다.', severity: 'success' })
    },
    onError: (e) => setSnackbar({ open: true, message: errMsg(e, '수정에 실패했습니다.'), severity: 'error' }),
  })

  const passwordMut = useMutation({
    mutationFn: ({ id, pwd }: { id: number; pwd: string }) => userAdminApi.resetPassword(id, pwd),
    onSuccess: () => {
      setPwdTarget(null)
      setSnackbar({ open: true, message: '비밀번호를 변경했습니다.', severity: 'success' })
    },
    onError: (e) => setSnackbar({ open: true, message: errMsg(e, '비밀번호 변경에 실패했습니다.'), severity: 'error' }),
  })

  const withdrawMut = useMutation({
    mutationFn: (id: number) => userAdminApi.withdraw(id),
    onSuccess: () => {
      invalidate()
      setSnackbar({ open: true, message: '탈퇴 처리했습니다.', severity: 'success' })
    },
    onError: (e) => setSnackbar({ open: true, message: errMsg(e, '탈퇴 처리에 실패했습니다.'), severity: 'error' }),
  })

  const applyKeyword = () => {
    setKeyword(keywordInput.trim())
    setPage(0)
  }

  const resetFilters = () => {
    setRoleFilter('')
    setStatusFilter('')
    setKeywordInput('')
    setKeyword('')
    setPage(0)
  }

  const handleWithdraw = async (u: AdminUser) => {
    const ok = await confirm({
      title: '사용자 탈퇴',
      message: `${u.name ?? u.username} (${u.username}) 계정을 탈퇴 처리하시겠습니까?`,
      description: '탈퇴한 계정은 로그인할 수 없으며 목록에서 사라집니다. 데이터는 삭제되지 않습니다.',
      severity: 'error',
      confirmText: '탈퇴',
    })
    if (ok) withdrawMut.mutate(u.id)
  }

  const columns: GridColDef<AdminUser>[] = [
    { field: 'username', headerName: '아이디', width: 140 },
    { field: 'name', headerName: '성명', width: 100, valueGetter: (p) => p.row.name ?? '-' },
    {
      field: 'role',
      headerName: '역할',
      width: 100,
      renderCell: (p) => <Chip size="small" variant="outlined" label={roleLabel(p.row.role)} />,
    },
    { field: 'companyName', headerName: '소속(업체/부서)', minWidth: 160,
      valueGetter: (p) => p.row.companyName ?? p.row.departmentName ?? '-' },
    { field: 'title', headerName: '직책', width: 100, valueGetter: (p) => p.row.title ?? '-' },
    { field: 'email', headerName: 'E-Mail', minWidth: 180, valueGetter: (p) => p.row.email ?? '-' },
    { field: 'phone', headerName: '연락처', width: 130, valueGetter: (p) => p.row.phone ?? '-' },
    {
      field: 'status',
      headerName: '상태',
      width: 100,
      renderCell: (p) => (
        <Chip size="small" label={statusLabel(p.row.status)} color={statusColor(p.row.status)} />
      ),
    },
    { field: 'createdAt', headerName: '가입일', width: 110, valueGetter: (p) => fmtDate(p.row.createdAt) },
    { field: 'lastLoginAt', headerName: '최근 로그인', width: 110, valueGetter: (p) => fmtDate(p.row.lastLoginAt) },
    {
      field: 'actions',
      headerName: '관리',
      width: 140,
      renderCell: (p) => (
        <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ flexWrap: 'nowrap' }}>
          <Tooltip title="정보 수정">
            <IconButton size="small" onClick={() => setEditTarget(p.row)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="비밀번호 변경">
            <IconButton size="small" color="primary" onClick={() => setPwdTarget(p.row)}>
              <LockResetIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="탈퇴 처리">
            <IconButton size="small" color="error" onClick={() => handleWithdraw(p.row)}>
              <PersonRemoveIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        사용자 관리
      </Typography>

      {/* Filters - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select value={roleFilter} displayEmpty
            onChange={(e) => { setRoleFilter(e.target.value as '' | AdminUserRole); setPage(0) }}>
            <MenuItem value="">역할 전체</MenuItem>
            {ROLE_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select value={statusFilter} displayEmpty
            onChange={(e) => { setStatusFilter(e.target.value as '' | AdminUserStatus); setPage(0) }}>
            <MenuItem value="">상태 전체</MenuItem>
            {STATUS_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </Select>
        </FormControl>
        <ListSearchBar
          placeholder="아이디 / 성명 / 이메일 / 업체명"
          value={keywordInput}
          onChange={setKeywordInput}
          onSearch={applyKeyword}
          sx={{ width: { xs: '100%', sm: 300 } }}
        />
        <IconButton onClick={resetFilters} size="small">
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Filters - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
        <FormControl size="small" fullWidth>
          <Select value={roleFilter} displayEmpty
            onChange={(e) => { setRoleFilter(e.target.value as '' | AdminUserRole); setPage(0) }}>
            <MenuItem value="">역할 전체</MenuItem>
            {ROLE_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth>
          <Select value={statusFilter} displayEmpty
            onChange={(e) => { setStatusFilter(e.target.value as '' | AdminUserStatus); setPage(0) }}>
            <MenuItem value="">상태 전체</MenuItem>
            {STATUS_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ListSearchBar
            placeholder="아이디 / 성명 / 이메일 / 업체명"
            value={keywordInput}
            onChange={setKeywordInput}
            onSearch={applyKeyword}
            fullWidth
          />
          <IconButton onClick={resetFilters} size="small" sx={{ flexShrink: 0 }}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {listQuery.isError && <Alert severity="error">사용자 목록을 불러오지 못했습니다.</Alert>}

      <ListTable
        rows={listQuery.data?.content ?? []}
        columns={columns}
        getRowId={(r) => r.id}
        loading={listQuery.isLoading}
        rowCount={listQuery.data?.totalElements ?? 0}
        paginationModel={{ page, pageSize }}
        onPaginationModelChange={(m) => setPage(m.page)}
        emptyMessage="조회된 사용자가 없습니다."
        minWidth={1400}
      />

      <EditUserDialog
        target={editTarget}
        saving={updateMut.isPending}
        onClose={() => setEditTarget(null)}
        onSave={(payload) => editTarget && updateMut.mutate({ id: editTarget.id, payload })}
      />

      <PasswordDialog
        target={pwdTarget}
        saving={passwordMut.isPending}
        onClose={() => setPwdTarget(null)}
        onSave={(pwd) => pwdTarget && passwordMut.mutate({ id: pwdTarget.id, pwd })}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

// ─── 정보 수정 다이얼로그 ────────────────────────────────────────────────────
const EditUserDialog: React.FC<{
  target: AdminUser | null
  saving: boolean
  onClose: () => void
  onSave: (payload: {
    name: string; title: string; email: string; phone: string
    roleCode: AdminUserRole; status: AdminUserStatus
  }) => void
}> = ({ target, saving, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: '', title: '', email: '', phone: '',
    roleCode: 'CONTRACTOR' as AdminUserRole, status: 'APPROVED' as AdminUserStatus,
  })

  // 다이얼로그가 열릴 때마다 대상 사용자 값으로 초기화
  const [loadedId, setLoadedId] = useState<number | null>(null)
  if (target && loadedId !== target.id) {
    setLoadedId(target.id)
    setForm({
      name: target.name ?? '',
      title: target.title ?? '',
      email: target.email ?? '',
      phone: target.phone ?? '',
      roleCode: target.role,
      status: target.status,
    })
  }

  return (
    <Dialog open={target != null} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        사용자 정보 수정
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <TextField size="small" fullWidth label="아이디" value={target?.username ?? ''}
            InputProps={{ readOnly: true }} helperText="아이디는 변경할 수 없습니다." />
          <TextField size="small" fullWidth label="성명" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <TextField size="small" fullWidth label="직책" value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <TextField size="small" fullWidth label="E-Mail" value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <TextField size="small" fullWidth label="연락처" value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <FormControl size="small" fullWidth>
            <Select value={form.roleCode}
              onChange={(e) => setForm((f) => ({ ...f, roleCode: e.target.value as AdminUserRole }))}>
              {ROLE_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <Select value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as AdminUserStatus }))}>
              {STATUS_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose}>취소</Button>
        <Button variant="contained" disabled={saving} onClick={() => onSave(form)}>
          {saving ? <CircularProgress size={20} /> : '저장'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── 비밀번호 변경 다이얼로그 ────────────────────────────────────────────────
const PasswordDialog: React.FC<{
  target: AdminUser | null
  saving: boolean
  onClose: () => void
  onSave: (pwd: string) => void
}> = ({ target, saving, onClose, onSave }) => {
  const [pwd, setPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [show, setShow] = useState(false)

  const [loadedId, setLoadedId] = useState<number | null>(null)
  if (target && loadedId !== target.id) {
    setLoadedId(target.id)
    setPwd('')
    setConfirmPwd('')
    setShow(false)
  }

  const ruleOk = PASSWORD_RULE.test(pwd)
  const matched = pwd.length > 0 && pwd === confirmPwd
  const canSave = ruleOk && matched

  return (
    <Dialog open={target != null} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        비밀번호 변경
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {target?.name ?? '-'} ({target?.username}) 의 비밀번호를 재설정합니다.
          </Typography>

          <TextField
            size="small" fullWidth autoFocus
            type={show ? 'text' : 'password'}
            label="새 비밀번호"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            error={pwd.length > 0 && !ruleOk}
            helperText="8~20자, 영문/숫자/특수문자[ @!%#?& ] 각 1개 이상"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShow((v) => !v)} edge="end">
                    {show ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            size="small" fullWidth
            type={show ? 'text' : 'password'}
            label="새 비밀번호 확인"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            error={confirmPwd.length > 0 && !matched}
            helperText={confirmPwd.length > 0 && !matched ? '비밀번호가 일치하지 않습니다.' : ' '}
          />

          <Alert severity="info" sx={{ py: 0 }}>
            변경한 비밀번호는 사용자에게 별도로 안내해 주세요. 시스템은 평문을 저장하지 않습니다.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose}>취소</Button>
        <Button variant="contained" color="primary" disabled={!canSave || saving} onClick={() => onSave(pwd)}>
          {saving ? <CircularProgress size={20} /> : '변경'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default UserManagePage
