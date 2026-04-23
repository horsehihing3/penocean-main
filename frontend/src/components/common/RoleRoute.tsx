import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { Role } from '../../types/auth'

interface RoleRouteProps {
  children: React.ReactNode
  allowedRoles: Role[]
  redirectTo?: string
}

const RoleRoute: React.FC<RoleRouteProps> = ({ children, allowedRoles, redirectTo = '/' }) => {
  const { user } = useAuth()

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}

export default RoleRoute
