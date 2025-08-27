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
    NextResponse: class NextResponse {
      public url?: string
      public status?: number
      public headers = {
        _map: new Map<string, string>(),
        get: function(key: string): string | null {
          return this._map.get(key) || null
        },
        set: function(key: string, value: string): void {
          this._map.set(key, value)
        },
        has: function(key: string): boolean {
          return this._map.has(key)
        },
        delete: function(key: string): boolean {
          return this._map.delete(key)
        },
        forEach: function(callback: (value: string, key: string) => void): void {
          this._map.forEach(callback)
        }
      }
      
      constructor(body?: BodyInit, init?: ResponseInit) {
        this.status = init?.status || 200
        if (init?.headers) {
          if (init.headers instanceof Headers) {
            init.headers.forEach((value, key) => {
              this.headers.set(key, value)
            })
          } else if (Array.isArray(init.headers)) {
            init.headers.forEach(([key, value]) => {
              this.headers.set(key, value)
            })
          } else {
            Object.entries(init.headers).forEach(([key, value]) => {
              this.headers.set(key, Array.isArray(value) ? value.join(', ') : String(value))
            })
          }
        }
      }
      
      static redirect(url: string | URL, status?: number) {
        const response = new NextResponse()
        const locationUrl = typeof url === 'string' ? url : url.toString()
        response.url = locationUrl
        response.status = status || 307
        response.headers.set('location', locationUrl)
        return response
      }
      
      static json(data: any, init?: ResponseInit) {
        const response = new NextResponse(JSON.stringify(data), init)
        response.headers.set('content-type', 'application/json')
        return response
      }
      
      static next() {
        const response = new NextResponse()
        return response
      }
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