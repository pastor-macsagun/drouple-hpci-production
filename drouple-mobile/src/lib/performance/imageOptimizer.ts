/**
 * Image Optimization Service
 * Handles image caching, resizing, and lazy loading
 */

import { Image, Dimensions, PixelRatio } from 'react-native';
import { memoryManager } from './memoryManager';

export interface ImageOptimizationConfig {
  enableCaching: boolean;
  enableLazyLoading: boolean;
  enableResizing: boolean;
  quality: number; // 0-1
  maxWidth: number;
  maxHeight: number;
  placeholderColor: string;
  errorColor: string;
}

export interface ImageSize {
  width: number;
  height: number;
}

export interface OptimizedImageProps {
  source: { uri: string } | number;
  style?: any;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center' | 'repeat';
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
  lazy?: boolean;
  optimize?: boolean;
}

export class ImageOptimizer {
  private static instance: ImageOptimizer;
  private config: ImageOptimizationConfig;
  private screenSize: ImageSize;
  private pixelRatio: number;

  private constructor() {
    const screen = Dimensions.get('screen');
    this.screenSize = {
      width: screen.width,
      height: screen.height,
    };
    this.pixelRatio = PixelRatio.get();

    this.config = {
      enableCaching: true,
      enableLazyLoading: true,
      enableResizing: true,
      quality: 0.8,
      maxWidth: this.screenSize.width * this.pixelRatio,
      maxHeight: this.screenSize.height * this.pixelRatio,
      placeholderColor: '#f0f0f0',
      errorColor: '#ff6b6b',
    };
  }

  static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer();
    }
    return ImageOptimizer.instance;
  }

  /**
   * Configure image optimization settings
   */
  configure(config: Partial<ImageOptimizationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get optimized image URI
   */
  getOptimizedImageUri(
    originalUri: string,
    targetWidth?: number,
    targetHeight?: number,
    quality?: number
  ): string {
    if (!this.config.enableResizing) {
      return originalUri;
    }

    const width = targetWidth || this.config.maxWidth;
    const height = targetHeight || this.config.maxHeight;
    const q = quality || this.config.quality;

    // For development, return original URI
    // In production, this would typically add query parameters or use a CDN
    const optimizedUri = `${originalUri}?w=${Math.round(width)}&h=${Math.round(height)}&q=${Math.round(q * 100)}`;

    return optimizedUri;
  }

  /**
   * Calculate optimal image dimensions
   */
  calculateOptimalDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth?: number,
    maxHeight?: number
  ): ImageSize {
    const targetMaxWidth = maxWidth || this.config.maxWidth;
    const targetMaxHeight = maxHeight || this.config.maxHeight;

    const aspectRatio = originalWidth / originalHeight;

    let width = originalWidth;
    let height = originalHeight;

    // Scale down if larger than maximum dimensions
    if (width > targetMaxWidth) {
      width = targetMaxWidth;
      height = width / aspectRatio;
    }

    if (height > targetMaxHeight) {
      height = targetMaxHeight;
      width = height * aspectRatio;
    }

    return { width, height };
  }

  /**
   * Get image size from URI
   */
  getImageSize(uri: string): Promise<ImageSize> {
    return new Promise((resolve, reject) => {
      Image.getSize(
        uri,
        (width, height) => resolve({ width, height }),
        error => reject(error)
      );
    });
  }

  /**
   * Preload images for better performance
   */
  async preloadImages(uris: string[]): Promise<void> {
    const preloadPromises = uris.map(uri => {
      return new Promise<void>((resolve, reject) => {
        Image.prefetch(uri)
          .then(() => resolve())
          .catch(() => resolve()); // Don't fail the entire batch for one image
      });
    });

    try {
      await Promise.all(preloadPromises);
    } catch (error) {
      console.error('Failed to preload images:', error);
    }
  }

  /**
   * Cache image data
   */
  async cacheImage(uri: string): Promise<boolean> {
    if (!this.config.enableCaching) {
      return false;
    }

    try {
      // Check if already cached
      const cachedImage = memoryManager.getCachedImage(uri);
      if (cachedImage) {
        return true;
      }

      // Download and cache image
      const response = await fetch(uri);
      const blob = await response.blob();

      // Convert blob to base64 for storage
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const success = memoryManager.cacheImage(uri, base64);
          resolve(success);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to cache image:', error);
      return false;
    }
  }

  /**
   * Get cached image
   */
  getCachedImage(uri: string): string | null {
    if (!this.config.enableCaching) {
      return null;
    }

    return memoryManager.getCachedImage(uri);
  }

  /**
   * Generate placeholder image data URL
   */
  generatePlaceholder(width: number, height: number, color?: string): string {
    const placeholderColor = color || this.config.placeholderColor;

    // Simple SVG placeholder
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${placeholderColor}"/>
        <circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) / 8}" fill="rgba(255,255,255,0.5)"/>
      </svg>
    `;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Generate error image data URL
   */
  generateErrorImage(width: number, height: number): string {
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${this.config.errorColor}"/>
        <text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="white" font-size="16">✕</text>
      </svg>
    `;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Get responsive image dimensions for different screen sizes
   */
  getResponsiveDimensions(
    baseWidth: number,
    baseHeight: number
  ): { small: ImageSize; medium: ImageSize; large: ImageSize } {
    const aspectRatio = baseWidth / baseHeight;

    return {
      small: {
        width: 200,
        height: 200 / aspectRatio,
      },
      medium: {
        width: 400,
        height: 400 / aspectRatio,
      },
      large: {
        width: 800,
        height: 800 / aspectRatio,
      },
    };
  }

  /**
   * Optimize image based on connection speed
   */
  getConnectionAwareImageUri(
    originalUri: string,
    connectionType: string = 'wifi'
  ): string {
    let quality = this.config.quality;
    let maxWidth = this.config.maxWidth;

    switch (connectionType) {
      case 'cellular':
      case '3g':
        quality = 0.6;
        maxWidth = this.screenSize.width;
        break;
      case '2g':
        quality = 0.4;
        maxWidth = this.screenSize.width * 0.5;
        break;
      case 'wifi':
      default:
        // Use default settings
        break;
    }

    return this.getOptimizedImageUri(originalUri, maxWidth, undefined, quality);
  }

  /**
   * Clear image cache
   */
  clearImageCache(): void {
    // This would clear the image cache in memoryManager
    console.log('Clearing image cache...');
  }

  /**
   * Get image cache statistics
   */
  getImageCacheStats(): {
    cachedImages: number;
    cacheSize: number;
    hitRate: number;
  } {
    // Mock implementation - would integrate with actual cache
    return {
      cachedImages: 0,
      cacheSize: 0,
      hitRate: 0,
    };
  }

  /**
   * Validate image format support
   */
  isImageFormatSupported(uri: string): boolean {
    const supportedFormats = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const extension = uri.toLowerCase().split('.').pop();
    return supportedFormats.includes(`.${extension}`);
  }

  /**
   * Get device-specific image quality settings
   */
  getDeviceOptimalSettings(): Partial<ImageOptimizationConfig> {
    const memoryWarning = false; // Would detect low memory devices
    const isLowEndDevice = false; // Would detect device capabilities

    if (memoryWarning || isLowEndDevice) {
      return {
        quality: 0.6,
        maxWidth: this.screenSize.width,
        maxHeight: this.screenSize.height,
        enableCaching: false,
      };
    }

    return this.config;
  }
}

// Export singleton instance
export const imageOptimizer = ImageOptimizer.getInstance();
