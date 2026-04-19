'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { buildsApi, adminApi } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { BuildStatus } from '@/types'

const TERMINAL_STATUSES: BuildStatus[] = ['success', 'failed']

export function useBuilds() {
  const query = useQuery({
    queryKey: queryKeys.builds.all,
    queryFn: buildsApi.getAll,
    refetchInterval: (query) => {
      const builds = query.state.data
      if (!builds) return false
      const hasActive = builds.some(
        (b) => !TERMINAL_STATUSES.includes(b.status),
      )
      return hasActive ? 10_000 : false
    },
  })
  return query
}

export function useBuild(id: string) {
  const query = useQuery({
    queryKey: queryKeys.builds.one(id),
    queryFn: () => buildsApi.getOne(id),
    refetchInterval: (query) => {
      const build = query.state.data
      if (!build) return false
      return TERMINAL_STATUSES.includes(build.status) ? false : 3_000
    },
  })
  return query
}

export function useTriggerBuild() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ repoUrl, branch }: { repoUrl: string; branch: string }) =>
      buildsApi.trigger(repoUrl, branch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.builds.all })
      toast.success('Build queued successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to trigger build')
    },
  })
}

export function useUploadBuild() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => buildsApi.uploadZip(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.builds.all })
      toast.success('ZIP uploaded — build queued')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload ZIP')
    },
  })
}

export function useDeleteBuild() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteBuild(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.builds })
      queryClient.invalidateQueries({ queryKey: queryKeys.builds.all })
      toast.success('Build deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete build')
    },
  })
}

export function useDeleteOwnBuild() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => buildsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.builds.all })
      toast.success('Build deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete build')
    },
  })
}
