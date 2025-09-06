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
      public _body?: string
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
        this._body = typeof body === 'string' ? body : body ? String(body) : undefined
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

      // Add Response-like methods for API testing
      async json() {
        if (this._body) {
          return JSON.parse(this._body)
        }
        throw new Error('No body to parse as JSON')
      }

      async text() {
        return this._body || ''
      }

      async arrayBuffer() {
        const text = this._body || ''
        return new TextEncoder().encode(text).buffer
      }

      clone() {
        const cloned = new NextResponse(this._body)
        cloned.status = this.status
        cloned.url = this.url
        // Copy headers
        this.headers.forEach((value, key) => {
          cloned.headers.set(key, value)
        })
        return cloned
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
        const bodyString = JSON.stringify(data)
        const response = new NextResponse(bodyString, init)
        response.headers.set('content-type', 'application/json')
        response._body = bodyString
        return response
      }
      
      static next() {
        const response = new NextResponse()
        return response
      }
    },
    NextRequest: class NextRequest {
      public url: string
      public _body?: string
      public method: string = 'GET'
      public headers: Headers
      public nextUrl: URL

      constructor(url: string, init?: RequestInit) {
        this.url = url
        this.method = init?.method || 'GET'
        this.headers = init?.headers ? new Headers(init.headers) : new Headers()
        this.nextUrl = new URL(this.url)
        
        // Store body for later JSON parsing
        if (init?.body) {
          this._body = typeof init.body === 'string' ? init.body : String(init.body)
        }
      }
      
      cookies = { get: () => undefined }

      // Add Request-like methods for API testing
      async json() {
        if (this._body) {
          return JSON.parse(this._body)
        }
        throw new Error('No body to parse as JSON')
      }

      async text() {
        return this._body || ''
      }

      async arrayBuffer() {
        const text = this._body || ''
        return new TextEncoder().encode(text).buffer
      }
    }
  }
})

// Note: next/navigation mocking is handled in test/setup.ts