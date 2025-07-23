import { NextResponse } from 'next/server'

type CacheControlOptions = {
  public?: boolean
  maxAge?: number // in seconds
  staleWhileRevalidate?: number // in seconds
  mustRevalidate?: boolean
}

/**
 * Adds cache control headers to a NextResponse object
 * @param response NextResponse object
 * @param options Cache control options
 * @returns NextResponse with cache headers
 */
export function addCacheHeaders(
  response: NextResponse,
  options: CacheControlOptions
): NextResponse {
  const directives: string[] = []

  if (options.public) {
    directives.push('public')
  } else {
    directives.push('private')
  }

  if (options.maxAge !== undefined) {
    directives.push(`max-age=${options.maxAge}`)
  }

  if (options.staleWhileRevalidate !== undefined) {
    directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`)
  }

  if (options.mustRevalidate) {
    directives.push('must-revalidate')
  }

  const cacheControl = directives.join(', ')
  response.headers.set('Cache-Control', cacheControl)

  return response
}

/**
 * Adds ETag header to a NextResponse object for conditional requests
 * @param response NextResponse object
 * @param data The data to generate ETag from
 * @returns NextResponse with ETag header
 */
export function addETag(response: NextResponse, data: any): NextResponse {
  const etag = generateETag(data)
  response.headers.set('ETag', etag)
  return response
}

/**
 * Generates a simple ETag from data
 * @param data Any data to generate ETag from
 * @returns ETag string
 */
function generateETag(data: any): string {
  // Simple implementation - in production, use a more robust hashing algorithm
  const str = typeof data === 'string' ? data : JSON.stringify(data)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return `"${hash.toString(16)}"`
}

/**
 * Cache configurations for different resource types
 */
export const cacheConfig = {
  // Static data that rarely changes
  static: {
    public: true,
    maxAge: 3600, // 1 hour
    staleWhileRevalidate: 86400, // 1 day
  },
  
  // Semi-static data that changes occasionally
  semiStatic: {
    public: true,
    maxAge: 300, // 5 minutes
    staleWhileRevalidate: 3600, // 1 hour
  },
  
  // Dynamic data that changes frequently but can still be cached briefly
  dynamic: {
    public: true,
    maxAge: 60, // 1 minute
    staleWhileRevalidate: 300, // 5 minutes
  },
  
  // User-specific data that should not be cached publicly
  private: {
    public: false,
    maxAge: 60, // 1 minute
    mustRevalidate: true,
  },
  
  // No caching
  noCache: {
    public: false,
    maxAge: 0,
    mustRevalidate: true,
  },
} 