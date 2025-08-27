'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Shield, CheckCircle, AlertCircle, QrCode } from 'lucide-react'
import { setup2FA, enable2FA, disable2FA, get2FAStatus } from './actions'
import { toast } from 'sonner'

export default function TwoFactorAuthPage() {
  const [status, setStatus] = useState<{
    enabled: boolean
    required: boolean
    serverEnabled: boolean
  } | null>(null)
  const [setupData, setSetupData] = useState<{
    secret: string
    qrCodeDataURL: string
    isRequired: boolean
  } | null>(null)
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    const result = await get2FAStatus()
    if (result.success && result.data) {
      setStatus(result.data)
    }
  }

  const handleSetup = async () => {
    setLoading(true)
    setError('')
    
    try {
      const result = await setup2FA()
      if (result.success && result.data) {
        setSetupData(result.data)
        toast.success('2FA setup initiated. Scan the QR code with your authenticator app.')
      } else {
        setError(result.error || 'Failed to setup 2FA')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEnable = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) {
      setError('Please enter the verification code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await enable2FA(token)
      if (result.success) {
        toast.success(result.message)
        setSetupData(null)
        setToken('')
        await loadStatus()
      } else {
        setError(result.error || 'Failed to enable 2FA')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) {
      setError('Please enter the verification code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await disable2FA(token)
      if (result.success) {
        toast.success(result.message)
        setToken('')
        await loadStatus()
      } else {
        setError(result.error || 'Failed to disable 2FA')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!status) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Loading 2FA status...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!status.serverEnabled) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Additional security for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Two-factor authentication is not enabled on this server.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Additional security for your account using TOTP codes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Status</p>
              <p className="text-sm text-muted-foreground">
                {status.enabled ? 'Two-factor authentication is active' : 'Two-factor authentication is disabled'}
              </p>
            </div>
            <div className="flex gap-2">
              {status.enabled ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Enabled
                </Badge>
              ) : (
                <Badge variant="secondary">
                  Disabled
                </Badge>
              )}
              {status.required && (
                <Badge variant="destructive">
                  Required
                </Badge>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!status.enabled && (
            <div className="space-y-4">
              {!setupData ? (
                <Button 
                  onClick={handleSetup} 
                  disabled={loading}
                  className="w-full"
                >
                  Setup Two-Factor Authentication
                </Button>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <QrCode className="h-4 w-4" />
                    <AlertDescription>
                      Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <Image 
                      src={setupData.qrCodeDataURL} 
                      alt="2FA QR Code" 
                      width={192}
                      height={192}
                      className="max-w-48 h-auto"
                      unoptimized={true}
                    />
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Or enter this secret manually:
                    </p>
                    <code className="bg-muted px-2 py-1 rounded text-sm break-all">
                      {setupData.secret}
                    </code>
                  </div>

                  <form onSubmit={handleEnable} className="space-y-4">
                    <div>
                      <Label htmlFor="token">Verification Code</Label>
                      <Input
                        id="token"
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        maxLength={6}
                        pattern="\d{6}"
                        required
                      />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full">
                      {loading ? 'Verifying...' : 'Enable 2FA'}
                    </Button>
                  </form>
                </div>
              )}
            </div>
          )}

          {status.enabled && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Two-factor authentication is protecting your account.
                  {status.required && ' This security measure is required for your role.'}
                </AlertDescription>
              </Alert>

              {!status.required && (
                <form onSubmit={handleDisable} className="space-y-4">
                  <div>
                    <Label htmlFor="disable-token">Enter current verification code to disable</Label>
                    <Input
                      id="disable-token"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      maxLength={6}
                      pattern="\d{6}"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    variant="destructive" 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? 'Disabling...' : 'Disable 2FA'}
                  </Button>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}