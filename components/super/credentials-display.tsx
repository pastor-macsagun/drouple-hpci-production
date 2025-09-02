'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Copy, Eye, EyeOff, CheckCircle } from 'lucide-react'

interface CredentialsDisplayProps {
  credentials: {
    email: string
    password: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CredentialsDisplay({ credentials, open, onOpenChange }: CredentialsDisplayProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState<'email' | 'password' | 'both' | null>(null)
  const { toast } = useToast()

  const copyToClipboard = async (text: string, type: 'email' | 'password' | 'both') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
      
      toast({
        title: 'Copied to clipboard',
        description: `${type === 'both' ? 'Credentials' : type.charAt(0).toUpperCase() + type.slice(1)} copied successfully`,
      })
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy to clipboard. Please copy manually.',
        variant: 'destructive',
      })
    }
  }

  const copyBothCredentials = () => {
    const credentialsText = `Login Credentials for ${credentials.email}:
Email: ${credentials.email}
Password: ${credentials.password}

Note: The user must change this password on their first login.`
    copyToClipboard(credentialsText, 'both')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-green-600 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Admin Account Created Successfully
          </DialogTitle>
          <DialogDescription>
            Save these credentials securely. The user must change their password on first login. These credentials will not be shown again.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
            <p className="text-sm text-warning-foreground font-medium mb-2">
              🔑 Save these credentials securely
            </p>
            <p className="text-xs text-warning-foreground/80">
              The user must change their password on first login. These credentials will not be shown again.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="generated-email">Email</Label>
              <div className="flex gap-2">
                <Input
                  id="generated-email"
                  value={credentials.email}
                  readOnly
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(credentials.email, 'email')}
                  className="px-3"
                  aria-label="Copy email"
                >
                  {copied === 'email' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="generated-password">Temporary Password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="generated-password"
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    readOnly
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(credentials.password, 'password')}
                  className="px-3"
                  aria-label="Copy password"
                >
                  {copied === 'password' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={copyBothCredentials}
              className="flex-1"
            >
              {copied === 'both' ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Both
                </>
              )}
            </Button>
            <Button onClick={() => onOpenChange(false)} className="flex-1">
              Done
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Make sure to save these credentials before closing this dialog.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}