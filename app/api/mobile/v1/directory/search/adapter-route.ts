/**
 * LEGACY ADAPTER: /api/mobile/v1/directory/search -> /api/v1/members/search
 * DEPRECATED: Will be removed on 2025-03-01
 */

import { NextRequest, NextResponse } from 'next/server';
import { createDeprecationAdapter } from '@/lib/middleware/adapters';

const adapter = createDeprecationAdapter({
  legacy: '/api/mobile/v1/directory/search',
  canonical: '/api/v1/members/search',
  deprecationDate: '2025-03-01'
});

export async function GET(request: NextRequest) {
  return adapter(request);
}