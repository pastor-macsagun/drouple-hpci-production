'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, X } from 'lucide-react'

interface QRScannerProps {
  onScan: (result: string) => void
  onError?: (error: string) => void
  onClose: () => void
}

export function QRScanner({ onScan, onError, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const elementId = "qr-scanner-container"

  useEffect(() => {
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      supportedScanTypes: []
    }

    const scanner = new Html5QrcodeScanner(elementId, config, false)
    scannerRef.current = scanner

    const onScanSuccess = (decodedText: string) => {
      scanner.clear()
      onScan(decodedText)
    }

    const onScanFailure = (error: string) => {
      // Don't log every scan failure, just when camera fails to start
      if (error.includes('camera') || error.includes('permission')) {
        onError?.(error)
      }
    }

    scanner.render(onScanSuccess, onScanFailure)
    setIsLoading(false)

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear()
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  }, [onScan, onError])

  const handleClose = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear()
      } catch {
        // Ignore cleanup errors
      }
    }
    onClose()
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            <CardTitle>Scan QR Code</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Close QR scanner">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Point your camera at a QR code to scan
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading camera...</p>
          </div>
        )}
        <div id={elementId} className="w-full" />
        <div className="mt-4 text-center">
          <Button variant="outline" onClick={handleClose} className="w-full">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}