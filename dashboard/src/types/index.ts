export type BuildStatus =
  | 'queued'
  | 'cloning'
  | 'extracting'
  | 'installing'
  | 'building'
  | 'success'
  | 'failed'

export type SourceType = 'repo' | 'upload'

export interface Build {
  _id: string
  userId: string
  repoUrl: string
  branch: string
  status: BuildStatus
  sourceType?: SourceType
  originalFilename?: string
  logs?: string
  apkUrl?: string
  apkSize?: number
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  email: string
  role: 'admin' | 'user'
}

export interface AuthResponse {
  token: string
  user: User
}

/** Admin builds include the populated userId with user email */
export interface AdminBuild extends Omit<Build, 'userId'> {
  userId: { _id: string; email: string }
}

/** Admin user list item — matches the Mongoose User document shape */
export interface AdminUser {
  _id: string
  email: string
  role: 'admin' | 'user'
  createdAt: string
  updatedAt: string
}

/** Real-time monitor data from SSE stream */
export interface MonitorData {
  cpu: {
    model: string
    cores: number
    usage: number
    loadAvg: [number, number, number]
  }
  memory: {
    total: number
    used: number
    free: number
    usagePercent: number
  }
  storage: {
    total: number
    used: number
    free: number
    usagePercent: number
  }
  system: {
    hostname: string
    platform: string
    arch: string
    uptime: number
    nodeVersion: string
    osRelease: string
  }
  builds: {
    buildsDir: string
    buildsDirSize: string
    activeBuildCount: number
    totalBuildCount: number
  }
  timestamp: number
}