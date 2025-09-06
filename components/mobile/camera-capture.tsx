"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Image as ImageIcon, Upload, X } from "lucide-react";
import { MobileButton } from "./mobile-button";
import { useMobileNotifications } from "./notification-manager";
import { triggerHapticFeedback } from "@/lib/mobile-utils";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onError?: (error: string) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  variant?: "camera" | "gallery" | "both";
  children?: React.ReactNode;
}

export function CameraCapture({
  onCapture,
  onError,
  accept = "image/*",
  maxSizeMB = 5,
  className,
  variant = "both",
  children,
}: CameraCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useMobileNotifications();

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return;

    triggerHapticFeedback('selection');
    setIsCapturing(true);

    try {
      // Validate file size
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSizeMB) {
        const error = `File size (${fileSizeMB.toFixed(1)}MB) exceeds limit of ${maxSizeMB}MB`;
        showError("File Too Large", error);
        onError?.(error);
        return;
      }

      // Validate file type
      if (accept !== "*/*" && !file.type.match(accept.replace("*", ".*"))) {
        const error = `File type ${file.type} is not allowed`;
        showError("Invalid File Type", error);
        onError?.(error);
        return;
      }

      triggerHapticFeedback('success');
      showSuccess("Photo Selected", "Processing image...");
      onCapture(file);
      
    } catch (error) {
      triggerHapticFeedback('error');
      const errorMessage = error instanceof Error ? error.message : "Failed to process image";
      showError("Upload Error", errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsCapturing(false);
      
      // Reset input values to allow selecting the same file again
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  }, [maxSizeMB, accept, onCapture, onError, showSuccess, showError]);

  const handleCameraCapture = useCallback(() => {
    triggerHapticFeedback('tap');
    cameraInputRef.current?.click();
  }, []);

  const handleGallerySelect = useCallback(() => {
    triggerHapticFeedback('tap');
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  if (variant === "camera") {
    return (
      <div className={className}>
        <MobileButton
          onClick={handleCameraCapture}
          disabled={isCapturing}
          hapticFeedback={false}
        >
          {isCapturing ? (
            "Processing..."
          ) : (
            <>
              <Camera className="w-4 h-4 mr-2" />
              {children || "Take Photo"}
            </>
          )}
        </MobileButton>
        
        <input
          ref={cameraInputRef}
          type="file"
          accept={accept}
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
          disabled={isCapturing}
        />
      </div>
    );
  }

  if (variant === "gallery") {
    return (
      <div className={className}>
        <MobileButton
          onClick={handleGallerySelect}
          disabled={isCapturing}
          hapticFeedback={false}
        >
          {isCapturing ? (
            "Processing..."
          ) : (
            <>
              <ImageIcon className="w-4 h-4 mr-2" />
              {children || "Choose Photo"}
            </>
          )}
        </MobileButton>
        
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          disabled={isCapturing}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-2">
        <MobileButton
          onClick={handleCameraCapture}
          disabled={isCapturing}
          variant="default"
          className="flex-1"
          hapticFeedback={false}
        >
          {isCapturing ? (
            "Processing..."
          ) : (
            <>
              <Camera className="w-4 h-4 mr-2" />
              Camera
            </>
          )}
        </MobileButton>
        
        <MobileButton
          onClick={handleGallerySelect}
          disabled={isCapturing}
          variant="outline"
          className="flex-1"
          hapticFeedback={false}
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          Gallery
        </MobileButton>
      </div>
      
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept={accept}
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        disabled={isCapturing}
      />
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={isCapturing}
      />
    </div>
  );
}

// Image preview component with native-like styling
interface ImagePreviewProps {
  file: File;
  onRemove: () => void;
  className?: string;
}

export function ImagePreview({ file, onRemove, className }: ImagePreviewProps) {
  const [preview, setPreview] = useState<string>("");
  
  useState(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  });

  const handleRemove = useCallback(() => {
    triggerHapticFeedback('delete');
    onRemove();
  }, [onRemove]);

  if (!preview) {
    return (
      <div className={`aspect-square bg-elevated rounded-xl flex items-center justify-center ${className}`}>
        <Upload className="w-8 h-8 text-ink-muted" />
      </div>
    );
  }

  return (
    <div className={`relative aspect-square rounded-xl overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={preview} 
        alt="Preview" 
        className="w-full h-full object-cover"
      />
      
      <MobileButton
        variant="ghost"
        size="icon"
        onClick={handleRemove}
        className="absolute top-2 right-2 bg-ink/80 text-white hover:bg-ink/90"
        hapticFeedback={false}
      >
        <X className="w-4 h-4" />
      </MobileButton>
      
      <div className="absolute bottom-2 left-2 right-2">
        <div className="text-xs text-white bg-ink/80 px-2 py-1 rounded backdrop-blur-sm">
          {file.name} ({(file.size / 1024).toFixed(0)}KB)
        </div>
      </div>
    </div>
  );
}

// Hook for camera access
export function useCameraCapture() {
  const { showError } = useMobileNotifications();

  const checkCameraSupport = useCallback(() => {
    return typeof navigator !== 'undefined' && 
           'mediaDevices' in navigator && 
           'getUserMedia' in navigator.mediaDevices;
  }, []);

  const requestCameraPermission = useCallback(async () => {
    if (!checkCameraSupport()) {
      showError("Camera Not Supported", "Camera access is not available on this device");
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Stop the stream immediately - we just needed to check permission
      stream.getTracks().forEach(track => track.stop());
      
      triggerHapticFeedback('success');
      return true;
    } catch (error) {
      triggerHapticFeedback('error');
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          showError("Camera Permission", "Please allow camera access to take photos");
        } else if (error.name === 'NotFoundError') {
          showError("No Camera", "No camera found on this device");
        } else {
          showError("Camera Error", error.message);
        }
      }
      
      return false;
    }
  }, [checkCameraSupport, showError]);

  return {
    checkCameraSupport,
    requestCameraPermission,
  };
}