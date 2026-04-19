'use client'

import { useState, useEffect, useRef } from 'react'
import { adminApi } from '@/lib/api'
import type { MonitorData } from '@/types'

/**
 * Real-time server monitor hook using Server-Sent Events.
 * Connects to the SSE stream and updates state on every push (every ~2s).
 */
export function useMonitor() {
  const [data, setData] = useState<MonitorData | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const url = adminApi.getMonitorStreamUrl()
    const es = new EventSource(url)
    eventSourceRef.current = es

    es.onopen = () => {
      setIsConnected(true)
      setError(null)
    }

    es.onmessage = (event) => {
      try {
        const parsed: MonitorData = JSON.parse(event.data)
        setData(parsed)
        setIsConnected(true)
        setError(null)
      } catch {
        // ignore malformed events
      }
    }

    es.onerror = () => {
      setIsConnected(false)
      setError('Connection lost — retrying…')
      // EventSource auto-reconnects by default
    }

    return () => {
      es.close()
      eventSourceRef.current = null
    }
  }, [])

  return { data, isConnected, error }
}
