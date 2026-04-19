'use client'

import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDeleteOwnBuild } from '@/hooks/useBuilds'
import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DeleteBuildButtonProps {
  buildId: string
  disabled?: boolean
  /** 'default' = full button with text, 'compact' = icon-only for cards */
  variant?: 'default' | 'compact'
  /** If true, navigate to /builds after deletion */
  redirectAfterDelete?: boolean
}

export default function DeleteBuildButton({
  buildId,
  disabled = false,
  variant = 'default',
  redirectAfterDelete = false,
}: DeleteBuildButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const deleteBuild = useDeleteOwnBuild()
  const router = useRouter()

  const handleOpenConfirm = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setShowConfirm(true)
    },
    [],
  )

  const handleDelete = useCallback(async () => {
    try {
      await deleteBuild.mutateAsync(buildId)
      setShowConfirm(false)
      if (redirectAfterDelete) {
        router.push('/builds')
      }
    } catch {
      // Error handled by the mutation hook
    }
  }, [buildId, deleteBuild, redirectAfterDelete, router])

  const trigger =
    variant === 'compact' ? (
      <Button
        id={`delete-build-compact-${buildId}`}
        onClick={handleOpenConfirm}
        disabled={disabled}
        size="sm"
        variant="outline"
        className={cn(
          'gap-1.5 border-red-500/30 bg-red-500/10 text-red-400',
          'hover:border-red-500/50 hover:bg-red-500/20 hover:text-red-300',
          'transition-all duration-200',
        )}
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">Delete</span>
      </Button>
    ) : (
      <Button
        id={`delete-build-${buildId}`}
        onClick={handleOpenConfirm}
        disabled={disabled}
        variant="outline"
        className={cn(
          'gap-2 border-red-500/30 bg-red-500/10 text-red-400',
          'hover:border-red-500/50 hover:bg-red-500/20 hover:text-red-300',
          'transition-all duration-200',
        )}
      >
        <Trash2 className="h-4 w-4" />
        Delete Build
      </Button>
    )

  return (
    <>
      {trigger}

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Delete this build?</DialogTitle>
            <DialogDescription>
              This will permanently delete the build record and its APK artifact.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteBuild.isPending}
            >
              {deleteBuild.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
