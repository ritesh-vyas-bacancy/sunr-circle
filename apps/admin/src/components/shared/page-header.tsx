import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface PageHeaderProps {
  title: string
  /** Alias for description — shown below the title in muted text */
  subtitle?: string
  description?: string
  backHref?: string
  backLabel?: string
  /** Slot rendered on the right side (action buttons, etc.) */
  actions?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  description,
  backHref,
  backLabel = 'Back',
  actions,
  children,
  className,
}: PageHeaderProps) {
  const subtext = subtitle ?? description
  return (
    <div className={cn('mb-6 pb-4 border-b border-gray-200', className)}>
      {backHref && (
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mb-4 -ml-2 h-8 px-2 text-muted-foreground hover:text-foreground"
        >
          <Link href={backHref}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtext && <p className="mt-1 text-sm text-muted-foreground">{subtext}</p>}
        </div>
        {(actions ?? children) && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
