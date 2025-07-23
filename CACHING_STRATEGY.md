# Conference Hub Caching Strategy

This document outlines the caching strategy implemented in the Conference Hub application to improve performance, reduce redundant data fetching, and provide a better user experience.

## Overview

The Conference Hub application implements a multi-layered caching strategy to optimize performance:

1. **Client-side caching** using React Query for data fetching and state management
2. **API-level caching** using HTTP cache headers and ETags
3. **Component-level optimizations** to prevent unnecessary re-renders

## Caching Layers

### 1. Client-side Caching with React Query

We use [TanStack Query](https://tanstack.com/query) (React Query) as our primary client-side caching solution. React Query provides:

- Automatic caching of API responses
- Background refetching of stale data
- Cache invalidation when data changes
- Deduplication of requests
- Retry logic for failed requests

#### Key Configuration:

- **Default stale time**: 5 minutes (data is considered fresh for 5 minutes)
- **Default cache time**: 1 hour (data is kept in cache for 1 hour)
- **Retry failed queries**: 1 time
- **Refetch on window focus**: Disabled by default

#### Cache Keys:

We use the following cache key structure:
- `['rooms']` - For all rooms
- `['rooms', roomId]` - For a specific room
- `['facilities']` - For all facilities
- `['resources']` - For all resources
- `['bookings', 'user', userId]` - For user-specific bookings

### 2. API-level Caching

API routes include HTTP cache headers to enable browser and CDN caching:

#### Cache Control Headers:

- **Static data** (facilities): `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`
- **Semi-static data** (rooms, resources): `Cache-Control: public, max-age=300, stale-while-revalidate=3600`
- **Dynamic data** (bookings): `Cache-Control: public, max-age=60, stale-while-revalidate=300`
- **Private data** (user bookings): `Cache-Control: private, max-age=60, must-revalidate`

#### ETag Support:

API endpoints include ETag headers for conditional requests, allowing clients to skip downloading unchanged data.

### 3. Cache Invalidation

Cache invalidation occurs when data changes:

1. **Automatic invalidation**: React Query automatically invalidates related queries when mutations occur
2. **Manual invalidation**: Triggered after operations like creating/updating/deleting rooms, bookings, etc.
3. **Time-based invalidation**: Stale data is automatically refetched after the stale time expires

## Role-Based Considerations

The caching strategy respects different user roles:

- **Admin**: Can see and modify all data, cache invalidation occurs when admins make changes
- **Facility Manager**: Can only see and modify their assigned facilities, cache is scoped to their permissions
- **User**: Can only see public data and their own bookings, private data is never cached across users

## Implementation Details

### Custom Hooks

We've created custom hooks for data fetching with appropriate caching strategies:

- `useRooms()` - Fetches and caches all rooms
- `useRoom(roomId)` - Fetches and caches a specific room
- `useFacilities()` - Fetches and caches all facilities
- `useResources()` - Fetches and caches all resources
- `useUserBookings(userId)` - Fetches and caches bookings for a specific user
- `useCreateBooking()` - Creates a booking and invalidates relevant caches
- `useCancelBooking()` - Cancels a booking and invalidates relevant caches

### API Cache Headers

API routes include cache headers based on the data type:

```typescript
// Example of API route with cache headers
export async function GET(request: NextRequest) {
  const data = await fetchData()
  let response = NextResponse.json(data)
  response = addCacheHeaders(response, cacheConfig.semiStatic)
  return response
}
```

## Performance Benefits

This caching strategy provides several performance benefits:

1. **Reduced API calls**: Identical API calls are deduplicated and cached
2. **Faster page loads**: Cached data is available immediately
3. **Lower server load**: Fewer requests hit the server and database
4. **Better user experience**: UI updates are immediate with optimistic updates
5. **Bandwidth savings**: Conditional requests avoid downloading unchanged data

## Maintenance and Extension

When adding new features to the application:

1. **New data types**: Create a new custom hook in `hooks/use-cached-data.ts`
2. **New API endpoints**: Add appropriate cache headers using `addCacheHeaders` from `lib/api-cache.ts`
3. **New mutations**: Implement cache invalidation in the mutation's `onSuccess` callback

## Monitoring and Debugging

- React Query DevTools are available in development mode to inspect cache state
- Cache hits/misses can be monitored in the browser's Network tab
- ETags and cache headers can be inspected in the Network tab's Headers section

## Security Considerations

- User-specific data uses `private` cache control to prevent sharing across users
- Authentication tokens are never cached
- Sensitive data is never stored in browser storage

## Future Improvements

Potential future improvements to the caching strategy:

1. **Server-side caching**: Implement Redis caching for API responses
2. **Persistent cache**: Add persistence to React Query cache for offline support
3. **Prefetching**: Implement prefetching of likely-to-be-needed data
4. **Cache analytics**: Add monitoring of cache hit/miss rates 