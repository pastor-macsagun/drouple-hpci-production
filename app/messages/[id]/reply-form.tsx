'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Reply } from 'lucide-react'
import { replyToMessage } from '../actions'
import { toast } from 'sonner'

interface ReplyFormProps {
  messageId: string
}

export function ReplyForm({ messageId }: ReplyFormProps) {
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await replyToMessage(messageId, formData)
      
      if (result.success) {
        toast.success('Reply sent successfully!')
        // Form will be reset and page will update via revalidation
        const form = document.querySelector('form[data-reply-form]') as HTMLFormElement
        form?.reset()
      } else {
        toast.error(result.error || 'Failed to send reply')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Reply className="h-4 w-4 mr-2" />
          Reply
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} data-reply-form className="space-y-4">
          <div>
            <Label htmlFor="content">Your Reply</Label>
            <Textarea
              id="content"
              name="content"
              required
              rows={4}
              placeholder="Type your reply here..."
              className="resize-none"
              maxLength={5000}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              <Reply className="h-4 w-4 mr-2" />
              {isPending ? 'Sending...' : 'Send Reply'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}