'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Terminal, CheckCircle2, XCircle } from 'lucide-react'
import type { BuildStatus } from '@/types'

interface BuildLogViewerProps {
  logs: string
  isStreaming: boolean
  status: BuildStatus
}

export default function BuildLogViewer({
  logs,
  isStreaming,
  status,
}: BuildLogViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [logs])

  const isTerminal = status === 'success' || status === 'failed'

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {/* Terminal header */}
      <div className="flex items-center gap-2 border-b border-zinc-700 bg-zinc-900 px-4 py-2.5">
        <Terminal className="h-4 w-4 text-zinc-400" />
        <span className="text-xs font-medium text-zinc-400">Build Logs</span>
        {isStreaming && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="inline-block h-1.5 w-1.5 animate-status-pulse rounded-full bg-emerald-400" />
            Live
          </span>
        )}
      </div>

      {/* Log content */}
      <div
        ref={scrollRef}
        className="build-log-viewer max-h-[500px] overflow-y-auto bg-zinc-950 p-4 text-sm leading-relaxed text-green-400"
      >
        {logs ? (
          <pre className="whitespace-pre-wrap break-words">{logs}</pre>
        ) : (
          <div className="flex items-center justify-center py-12 text-zinc-500">
            <span className="text-sm">Waiting for logs…</span>
          </div>
        )}
      </div>

      {/* Terminal status bar */}
      {isTerminal && (
        <div
          className={cn(
            'flex items-center gap-2 border-t px-4 py-2.5 text-xs font-medium',
            status === 'success'
              ? 'border-emerald-800 bg-emerald-950 text-emerald-400'
              : 'border-red-800 bg-red-950 text-red-400',
          )}
        >
          {status === 'success' ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Build completed successfully
            </>
          ) : (
            <>
              <XCircle className="h-3.5 w-3.5" />
              Build failed
            </>
          )}
        </div>
      )}
    </div>
  )
}
