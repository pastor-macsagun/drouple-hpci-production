'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BRAND_CONFIG } from '@/config/brand';
import { UserRole } from '@prisma/client';
import { usePWADetection } from '@/hooks/use-pwa-detection';

interface SplashScreenProps {
  user?: {
    id: string;
    role: UserRole;
  } | null;
}

export default function SplashScreen({ user }: SplashScreenProps) {
  const router = useRouter();
  const { isPWA, isLoading } = usePWADetection();
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Only show splash screen if it's PWA mode and not loading
    if (!isLoading) {
      if (isPWA) {
        setShowSplash(true);
        
        const timer = setTimeout(() => {
          if (user) {
            // Redirect authenticated users based on role
            switch (user.role) {
              case UserRole.SUPER_ADMIN:
                router.push('/super');
                break;
              case UserRole.ADMIN:
              case UserRole.PASTOR:
                router.push('/admin');
                break;
              case UserRole.VIP:
                router.push('/vip');
                break;
              case UserRole.LEADER:
                router.push('/leader');
                break;
              case UserRole.MEMBER:
              default:
                router.push('/dashboard');
                break;
            }
          } else {
            // Redirect to login for non-authenticated users
            router.push('/auth/signin');
          }
        }, 2000); // Show splash for 2 seconds

        return () => clearTimeout(timer);
      }
    }
  }, [isPWA, isLoading, user, router]);

  // Don't render splash screen if not PWA or still loading detection
  if (isLoading || !isPWA || !showSplash) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800">
      {/* Animated background pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, rgb(30, 124, 232) 0px, transparent 50px),
                             radial-gradient(circle at 80% 80%, rgb(229, 196, 83) 0px, transparent 50px),
                             radial-gradient(circle at 40% 60%, rgb(30, 124, 232) 0px, transparent 30px)`,
            backgroundSize: '200px 200px'
          }}></div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* App Icon with pulsing animation */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-gradient-to-br from-[#1e7ce8] to-[#e5c453] rounded-3xl flex items-center justify-center shadow-2xl animate-pulse">
            <svg 
              className="w-14 h-14 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              strokeWidth="2"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" 
              />
            </svg>
          </div>
        </div>

        {/* Brand name with fade-in animation */}
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 animate-fade-in">
          {BRAND_CONFIG.name}
        </h1>
        
        {/* Tagline */}
        <p className="text-lg text-gray-300 mb-8 animate-fade-in-delay">
          {BRAND_CONFIG.tagline}
        </p>

        {/* Loading indicator */}
        <div className="flex justify-center space-x-2">
          <div className="w-2 h-2 bg-[#1e7ce8] rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-[#1e7ce8] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-[#1e7ce8] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>

        {/* Loading text */}
        <p className="text-sm text-gray-400 mt-4">
          {user ? 'Taking you to your dashboard...' : 'Redirecting to sign in...'}
        </p>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-fade-in-delay {
          animation: fade-in 0.8s ease-out 0.2s both;
        }
      `}</style>
    </div>
  );
}