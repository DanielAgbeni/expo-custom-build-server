import axios from 'axios'
import type {
  AuthResponse,
  Build,
  AdminBuild,
  AdminUser,
  MonitorData,
} from '@/types'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

// ── Request interceptor: attach Bearer token ──────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// ── Response interceptor: handle 401 → clear token & redirect ─────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined'
    ) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      document.cookie = 'token=; path=/; max-age=0'
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

// ── Auth API ──────────────────────────────────────────────────────────
export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/api/auth/login', {
      email,
      password,
    })
    return data
  },

  async register(
    email: string,
    password: string,
  ): Promise<{ id: string; email: string }> {
    const { data } = await api.post<{ id: string; email: string }>(
      '/api/auth/register',
      { email, password },
    )
    return data
  },
}

// ── Builds API ────────────────────────────────────────────────────────
export const buildsApi = {
  async getAll(): Promise<Build[]> {
    const { data } = await api.get<Build[]>('/api/builds')
    return data
  },

  async getOne(id: string): Promise<Build> {
    const { data } = await api.get<Build>(`/api/builds/${id}`)
    return data
  },

  async trigger(
    repoUrl: string,
    branch: string,
  ): Promise<Build> {
    const { data } = await api.post<Build>('/api/builds', {
      repoUrl,
      branch,
    })
    return data
  },

  /** Opens the download URL in a new tab (requires auth token as query param) */
  download(id: string): void {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('token')
        : null
    const baseURL = process.env.NEXT_PUBLIC_API_URL ?? ''
    window.open(
      `${baseURL}/api/builds/${id}/download?token=${token ?? ''}`,
      '_blank',
    )
  },

  /** Upload a ZIP file to trigger a build */
  async uploadZip(file: File): Promise<Build> {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await api.post<Build>('/api/builds/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300_000, // 5 min for large uploads
    })
    return data
  },

  /** Retry a failed build — resets status and re-queues */
  async retry(id: string): Promise<Build> {
    const { data } = await api.post<Build>(`/api/builds/${id}/retry`)
    return data
  },

  /** Delete a build and its artifact */
  async delete(id: string): Promise<void> {
    await api.delete(`/api/builds/${id}`)
  },
}

// ── Admin API ─────────────────────────────────────────────────────────
export const adminApi = {
  async getUsers(): Promise<AdminUser[]> {
    const { data } = await api.get<AdminUser[]>('/api/admin/users')
    return data
  },

  async getAllBuilds(): Promise<AdminBuild[]> {
    const { data } = await api.get<AdminBuild[]>('/api/admin/builds')
    return data
  },

  async deleteBuild(id: string): Promise<void> {
    await api.delete(`/api/admin/builds/${id}`)
  },

  /** Returns the full SSE URL for the monitor stream (with auth token) */
  getMonitorStreamUrl(): string {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('token')
        : null
    const baseURL = process.env.NEXT_PUBLIC_API_URL ?? ''
    return `${baseURL}/api/admin/monitor/stream?token=${token ?? ''}`
  },
}

export default api