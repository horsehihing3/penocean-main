// [2026-05-02] 개발 질문 게시판 — localStorage 기반 CRUD, 메뉴 계층 콤보
import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { format } from 'date-fns'
import { useConfirm } from '../../components/common/ConfirmDialogProvider'

// ─── 메뉴 트리 (Sidebar 구조와 동일하게 유지) ───────────────────────────────
interface MenuNode {
  label: string
  children?: MenuNode[]
}

const MENU_TREE: MenuNode[] = [
  {
    label: '소개',
    children: [
      { label: '안전보건 경영방침' },
      { label: '안전보건 목표' },
      { label: '안전보건 인증' },
    ],
  },
  {
    label: '사업장(선박)안전보건 (업체용)',
    children: [
      { label: '사업장 출입절차' },
      { label: '사업장 출입신청' },
      { label: '반기평가' },
      { label: '근로자 의견' },
    ],
  },
  {
    label: '협력업체 안전보건 (계약부서용)',
    children: [
      { label: '협력업체 안전보건평가' },
      { label: '업체평가 및 반기평가' },
      { label: '개선요청 이력' },
      { label: '산업재해 발생 List' },
    ],
  },
  {
    label: '공지사항',
    children: [
      { label: '공지' },
      { label: '양식함' },
    ],
  },
  {
    label: '관리자',
    children: [
      { label: '가입신청List & 업체관리' },
      { label: '정보수집' },
      { label: '사업장 출입신청 허가' },
      { label: '협력업체 안전보건평가 검토' },
      { label: '협력업체 안전보건평가 항목관리' },
      { label: '안전수칙' },
      { label: '협력업체 산업재해 발생List' },
      {
        label: '안전보건실적관리',
        children: [
          { label: '육상안전보건 예산 및 실적' },
          { label: '해상안전보건 예산 및 실적' },
          { label: '육상직원 질병/부상 누적건수 및 재해율' },
          { label: '해상직원 질병/부상 누적건수 및 재해율' },
        ],
      },
      { label: '보건파트' },
      { label: 'QR 안전교육 이수 관리' },
      { label: '질문 게시판' },
    ],
  },
]

const TOP_MENUS = MENU_TREE.map((m) => m.label)

function getChildren(parentLabel: string): MenuNode[] {
  return MENU_TREE.find((m) => m.label === parentLabel)?.children ?? []
}

function getGrandChildren(parentLabel: string, childLabel: string): MenuNode[] {
  return getChildren(parentLabel).find((c) => c.label === childLabel)?.children ?? []
}

// ─── 데이터 모델 ─────────────────────────────────────────────────────────────
interface QnaItem {
  id: number
  parentMenu: string
  childMenu: string
  grandChildMenu: string
  question: string
  answer: string
  createdAt: string
}

const STORAGE_KEY = 'dev_qna_items'

function loadItems(): QnaItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as QnaItem[]) : []
  } catch {
    return []
  }
}

function saveItems(items: QnaItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

const emptyForm = {
  parentMenu: '',
  childMenu: '',
  grandChildMenu: '',
  question: '',
  answer: '',
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────
const DevQnAPage: React.FC = () => {
  const confirm = useConfirm()
  const [items, setItems] = useState<QnaItem[]>(loadItems)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<QnaItem | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [detailItem, setDetailItem] = useState<QnaItem | null>(null)

  useEffect(() => {
    saveItems(items)
  }, [items])

  // 상위메뉴 변경 시 하위 초기화
  const handleParentChange = (value: string) => {
    setForm((f) => ({ ...f, parentMenu: value, childMenu: '', grandChildMenu: '' }))
  }

  // 하위메뉴 변경 시 하위하위 초기화
  const handleChildChange = (value: string) => {
    setForm((f) => ({ ...f, childMenu: value, grandChildMenu: '' }))
  }

  const childMenus = getChildren(form.parentMenu)
  const grandChildMenus = getGrandChildren(form.parentMenu, form.childMenu)

  const openCreate = () => {
    setEditTarget(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (item: QnaItem) => {
    setEditTarget(item)
    setForm({
      parentMenu: item.parentMenu,
      childMenu: item.childMenu,
      grandChildMenu: item.grandChildMenu ?? '',
      question: item.question,
      answer: item.answer,
    })
    setDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!form.question.trim()) return
    if (editTarget) {
      setItems((prev) =>
        prev.map((it) => (it.id === editTarget.id ? { ...it, ...form } : it))
      )
    } else {
      const newItem: QnaItem = {
        id: Date.now(),
        ...form,
        createdAt: new Date().toISOString(),
      }
      setItems((prev) => [newItem, ...prev])
    }
    setDialogOpen(false)
  }

  // [2026-08-03] window.confirm → 프로젝트 커스텀 confirm 으로 교체
  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: '질문 삭제',
      message: '이 질문을 삭제하시겠습니까?',
      description: '삭제한 질문은 복구할 수 없습니다.',
      severity: 'error',
      confirmText: '삭제',
    })
    if (!ok) return
    setItems((prev) => prev.filter((it) => it.id !== id))
    if (detailItem?.id === id) setDetailItem(null)
  }

  const formatDate = (iso: string) => {
    try {
      return format(new Date(iso), 'yyyy-MM-dd')
    } catch {
      return iso
    }
  }

  // 메뉴 표시 텍스트 (하위 있으면 ▸ 구분)
  const menuLabel = (item: QnaItem) => {
    const parts = [item.parentMenu, item.childMenu, item.grandChildMenu].filter(Boolean)
    return parts.join(' > ')
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          질문 게시판
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          질문 등록
        </Button>
      </Stack>

      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 60 }}>번호</TableCell>
                <TableCell sx={{ width: 200 }}>상위메뉴</TableCell>
                <TableCell sx={{ width: 200 }}>하위메뉴</TableCell>
                <TableCell>질문</TableCell>
                <TableCell>답변</TableCell>
                <TableCell sx={{ width: 100 }}>등록일</TableCell>
                <TableCell sx={{ width: 80 }} align="center">관리</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    등록된 질문이 없습니다.
                  </TableCell>
                </TableRow>
              )}
              {items.map((item, idx) => (
                <TableRow
                  key={item.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setDetailItem(item)}
                >
                  <TableCell>{items.length - idx}</TableCell>
                  <TableCell>
                    {item.parentMenu ? (
                      <Chip label={item.parentMenu} size="small" variant="outlined" />
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="column" spacing={0.5}>
                      {item.childMenu && (
                        <Chip label={item.childMenu} size="small" variant="outlined" color="primary" />
                      )}
                      {item.grandChildMenu && (
                        <Chip label={item.grandChildMenu} size="small" variant="outlined" color="secondary" />
                      )}
                      {!item.childMenu && (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 220 }}>
                    <Typography
                      variant="body2"
                      sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}
                    >
                      {item.question}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 220 }}>
                    {item.answer ? (
                      <Typography
                        variant="body2"
                        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}
                      >
                        {item.answer}
                      </Typography>
                    ) : (
                      <Chip label="미답변" size="small" color="warning" />
                    )}
                  </TableCell>
                  <TableCell>{formatDate(item.createdAt)}</TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <IconButton size="small" onClick={() => openEdit(item)}>
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ── 등록/수정 다이얼로그 ─────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {editTarget ? '질문 수정' : '질문 등록'}
          <IconButton size="small" onClick={() => setDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            {/* 상위메뉴 */}
            <FormControl size="small" fullWidth>
              <InputLabel>상위메뉴</InputLabel>
              <Select
                label="상위메뉴"
                value={form.parentMenu}
                onChange={(e) => handleParentChange(e.target.value)}
              >
                <MenuItem value=""><em>선택 안 함</em></MenuItem>
                {TOP_MENUS.map((m) => (
                  <MenuItem key={m} value={m}>{m}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 하위메뉴 — 상위 선택 시 노출 */}
            {childMenus.length > 0 && (
              <FormControl size="small" fullWidth>
                <InputLabel>하위메뉴</InputLabel>
                <Select
                  label="하위메뉴"
                  value={form.childMenu}
                  onChange={(e) => handleChildChange(e.target.value)}
                >
                  <MenuItem value=""><em>선택 안 함</em></MenuItem>
                  {childMenus.map((c) => (
                    <MenuItem key={c.label} value={c.label}>{c.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* 3단계 하위메뉴 — 해당 하위메뉴에 자식이 있을 때 자동 생성 */}
            {grandChildMenus.length > 0 && (
              <FormControl size="small" fullWidth>
                <InputLabel>세부메뉴</InputLabel>
                <Select
                  label="세부메뉴"
                  value={form.grandChildMenu}
                  onChange={(e) => setForm((f) => ({ ...f, grandChildMenu: e.target.value }))}
                >
                  <MenuItem value=""><em>선택 안 함</em></MenuItem>
                  {grandChildMenus.map((g) => (
                    <MenuItem key={g.label} value={g.label}>{g.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              size="small"
              fullWidth
              multiline
              minRows={3}
              label="질문 *"
              value={form.question}
              onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
            />
            <TextField
              size="small"
              fullWidth
              multiline
              minRows={3}
              label="답변"
              value={form.answer}
              onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
              placeholder="답변이 확인되면 입력하세요"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={!form.question.trim()}>
            {editTarget ? '수정' : '등록'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── 상세 보기 다이얼로그 ─────────────────────────────── */}
      <Dialog open={detailItem != null} onClose={() => setDetailItem(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          질문 상세
          <IconButton size="small" onClick={() => setDetailItem(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailItem && (
            <Stack spacing={2}>
              {/* 메뉴 경로 */}
              {menuLabel(detailItem) && (
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {[detailItem.parentMenu, detailItem.childMenu, detailItem.grandChildMenu]
                    .filter(Boolean)
                    .map((label, i) => (
                      <Chip
                        key={i}
                        label={label}
                        size="small"
                        variant="outlined"
                        color={i === 0 ? 'default' : i === 1 ? 'primary' : 'secondary'}
                      />
                    ))}
                </Stack>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">질문</Typography>
                <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5, whiteSpace: 'pre-wrap' }}>
                  <Typography variant="body2">{detailItem.question}</Typography>
                </Paper>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">답변</Typography>
                <Paper
                  variant="outlined"
                  sx={{ p: 1.5, mt: 0.5, whiteSpace: 'pre-wrap', bgcolor: detailItem.answer ? 'inherit' : 'grey.50' }}
                >
                  {detailItem.answer ? (
                    <Typography variant="body2">{detailItem.answer}</Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">미답변</Typography>
                  )}
                </Paper>
              </Box>
              <Typography variant="caption" color="text.secondary">
                등록일: {formatDate(detailItem.createdAt)}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          {detailItem && (
            <Button
              startIcon={<EditOutlinedIcon />}
              onClick={() => {
                openEdit(detailItem)
                setDetailItem(null)
              }}
            >
              수정
            </Button>
          )}
          <Button onClick={() => setDetailItem(null)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DevQnAPage
