/**
 * Legacy endpoint adapters
 * Redirects /api/mobile/v1/* and /api/web/v1/* to /api/v1/*
 * Adds deprecation warnings and logging
 */

import { NextRequest, NextResponse } from 'next/server';

interface AdapterOptions {
  legacy: string;
  canonical: string;
  deprecationDate?: string;
}

export function createDeprecationAdapter({ legacy, canonical, deprecationDate }: AdapterOptions) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Log deprecation usage
    console.warn(`DEPRECATED_ENDPOINT: ${legacy} -> ${canonical}`, {
      code: 'DEPRECATED_ENDPOINT',
      legacy,
      canonical,
      target: canonical,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
    });

    // Create new URL with canonical path
    const newUrl = new URL(request.url);
    newUrl.pathname = canonical;

    // Forward the request to the canonical endpoint
    const canonicalRequest = new NextRequest(newUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    // Make the request to the canonical endpoint internally
    try {
      // In Next.js App Router, we need to fetch the canonical endpoint
      const response = await fetch(canonicalRequest);
      
      // Clone the response to add deprecation headers
      const responseData = await response.text();
      
      const deprecatedResponse = new NextResponse(responseData, {
        status: response.status,
        headers: response.headers,
      });

      // Add RFC-compliant deprecation headers
      const sunsetDate = new Date();
      sunsetDate.setDate(sunsetDate.getDate() + 60); // 60 days from now
      const sunsetString = sunsetDate.toUTCString();
      
      deprecatedResponse.headers.set('Deprecation', 'true');
      deprecatedResponse.headers.set('Sunset', sunsetString); // RFC 8594 compliant
      deprecatedResponse.headers.set('Warning', `299 - "Deprecated endpoint. Use ${canonical} instead"`);
      deprecatedResponse.headers.set('Link', `<${canonical}>; rel="successor-version"`); // RFC 8288 compliant

      return deprecatedResponse;

    } catch (error) {
      console.error('Adapter forwarding error:', error);
      return NextResponse.json(
        { 
          ok: false, 
          code: 'ADAPTER_ERROR', 
          message: 'Error forwarding deprecated endpoint' 
        },
        { status: 500 }
      );
    }
  };
}

// Helper function to extract path segments
export function createLegacyPath(originalPath: string, from: string, to: string): string {
  return originalPath.replace(new RegExp(`^${from}`), to);
}

export const ADAPTER_MAPPINGS = [
  // Mobile API v1 adapters
  { legacy: '/api/mobile/v1/auth/login', canonical: '/api/v1/auth/login' },
  { legacy: '/api/mobile/v1/auth/refresh', canonical: '/api/v1/auth/refresh' },
  { legacy: '/api/mobile/v1/directory/search', canonical: '/api/v1/members/search' },
  { legacy: '/api/mobile/v1/events', canonical: '/api/v1/events' },
  { legacy: '/api/mobile/v1/checkin', canonical: '/api/v1/checkins' },
  { legacy: '/api/mobile/v1/sync/members', canonical: '/api/v1/sync/members' },
  { legacy: '/api/mobile/v1/sync/events', canonical: '/api/v1/sync/events' },
  { legacy: '/api/mobile/v1/devices', canonical: '/api/v1/devices' },
  { legacy: '/api/mobile/v1/live/service-counts', canonical: '/api/v1/live/service-counts' },

  // Web API adapters (if they exist)
  { legacy: '/api/web/v1/auth/login', canonical: '/api/v1/auth/login' },
  { legacy: '/api/web/v1/auth/refresh', canonical: '/api/v1/auth/refresh' },
] as const;