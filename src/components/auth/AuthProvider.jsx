import React, { createContext, useContext } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useUser } from '../../hooks/useUser'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const auth = useAuth()
  const { profile, loading: profileLoading, updateProfile } = useUser(auth.user?.id)

  const value = {
    ...auth,
    profile,
    profileLoading,
    updateProfile,
    // Convenience getters
    isAuthenticated: !!auth.session,
    isLoading: auth.loading || (auth.session && profileLoading),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
