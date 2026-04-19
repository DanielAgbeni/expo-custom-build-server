'use client'

import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Sidebar from '@/components/layout/Sidebar'

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="ml-60 flex-1">
          <Suspense fallback={<DashboardSkeleton />}>{children}</Suspense>
        </main>
      </div>
    </ProtectedRoute>
  )
}
