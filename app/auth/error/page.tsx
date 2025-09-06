"use client";

import { Suspense } from 'react';
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  NativeButton,
  NativeCard,
  NativeCardContent,
  NativeCardDescription,
  NativeCardHeader,
  NativeCardTitle
} from "@/components/ui/native";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "You do not have permission to sign in.",
    Verification: "The verification token has expired or has already been used.",
    SessionExpired: "Your session has expired or is invalid. Please sign in again.",
    JWTError: "Authentication session error. Please sign in again.",
    Default: "An error occurred during authentication.",
  };

  const message = errorMessages[error || "Default"] || errorMessages.Default;

  return (
    <main className="min-h-screen bg-gradient-to-br from-destructive/5 via-bg to-destructive/10 flex flex-col">
      {/* Native App Header */}
      <div className="relative flex items-center justify-center p-4 pt-safe-area-top">
        <div className="text-lg font-semibold text-ink">Authentication Error</div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        {/* Error Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-destructive flex items-center justify-center shadow-lg">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-ink mb-2">Authentication Error</h1>
          <p className="text-ink-muted">
            Something went wrong during sign in
          </p>
        </div>

        <NativeCard className="max-w-md mx-auto w-full">
          <NativeCardContent className="text-center space-y-6">
            <div className="space-y-3">
              <p className="text-ink">
                {message}
              </p>
            </div>

            <Link href="/auth/signin" className="block">
              <NativeButton 
                className="w-full h-14 text-lg font-semibold"
                
                hapticFeedback
              >
                Try Again
              </NativeButton>
            </Link>
          </NativeCardContent>
        </NativeCard>
      </div>

      {/* Footer */}
      <div className="px-6 pb-safe-area-bottom pb-4 text-center">
        <p className="text-sm text-ink-muted">
          Need help? Contact your church administrator
        </p>
      </div>
    </main>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-destructive/5 via-bg to-destructive/10 flex flex-col">
        <div className="relative flex items-center justify-center p-4 pt-safe-area-top">
          <div className="text-lg font-semibold text-ink">Loading...</div>
        </div>
        
        <div className="flex-1 flex flex-col justify-center px-6 py-8">
          <NativeCard className="max-w-md mx-auto w-full">
            <NativeCardContent className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
            </NativeCardContent>
          </NativeCard>
        </div>
      </main>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}