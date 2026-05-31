'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserCheck, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { AssignComplaintDialog } from '@/features/complaints/components/assign-complaint-dialog'
import { UpdateStatusDialog } from '@/features/complaints/components/update-status-dialog'
import type { ComplaintDetail } from '@/features/complaints/queries/complaint.queries'

interface ComplaintActionsClientProps {
  complaint: ComplaintDetail
}

export function ComplaintActionsClient({ complaint }: ComplaintActionsClientProps) {
  const [assignOpen, setAssignOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const router = useRouter()

  const handleClose = () => {
    setAssignOpen(false)
    setStatusOpen(false)
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      {(complaint.status === 'open' || complaint.status === 'assigned') && (
        <Button variant="outline" size="sm" onClick={() => setAssignOpen(true)}>
          <UserCheck className="h-4 w-4 mr-1" /> Assign Line Man
        </Button>
      )}
      {complaint.status !== 'closed' && complaint.status !== 'rejected' && (
        <Button size="sm" onClick={() => setStatusOpen(true)}>
          <RefreshCw className="h-4 w-4 mr-1" /> Update Status
        </Button>
      )}
      <AssignComplaintDialog
        complaint={complaint as any}
        open={assignOpen}
        onClose={handleClose}
      />
      <UpdateStatusDialog
        complaint={complaint as any}
        open={statusOpen}
        onClose={handleClose}
      />
    </div>
  )
}
