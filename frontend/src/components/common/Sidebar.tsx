import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Tooltip,
  Collapse,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../../api/dashboardApi'
import InfoIcon from '@mui/icons-material/Info'
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat'
import BusinessIcon from '@mui/icons-material/Business'
import CampaignIcon from '@mui/icons-material/Campaign'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import PolicyIcon from '@mui/icons-material/Policy'
import ArticleIcon from '@mui/icons-material/Article'
import VerifiedIcon from '@mui/icons-material/Verified'
import LoginIcon from '@mui/icons-material/Login'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import BadgeIcon from '@mui/icons-material/Badge'
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver'
import AssessmentIcon from '@mui/icons-material/Assessment'
import ReportIcon from '@mui/icons-material/Report'
import DescriptionIcon from '@mui/icons-material/Description'
import FolderCopyIcon from '@mui/icons-material/FolderCopy'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import HowToRegIcon from '@mui/icons-material/HowToReg'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import RuleIcon from '@mui/icons-material/Rule'
import WorkIcon from '@mui/icons-material/Work'
import { useThemeMode } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import type { Role } from '../../types/auth'

interface MenuItem {
  textKey: string
  icon: React.ReactNode
  path?: string
  children?: MenuItem[]
  allowedRoles?: Role[]
}

const menuItems: MenuItem[] = [
  {
    textKey: 'nav.introduction',
    icon: <InfoIcon />,
    children: [
      { textKey: 'nav.introPolicy', icon: <PolicyIcon />, path: '/introduction/policy' },
      { textKey: 'nav.introGoal', icon: <ArticleIcon />, path: '/introduction/goal' },
      { textKey: 'nav.introCertificate', icon: <VerifiedIcon />, path: '/introduction/certificate' },
    ],
  },
  {
    textKey: 'nav.vesselSite',
    icon: <DirectionsBoatIcon />,
    children: [
      { textKey: 'nav.vesselAccessProcedure', icon: <ArticleIcon />, path: '/vessel/procedure/access' },
      { textKey: 'nav.vesselRiskProcedure', icon: <ArticleIcon />, path: '/vessel/procedure/risk-assessment' },
      { textKey: 'nav.vesselAccessRequest', icon: <LoginIcon />, path: '/vessel/access-request' },
      { textKey: 'nav.vesselAccessPermit', icon: <VpnKeyIcon />, path: '/vessel/access-permit' },
      { textKey: 'nav.visitPermit', icon: <BadgeIcon />, path: '/vessel/visit-permit' },
      { textKey: 'nav.workerVoice', icon: <RecordVoiceOverIcon />, path: '/vessel/worker-voice' },
    ],
  },
  {
    textKey: 'nav.contractor',
    icon: <BusinessIcon />,
    children: [
      { textKey: 'nav.contractorProcedure', icon: <ArticleIcon />, path: '/contractor/procedure' },
      { textKey: 'nav.contractorEval', icon: <AssessmentIcon />, path: '/contractor/evaluation' },
      { textKey: 'nav.improvementHistory', icon: <FactCheckIcon />, path: '/contractor/improvements' },
      { textKey: 'nav.accident', icon: <ReportIcon />, path: '/contractor/accident' },
    ],
  },
  {
    textKey: 'nav.notice',
    icon: <CampaignIcon />,
    children: [
      { textKey: 'nav.noticeBoard', icon: <DescriptionIcon />, path: '/notice/board' },
      { textKey: 'nav.noticeForms', icon: <FolderCopyIcon />, path: '/notice/forms' },
    ],
  },
  {
    // PPT slide 31: 보건파트 단일 메뉴로 통합 (병원자료 + 3년 추이 + 상담내역)
    textKey: 'nav.healthPortal',
    icon: <LocalHospitalIcon />,
    path: '/health/checkup',
  },
  {
    textKey: 'nav.admin',
    icon: <AdminPanelSettingsIcon />,
    allowedRoles: ['ADMIN'],
    children: [
      { textKey: 'nav.adminApproval', icon: <HowToRegIcon />, path: '/admin/approval' },
      { textKey: 'nav.adminCompany', icon: <BusinessIcon />, path: '/admin/company' },
      { textKey: 'nav.adminAccessApproval', icon: <LoginIcon />, path: '/admin/access-approval' },
      { textKey: 'nav.adminEvalReview', icon: <AssessmentIcon />, path: '/admin/eval-review' },
      { textKey: 'nav.adminCodeMaster', icon: <ArticleIcon />, path: '/admin/code-masters' },
      { textKey: 'nav.adminEvalItem', icon: <FactCheckIcon />, path: '/admin/eval-item' },
      { textKey: 'nav.adminSafetyRule', icon: <RuleIcon />, path: '/admin/safety-rule' },
      { textKey: 'nav.auditInspection', icon: <FactCheckIcon />, path: '/admin/audit-inspection' },
      { textKey: 'nav.dailySafetyLog', icon: <WorkIcon />, path: '/admin/daily-safety-log' },
      { textKey: 'nav.performanceLand', icon: <AssessmentIcon />, path: '/admin/safety-performance/land' },
      { textKey: 'nav.performanceSea', icon: <DirectionsBoatIcon />, path: '/admin/safety-performance/sea' },
    ],
  },
]

interface SidebarProps {
  onMenuClick?: () => void
  collapsed?: boolean
}

const Sidebar: React.FC<SidebarProps> = ({ onMenuClick, collapsed = false }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { isDarkMode } = useThemeMode()

  const visibleMenuItems = menuItems.filter(
    (item) => !item.allowedRoles || (user?.role && item.allowedRoles.includes(user.role))
  )

  // ADMIN 에게만 가입승인 대기건수 뱃지 표시 (60s polling)
  const isAdmin = user?.role === 'ADMIN'
  const { data: dashboardSummary } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardApi.getSummary,
    enabled: isAdmin,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })
  const pendingApprovalCount = dashboardSummary?.pendingApprovalCount ?? 0

  const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
    const active = visibleMenuItems.find((item) =>
      item.children?.some(
        (child) => child.path && (location.pathname === child.path || (child.path !== '/' && location.pathname.startsWith(child.path)))
      )
    )
    return active ? [active.textKey] : []
  })

  // Theme-aware sidebar colors
  const colors = {
    sidebar: isDarkMode ? '#18181b' : '#1e293b',
    sidebarBrand: isDarkMode ? '#09090b' : '#0f172a',
    sidebarHover: isDarkMode ? '#27272a' : '#334155',
    activeBackground: '#0052a5',
    activeBorder: '#1e6ec0',
    inactiveText: isDarkMode ? '#71717a' : '#9ca3af',
    subMenuBg: isDarkMode ? '#09090b' : '#0f172a',
  }

  const isPathActive = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path))

  const isParentActive = (item: MenuItem) =>
    item.children?.some((child) => child.path && isPathActive(child.path)) ?? false

  const toggleExpand = (textKey: string) => {
    setExpandedMenus((prev) => (prev.includes(textKey) ? [] : [textKey]))
  }

  const renderMenuItem = (item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedMenus.includes(item.textKey)
    const isActive = item.path ? isPathActive(item.path) : isParentActive(item)

    const button = (
      <ListItemButton
        onClick={() => {
          if (hasChildren) {
            toggleExpand(item.textKey)
          } else if (item.path) {
            navigate(item.path)
            onMenuClick?.()
          }
        }}
        sx={{
          py: 1.5,
          px: collapsed ? 1.5 : 2,
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderLeft: isActive ? `4px solid ${colors.activeBorder}` : '4px solid transparent',
          borderBottom: isActive && hasChildren && isExpanded ? '1px solid rgba(255,255,255,0.3)' : 'none',
          backgroundColor: isActive ? colors.activeBackground : 'transparent',
          color: isActive ? 'white' : colors.inactiveText,
          '&:hover': {
            backgroundColor: isActive ? colors.activeBackground : colors.sidebarHover,
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: collapsed ? 'auto' : 40,
            justifyContent: 'center',
            color: isActive ? 'white' : colors.inactiveText,
          }}
        >
          {item.icon}
        </ListItemIcon>
        {!collapsed && (
          <>
            <ListItemText
              primary={t(item.textKey)}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
              }}
            />
            {hasChildren && (isExpanded ? <ExpandLess /> : <ExpandMore />)}
          </>
        )}
      </ListItemButton>
    )

    return (
      <Box key={item.textKey}>
        <ListItem disablePadding>
          {collapsed ? (
            <Tooltip title={t(item.textKey)} placement="right" arrow>
              {button}
            </Tooltip>
          ) : (
            button
          )}
        </ListItem>

        {hasChildren && !collapsed && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List disablePadding sx={{ backgroundColor: colors.subMenuBg }}>
              {item.children!.map((child) => {
                const childActive = child.path ? isPathActive(child.path) : false
                const showApprovalBadge =
                  isAdmin && child.path === '/admin/approval' && pendingApprovalCount > 0
                return (
                  <ListItem key={child.textKey} disablePadding>
                    <ListItemButton
                      onClick={() => {
                        if (child.path) {
                          navigate(child.path)
                          onMenuClick?.()
                        }
                      }}
                      sx={{
                        py: 1,
                        pl: 4,
                        pr: 2,
                        borderLeft: childActive ? `4px solid ${colors.activeBorder}` : '4px solid transparent',
                        backgroundColor: childActive ? colors.activeBackground : 'transparent',
                        color: childActive ? 'white' : colors.inactiveText,
                        '&:hover': {
                          backgroundColor: childActive ? colors.activeBackground : colors.sidebarHover,
                        },
                      }}
                    >
                      <ListItemText
                        primary={`•  ${t(child.textKey)}`}
                        primaryTypographyProps={{
                          fontSize: '0.8rem',
                          fontWeight: childActive ? 600 : 400,
                        }}
                      />
                      {showApprovalBadge && (
                        <Box
                          sx={{
                            ml: 1,
                            minWidth: 22,
                            height: 20,
                            px: 0.75,
                            borderRadius: '10px',
                            backgroundColor: 'error.main',
                            color: 'white',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {pendingApprovalCount}
                        </Box>
                      )}
                    </ListItemButton>
                  </ListItem>
                )
              })}
            </List>
          </Collapse>
        )}
      </Box>
    )
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: colors.sidebar,
      }}
    >
      <List sx={{ flex: 1, pt: 2, px: 0, overflowY: 'auto', overflowX: 'hidden' }}>
        {visibleMenuItems.map((item) => renderMenuItem(item))}
      </List>

      <Box
        sx={{
          p: collapsed ? 1 : 2,
          backgroundColor: colors.sidebarBrand,
          borderTop: isDarkMode ? '1px solid #27272a' : 'none',
          textAlign: 'center',
        }}
      >
        <Typography variant="caption" sx={{ color: colors.inactiveText }}>
          {collapsed ? 'v1.0' : 'Version 1.0.0'}
        </Typography>
      </Box>
    </Box>
  )
}

export default Sidebar
