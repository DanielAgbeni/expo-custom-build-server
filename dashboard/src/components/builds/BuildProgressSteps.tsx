'use client'

import React from 'react'
import {
  CheckCircle2,
  Circle,
  GitBranch,
  Download,
  Hammer,
  Loader2,
  XCircle,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BuildStatus } from '@/types'

interface Step {
  key: BuildStatus | 'done'
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const STEPS: Step[] = [
  { key: 'queued', label: 'Queued', icon: Clock },
  { key: 'cloning', label: 'Cloning', icon: GitBranch },
  { key: 'installing', label: 'Installing', icon: Download },
  { key: 'building', label: 'Building', icon: Hammer },
  { key: 'done', label: 'Complete', icon: CheckCircle2 },
]

const STATUS_ORDER: Record<string, number> = {
  queued: 0,
  cloning: 1,
  installing: 2,
  building: 3,
  success: 4,
  failed: 4,
}

interface BuildProgressStepsProps {
  status: BuildStatus
  className?: string
}

export default function BuildProgressSteps({
  status,
  className,
}: BuildProgressStepsProps) {
  const currentIndex = STATUS_ORDER[status] ?? 0
  const isFailed = status === 'failed'
  const isSuccess = status === 'success'
  const isTerminal = isFailed || isSuccess

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex
          const isActive = index === currentIndex && !isTerminal
          const isFailedStep = isFailed && index === currentIndex
          const isSuccessStep = isSuccess && step.key === 'done'
          const Icon = step.icon

          return (
            <React.Fragment key={step.key}>
              {/* Step circle + label */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-500',
                    isCompleted &&
                      'border-emerald-500 bg-emerald-500/20 text-emerald-400',
                    isActive &&
                      'border-amber-500 bg-amber-500/15 text-amber-400',
                    isFailedStep &&
                      'border-red-500 bg-red-500/15 text-red-400',
                    isSuccessStep &&
                      'border-emerald-500 bg-emerald-500/20 text-emerald-400',
                    !isCompleted &&
                      !isActive &&
                      !isFailedStep &&
                      !isSuccessStep &&
                      'border-zinc-700 bg-zinc-800/50 text-zinc-500',
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isFailedStep ? (
                    <XCircle className="h-4 w-4" />
                  ) : isSuccessStep ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}

                  {/* Pulse ring for active step */}
                  {isActive && (
                    <span className="absolute inset-0 animate-ping rounded-full border-2 border-amber-500/40" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-[11px] font-medium transition-colors',
                    isCompleted && 'text-emerald-400',
                    isActive && 'text-amber-400',
                    isFailedStep && 'text-red-400',
                    isSuccessStep && 'text-emerald-400',
                    !isCompleted &&
                      !isActive &&
                      !isFailedStep &&
                      !isSuccessStep &&
                      'text-zinc-500',
                  )}
                >
                  {isFailedStep ? 'Failed' : step.label}
                </span>
              </div>

              {/* Connector line between steps */}
              {index < STEPS.length - 1 && (
                <div className="mb-5 flex-1 px-2">
                  <div
                    className={cn(
                      'h-0.5 w-full rounded-full transition-all duration-500',
                      index < currentIndex
                        ? 'bg-emerald-500/60'
                        : 'bg-zinc-700',
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
