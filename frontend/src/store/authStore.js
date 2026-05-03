import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token:           null,
      refreshToken:    null,
      did:             null,
      role:            null,
      isAuthenticated: false,

      login: (token, refreshToken, did, role) =>
        set({ token, refreshToken, did, role, isAuthenticated: true }),

      logout: () =>
        set({ token: null, refreshToken: null, did: null, role: null, isAuthenticated: false }),

      getToken:  () => get().token,
      getRole:   () => get().role,
      getDid:    () => get().did,
    }),
    { name: 'sv-auth', version: 1 }
  )
)
