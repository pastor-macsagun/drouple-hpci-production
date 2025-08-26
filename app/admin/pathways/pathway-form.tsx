'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { PathwayType } from '@prisma/client'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { createPathway, updatePathway } from './actions'

const pathwaySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.nativeEnum(PathwayType),
  isActive: z.boolean().default(true),
})

type PathwayFormData = z.infer<typeof pathwaySchema>

interface PathwayFormProps {
  tenantId: string
  pathway?: {
    id: string
    name: string
    description: string | null
    type: PathwayType
    isActive: boolean
  }
}

export default function PathwayForm({ tenantId, pathway }: PathwayFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PathwayFormData>({
    resolver: zodResolver(pathwaySchema),
    defaultValues: {
      name: pathway?.name || '',
      description: pathway?.description || '',
      type: pathway?.type || PathwayType.ROOTS,
      isActive: pathway?.isActive ?? true,
    },
  })

  async function onSubmit(data: PathwayFormData) {
    setIsSubmitting(true)
    try {
      if (pathway) {
        await updatePathway(pathway.id, data)
      } else {
        await createPathway({ ...data, tenantId })
      }
      router.push('/admin/pathways')
      router.refresh()
    } catch (error) {
      console.error('Failed to save pathway:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="ROOTS" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Foundation course for new believers"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pathway type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={PathwayType.ROOTS}>ROOTS</SelectItem>
                  <SelectItem value={PathwayType.VINES}>VINES</SelectItem>
                  <SelectItem value={PathwayType.RETREAT}>RETREAT</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                ROOTS: Auto-enrolled for new believers. VINES: Opt-in. RETREAT: Schedule/attendance tracking.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active</FormLabel>
                <FormDescription>
                  Allow new enrollments to this pathway
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : pathway ? 'Update' : 'Create'} Pathway
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/pathways')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}