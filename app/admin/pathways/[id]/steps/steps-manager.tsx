'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createStep, updateStep, deleteStep } from '../../actions'
import { Trash2, Edit2, Save, X, Plus } from 'lucide-react'

interface Step {
  id: string
  name: string
  description: string | null
  orderIndex: number
}

interface StepsManagerProps {
  pathway: {
    id: string
    name: string
    steps: Step[]
  }
}

export default function StepsManager({ pathway }: StepsManagerProps) {
  const router = useRouter()
  const [steps, setSteps] = useState(pathway.steps)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '' })
  const [isAdding, setIsAdding] = useState(false)
  const [newStep, setNewStep] = useState({ name: '', description: '' })

  async function handleAdd() {
    if (!newStep.name.trim()) return

    await createStep({
      pathwayId: pathway.id,
      name: newStep.name,
      description: newStep.description || undefined,
      orderIndex: steps.length,
    })

    setNewStep({ name: '', description: '' })
    setIsAdding(false)
    router.refresh()
  }

  async function handleEdit(step: Step) {
    if (editingId === step.id) {
      await updateStep(step.id, {
        name: editForm.name,
        description: editForm.description || undefined,
      })
      setEditingId(null)
      router.refresh()
    } else {
      setEditingId(step.id)
      setEditForm({
        name: step.name,
        description: step.description || '',
      })
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this step?')) {
      await deleteStep(id)
      router.refresh()
    }
  }

  async function handleReorder(index: number, direction: 'up' | 'down') {
    const newSteps = [...steps]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex < 0 || targetIndex >= steps.length) return

    const temp = newSteps[index]
    newSteps[index] = newSteps[targetIndex]
    newSteps[targetIndex] = temp

    await Promise.all(
      newSteps.map((step, i) =>
        updateStep(step.id, { orderIndex: i })
      )
    )

    setSteps(newSteps)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-32">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {steps.map((step, index) => (
            <TableRow key={step.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                {editingId === step.id ? (
                  <Input
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                  />
                ) : (
                  <span className="font-medium">{step.name}</span>
                )}
              </TableCell>
              <TableCell>
                {editingId === step.id ? (
                  <Textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {step.description}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {editingId === step.id ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(step)}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(step)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(step.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={index === 0}
                        onClick={() => handleReorder(index, 'up')}
                      >
                        ↑
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={index === steps.length - 1}
                        onClick={() => handleReorder(index, 'down')}
                      >
                        ↓
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {isAdding && (
            <TableRow>
              <TableCell>{steps.length + 1}</TableCell>
              <TableCell>
                <Input
                  placeholder="Step name"
                  value={newStep.name}
                  onChange={(e) =>
                    setNewStep({ ...newStep, name: e.target.value })
                  }
                />
              </TableCell>
              <TableCell>
                <Textarea
                  placeholder="Step description"
                  value={newStep.description}
                  onChange={(e) =>
                    setNewStep({ ...newStep, description: e.target.value })
                  }
                />
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={handleAdd}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsAdding(false)
                      setNewStep({ name: '', description: '' })
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {!isAdding && (
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Step
        </Button>
      )}
    </div>
  )
}