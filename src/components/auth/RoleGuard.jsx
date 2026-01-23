import React from 'react'
import { useRole } from '../../hooks/useRole'

export default function RoleGuard({
  children,
  requiredRole,
  requireEdit = false,
  requireAdmin = false,
  fallback = null
}) {
  const { role, canEdit, isAdmin } = useRole()

  // Check specific role requirement
  if (requiredRole && role !== requiredRole) {
    return fallback
  }

  // Check edit permission
  if (requireEdit && !canEdit) {
    return fallback
  }

  // Check admin permission
  if (requireAdmin && !isAdmin) {
    return fallback
  }

  return children
}
