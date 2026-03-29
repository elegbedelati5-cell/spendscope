import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

const STORAGE_USER = 'spendscope_user'
const STORAGE_TOKEN = 'token'

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_USER)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser())
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_TOKEN))

  useEffect(() => {
    if (!token) return undefined
    let cancelled = false
    api
      .get('/me')
      .then(({ data }) => {
        if (!cancelled) {
          localStorage.setItem(STORAGE_USER, JSON.stringify(data))
          setUser(data)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [token])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_TOKEN)
    localStorage.removeItem(STORAGE_USER)
    setToken(null)
    setUser(null)
  }, [])

  const updateSessionUser = useCallback((partial) => {
    setUser((u) => {
      const next = { ...(u || {}), ...partial }
      localStorage.setItem(STORAGE_USER, JSON.stringify(next))
      return next
    })
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem(STORAGE_TOKEN, data.token)
    localStorage.setItem(STORAGE_USER, JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (email, password, name) => {
    const { data } = await api.post('/auth/register', { email, password, name })
    localStorage.setItem(STORAGE_TOKEN, data.token)
    localStorage.setItem(STORAGE_USER, JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
      updateSessionUser,
    }),
    [user, token, login, register, logout, updateSessionUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
