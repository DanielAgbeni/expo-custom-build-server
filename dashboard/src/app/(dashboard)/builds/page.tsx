'use client'

import { useMemo } from 'react'
import { Hammer, CheckCircle2, XCircle, Clock, PackageOpen } from 'lucide-react'
import { useBuilds } from '@/hooks/useBuilds'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Topbar from '@/components/layout/Topbar'
import BuildCard from '@/components/builds/BuildCard'
import NewBuildDialog from '@/components/builds/NewBuildDialog'
import type { BuildStatus } from '@/types'

const TERMINAL_STATUSES: BuildStatus[] = ['success', 'failed']

export default function BuildsPage() {
  const { data: builds, isLoading, error } = useBuilds()

  const stats = useMemo(() => {
    if (!builds) return { total: 0, running: 0, succeeded: 0, failed: 0 }
    return {
      total: builds.length,
      running: builds.filter((b) => !TERMINAL_STATUSES.includes(b.status))
        .length,
      succeeded: builds.filter((b) => b.status === 'success').length,
      failed: builds.filter((b) => b.status === 'failed').length,
    }
  }, [builds])

  if (error) {
    return (
      <>
        <Topbar title="Builds" />
        <div className="p-6">
          <Alert variant="destructive">
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : 'Failed to load builds'}
            </AlertDescription>
          </Alert>
        </div>
      </>
    )
  }

  return (
    <>
      <Topbar title="Builds">
        <NewBuildDialog />
      </Topbar>

      <div className="space-y-6 p-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatsCard
            label="Total Builds"
            value={stats.total}
            icon={<Hammer className="h-4 w-4 text-primary" />}
            isLoading={isLoading}
          />
          <StatsCard
            label="Running"
            value={stats.running}
            icon={<Clock className="h-4 w-4 text-amber-500" />}
            isLoading={isLoading}
          />
          <StatsCard
            label="Succeeded"
            value={stats.succeeded}
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            isLoading={isLoading}
          />
          <StatsCard
            label="Failed"
            value={stats.failed}
            icon={<XCircle className="h-4 w-4 text-red-500" />}
            isLoading={isLoading}
          />
        </div>

        {/* Build cards grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        ) : builds && builds.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {builds.map((build) => (
              <BuildCard key={build._id} build={build} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
            <PackageOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-medium text-foreground">
              No builds yet
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Trigger your first build to get started.
            </p>
            <div className="mt-6">
              <NewBuildDialog />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function StatsCard({
  label,
  value,
  icon,
  isLoading,
}: {
  label: string
  value: number
  icon: React.ReactNode
  isLoading: boolean
}) {
  return (
    <Card className="border border-border">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          {icon}
        </div>
        <div>
          {isLoading ? (
            <Skeleton className="h-7 w-10" />
          ) : (
            <p className="text-2xl font-semibold text-foreground">{value}</p>
          )}
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
