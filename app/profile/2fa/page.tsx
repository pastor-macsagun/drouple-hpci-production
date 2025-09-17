'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { 
  NativeCard, 
  NativeCardContent, 
  NativeCardDescription, 
  NativeCardHeader, 
  NativeCardTitle,
  NativeButton,
  NativeInput
} from '@/components/ui/native'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Shield, CheckCircle, AlertCircle, QrCode } from 'lucide-react'
import { setup2FA, enable2FA, disable2FA, get2FAStatus } from './actions'
import { useMobileNotifications } from '@/components/mobile/notification-manager'

export default function TwoFactorAuthPage() {
  const { showSuccess } = useMobileNotifications()
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
        showSuccess('Setup Initiated', '2FA setup initiated. Scan the QR code with your authenticator app.')
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
        showSuccess('2FA Enabled', result.message || '2FA has been successfully enabled')
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
        showSuccess('2FA Disabled', result.message || '2FA has been successfully disabled')
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
      <AppLayout>
        <PageHeader 
          title="Two-Factor Authentication"
          description="Additional security for your account"
        />
        <div className="max-w-2xl mx-auto p-6">
          <NativeCard>
            <NativeCardContent className="py-8">
              <div className="text-center text-ink-muted flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
                Loading 2FA status...
              </div>
            </NativeCardContent>
          </NativeCard>
        </div>
      </AppLayout>
    )
  }

  if (!status.serverEnabled) {
    return (
      <AppLayout>
        <PageHeader 
          title="Two-Factor Authentication"
          description="Additional security for your account"
        />
        <div className="max-w-2xl mx-auto p-6">
          <NativeCard>
            <NativeCardHeader>
              <NativeCardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Two-Factor Authentication
              </NativeCardTitle>
              <NativeCardDescription>
                Additional security for your account
              </NativeCardDescription>
            </NativeCardHeader>
            <NativeCardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Two-factor authentication is not enabled on this server.
                </AlertDescription>
              </Alert>
            </NativeCardContent>
          </NativeCard>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PageHeader 
        title="Two-Factor Authentication"
        description="Additional security for your account using TOTP codes"
      />
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <NativeCard>
          <NativeCardHeader>
            <NativeCardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Two-Factor Authentication
            </NativeCardTitle>
            <NativeCardDescription>
              Additional security for your account using TOTP codes
            </NativeCardDescription>
          </NativeCardHeader>
        <NativeCardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Status</p>
              <p className="text-sm text-ink-muted">
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
                <NativeButton 
                  onClick={handleSetup} 
                  disabled={loading}
                  loading={loading}
                  className="w-full"
                  
                  hapticFeedback
                >
                  Setup Two-Factor Authentication
                </NativeButton>
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
                      <NativeInput
                        label="Verification Code"
                        id="token"
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        maxLength={6}
                        pattern="\d{6}"
                        required
                        disabled={loading}
                      />
                    </div>
                    <NativeButton 
                      type="submit" 
                      disabled={loading} 
                      loading={loading}
                      className="w-full"
                      
                      hapticFeedback
                    >
                      {loading ? 'Verifying...' : 'Enable 2FA'}
                    </NativeButton>
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
                    <NativeInput
                      label="Enter current verification code to disable"
                      id="disable-token"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      maxLength={6}
                      pattern="\d{6}"
                      required
                      disabled={loading}
                    />
                  </div>
                  <NativeButton 
                    type="submit" 
                    variant="destructive" 
                    disabled={loading}
                    loading={loading}
                    className="w-full"
                    
                    hapticFeedback
                  >
                    {loading ? 'Disabling...' : 'Disable 2FA'}
                  </NativeButton>
                </form>
              )}
            </div>
          )}
        </NativeCardContent>
      </NativeCard>
    </div>
    </AppLayout>
  )
}