---
type: "manual"
---

# Data Models

This document outlines the core data models used in the Conference Hub application. Understanding these models is essential for maintaining data integrity and implementing features correctly.

## User Model

```typescript
interface User {
  id: string                // UUID from Supabase auth
  name: string              // Full name of the user
  email: string             // Email address (unique)
  role: "admin" | "user"    // Role for access control
  department: string        // Department within organization
  position: string          // Job title/position
  phone?: string            // Optional phone number
  profileImage?: string     // Optional profile image URL
  dateCreated: string       // ISO timestamp of account creation
  lastLogin: string         // ISO timestamp of last login
}
```

**Key Relationships:**
- One-to-many relationship with Bookings (a user can have multiple bookings)

**Access Control:**
- Regular users can only view and edit their own profiles
- Admin users can view and edit all user profiles

## Room Model

```typescript
interface Room {
  id: string                                      // UUID primary key
  name: string                                    // Room name (e.g., "Boardroom A")
  location: string                                // Physical location (e.g., "3rd Floor, East Wing")
  capacity: number                                // Maximum number of people
  features: string[]                              // Array of room features (e.g., ["projector", "whiteboard"])
  status: "available" | "maintenance" | "reserved" // Current room status
  image?: string                                  // Optional room image URL
  description?: string                            // Optional detailed description
  resources?: string[]                            // Optional array of resource IDs
}
```

**Key Relationships:**
- One-to-many relationship with Bookings (a room can have multiple bookings)
- Many-to-many relationship with Resources (a room can have multiple resources)

**Access Control:**
- All users can view room information
- Only admin users can create, update, or delete rooms

## Booking Model

```typescript
interface Booking {
  id: string                                  // UUID primary key
  roomId: string                              // Foreign key to Room
  userId: string                              // Foreign key to User
  title: string                               // Meeting title
  description?: string                        // Optional meeting description
  startTime: string                           // ISO timestamp for start time
  endTime: string                             // ISO timestamp for end time
  attendees?: string[]                        // Optional array of attendee emails/names
  status: "pending" | "confirmed" | "cancelled" // Booking status
  resources?: string[]                        // Optional array of resource IDs
  createdAt: string                           // ISO timestamp of creation
  updatedAt: string                           // ISO timestamp of last update
}
```

**Key Relationships:**
- Many-to-one relationship with User (many bookings can belong to one user)
- Many-to-one relationship with Room (many bookings can be for one room)
- Many-to-many relationship with Resources (a booking can use multiple resources)

**Access Control:**
- Users can create bookings and view/edit their own bookings
- Admin users can view and manage all bookings

## Resource Model

```typescript
interface Resource {
  id: string                                        // UUID primary key
  name: string                                      // Resource name (e.g., "Projector")
  type: string                                      // Resource type/category
  status: "available" | "in-use" | "maintenance"    // Current resource status
  description?: string                              // Optional detailed description
}
```

**Key Relationships:**
- Many-to-many relationship with Rooms (a resource can be assigned to multiple rooms)
- Many-to-many relationship with Bookings (a resource can be used in multiple bookings)

**Access Control:**
- All users can view resource information
- Only admin users can create, update, or delete resources

## AuthUser Model (Simplified User Model)

```typescript
interface AuthUser {
  id: string              // UUID from Supabase auth
  name: string            // Full name of the user
  email: string           // Email address
  role: "admin" | "user"  // Role for access control
  department: string      // Department within organization
  position: string        // Job title/position
}
```

This simplified user model is used specifically for authentication contexts to reduce payload size and improve performance.

## Database Schema

The application uses Supabase (PostgreSQL) with the following tables:

1. `users` - Stores user profile information linked to Supabase auth
2. `rooms` - Stores room information
3. `bookings` - Stores booking information
4. `resources` - Stores resource information

Row Level Security (RLS) policies are implemented to enforce access control at the database level, ensuring users can only access data they are authorized to see. 