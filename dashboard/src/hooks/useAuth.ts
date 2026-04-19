'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { jwtDecode } from 'jwt-decode'
import { authApi } from '@/lib/api'
import type { User } from '@/types'

interface JwtPayload {
  userId: string
  email: string
  exp: number
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

function getUserFromToken(token: string | null): User | null {
  if (!token) return null
  try {
    const payload = jwtDecode<JwtPayload>(token)
    // Check if token is expired
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      document.cookie = 'token=; path=/; max-age=0'
      return null
    }
    // Read user info from localStorage (includes role from login response)
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      return JSON.parse(storedUser) as User
    }
    // Fallback: build user from JWT payload (role defaults to 'user')
    return {
      id: payload.userId,
      email: payload.email,
      role: 'user',
    }
  } catch {
    return null
  }
}

function setTokenCookie(token: string): void {
  // Set cookie for middleware access (7 day expiry matching JWT)
  document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
}

function clearTokenCookie(): void {
  document.cookie = 'token=; path=/; max-age=0'
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(getStoredToken)
  const [user, setUser] = useState<User | null>(() =>
    getUserFromToken(getStoredToken()),
  )
  const router = useRouter()
  const queryClient = useQueryClient()

  const isAuthenticated = token !== null && user !== null

  // Sync state on mount (handles SSR → client hydration)
  useEffect(() => {
    const storedToken = getStoredToken()
    const currentUser = getUserFromToken(storedToken)
    setToken(storedToken)
    setUser(currentUser)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authApi.login(email, password)
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      setTokenCookie(response.token)
      setToken(response.token)
      setUser(response.user)
      queryClient.clear()
      router.push('/builds')
    },
    [queryClient, router],
  )

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    clearTokenCookie()
    setToken(null)
    setUser(null)
    queryClient.clear()
    router.push('/login')
  }, [queryClient, router])

  return { user, token, login, logout, isAuthenticated }
}
