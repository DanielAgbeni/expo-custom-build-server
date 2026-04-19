'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  ArrowLeft,
  GitBranch,
  Clock,
  ExternalLink,
  Package,
  Copy,
  Check,
} from 'lucide-react'
import { useBuild } from '@/hooks/useBuilds'
import { useBuildLogs } from '@/hooks/useBuildLogs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Topbar from '@/components/layout/Topbar'
import BuildStatusBadge from '@/components/builds/BuildStatusBadge'
import BuildProgressSteps from '@/components/builds/BuildProgressSteps'
import BuildTimer from '@/components/builds/BuildTimer'
import BuildLogViewer from '@/components/builds/BuildLogViewer'
import DownloadButton from '@/components/builds/DownloadButton'
import RetryButton from '@/components/builds/RetryButton'
import DeleteBuildButton from '@/components/builds/DeleteBuildButton'

/** Format bytes into a human-readable string */
function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return 'Unknown size'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

interface BuildDetailPageProps {
  params: Promise<{ id: string }>
}

export default function BuildDetailPage({ params }: BuildDetailPageProps) {
  const { id } = use(params)
  const { data: build, isLoading, error } = useBuild(id)
  const { logs, isStreaming } = useBuildLogs({
    buildId: id,
    status: build?.status ?? 'queued',
  })
  const [copied, setCopied] = useState(false)

  if (error) {
    return (
      <>
        <Topbar title="Build Details" />
        <div className="p-6">
          <Alert variant="destructive">
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : 'Failed to load build'}
            </AlertDescription>
          </Alert>
        </div>
      </>
    )
  }

  if (isLoading || !build) {
    return (
      <>
        <Topbar title="Build Details" />
        <div className="space-y-6 p-6">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-80" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </>
    )
  }

  const repoDisplayName = build.repoUrl
    .replace(/^https?:\/\/(github|gitlab)\.com\//, '')
    .replace(/\.git$/, '')

  const isActive = !['success', 'failed'].includes(build.status)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? ''
  const baseUrl = apiUrl.startsWith('http')
    ? apiUrl
    : `${typeof window !== 'undefined' ? window.location.origin : ''}${apiUrl}`

  const downloadUrl = build.apkUrl
    ? `${baseUrl.replace(/\/$/, '')}${build.apkUrl.startsWith('/') ? '' : '/'}${build.apkUrl}`
    : null

  const handleCopyLink = () => {
    if (downloadUrl) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      navigator.clipboard.writeText(`${downloadUrl}?token=${token ?? ''}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <>
      <Topbar title="Build Details">
        <div className="flex items-center gap-2">
          {build.status === 'success' && <DownloadButton buildId={build._id} apkSize={build.apkSize} />}
          {build.status === 'failed' && <RetryButton buildId={build._id} />}
          {(build.status === 'success' || build.status === 'failed') && (
            <DeleteBuildButton buildId={build._id} redirectAfterDelete />
          )}
        </div>
      </Topbar>

      <div className="space-y-6 p-6">
        {/* Back link */}
        <Link
          href="/builds"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to builds
        </Link>

        {/* Build info header */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-foreground">
                  {repoDisplayName}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <GitBranch className="h-3.5 w-3.5" />
                  {build.branch}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Created{' '}
                  {format(new Date(build.createdAt), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BuildTimer
                status={build.status}
                startedAt={build.startedAt}
                completedAt={build.completedAt}
                createdAt={build.createdAt}
                updatedAt={build.updatedAt}
                variant="badge"
              />
              <BuildStatusBadge status={build.status} />
            </div>
          </div>

          {build.updatedAt && build.updatedAt !== build.createdAt && (
            <p className="mt-3 text-xs text-muted-foreground">
              Last updated{' '}
              {format(new Date(build.updatedAt), 'MMM d, yyyy h:mm a')}
            </p>
          )}
        </div>

        {/* ── Build Progress Pipeline ── */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Build Pipeline
          </h3>
          <BuildProgressSteps status={build.status} />
        </div>

        {/* ── APK Artifact Section ───────────────────────────────── */}
        {build.status === 'success' && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
                  <Package className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Build Artifact
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-mono">app-release.apk</span>
                    {build.apkSize && (
                      <span className="ml-2 text-emerald-400">
                        ({formatFileSize(build.apkSize)})
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {downloadUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    onClick={handleCopyLink}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Button>
                )}
                <DownloadButton
                  buildId={build._id}
                  apkSize={build.apkSize}
                />
              </div>
            </div>

            {/* Download URL display */}
            {downloadUrl && (
              <div className="mt-3 rounded-md border border-emerald-500/20 bg-zinc-900/50 px-3 py-2">
                <p className="text-[11px] font-medium text-zinc-400 mb-1">
                  Download URL
                </p>
                <code className="block break-all text-xs text-emerald-400/80">
                  {downloadUrl}
                </code>
              </div>
            )}
          </div>
        )}

        {/* ── Failed Build Retry Section ───────────────────────────── */}
        {build.status === 'failed' && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
                  <Package className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Build Failed
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    The build encountered an error. You can retry to attempt a new build.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <RetryButton buildId={build._id} />
                <DeleteBuildButton buildId={build._id} redirectAfterDelete />
              </div>
            </div>
          </div>
        )}

        {/* Log viewer */}
        <BuildLogViewer
          logs={build.logs ? build.logs + logs : logs}
          isStreaming={isStreaming}
          status={build.status}
        />
      </div>
    </>
  )
}
