'use client'

import { useTransition } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import type { AppUser } from '@/types'
import { deactivateUser } from '../actions/user.actions'

interface DeactivateUserDialogProps {
  user: AppUser
  open: boolean
  onClose: () => void
}

export function DeactivateUserDialog({ user, open, onClose }: DeactivateUserDialogProps) {
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const result = await deactivateUser(user.id)
      if (result.success) {
        toast.success(`${user.full_name} has been deactivated.`)
        onClose()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !isPending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Deactivate User</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            You are about to deactivate{' '}
            <span className="font-semibold text-foreground">{user.full_name}</span>.{' '}
            This will prevent the user from logging in. This action can be reversed by an
            administrator.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Deactivate User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
