import { vi } from 'vitest'

// Mock next/server for next-auth compatibility in tests
vi.mock('next/server', () => {
  return {
    headers: () => new Map(),
    cookies: () => ({ 
      get: () => undefined, 
      set: () => {}, 
      delete: () => {} 
    }),
    NextResponse: { 
      redirect: (url: string) => ({ url }),
      json: (data: any) => ({ json: () => data }),
      next: () => ({})
    },
    NextRequest: class NextRequest {
      constructor(public url: string) {}
      nextUrl = new URL(this.url)
      cookies = { get: () => undefined }
    }
  }
})

// Mock next/navigation for next-auth compatibility
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))