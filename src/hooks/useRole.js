import { useAuthContext } from '../components/auth/AuthProvider'

export function useRole() {
  const { profile } = useAuthContext()

  const role = profile?.role || 'viewer'

  return {
    role,
    isAdmin: role === 'admin',
    isEditor: role === 'editor' || role === 'admin',
    isViewer: role === 'viewer',
    canEdit: role === 'editor' || role === 'admin',
    canManageUsers: role === 'admin',
  }
}
