"use client";

import { useState, Suspense, useEffect } from "react";
import { signIn, getCsrfToken } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MobileButton } from "@/components/mobile/mobile-button";
import { MobileInput } from "@/components/mobile/mobile-form";
import { MobileSpinner } from "@/components/mobile/mobile-loading";
import { useMobileNotifications, NotificationManager } from "@/components/mobile/notification-manager";
import { isPWAStandalone, triggerHapticFeedback } from "@/lib/mobile-utils";
import { Eye, EyeOff, ArrowLeft, Church } from "lucide-react";

function SignInContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [isPWA, setIsPWA] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showSuccess, showError, notifications, removeNotification } = useMobileNotifications();
  
  const callbackUrl = searchParams.get("callbackUrl") || searchParams.get("returnTo") || "/";
  const justRegistered = searchParams.get("registered") === "true";
  const passwordChanged = searchParams.get("message") === "password-changed";

  useEffect(() => {
    setIsPWA(isPWAStandalone());
    
    // Show success messages on mount
    if (justRegistered) {
      showSuccess(
        "Welcome to Drouple!",
        "Registration successful! Please sign in with your new account.",
        { duration: 4000 }
      );
    }
    
    if (passwordChanged) {
      showSuccess(
        "Password Updated",
        "Password changed successfully! Please sign in with your new password.",
        { duration: 4000 }
      );
    }
  }, [justRegistered, passwordChanged, showSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    triggerHapticFeedback('light');
    
    try {
      // Get CSRF token for security
      const csrfToken = await getCsrfToken();
      
      const result = await signIn("credentials", {
        email,
        password,
        csrfToken,
        callbackUrl,
        redirect: false,
      });
      
      if (result?.error) {
        triggerHapticFeedback('heavy');
        if (result.error.includes("too many")) {
          showError("Too Many Attempts", "Too many login attempts. Please try again later.", { duration: 0 });
        } else {
          showError("Invalid Credentials", "Invalid email or password. Please try again.");
        }
      } else if (result?.ok) {
        triggerHapticFeedback('medium');
        showSuccess("Welcome Back!", "Signing you in...", { duration: 2000 });
        
        // Small delay for UX feedback
        setTimeout(() => {
          router.push(callbackUrl);
        }, 500);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      triggerHapticFeedback('heavy');
      showError("Connection Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    triggerHapticFeedback('light');
  };

  const validateEmail = (value: string) => {
    if (!value.trim()) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(value)) return "Enter a valid email address";
    return undefined;
  };

  const validatePassword = (value: string) => {
    if (!value) return "Password is required";
    if (value.length < 6) return "Password must be at least 6 characters";
    return undefined;
  };

  const emailError = touched.email ? validateEmail(email) : undefined;
  const passwordError = touched.password ? validatePassword(password) : undefined;
  const isValid = !emailError && !passwordError && email && password;

  return (
    <main className="min-h-screen bg-gradient-to-br from-accent/5 via-bg to-accent/10 flex flex-col">
      {/* Native App Header */}
      <div className="relative flex items-center justify-between p-4 pt-safe-area-top">
        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-elevated transition-colors">
          <ArrowLeft className="w-6 h-6 text-ink-muted" />
        </Link>
        <div className="absolute inset-x-0 flex justify-center">
          <div className="text-lg font-semibold text-ink">Sign In</div>
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        {/* App Logo/Branding */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center shadow-lg">
            <Church className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-ink mb-2">Welcome to Drouple</h1>
          <p className="text-ink-muted">
            {isPWA ? "Sign in to your church community" : "Sign in to continue"}
          </p>
        </div>

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <MobileInput
              label="Email Address"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
              error={emailError}
              touched={touched.email}
              disabled={loading}
              autoComplete="email"
            />

            <MobileInput
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
              error={passwordError}
              touched={touched.password}
              disabled={loading}
              autoComplete="current-password"
              rightIcon={
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="p-1 rounded hover:bg-elevated transition-colors"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-ink-muted" />
                  ) : (
                    <Eye className="w-5 h-5 text-ink-muted" />
                  )}
                </button>
              }
            />
          </div>

          <MobileButton
            type="submit"
            disabled={!isValid || loading}
            className="w-full h-14 text-lg font-semibold"
            touchTarget="large"
            hapticFeedback
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <MobileSpinner size="sm" />
                <span>Signing In...</span>
              </div>
            ) : (
              "Sign In"
            )}
          </MobileButton>
        </form>

        {/* Additional Options */}
        <div className="mt-8 text-center space-y-4">
          <Link 
            href="/auth/forgot-password" 
            className="text-accent font-medium hover:text-accent/80 transition-colors block py-2"
          >
            Forgot Password?
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-safe-area-bottom pb-4 text-center">
        <p className="text-sm text-ink-muted">
          Need help? Contact your church administrator
        </p>
      </div>

      {/* Mobile Notifications */}
      <NotificationManager
        notifications={notifications}
        onRemove={removeNotification}
        position="top"
      />
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-accent/5 via-bg to-accent/10 flex flex-col">
        <div className="relative flex items-center justify-between p-4 pt-safe-area-top">
          <div className="w-6 h-6" />
          <div className="text-lg font-semibold text-ink">Sign In</div>
          <div className="w-6 h-6" />
        </div>
        
        <div className="flex-1 flex flex-col justify-center px-6 py-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center shadow-lg">
              <Church className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-ink mb-2">Welcome to Drouple</h1>
          </div>
          
          <div className="flex justify-center py-12">
            <MobileSpinner size="lg" />
          </div>
        </div>
      </main>
    }>
      <SignInContent />
    </Suspense>
  );
}