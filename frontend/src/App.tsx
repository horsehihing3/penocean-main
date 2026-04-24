import { Routes, Route } from 'react-router-dom'

import Layout from './components/common/Layout'
import ProtectedRoute from './components/common/ProtectedRoute'
import RoleRoute from './components/common/RoleRoute'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Dashboard from './pages/Dashboard'
import ProfilePage from './pages/ProfilePage'
import PolicyPage from './pages/introduction/PolicyPage'
import GoalPage from './pages/introduction/GoalPage'
import CertificatePage from './pages/introduction/CertificatePage'
import ComingSoonPage from './pages/ComingSoonPage'
import NotFoundPage from './pages/NotFoundPage'
import ApprovalPage from './pages/admin/ApprovalPage'
import DailySafetyLogPage from './pages/admin/DailySafetyLogPage'
import EvaluationItemPage from './pages/admin/EvaluationItemPage'
import AccessProcedurePage from './pages/vessel/AccessProcedurePage'
import RiskAssessmentProcedurePage from './pages/vessel/RiskAssessmentProcedurePage'
import AccessRequestPage from './pages/vessel/AccessRequestPage'
import AccessRequestCreatePage from './pages/vessel/AccessRequestCreatePage'
import AccessRequestDetailPage from './pages/vessel/AccessRequestDetailPage'
import VisitPermitPage from './pages/vessel/VisitPermitPage'
import ContractDeptProcedurePage from './pages/contractor/ContractDeptProcedurePage'
import EvaluationPage from './pages/contractor/EvaluationPage'
import EvaluationCreatePage from './pages/contractor/EvaluationCreatePage'
import ImprovementHistoryPage from './pages/contractor/ImprovementHistoryPage'
import IndustrialAccidentPage from './pages/contractor/IndustrialAccidentPage'
import WorkerVoicePage from './pages/vessel/WorkerVoicePage'
import SafetyPerformanceLandPage from './pages/admin/SafetyPerformanceLandPage'
import SafetyPerformanceSeaPage from './pages/admin/SafetyPerformanceSeaPage'
import HealthCheckupPage from './pages/health/HealthCheckupPage'
import HealthTrendPage from './pages/health/HealthTrendPage'
import NoticeBoardPage from './pages/notice/NoticeBoardPage'
import FormLibraryPage from './pages/notice/FormLibraryPage'
import SafetyRulePage from './pages/admin/SafetyRulePage'
import CompanyManagePage from './pages/admin/CompanyManagePage'
import AdminAccessApprovalPage from './pages/admin/AdminAccessApprovalPage'
import AdminEvaluationReviewPage from './pages/admin/AdminEvaluationReviewPage'
import CodeMasterPage from './pages/admin/CodeMasterPage'
import AuditInspectionPage from './pages/admin/AuditInspectionPage'
import AdminAccidentReportPage from './pages/admin/AdminAccidentReportPage'
import LandBudgetPage from './pages/admin/LandBudgetPage'
import SeaCrewStatsPage from './pages/admin/SeaCrewStatsPage'

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<ProfilePage />} />

        {/* Introduction */}
        <Route path="introduction/policy" element={<PolicyPage />} />
        <Route path="introduction/goal" element={<GoalPage />} />
        <Route path="introduction/certificate" element={<CertificatePage />} />

        {/* Vessel site */}
        <Route path="vessel/procedure/access" element={<AccessProcedurePage />} />
        <Route path="vessel/procedure/risk-assessment" element={<RiskAssessmentProcedurePage />} />
        <Route path="vessel/access-request" element={<AccessRequestPage />} />
        <Route
          path="vessel/access-request/new"
          element={
            <RoleRoute allowedRoles={['CONTRACTOR', 'ADMIN']}>
              <AccessRequestCreatePage />
            </RoleRoute>
          }
        />
        <Route
          path="vessel/access-request/:id/edit"
          element={
            <RoleRoute allowedRoles={['CONTRACTOR', 'ADMIN', 'CONTRACT_DEPT']}>
              <AccessRequestCreatePage />
            </RoleRoute>
          }
        />
        <Route path="vessel/access-request/:id" element={<AccessRequestDetailPage />} />
        <Route path="vessel/access-permit" element={<AccessRequestPage />} />
        <Route path="vessel/access-permit/:id" element={<AccessRequestDetailPage />} />
        <Route path="vessel/visit-permit" element={<VisitPermitPage />} />
        <Route path="vessel/worker-voice" element={<WorkerVoicePage />} />

        {/* Contractor */}
        <Route path="contractor/procedure" element={<ContractDeptProcedurePage />} />
        <Route path="contractor/evaluation" element={<EvaluationPage />} />
        <Route
          path="contractor/evaluation/new"
          element={
            <RoleRoute allowedRoles={['ADMIN', 'CONTRACT_DEPT']}>
              <EvaluationCreatePage />
            </RoleRoute>
          }
        />
        <Route path="contractor/improvements" element={<ImprovementHistoryPage />} />
        <Route path="contractor/accident" element={<IndustrialAccidentPage />} />

        {/* Notice */}
        <Route path="notice/board" element={<NoticeBoardPage />} />
        <Route path="notice/forms" element={<FormLibraryPage />} />

        {/* Health */}
        <Route path="health/checkup" element={<HealthCheckupPage />} />
        <Route path="health/trend" element={<HealthTrendPage />} />

        {/* Admin (role-gated) */}
        <Route
          path="admin/approval"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <ApprovalPage />
            </RoleRoute>
          }
        />
        <Route
          path="admin/daily-safety-log"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <DailySafetyLogPage />
            </RoleRoute>
          }
        />
        <Route
          path="admin/company"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <CompanyManagePage />
            </RoleRoute>
          }
        />
        <Route
          path="admin/access-approval"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminAccessApprovalPage />
            </RoleRoute>
          }
        />
        <Route
          path="admin/eval-review"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminEvaluationReviewPage />
            </RoleRoute>
          }
        />
        <Route
          path="admin/code-masters"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <CodeMasterPage />
            </RoleRoute>
          }
        />
        <Route
          path="admin/eval-item"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <EvaluationItemPage />
            </RoleRoute>
          }
        />
        <Route
          path="admin/safety-rule"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <SafetyRulePage />
            </RoleRoute>
          }
        />
        <Route
          path="admin/accident-report"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminAccidentReportPage />
            </RoleRoute>
          }
        />
        <Route
          path="admin/land-budget"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <LandBudgetPage />
            </RoleRoute>
          }
        />
        <Route
          path="admin/sea-budget"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <ComingSoonPage />
            </RoleRoute>
          }
        />
        <Route
          path="admin/land-crew-stats"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <ComingSoonPage />
            </RoleRoute>
          }
        />
        <Route
          path="admin/sea-crew-stats"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <SeaCrewStatsPage />
            </RoleRoute>
          }
        />
        <Route
          path="admin/audit-inspection"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AuditInspectionPage />
            </RoleRoute>
          }
        />
        <Route
          path="admin/safety-performance/land"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <SafetyPerformanceLandPage />
            </RoleRoute>
          }
        />
        <Route
          path="admin/safety-performance/sea"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <SafetyPerformanceSeaPage />
            </RoleRoute>
          }
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
