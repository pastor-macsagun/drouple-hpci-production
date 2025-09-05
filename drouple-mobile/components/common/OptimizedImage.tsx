/**
 * Optimized Image Component with CDN Width Parameters
 * Implements responsive images with CDN optimization and caching
 */

import React, { memo, useMemo } from 'react';
import { Image, ImageProps, Dimensions, PixelRatio } from 'react-native';
import { Image as ExpoImage, ImageSource } from 'expo-image';

// Get device dimensions and pixel ratio for optimization
const { width: screenWidth } = Dimensions.get('window');
const pixelRatio = PixelRatio.get();

// CDN configuration
const CDN_CONFIG = {
  baseUrl: 'https://cdn.drouple.com', // Your CDN base URL
  defaultFormat: 'webp', // Modern format with better compression
  fallbackFormat: 'jpg', // Fallback for older devices
  quality: 85, // Quality setting (0-100)
  enableProgressive: true, // Progressive JPEG loading
};

// Image size breakpoints for responsive loading
const IMAGE_BREAKPOINTS = {
  thumbnail: 150,
  small: 300,
  medium: 600,
  large: 1200,
  xlarge: 2000,
};

// Image optimization utilities
class ImageOptimizer {
  /**
   * Generate optimized image URL with CDN parameters
   */
  static generateOptimizedUrl(
    originalUrl: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'jpg' | 'png';
      fit?: 'cover' | 'contain' | 'fill';
      progressive?: boolean;
    } = {}
  ): string {
    if (!originalUrl || !originalUrl.startsWith('http')) {
      return originalUrl;
    }

    // If already a CDN URL, return as is
    if (originalUrl.includes(CDN_CONFIG.baseUrl)) {
      return originalUrl;
    }

    const {
      width,
      height,
      quality = CDN_CONFIG.quality,
      format = CDN_CONFIG.defaultFormat,
      fit = 'cover',
      progressive = CDN_CONFIG.enableProgressive,
    } = options;

    // Build CDN query parameters
    const params = new URLSearchParams();
    
    if (width) params.set('w', Math.round(width).toString());
    if (height) params.set('h', Math.round(height).toString());
    if (quality !== CDN_CONFIG.quality) params.set('q', quality.toString());
    if (format !== CDN_CONFIG.defaultFormat) params.set('f', format);
    if (fit !== 'cover') params.set('fit', fit);
    if (progressive && format === 'jpg') params.set('progressive', 'true');

    // Generate CDN URL
    const encodedUrl = encodeURIComponent(originalUrl);
    const queryString = params.toString();
    
    return `${CDN_CONFIG.baseUrl}/img/${encodedUrl}${queryString ? `?${queryString}` : ''}`;
  }

  /**
   * Calculate optimal image dimensions based on display size and device DPR
   */
  static calculateOptimalDimensions(
    displayWidth: number,
    displayHeight?: number,
    maxWidth = screenWidth
  ): { width: number; height?: number } {
    // Account for device pixel ratio but cap at 2x to avoid oversized images
    const effectivePixelRatio = Math.min(pixelRatio, 2);
    
    const optimalWidth = Math.min(
      Math.round(displayWidth * effectivePixelRatio),
      maxWidth * effectivePixelRatio
    );

    const optimalHeight = displayHeight
      ? Math.round(displayHeight * effectivePixelRatio)
      : undefined;

    return {
      width: optimalWidth,
      height: optimalHeight,
    };
  }

  /**
   * Select appropriate image size breakpoint
   */
  static selectBreakpoint(width: number): number {
    if (width <= IMAGE_BREAKPOINTS.thumbnail) return IMAGE_BREAKPOINTS.thumbnail;
    if (width <= IMAGE_BREAKPOINTS.small) return IMAGE_BREAKPOINTS.small;
    if (width <= IMAGE_BREAKPOINTS.medium) return IMAGE_BREAKPOINTS.medium;
    if (width <= IMAGE_BREAKPOINTS.large) return IMAGE_BREAKPOINTS.large;
    return IMAGE_BREAKPOINTS.xlarge;
  }
}

// Optimized Image Props
interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  source: string | ImageSource;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
  fit?: 'cover' | 'contain' | 'fill';
  progressive?: boolean;
  placeholder?: string;
  priority?: boolean; // For above-the-fold images
  lazy?: boolean; // For lazy loading
}

// Main optimized image component
export const OptimizedImage = memo<OptimizedImageProps>(({
  source,
  width,
  height,
  quality,
  format,
  fit = 'cover',
  progressive = true,
  placeholder,
  priority = false,
  lazy = true,
  style,
  ...props
}) => {
  // Memoize the optimized image source
  const optimizedSource = useMemo(() => {
    if (typeof source !== 'string') {
      return source;
    }

    // Calculate optimal dimensions if width/height provided
    let optimalDimensions = { width: undefined as number | undefined, height };
    
    if (width) {
      optimalDimensions = ImageOptimizer.calculateOptimalDimensions(width, height);
    }

    const optimizedUrl = ImageOptimizer.generateOptimizedUrl(source, {
      width: optimalDimensions.width,
      height: optimalDimensions.height,
      quality,
      format,
      fit,
      progressive,
    });

    return {
      uri: optimizedUrl,
      width: optimalDimensions.width,
      height: optimalDimensions.height,
    };
  }, [source, width, height, quality, format, fit, progressive]);

  // Memoize placeholder source
  const placeholderSource = useMemo(() => {
    if (!placeholder) return undefined;
    
    if (typeof placeholder === 'string' && width) {
      // Generate low-quality placeholder
      return {
        uri: ImageOptimizer.generateOptimizedUrl(placeholder, {
          width: Math.round(width / 4), // Quarter size for placeholder
          height: height ? Math.round(height / 4) : undefined,
          quality: 20, // Very low quality for fast loading
          format: 'jpg', // JPEG for better compression on low quality
        }),
      };
    }
    
    return placeholder;
  }, [placeholder, width, height]);

  return (
    <ExpoImage
      source={optimizedSource}
      placeholder={placeholderSource}
      style={[
        width && height ? { width, height } : undefined,
        style,
      ]}
      transition={200} // Smooth transition when loading
      cachePolicy={priority ? 'memory-disk' : 'disk'} // Cache strategy based on priority
      priority={priority ? 'high' : 'normal'}
      contentFit={fit}
      {...props}
    />
  );
});

OptimizedImage.displayName = 'OptimizedImage';

// Specialized image components for common use cases

// Avatar component with circular crop and optimized sizes
export const Avatar = memo<{
  source: string;
  size: number;
  placeholder?: string;
}>(({ source, size, placeholder }) => {
  const optimizedSize = ImageOptimizer.selectBreakpoint(size);
  
  return (
    <OptimizedImage
      source={source}
      width={optimizedSize}
      height={optimizedSize}
      fit="cover"
      format="webp"
      quality={90} // Higher quality for profile images
      placeholder={placeholder}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
      }}
    />
  );
});

// Event image component with aspect ratio handling
export const EventImage = memo<{
  source: string;
  width: number;
  aspectRatio?: number;
  placeholder?: string;
}>(({ source, width, aspectRatio = 16/9, placeholder }) => {
  const height = width / aspectRatio;
  const optimalWidth = ImageOptimizer.selectBreakpoint(width);
  
  return (
    <OptimizedImage
      source={source}
      width={optimalWidth}
      height={optimalWidth / aspectRatio}
      fit="cover"
      format="webp"
      placeholder={placeholder}
      style={{
        width,
        height,
        borderRadius: 8,
      }}
    />
  );
});

// Hero image component for large banners
export const HeroImage = memo<{
  source: string;
  height?: number;
  overlay?: boolean;
}>(({ source, height = 200, overlay = false }) => {
  const width = screenWidth;
  const optimalDimensions = ImageOptimizer.calculateOptimalDimensions(width, height);
  
  return (
    <OptimizedImage
      source={source}
      width={optimalDimensions.width}
      height={optimalDimensions.height}
      fit="cover"
      format="webp"
      quality={90}
      priority={true} // Hero images are above-the-fold
      style={{
        width,
        height,
      }}
    />
  );
});

// Image preloader utility
export class ImagePreloader {
  private static preloadedImages = new Set<string>();
  
  static async preload(source: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
  }) {
    if (this.preloadedImages.has(source)) {
      return;
    }
    
    const optimizedUrl = ImageOptimizer.generateOptimizedUrl(source, options);
    
    try {
      await ExpoImage.prefetch(optimizedUrl);
      this.preloadedImages.add(source);
    } catch (error) {
      console.warn('Image preload failed:', error);
    }
  }
  
  static preloadMultiple(images: Array<{
    source: string;
    width?: number;
    height?: number;
  }>) {
    return Promise.allSettled(
      images.map(img => this.preload(img.source, img))
    );
  }
}

// Image performance monitoring hook
export function useImagePerformance() {
  const trackImageLoad = React.useCallback((source: string, loadTime: number) => {
    if (loadTime > 2000) { // Warn if image takes longer than 2 seconds
      console.warn(`⚠️  Slow image load: ${source} took ${loadTime}ms`);
    }
  }, []);
  
  const preloadImages = React.useCallback((images: string[]) => {
    ImagePreloader.preloadMultiple(
      images.map(source => ({ 
        source, 
        width: IMAGE_BREAKPOINTS.small 
      }))
    );
  }, []);
  
  return {
    trackImageLoad,
    preloadImages,
  };
}