import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'

export function useAuth() {
  const navigate = useNavigate()
  const store    = useAuthStore()

  const logout = useCallback(async () => {
    try {
      if (store.token) await api.post('/auth/logout', { token: store.token })
    } catch {}
    store.logout()
    navigate('/login')
  }, [store, navigate])

  const refreshMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me')
      return data
    } catch {
      logout()
      return null
    }
  }, [logout])

  return {
    did:             store.did,
    role:            store.role,
    token:           store.token,
    isAuthenticated: store.isAuthenticated,
    logout,
    refreshMe,
  }
}
