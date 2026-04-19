'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useDeleteBuild } from '@/hooks/useBuilds'
import { adminApi } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import Topbar from '@/components/layout/Topbar'
import BuildStatusBadge from '@/components/builds/BuildStatusBadge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AdminBuild } from '@/types'

export default function AdminPage() {
  const { user } = useAuth()
  const [deleteTarget, setDeleteTarget] = useState<AdminBuild | null>(null)
  const deleteBuild = useDeleteBuild()

  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: queryKeys.admin.users,
    queryFn: adminApi.getUsers,
    enabled: user?.role === 'admin',
  })

  const {
    data: builds,
    isLoading: buildsLoading,
    error: buildsError,
  } = useQuery({
    queryKey: queryKeys.admin.builds,
    queryFn: adminApi.getAllBuilds,
    enabled: user?.role === 'admin',
  })

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return
    await deleteBuild.mutateAsync(deleteTarget._id)
    setDeleteTarget(null)
  }, [deleteTarget, deleteBuild])

  if (user?.role !== 'admin') {
    return (
      <>
        <Topbar title="Admin" />
        <div className="p-6">
          <Alert variant="destructive">
            <AlertDescription>
              You do not have permission to view this page.
            </AlertDescription>
          </Alert>
        </div>
      </>
    )
  }

  return (
    <>
      <Topbar title="Admin Panel" />

      <div className="p-6">
        <Tabs defaultValue="users" className="w-full">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="builds">All Builds</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            {usersError ? (
              <Alert variant="destructive">
                <AlertDescription>Failed to load users</AlertDescription>
              </Alert>
            ) : usersLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded" />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((u) => (
                      <TableRow key={u._id}>
                        <TableCell className="font-medium">
                          {u.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              u.role === 'admin' ? 'default' : 'secondary'
                            }
                            className="capitalize"
                          >
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(u.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* All Builds Tab */}
          <TabsContent value="builds" className="mt-6">
            {buildsError ? (
              <Alert variant="destructive">
                <AlertDescription>Failed to load builds</AlertDescription>
              </Alert>
            ) : buildsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded" />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Repository</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-16" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {builds?.map((build) => (
                      <TableRow key={build._id}>
                        <TableCell className="text-sm">
                          {build.userId?.email ?? 'Unknown'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm font-medium">
                          {build.repoUrl
                            .replace(
                              /^https?:\/\/(github|gitlab)\.com\//,
                              '',
                            )
                            .replace(/\.git$/, '')}
                        </TableCell>
                        <TableCell>
                          <BuildStatusBadge status={build.status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(build.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTarget(build)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete build?</DialogTitle>
            <DialogDescription>
              This will permanently delete the build and its APK artifact. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteBuild.isPending}
            >
              {deleteBuild.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
