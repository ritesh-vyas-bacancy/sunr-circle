'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { deactivateOffice } from '../actions/office.actions'
import type { Office } from '@/types'

interface DeactivateOfficeDialogProps {
  office: Office
  open: boolean
  onClose: () => void
}

export function DeactivateOfficeDialog({ office, open, onClose }: DeactivateOfficeDialogProps) {
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const result = await deactivateOffice(office.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(`"${office.name}" has been deactivated.`)
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen && !isPending) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Deactivate Office</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Are you sure you want to deactivate{' '}
            <span className="font-semibold text-foreground">{office.name}</span>{' '}
            ({office.code})? This office will no longer appear in active listings.
            <br />
            <br />
            <span className="text-xs">
              Note: You cannot deactivate an office that has active child offices.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending ? 'Deactivating...' : 'Deactivate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
