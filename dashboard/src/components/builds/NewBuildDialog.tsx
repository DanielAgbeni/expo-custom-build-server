'use client'

import { useState, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus, GitBranch, Upload, FileArchive, X } from 'lucide-react'
import { useTriggerBuild, useUploadBuild } from '@/hooks/useBuilds'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const newBuildSchema = z.object({
  repoUrl: z
    .string()
    .url('Must be a valid URL')
    .refine(
      (url) =>
        url.startsWith('https://github.com') ||
        url.startsWith('https://gitlab.com'),
      'Repository must be on GitHub or GitLab',
    ),
  branch: z.string().min(1, 'Branch is required'),
})

type NewBuildValues = z.infer<typeof newBuildSchema>
type Tab = 'repo' | 'upload'

function humanFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

export default function NewBuildDialog() {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('repo')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const triggerBuild = useTriggerBuild()
  const uploadBuild = useUploadBuild()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewBuildValues>({
    resolver: zodResolver(newBuildSchema),
    defaultValues: {
      repoUrl: '',
      branch: 'main',
    },
  })

  const onSubmitRepo = useCallback(
    async (values: NewBuildValues) => {
      await triggerBuild.mutateAsync({
        repoUrl: values.repoUrl,
        branch: values.branch,
      })
      setOpen(false)
      reset()
    },
    [triggerBuild, reset],
  )

  const onSubmitUpload = useCallback(async () => {
    if (!selectedFile) return
    await uploadBuild.mutateAsync(selectedFile)
    setOpen(false)
    setSelectedFile(null)
  }, [uploadBuild, selectedFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.zip') || file.type === 'application/zip')) {
      setSelectedFile(file)
    }
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) setSelectedFile(file)
    },
    [],
  )

  const handleOpenChange = (val: boolean) => {
    setOpen(val)
    if (!val) {
      setSelectedFile(null)
      setActiveTab('repo')
      reset()
    }
  }

  const isLoading = triggerBuild.isPending || uploadBuild.isPending

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button id="new-build-trigger" className="gap-2" />}
      >
        <Plus className="h-4 w-4" />
        New build
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Trigger a new build</DialogTitle>
          <DialogDescription>
            Clone from a Git repository or upload a ZIP file with your React
            Native source code.
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex rounded-lg border border-border bg-muted/30 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('repo')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
              activeTab === 'repo'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <GitBranch className="h-4 w-4" />
            Git Repository
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
              activeTab === 'upload'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Upload className="h-4 w-4" />
            Upload ZIP
          </button>
        </div>

        {/* Git Repository Tab */}
        {activeTab === 'repo' && (
          <form onSubmit={handleSubmit(onSubmitRepo)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="new-build-repo">Repository URL</Label>
              <Input
                id="new-build-repo"
                placeholder="https://github.com/user/repo"
                {...register('repoUrl')}
              />
              {errors.repoUrl && (
                <p className="text-sm text-destructive">
                  {errors.repoUrl.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-build-branch">Branch</Label>
              <Input
                id="new-build-branch"
                placeholder="main"
                {...register('branch')}
              />
              {errors.branch && (
                <p className="text-sm text-destructive">
                  {errors.branch.message}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                id="new-build-submit"
                type="submit"
                disabled={isLoading}
              >
                {triggerBuild.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {triggerBuild.isPending ? 'Queuing…' : 'Start build'}
              </Button>
            </div>
          </form>
        )}

        {/* Upload ZIP Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-4 pt-2">
            {/* Drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-all ${
                dragOver
                  ? 'border-primary bg-primary/5'
                  : selectedFile
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={handleFileChange}
              />

              {selectedFile ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                    <FileArchive className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {humanFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFile(null)
                    }}
                    className="ml-2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="mb-3 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-foreground">
                    Drop your .zip file here
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    or click to browse · Max 500 MB
                  </p>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                id="new-build-upload-submit"
                disabled={!selectedFile || isLoading}
                onClick={onSubmitUpload}
              >
                {uploadBuild.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {uploadBuild.isPending ? 'Uploading…' : 'Upload & Build'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
