'use client'

import { useState, useEffect, useRef } from 'react'
import type { BuildStatus } from '@/types'

const TERMINAL_STATUSES: BuildStatus[] = ['success', 'failed']

interface UseBuildLogsOptions {
  buildId: string
  status: BuildStatus
}

interface SseLogData {
  logs?: string
  done?: boolean
  status?: BuildStatus
}

export function useBuildLogs({ buildId, status }: UseBuildLogsOptions) {
  const [logs, setLogs] = useState<string>('')
  const [isStreaming, setIsStreaming] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    // Don't connect if build is already terminal
    if (TERMINAL_STATUSES.includes(status)) {
      setIsStreaming(false)
      return
    }

    const token = localStorage.getItem('token')
    if (!token) return

    const baseURL = process.env.NEXT_PUBLIC_API_URL ?? ''
    const url = `${baseURL}/api/builds/${buildId}/logs?token=${token}`

    const es = new EventSource(url)
    eventSourceRef.current = es
    setIsStreaming(true)

    es.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string) as SseLogData
        if (data.logs) {
          setLogs((prev) => prev + data.logs)
        }
        if (data.done) {
          setIsStreaming(false)
          es.close()
        }
      } catch {
        // Ignore malformed SSE data
      }
    }

    es.onerror = () => {
      setIsStreaming(false)
      es.close()
    }

    return () => {
      es.close()
      eventSourceRef.current = null
    }
  }, [buildId, status])

  return { logs, isStreaming }
}
