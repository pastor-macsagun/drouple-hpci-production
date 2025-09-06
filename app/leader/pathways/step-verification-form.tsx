'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { verifyStepCompletion } from '@/app/admin/pathways/actions'
import { toast } from 'sonner'

interface StepVerificationFormProps {
  enrollmentId: string
  stepId: string
  stepName: string
  userName: string
}

export function StepVerificationForm({ 
  enrollmentId, 
  stepId, 
  stepName, 
  userName 
}: StepVerificationFormProps) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleVerify = async () => {
    if (!notes.trim()) {
      toast.error('Please add verification notes')
      return
    }

    setIsSubmitting(true)
    try {
      await verifyStepCompletion(enrollmentId, stepId, notes)
      toast.success(`Step verified for ${userName}`)
      setOpen(false)
      setNotes('')
      // The page will revalidate automatically due to server action
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to verify step')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Verify
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Verify Step Completion</DialogTitle>
          <DialogDescription>
            Confirm that <strong>{userName}</strong> has completed the step: <strong>"{stepName}"</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Verification Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about how this step was completed (e.g., 'Completed baptism class and demonstrated understanding', 'Attended water baptism service on 01/15/2025')..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              required
            />
            <p className="text-sm text-ink-muted">
              Your notes will be saved as verification and visible to admins and the member.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleVerify}
            disabled={isSubmitting || !notes.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Verify Completion
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}