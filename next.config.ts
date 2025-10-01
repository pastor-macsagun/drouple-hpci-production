import type { NextConfig } from "next";

// Bundle analyzer configuration
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  eslint: {
    ignoreDuringBuilds: true, // Allow build to succeed with PWA-related lint warnings
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Quiet OpenTelemetry warnings in development only
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        {
          module: /@opentelemetry\/instrumentation\/build\/esm\/platform\/node\/instrumentation\.js/,
          message: /Critical dependency: the request of a dependency is an expression/,
        },
      ];
    }
    return config;
  },
  async headers() {
    const headers = [
      {
        source: '/:path*',
        headers: [
          // Development security headers (vercel.json handles production)
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              process.env.NODE_ENV === 'development' 
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com" // Dev mode needs unsafe-eval for webpack HMR + Vercel scripts
                : "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com", // Production needs Vercel scripts
              "style-src 'self' 'unsafe-inline'", // Required for progress.tsx dynamic transforms
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "worker-src 'self'", // Allow service workers from same origin
              "manifest-src 'self'", // Allow web app manifest from same origin
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ];

    // HSTS is set in vercel.json for production deployment
    // Only set in development/local environment
    if (process.env.NODE_ENV === 'development') {
      headers[0].headers.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains', // Match Vercel config
      });
    }

    return headers;
  },
};

// Apply bundle analyzer configuration
export default withBundleAnalyzer(nextConfig);
