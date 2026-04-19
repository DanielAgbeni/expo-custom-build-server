'use client'

import { useMemo } from 'react'
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Server,
  Activity,
  Hammer,
  Clock,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useMonitor } from '@/hooks/useMonitor'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Topbar from '@/components/layout/Topbar'

/* ───── Helpers ────────────────────────────────────────────────────── */

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const parts = []
  if (d > 0) parts.push(`${d}d`)
  if (h > 0) parts.push(`${h}h`)
  parts.push(`${m}m`)
  return parts.join(' ')
}

function getThresholdColor(percent: number) {
  if (percent >= 85) return { text: 'text-red-500', bg: 'bg-red-500', ring: 'stroke-red-500', gradient: 'from-red-500 to-rose-400' }
  if (percent >= 60) return { text: 'text-amber-500', bg: 'bg-amber-500', ring: 'stroke-amber-500', gradient: 'from-amber-500 to-orange-400' }
  return { text: 'text-emerald-500', bg: 'bg-emerald-500', ring: 'stroke-emerald-500', gradient: 'from-emerald-500 to-teal-400' }
}

/* ───── Circular Gauge ─────────────────────────────────────────────── */

function CircularGauge({
  value,
  label,
  sublabel,
  size = 140,
}: {
  value: number
  label: string
  sublabel?: string
  size?: number
}) {
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(value, 100) / 100) * circumference
  const color = getThresholdColor(value)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-muted/30"
            strokeWidth={strokeWidth}
          />
          {/* Value ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className={color.ring}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${color.text}`}>
            {value.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sublabel && (
          <p className="text-xs text-muted-foreground">{sublabel}</p>
        )}
      </div>
    </div>
  )
}

/* ───── Progress Bar ───────────────────────────────────────────────── */

function ProgressBar({
  value,
  label,
  detail,
}: {
  value: number
  label: string
  detail: string
}) {
  const color = getThresholdColor(value)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className={`font-semibold ${color.text}`}>{value.toFixed(1)}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted/40">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color.gradient}`}
          style={{
            width: `${Math.min(value, 100)}%`,
            transition: 'width 0.8s ease-out',
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}

/* ───── Info Row ───────────────────────────────────────────────────── */

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </div>
      <span className="text-sm font-medium text-foreground">{String(value)}</span>
    </div>
  )
}

/* ───── Load Average Bars ──────────────────────────────────────────── */

function LoadAvgBars({ loadAvg, cores }: { loadAvg: [number, number, number]; cores: number }) {
  const labels = ['1m', '5m', '15m']
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">Load Average</p>
      {loadAvg.map((val, i) => {
        const percent = Math.min((val / cores) * 100, 100)
        const color = getThresholdColor(percent)
        return (
          <div key={labels[i]} className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{labels[i]}</span>
              <span className={color.text}>{val.toFixed(2)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted/40">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${color.gradient}`}
                style={{ width: `${percent}%`, transition: 'width 0.8s ease-out' }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ───── Main Page ──────────────────────────────────────────────────── */

export default function MonitorPage() {
  const { data, isConnected, error } = useMonitor()

  return (
    <>
      <Topbar title="Server Monitor">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-emerald-600">Live</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1">
              <WifiOff className="h-3 w-3 text-red-500" />
              <span className="text-xs font-medium text-red-600">Disconnected</span>
            </div>
          )}
        </div>
      </Topbar>

      <div className="space-y-6 p-6">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
            <WifiOff className="h-4 w-4" />
            {error}
          </div>
        )}

        {!data ? (
          /* Loading skeleton */
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {/* ── Top gauges row ─────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {/* CPU */}
              <Card className="border border-border bg-gradient-to-br from-background to-muted/20">
                <CardContent className="flex flex-col items-center gap-4 p-6">
                  <div className="flex w-full items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                      <Cpu className="h-4 w-4 text-blue-500" />
                    </div>
                    CPU Usage
                  </div>
                  <CircularGauge
                    value={data.cpu.usage}
                    label={`${data.cpu.cores} Cores`}
                    sublabel={data.cpu.model.split(' ').slice(0, 3).join(' ')}
                  />
                </CardContent>
              </Card>

              {/* Memory */}
              <Card className="border border-border bg-gradient-to-br from-background to-muted/20">
                <CardContent className="flex flex-col items-center gap-4 p-6">
                  <div className="flex w-full items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                      <MemoryStick className="h-4 w-4 text-violet-500" />
                    </div>
                    Memory
                  </div>
                  <CircularGauge
                    value={data.memory.usagePercent}
                    label={`${formatBytes(data.memory.used)} / ${formatBytes(data.memory.total)}`}
                    sublabel={`${formatBytes(data.memory.free)} free`}
                  />
                </CardContent>
              </Card>

              {/* Storage */}
              <Card className="border border-border bg-gradient-to-br from-background to-muted/20">
                <CardContent className="flex flex-col gap-4 p-6">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                      <HardDrive className="h-4 w-4 text-amber-500" />
                    </div>
                    Storage
                  </div>
                  <ProgressBar
                    value={data.storage.usagePercent}
                    label="Disk Usage"
                    detail={`${formatBytes(data.storage.used)} of ${formatBytes(data.storage.total)} used · ${formatBytes(data.storage.free)} free`}
                  />
                  <div className="mt-2 rounded-lg bg-muted/30 px-3 py-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Builds directory</span>
                      <span className="font-medium text-foreground">{data.builds.buildsDirSize}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Builds Info */}
              <Card className="border border-border bg-gradient-to-br from-background to-muted/20">
                <CardContent className="flex flex-col gap-4 p-6">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                      <Hammer className="h-4 w-4 text-emerald-500" />
                    </div>
                    Builds
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-muted/30 px-4 py-3 text-center">
                      <p className="text-2xl font-bold text-foreground">
                        {data.builds.activeBuildCount}
                      </p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                    <div className="rounded-xl bg-muted/30 px-4 py-3 text-center">
                      <p className="text-2xl font-bold text-foreground">
                        {data.builds.totalBuildCount}
                      </p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/30 px-3 py-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Builds path</span>
                      <span className="font-mono text-foreground">{data.builds.buildsDir}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Bottom details row ────────────────────────────── */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* System Info */}
              <Card className="border border-border">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-500/10">
                      <Server className="h-4 w-4 text-slate-500" />
                    </div>
                    System Information
                  </div>
                  <div className="space-y-0">
                    <InfoRow label="Hostname" value={data.system.hostname} icon={Server} />
                    <InfoRow label="Platform" value={`${data.system.platform} (${data.system.arch})`} />
                    <InfoRow label="Kernel" value={data.system.osRelease} />
                    <InfoRow label="Node.js" value={data.system.nodeVersion} />
                    <InfoRow label="Uptime" value={formatUptime(data.system.uptime)} icon={Clock} />
                    <InfoRow label="CPU Model" value={data.cpu.model} icon={Cpu} />
                  </div>
                </CardContent>
              </Card>

              {/* Load Average */}
              <Card className="border border-border">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
                      <Activity className="h-4 w-4 text-indigo-500" />
                    </div>
                    CPU Load
                  </div>
                  <LoadAvgBars loadAvg={data.cpu.loadAvg as [number, number, number]} cores={data.cpu.cores} />
                  <div className="mt-6 rounded-lg bg-muted/30 px-4 py-3">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      Understanding Load Average
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Values above <strong>{data.cpu.cores}.0</strong> (your core count)
                      indicate the CPU is overloaded. Green = healthy, Amber = busy, Red = overloaded.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </>
  )
}
