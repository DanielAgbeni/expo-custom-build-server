'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buildsApi } from '@/lib/api'
import { useCallback } from 'react'
import { cn } from '@/lib/utils'

/** Format bytes into a human-readable string */
function formatFileSize(bytes?: number): string | null {
  if (!bytes || bytes <= 0) return null
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

interface DownloadButtonProps {
  buildId: string
  apkSize?: number
  disabled?: boolean
  /** 'default' = full button with text, 'compact' = icon-only for cards */
  variant?: 'default' | 'compact'
}

export default function DownloadButton({
  buildId,
  apkSize,
  disabled = false,
  variant = 'default',
}: DownloadButtonProps) {
  const handleDownload = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation() // Prevent card click navigation
      buildsApi.download(buildId)
    },
    [buildId],
  )

  const sizeLabel = formatFileSize(apkSize)

  if (variant === 'compact') {
    return (
      <Button
        id={`download-apk-compact-${buildId}`}
        onClick={handleDownload}
        disabled={disabled}
        size="sm"
        variant="outline"
        className={cn(
          'gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
          'hover:border-emerald-500/50 hover:bg-emerald-500/20 hover:text-emerald-300',
          'transition-all duration-200',
        )}
      >
        <Download className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">APK</span>
        {sizeLabel && (
          <span className="text-[10px] opacity-70">({sizeLabel})</span>
        )}
      </Button>
    )
  }

  return (
    <Button
      id={`download-apk-${buildId}`}
      onClick={handleDownload}
      disabled={disabled}
      className={cn(
        'gap-2 bg-emerald-600 text-white',
        'hover:bg-emerald-500',
        'shadow-lg shadow-emerald-600/20',
        'transition-all duration-200',
      )}
    >
      <Download className="h-4 w-4" />
      Download APK
      {sizeLabel && (
        <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-normal">
          {sizeLabel}
        </span>
      )}
    </Button>
  )
}
