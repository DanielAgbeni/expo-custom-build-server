'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Skeleton } from '@/components/ui/skeleton'

export default function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode
  requireAdmin?: boolean
}) {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (requireAdmin && user?.role !== 'admin') {
      router.push('/builds')
    }
  }, [isAuthenticated, requireAdmin, user, router])

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 w-80">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    )
  }

  if (requireAdmin && user?.role !== 'admin') {
    return null
  }

  return <>{children}</>
}
