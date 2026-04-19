'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { BuildStatus } from '@/types'

const STATUS_CONFIG: Record<
  BuildStatus,
  { label: string; dotClass: string; badgeClass: string; pulse: boolean }
> = {
  queued: {
    label: 'Queued',
    dotClass: 'bg-gray-400',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
    pulse: false,
  },
  cloning: {
    label: 'Cloning',
    dotClass: 'bg-blue-500',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    pulse: true,
  },
  extracting: {
    label: 'Extracting',
    dotClass: 'bg-violet-500',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
    pulse: true,
  },
  installing: {
    label: 'Installing',
    dotClass: 'bg-blue-500',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    pulse: true,
  },
  building: {
    label: 'Building',
    dotClass: 'bg-amber-500',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    pulse: true,
  },
  success: {
    label: 'Success',
    dotClass: 'bg-emerald-500',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pulse: false,
  },
  failed: {
    label: 'Failed',
    dotClass: 'bg-red-500',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    pulse: false,
  },
}

interface BuildStatusBadgeProps {
  status: BuildStatus
  className?: string
}

const BuildStatusBadge = React.memo(function BuildStatusBadge({
  status,
  className,
}: BuildStatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.badgeClass,
        className,
      )}
    >
      <span
        className={cn(
          'inline-block h-1.5 w-1.5 rounded-full',
          config.dotClass,
          config.pulse && 'animate-status-pulse',
        )}
      />
      {config.label}
    </Badge>
  )
})

export default BuildStatusBadge
