import { useMemo, useState } from 'react'
import {
  Box,
  Paper,
  Stack,
  Typography,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Snackbar,
  Alert,
  Chip,
} from '@mui/material'
import { GridColDef, GridRowParams } from '@mui/x-data-grid'
import ListTable from '../../components/common/ListTable'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { codeMasterApi, type CodeMaster, type Department } from '../../api/codeMasterApi'
import { useConfirm } from '../../components/common/ConfirmDialogProvider'

type SnackbarState = { open: boolean; message: string; severity: 'success' | 'error' }

type TabKey = 'INDUSTRY' | 'DEPARTMENT' | 'BUDGET_ITEM'

const CodeMasterPage: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const confirm = useConfirm()
  const [tab, setTab] = useState<TabKey>('INDUSTRY')
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  })

  // INDUSTRY 또는 BUDGET_ITEM 같은 tb_code 그룹. tab 값을 그대로 groupCode 로 사용
  const industriesQuery = useQuery({
    queryKey: ['code-masters', tab],
    queryFn: () => codeMasterApi.listByGroup(tab, false),
    enabled: tab !== 'DEPARTMENT',
  })

  const departmentsQuery = useQuery({
    queryKey: ['code-masters', 'departments'],
    queryFn: () => codeMasterApi.listDepartments(),
    enabled: tab === 'DEPARTMENT',
  })

  // ------- Dialog state (tb_code group / department share minimal code/name form) -------
  const [editOpen, setEditOpen] = useState(false)
  const [editMode, setEditMode] = useState<'CREATE' | 'EDIT'>('CREATE')
  const [editTarget, setEditTarget] = useState<'CODE' | 'DEPARTMENT'>('CODE')
  const [form, setForm] = useState<{ id?: number; code: string; name: string; description?: string; active: boolean }>({
    code: '',
    name: '',
    description: '',
    active: true,
  })

  // tab 값이 곧 groupCode (INDUSTRY / BUDGET_ITEM 등). DEPARTMENT 는 별도 API.
  const currentGroup = tab !== 'DEPARTMENT' ? tab : null

  const openCreate = (target: TabKey) => {
    setEditTarget(target === 'DEPARTMENT' ? 'DEPARTMENT' : 'CODE')
    setEditMode('CREATE')
    setForm({ code: '', name: '', description: '', active: true })
    setEditOpen(true)
  }

  const openEditIndustry = (c: CodeMaster) => {
    setEditTarget('CODE')
    setEditMode('EDIT')
    setForm({
      id: c.id,
      code: c.code,
      name: c.name,
      description: c.description ?? '',
      active: c.active ?? true,
    })
    setEditOpen(true)
  }

  const openEditDepartment = (d: Department) => {
    setEditTarget('DEPARTMENT')
    setEditMode('EDIT')
    setForm({ id: d.id, code: d.code, name: d.name, description: '', active: true })
    setEditOpen(true)
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.code.trim() || !form.name.trim()) {
        throw new Error(t('codeMaster.codeNameRequired'))
      }
      if (editTarget === 'CODE') {
        const group = currentGroup ?? 'INDUSTRY'
        if (editMode === 'CREATE') {
          await codeMasterApi.createInGroup(group, {
            code: form.code.trim(),
            name: form.name.trim(),
            description: form.description,
            active: form.active,
          })
        } else {
          await codeMasterApi.updateCode(form.id!, {
            name: form.name.trim(),
            description: form.description,
            active: form.active,
          })
        }
      } else {
        if (editMode === 'CREATE') {
          await codeMasterApi.createDepartment({ code: form.code.trim(), name: form.name.trim() })
        } else {
          await codeMasterApi.updateDepartment(form.id!, { name: form.name.trim() })
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['code-masters'] })
      setEditOpen(false)
      setSnackbar({ open: true, message: t('common.save'), severity: 'success' })
    },
    onError: (err: unknown) =>
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : String(err),
        severity: 'error',
      }),
  })

  const deleteIndustryMut = useMutation({
    mutationFn: (id: number) => codeMasterApi.deleteCode(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['code-masters', tab] })
      setSnackbar({ open: true, message: t('common.delete'), severity: 'success' })
    },
    onError: (err: unknown) =>
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : String(err),
        severity: 'error',
      }),
  })

  const deleteDepartmentMut = useMutation({
    mutationFn: (id: number) => codeMasterApi.deleteDepartment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['code-masters', 'departments'] })
      setSnackbar({ open: true, message: t('common.delete'), severity: 'success' })
    },
    onError: (err: unknown) =>
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : String(err),
        severity: 'error',
      }),
  })

  const industryColumns: GridColDef<CodeMaster>[] = useMemo(
    () => [
      { field: 'code', headerName: t('codeMaster.code'), width: 160 },
      { field: 'name', headerName: t('codeMaster.name'), flex: 1, minWidth: 180 },
      { field: 'description', headerName: t('codeMaster.description'), flex: 1, minWidth: 200 },
      {
        field: 'active',
        headerName: t('codeMaster.active'),
        width: 100,
        renderCell: (p) => (
          <Chip
            size="small"
            label={p.value ? t('codeMaster.activeYes') : t('codeMaster.activeNo')}
            color={p.value ? 'success' : 'default'}
          />
        ),
      },
      {
        field: 'actions',
        headerName: '',
        width: 110,
        sortable: false,
        renderCell: (p) => (
          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" onClick={() => openEditIndustry(p.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={async () => {
                if (await confirm({
                  title: t('common.delete'),
                  message: t('codeMaster.deleteConfirm'),
                  severity: 'error',
                  confirmText: t('common.delete'),
                })) {
                  deleteIndustryMut.mutate(p.row.id)
                }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        ),
      },
    ],
    [t, deleteIndustryMut, confirm]
  )

  const departmentColumns: GridColDef<Department>[] = useMemo(
    () => [
      { field: 'code', headerName: t('codeMaster.code'), width: 160 },
      { field: 'name', headerName: t('codeMaster.name'), flex: 1, minWidth: 180 },
      {
        field: 'actions',
        headerName: '',
        width: 110,
        sortable: false,
        renderCell: (p) => (
          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" onClick={() => openEditDepartment(p.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={async () => {
                if (await confirm({
                  title: t('common.delete'),
                  message: t('codeMaster.deleteConfirm'),
                  severity: 'error',
                  confirmText: t('common.delete'),
                })) {
                  deleteDepartmentMut.mutate(p.row.id)
                }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        ),
      },
    ],
    [t, deleteDepartmentMut, confirm]
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        {t('codeMaster.pageTitle')}
      </Typography>

      <Paper variant="outlined">
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={t('codeMaster.tabIndustry')} value="INDUSTRY" />
          <Tab label={t('codeMaster.tabDepartment')} value="DEPARTMENT" />
          <Tab label={t('codeMaster.tabBudget')} value="BUDGET_ITEM" />
        </Tabs>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size="small"
            onClick={() => openCreate(tab)}
          >
            {t('codeMaster.add')}
          </Button>
        </Stack>

        {tab !== 'DEPARTMENT' ? (
          <ListTable
            rows={industriesQuery.data ?? []}
            columns={industryColumns}
            getRowId={(r) => r.id}
            loading={industriesQuery.isLoading}
            onRowDoubleClick={(p: GridRowParams<CodeMaster>) => openEditIndustry(p.row)}
            emptyMessage={t('approval.empty')}
          />
        ) : (
          <ListTable
            rows={departmentsQuery.data ?? []}
            columns={departmentColumns}
            getRowId={(r) => r.id}
            loading={departmentsQuery.isLoading}
            onRowDoubleClick={(p: GridRowParams<Department>) => openEditDepartment(p.row)}
            emptyMessage={t('approval.empty')}
          />
        )}
      </Paper>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode === 'CREATE' ? t('codeMaster.createTitle') : t('codeMaster.editTitle')}
          {' · '}
          {editTarget === 'CODE'
            ? tab === 'BUDGET_ITEM'
              ? t('codeMaster.tabBudget')
              : t('codeMaster.tabIndustry')
            : t('codeMaster.tabDepartment')}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              size="small"
              fullWidth
              label={t('codeMaster.code')}
              value={form.code}
              disabled={editMode === 'EDIT'}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            />
            <TextField
              size="small"
              fullWidth
              label={t('codeMaster.name')}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            {editTarget === 'CODE' && (
              <TextField
                size="small"
                fullWidth
                multiline
                minRows={2}
                label={t('codeMaster.description')}
                value={form.description ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default CodeMasterPage
