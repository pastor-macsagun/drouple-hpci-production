"use client";

import { useState, useCallback } from "react";
import { Share, Copy } from "lucide-react";
import { MobileButton } from "./mobile-button";
import { useMobileNotifications } from "./notification-manager";
import { triggerHapticFeedback } from "@/lib/mobile-utils";

interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

interface NativeShareProps {
  data: ShareData;
  fallbackText?: string;
  className?: string;
  variant?: "default" | "icon" | "text";
  children?: React.ReactNode;
}

export function NativeShare({
  data,
  fallbackText = "Share",
  className,
  variant = "default",
  children,
}: NativeShareProps) {
  const [isSharing, setIsSharing] = useState(false);
  const { showSuccess, showError } = useMobileNotifications();

  const canShare = useCallback(() => {
    return typeof navigator !== 'undefined' && 'share' in navigator;
  }, []);

  const handleShare = useCallback(async () => {
    if (!canShare()) {
      // Fallback to clipboard
      await handleCopyToClipboard();
      return;
    }

    setIsSharing(true);
    triggerHapticFeedback('tap');

    try {
      // Check if data is shareable
      const shareData: ShareData = {};
      
      if (data.title) shareData.title = data.title;
      if (data.text) shareData.text = data.text;
      if (data.url) shareData.url = data.url;
      
      // Check file sharing support
      if (data.files && data.files.length > 0) {
        if (navigator.canShare && navigator.canShare({ files: data.files })) {
          shareData.files = data.files;
        } else {
          // Files not supported, share URL only
          if (!shareData.url && !shareData.text) {
            showError("Share Error", "File sharing not supported on this device");
            return;
          }
        }
      }

      await navigator.share(shareData);
      triggerHapticFeedback('success');
      showSuccess("Shared!", "Content shared successfully");
      
    } catch (error) {
      triggerHapticFeedback('error');
      
      if ((error as Error).name === 'AbortError') {
        // User cancelled sharing - no error message needed
        return;
      }
      
      // Fallback to clipboard on other errors
      await handleCopyToClipboard();
    } finally {
      setIsSharing(false);
    }
  }, [data, canShare, showSuccess, showError]);

  const handleCopyToClipboard = useCallback(async () => {
    try {
      const textToShare = data.url || data.text || data.title || "";
      
      if ((navigator as any).clipboard) {
        await (navigator as any).clipboard.writeText(textToShare);
        triggerHapticFeedback('success');
        showSuccess("Copied!", "Link copied to clipboard");
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = textToShare;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        triggerHapticFeedback('success');
        showSuccess("Copied!", "Link copied to clipboard");
      }
    } catch {
      triggerHapticFeedback('error');
      showError("Copy Failed", "Unable to copy to clipboard");
    }
  }, [data, showSuccess, showError]);

  if (variant === "icon") {
    return (
      <MobileButton
        variant="ghost"
        size="icon"
        onClick={handleShare}
        disabled={isSharing}
        className={className}
        hapticFeedback={false} // We handle haptics manually
        title={canShare() ? "Share" : "Copy link"}
      >
        {canShare() ? (
          <Share className="w-5 h-5" />
        ) : (
          <Copy className="w-5 h-5" />
        )}
      </MobileButton>
    );
  }

  if (variant === "text") {
    return (
      <button
        onClick={handleShare}
        disabled={isSharing}
        className={`text-accent hover:text-accent/80 transition-colors ${className}`}
      >
        {children || fallbackText}
      </button>
    );
  }

  return (
    <MobileButton
      onClick={handleShare}
      disabled={isSharing}
      className={className}
      hapticFeedback={false} // We handle haptics manually
    >
      {isSharing ? (
        "Sharing..."
      ) : (
        <>
          {canShare() ? (
            <Share className="w-4 h-4 mr-2" />
          ) : (
            <Copy className="w-4 h-4 mr-2" />
          )}
          {children || (canShare() ? "Share" : "Copy Link")}
        </>
      )}
    </MobileButton>
  );
}

// Hook for programmatic sharing
export function useNativeShare() {
  const { showSuccess, showError } = useMobileNotifications();

  const share = useCallback(async (data: ShareData) => {
    if (typeof navigator === 'undefined') return false;

    if ('share' in navigator) {
      try {
        await navigator.share(data);
        triggerHapticFeedback('success');
        return true;
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          triggerHapticFeedback('error');
        }
        return false;
      }
    }

    // Fallback to clipboard
    try {
      const textToShare = data.url || data.text || data.title || "";
      if ((navigator as any).clipboard) {
        await (navigator as any).clipboard.writeText(textToShare);
        triggerHapticFeedback('success');
        showSuccess("Copied!", "Link copied to clipboard");
        return true;
      }
    } catch {
      triggerHapticFeedback('error');
      showError("Share Failed", "Unable to share content");
    }

    return false;
  }, [showSuccess, showError]);

  const canShare = useCallback((data?: ShareData) => {
    if (typeof navigator === 'undefined') return false;
    
    if ('share' in navigator) {
      if (data?.files && navigator.canShare) {
        return navigator.canShare(data);
      }
      return true;
    }
    
    return !!(navigator as any).clipboard;
  }, []);

  return { share, canShare };
}