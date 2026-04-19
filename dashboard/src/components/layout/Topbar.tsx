'use client'

interface TopbarProps {
  title: string
  children?: React.ReactNode
}

export default function Topbar({ title, children }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </header>
  )
}
