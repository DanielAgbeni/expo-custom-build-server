'use client'

import { RotateCcw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buildsApi } from '@/lib/api'
import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

interface RetryButtonProps {
  buildId: string
  disabled?: boolean
  /** 'default' = full button with text, 'compact' = small for cards */
  variant?: 'default' | 'compact'
}

export default function RetryButton({
  buildId,
  disabled = false,
  variant = 'default',
}: RetryButtonProps) {
  const queryClient = useQueryClient()
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation() // Prevent card click navigation
      setIsRetrying(true)
      try {
        await buildsApi.retry(buildId)
        // Invalidate caches so the UI refreshes with the new status
        queryClient.invalidateQueries({ queryKey: ['builds'] })
        queryClient.invalidateQueries({ queryKey: ['build', buildId] })
      } catch (err) {
        console.error('Retry failed:', err)
      } finally {
        setIsRetrying(false)
      }
    },
    [buildId, queryClient],
  )

  const Icon = isRetrying ? Loader2 : RotateCcw

  if (variant === 'compact') {
    return (
      <Button
        id={`retry-build-compact-${buildId}`}
        onClick={handleRetry}
        disabled={disabled || isRetrying}
        size="sm"
        variant="outline"
        className={cn(
          'gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-400',
          'hover:border-amber-500/50 hover:bg-amber-500/20 hover:text-amber-300',
          'transition-all duration-200',
        )}
      >
        <Icon className={cn('h-3.5 w-3.5', isRetrying && 'animate-spin')} />
        <span className="text-xs font-medium">Retry</span>
      </Button>
    )
  }

  return (
    <Button
      id={`retry-build-${buildId}`}
      onClick={handleRetry}
      disabled={disabled || isRetrying}
      className={cn(
        'gap-2 bg-amber-600 text-white',
        'hover:bg-amber-500',
        'shadow-lg shadow-amber-600/20',
        'transition-all duration-200',
      )}
    >
      <Icon className={cn('h-4 w-4', isRetrying && 'animate-spin')} />
      {isRetrying ? 'Retrying…' : 'Retry Build'}
    </Button>
  )
}
