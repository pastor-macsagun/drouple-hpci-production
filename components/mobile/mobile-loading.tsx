"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave";
}

export function Skeleton({
  className,
  variant = "rectangular",
  width,
  height,
  animation = "pulse",
}: SkeletonProps) {
  const variantStyles = {
    text: "h-4 rounded-md",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const animationStyles = {
    pulse: "animate-pulse",
    wave: "animate-shimmer",
  };

  return (
    <div
      className={cn(
        "bg-elevated",
        variantStyles[variant],
        animationStyles[animation],
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

interface MobileListSkeletonProps {
  count?: number;
  showAvatar?: boolean;
  showActions?: boolean;
}

export function MobileListSkeleton({
  count = 5,
  showAvatar = true,
  showActions = false,
}: MobileListSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="p-4 border border-border rounded-lg bg-bg">
          <div className="flex items-start space-x-3">
            {showAvatar && (
              <Skeleton variant="circular" width={48} height={48} />
            )}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
            {showActions && (
              <div className="flex space-x-2">
                <Skeleton variant="circular" width={32} height={32} />
                <Skeleton variant="circular" width={32} height={32} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface MobileCardSkeletonProps {
  count?: number;
}

export function MobileCardSkeleton({ count = 3 }: MobileCardSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="p-6 border border-border rounded-xl bg-bg">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton variant="circular" width={24} height={24} />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function MobileSpinner({ size = "md", className }: SpinnerProps) {
  const sizeStyles = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12",
  };

  return (
    <div className={cn("flex justify-center items-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-elevated border-t-accent",
          sizeStyles[size]
        )}
      />
    </div>
  );
}

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  showLabel?: boolean;
  color?: "accent" | "green" | "red" | "blue";
}

export function MobileProgressBar({
  progress,
  className,
  showLabel = false,
  color = "accent",
}: ProgressBarProps) {
  const colorStyles = {
    accent: "bg-accent",
    green: "bg-green-500",
    red: "bg-red-500", 
    blue: "bg-blue-500",
  };

  const constrainedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between text-sm text-ink-muted mb-2">
          <span>Progress</span>
          <span>{constrainedProgress}%</span>
        </div>
      )}
      <div className="w-full bg-elevated rounded-full h-2">
        <div
          className={cn(
            "h-2 rounded-full transition-all duration-300 ease-out",
            colorStyles[color]
          )}
          style={{ width: `${constrainedProgress}%` }}
        />
      </div>
    </div>
  );
}