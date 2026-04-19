'use client'

import React, { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { GitBranch, ExternalLink, FileArchive } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import BuildStatusBadge from '@/components/builds/BuildStatusBadge'
import BuildTimer from '@/components/builds/BuildTimer'
import DownloadButton from '@/components/builds/DownloadButton'
import RetryButton from '@/components/builds/RetryButton'
import DeleteBuildButton from '@/components/builds/DeleteBuildButton'
import type { Build } from '@/types'

interface BuildCardProps {
  build: Build
}

const BuildCard = React.memo(function BuildCard({ build }: BuildCardProps) {
  const router = useRouter()

  const handleClick = useCallback(() => {
    router.push(`/builds/${build._id}`)
  }, [router, build._id])

  const isUpload = build.sourceType === 'upload'

  /** Extract org/repo from a full git URL for display, or show filename */
  const displayName = isUpload
    ? build.originalFilename ?? 'Uploaded ZIP'
    : build.repoUrl
        .replace(/^https?:\/\/(github|gitlab)\.com\//, '')
        .replace(/\.git$/, '')

  const isActive = !['success', 'failed'].includes(build.status)

  return (
    <Card
      id={`build-card-${build._id}`}
      className={cn(
        'group cursor-pointer border border-border transition-all hover:border-primary/30 hover:shadow-md',
        isActive && 'border-amber-500/20 shadow-amber-500/5',
      )}
      onClick={handleClick}
    >
      <CardContent className="flex flex-col gap-3 p-5">
        {/* Top row: repo + status */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {isUpload ? (
                <FileArchive className="h-3.5 w-3.5 shrink-0 text-violet-500" />
              ) : (
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                {displayName}
              </p>
            </div>
          </div>
          <BuildStatusBadge status={build.status} />
        </div>

        {/* Branch + time + timer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {!isUpload && (
              <div className="flex items-center gap-1">
                <GitBranch className="h-3 w-3" />
                <span>{build.branch}</span>
              </div>
            )}
            <BuildTimer
              status={build.status}
              startedAt={build.startedAt}
              completedAt={build.completedAt}
              createdAt={build.createdAt}
              updatedAt={build.updatedAt}
              variant="inline"
            />
          </div>
          <time dateTime={build.createdAt}>
            {formatDistanceToNow(new Date(build.createdAt), {
              addSuffix: true,
            })}
          </time>
        </div>

        {/* Action buttons — download/delete for success, retry/delete for failed */}
        {(build.status === 'success' || build.status === 'failed') && (
          <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
            {build.status === 'success' && (
              <DownloadButton
                buildId={build._id}
                apkSize={build.apkSize}
                variant="compact"
              />
            )}
            {build.status === 'failed' && (
              <RetryButton buildId={build._id} variant="compact" />
            )}
            <DeleteBuildButton buildId={build._id} variant="compact" />
          </div>
        )}
      </CardContent>
    </Card>
  )
})

export default BuildCard
