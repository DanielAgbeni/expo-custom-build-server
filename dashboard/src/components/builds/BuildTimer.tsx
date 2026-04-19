'use client'

import { useState, useEffect } from 'react'
import { Timer, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BuildStatus } from '@/types'

interface BuildTimerProps {
  status: BuildStatus
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
  className?: string
  /** 'inline' for card usage, 'badge' for standalone */
  variant?: 'inline' | 'badge'
}

function formatDuration(ms: number): string {
  if (ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

export default function BuildTimer({
  status,
  startedAt,
  completedAt,
  createdAt,
  updatedAt,
  className,
  variant = 'inline',
}: BuildTimerProps) {
  const [now, setNow] = useState(Date.now())
  const isActive = !['success', 'failed'].includes(status)

  // Live tick for active builds
  useEffect(() => {
    if (!isActive) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [isActive])

  // Calculate elapsed time
  const start = startedAt
    ? new Date(startedAt).getTime()
    : new Date(createdAt).getTime()

  const end = isActive
    ? now
    : completedAt
      ? new Date(completedAt).getTime()
      : new Date(updatedAt).getTime()

  const elapsed = end - start
  const label = formatDuration(elapsed)

  if (variant === 'badge') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
          isActive
            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            : status === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20',
          className,
        )}
      >
        {isActive ? (
          <Timer className="h-3 w-3 animate-pulse" />
        ) : (
          <Clock className="h-3 w-3" />
        )}
        <span className={cn(isActive && 'tabular-nums')}>{label}</span>
      </div>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs',
        isActive
          ? 'text-amber-400'
          : 'text-muted-foreground',
        className,
      )}
    >
      {isActive ? (
        <Timer className="h-3 w-3 animate-pulse" />
      ) : (
        <Clock className="h-3 w-3" />
      )}
      <span className={cn(isActive && 'tabular-nums font-medium')}>
        {label}
      </span>
    </span>
  )
}
