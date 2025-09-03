'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Send } from 'lucide-react'
import { sendMessage } from '../actions'
import { toast } from 'sonner'

type User = {
  id: string
  name: string | null
  email: string
}

interface MessageFormProps {
  users: User[]
  defaultRecipientId?: string
}

export function MessageForm({ users, defaultRecipientId }: MessageFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await sendMessage(formData)
      
      if (result.success) {
        toast.success('Message sent successfully!')
        router.push(`/messages/${result.messageId}?sent=true`)
      } else {
        toast.error(result.error || 'Failed to send message')
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="recipientId">To</Label>
        <Select name="recipientId" defaultValue={defaultRecipientId || ''} required>
          <SelectTrigger>
            <SelectValue placeholder="Select recipient" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name || user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="subject">Subject (Optional)</Label>
        <Input
          id="subject"
          name="subject"
          placeholder="Enter subject"
          maxLength={200}
        />
      </div>

      <div>
        <Label htmlFor="content">Message</Label>
        <Textarea
          id="content"
          name="content"
          required
          rows={8}
          placeholder="Type your message here..."
          className="resize-none"
          maxLength={5000}
        />
      </div>

      <div className="flex justify-end space-x-3">
        <Button 
          variant="outline" 
          type="button"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          <Send className="h-4 w-4 mr-2" />
          {isPending ? 'Sending...' : 'Send Message'}
        </Button>
      </div>
    </form>
  )
}