# Conference Hub Implementation Plan: Facility Manager & Super Admin Features

This document outlines a comprehensive, step-by-step implementation plan for adding Facility Manager and Super Admin features to the Conference Hub application.

## Table of Contents

1. [Database Schema Updates](#1-database-schema-updates)
2. [Type Definitions Updates](#2-type-definitions-updates)
3. [Backend API Functions](#3-backend-api-functions)
4. [API Endpoints](#4-api-endpoints)
5. [Frontend Implementation](#5-frontend-implementation)
   - [Facility Manager Dashboard](#51-facility-manager-dashboard)
   - [Super Admin Dashboard](#52-super-admin-dashboard)
6. [Notifications System Enhancement](#6-notifications-system-enhancement)
7. [Authentication & Authorization Updates](#7-authentication--authorization-updates)
8. [Implementation Strategy & Timeline](#8-implementation-strategy--timeline)
9. [Key Considerations](#9-key-considerations)

## 1. Database Schema Updates

### Step 1.1: Create Facilities Table

```sql
CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Step 1.2: Create Facility Managers Table

```sql
CREATE TABLE facility_managers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(facility_id, user_id)
);
```

### Step 1.3: Update Users Table

```sql
-- Update the existing role enum to include new roles
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('user', 'admin', 'facility_manager', 'super_admin'));
```

### Step 1.4: Update Rooms Table

```sql
ALTER TABLE rooms ADD COLUMN facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL;
```

### Step 1.5: Create Reports Table

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  parameters JSONB,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Step 1.6: Set Up Row Level Security (RLS)

```sql
-- Facility RLS
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can do everything with facilities"
  ON facilities FOR ALL
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin'));

CREATE POLICY "Facility managers can view their facilities"
  ON facilities FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM facility_managers WHERE facility_id = id));

-- Room RLS updates
CREATE POLICY "Facility managers can manage rooms in their facilities"
  ON rooms FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM facility_managers WHERE facility_id = rooms.facility_id));

-- Booking RLS updates
CREATE POLICY "Facility managers can view and manage bookings for their facilities' rooms"
  ON bookings FOR ALL
  USING (room_id IN (SELECT id FROM rooms WHERE facility_id IN 
    (SELECT facility_id FROM facility_managers WHERE user_id = auth.uid())));
```

### Step 1.7: Create Migration Script

Create a file called `facility_manager_migration.sql` with all the above SQL statements and apply it to your Supabase database.

## 2. Type Definitions Updates

### Step 2.1: Update User Type

```typescript
// types/index.ts
export interface User {
  id: string
  name: string
  email: string
  role: "super_admin" | "admin" | "facility_manager" | "user"
  department: string
  position: string
  phone?: string
  profile_image?: string
  date_created: string
  last_login: string
}
```

### Step 2.2: Create Facility Type

```typescript
// types/index.ts
export interface Facility {
  id: string
  name: string
  location: string
  description?: string
  created_at: string
  updated_at: string
}
```

### Step 2.3: Update Room Type

```typescript
// types/index.ts
export interface Room {
  id: string
  name: string
  location: string
  capacity: number
  room_resources?: string[]
  resources?: string[] // For compatibility with form data
  status: "available" | "maintenance" | "reserved"
  image?: string
  description?: string
  resourceDetails?: Resource[]
  facility_id: string // New field
}
```

### Step 2.4: Create Report Type

```typescript
// types/index.ts
export interface Report {
  id: string
  name: string
  type: "room_utilization" | "booking_trends" | "user_activity"
  parameters: any
  created_by: string
  created_at: string
}
```

### Step 2.5: Create FacilityManager Type

```typescript
// types/index.ts
export interface FacilityManager {
  id: string
  facility_id: string
  user_id: string
  assigned_at: string
  facility?: Facility
  user?: User
}
```

## 3. Backend API Functions

### Step 3.1: Create Facility Functions

```typescript
// lib/supabase-data.ts

// Get all facilities
export async function getFacilities(): Promise<Facility[]> {
  try {
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      
    if (error) {
      console.error('Error fetching facilities:', error)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('Exception in getFacilities:', error)
    throw error
  }
}

// Get facility by ID
export async function getFacilityById(id: string): Promise<Facility | null> {
  try {
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .eq('id', id)
      .single()
      
    if (error) {
      console.error(`Error fetching facility ${id}:`, error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Exception in getFacilityById:', error)
    throw error
  }
}

// Create facility
export async function createFacility(facilityData: Omit<Facility, 'id' | 'created_at' | 'updated_at'>): Promise<Facility> {
  try {
    const { data, error } = await supabase
      .from('facilities')
      .insert({
        name: facilityData.name,
        location: facilityData.location,
        description: facilityData.description
      })
      .select()
      .single()
      
    if (error) {
      console.error('Error creating facility:', error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Exception in createFacility:', error)
    throw error
  }
}

// Update facility
export async function updateFacility(id: string, facilityData: Partial<Facility>): Promise<Facility> {
  try {
    const { data, error } = await supabase
      .from('facilities')
      .update({
        name: facilityData.name,
        location: facilityData.location,
        description: facilityData.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
      
    if (error) {
      console.error(`Error updating facility ${id}:`, error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Exception in updateFacility:', error)
    throw error
  }
}

// Delete facility
export async function deleteFacility(id: string): Promise<boolean> {
  try {
    // Check if there are any rooms in this facility
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id')
      .eq('facility_id', id)
      .limit(1)
      
    if (roomsError) {
      console.error(`Error checking rooms for facility ${id}:`, roomsError)
      throw roomsError
    }
    
    if (rooms && rooms.length > 0) {
      throw new Error('Cannot delete facility with existing rooms. Delete or reassign rooms first.')
    }
    
    const { error } = await supabase
      .from('facilities')
      .delete()
      .eq('id', id)
      
    if (error) {
      console.error(`Error deleting facility ${id}:`, error)
      throw error
    }
    
    return true
  } catch (error) {
    console.error('Exception in deleteFacility:', error)
    throw error
  }
}
```

### Step 3.2: Create Facility Manager Functions

```typescript
// lib/supabase-data.ts

// Assign facility manager
export async function assignFacilityManager(facilityId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('facility_managers')
      .insert({
        facility_id: facilityId,
        user_id: userId
      })
      
    if (error) {
      console.error(`Error assigning manager ${userId} to facility ${facilityId}:`, error)
      throw error
    }
    
    return true
  } catch (error) {
    console.error('Exception in assignFacilityManager:', error)
    throw error
  }
}

// Remove facility manager
export async function removeFacilityManager(facilityId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('facility_managers')
      .delete()
      .eq('facility_id', facilityId)
      .eq('user_id', userId)
      
    if (error) {
      console.error(`Error removing manager ${userId} from facility ${facilityId}:`, error)
      throw error
    }
    
    return true
  } catch (error) {
    console.error('Exception in removeFacilityManager:', error)
    throw error
  }
}

// Get facility managers
export async function getFacilityManagers(facilityId: string): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('facility_managers')
      .select(`
        user_id,
        users:user_id (*)
      `)
      .eq('facility_id', facilityId)
      
    if (error) {
      console.error(`Error fetching managers for facility ${facilityId}:`, error)
      throw error
    }
    
    return data.map(item => item.users) || []
  } catch (error) {
    console.error('Exception in getFacilityManagers:', error)
    throw error
  }
}

// Get user managed facilities
export async function getUserManagedFacilities(userId: string): Promise<Facility[]> {
  try {
    const { data, error } = await supabase
      .from('facility_managers')
      .select(`
        facility_id,
        facilities:facility_id (*)
      `)
      .eq('user_id', userId)
      
    if (error) {
      console.error(`Error fetching facilities managed by user ${userId}:`, error)
      throw error
    }
    
    return data.map(item => item.facilities) || []
  } catch (error) {
    console.error('Exception in getUserManagedFacilities:', error)
    throw error
  }
}
```

### Step 3.3: Create Report Functions

```typescript
// lib/supabase-data.ts

// Generate room utilization report
export async function generateRoomUtilizationReport(
  startDate: string, 
  endDate: string, 
  facilityId?: string
): Promise<any> {
  try {
    let query = supabase
      .from('bookings')
      .select(`
        id,
        room_id,
        start_time,
        end_time,
        status,
        rooms:room_id (
          id,
          name,
          facility_id
        )
      `)
      .gte('start_time', startDate)
      .lte('end_time', endDate)
      .in('status', ['confirmed', 'pending'])
    
    if (facilityId) {
      query = query.eq('rooms.facility_id', facilityId)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error generating room utilization report:', error)
      throw error
    }
    
    // Process data to calculate utilization
    const roomUtilization: Record<string, any> = {}
    
    data.forEach(booking => {
      const roomId = booking.room_id
      const roomName = booking.rooms.name
      
      if (!roomUtilization[roomId]) {
        roomUtilization[roomId] = {
          id: roomId,
          name: roomName,
          totalBookings: 0,
          totalHours: 0,
          facility_id: booking.rooms.facility_id
        }
      }
      
      roomUtilization[roomId].totalBookings++
      
      const start = new Date(booking.start_time)
      const end = new Date(booking.end_time)
      const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      
      roomUtilization[roomId].totalHours += durationHours
    })
    
    return Object.values(roomUtilization)
  } catch (error) {
    console.error('Exception in generateRoomUtilizationReport:', error)
    throw error
  }
}

// Generate booking trends report
export async function generateBookingTrendsReport(
  startDate: string, 
  endDate: string, 
  facilityId?: string
): Promise<any> {
  try {
    let query = supabase
      .from('bookings')
      .select(`
        id,
        room_id,
        start_time,
        end_time,
        status,
        rooms:room_id (
          id,
          name,
          facility_id
        )
      `)
      .gte('start_time', startDate)
      .lte('end_time', endDate)
    
    if (facilityId) {
      query = query.eq('rooms.facility_id', facilityId)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error generating booking trends report:', error)
      throw error
    }
    
    // Process data to calculate trends by day and hour
    const bookingsByDay: Record<string, number> = {}
    const bookingsByHour: Record<string, number> = {}
    const statusCounts: Record<string, number> = {}
    
    data.forEach(booking => {
      const start = new Date(booking.start_time)
      const day = start.toLocaleDateString('en-US', { weekday: 'long' })
      const hour = start.getHours()
      
      // Count by day
      bookingsByDay[day] = (bookingsByDay[day] || 0) + 1
      
      // Count by hour
      bookingsByHour[hour] = (bookingsByHour[hour] || 0) + 1
      
      // Count by status
      statusCounts[booking.status] = (statusCounts[booking.status] || 0) + 1
    })
    
    return {
      bookingsByDay,
      bookingsByHour,
      statusCounts,
      totalBookings: data.length
    }
  } catch (error) {
    console.error('Exception in generateBookingTrendsReport:', error)
    throw error
  }
}

// Save report
export async function saveReport(
  reportData: Omit<Report, 'id' | 'created_at'>
): Promise<Report> {
  try {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        name: reportData.name,
        type: reportData.type,
        parameters: reportData.parameters,
        created_by: reportData.created_by
      })
      .select()
      .single()
      
    if (error) {
      console.error('Error saving report:', error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Exception in saveReport:', error)
    throw error
  }
}

// Get saved reports
export async function getSavedReports(): Promise<Report[]> {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      
    if (error) {
      console.error('Error fetching saved reports:', error)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('Exception in getSavedReports:', error)
    throw error
  }
}
```

### Step 3.4: Create Super Admin Functions

```typescript
// lib/supabase-data.ts

// Update user role
export async function updateUserRole(userId: string, role: User['role']): Promise<User> {
  try {
    const adminClient = createAdminClient()
    
    const { data, error } = await adminClient
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single()
      
    if (error) {
      console.error(`Error updating role for user ${userId}:`, error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Exception in updateUserRole:', error)
    throw error
  }
}

// Get system stats
export async function getSystemStats(): Promise<any> {
  try {
    const adminClient = createAdminClient()
    
    const [
      { count: userCount, error: userError },
      { count: facilityCount, error: facilityError },
      { count: roomCount, error: roomError },
      { count: bookingCount, error: bookingError }
    ] = await Promise.all([
      adminClient.from('users').select('*', { count: 'exact', head: true }),
      adminClient.from('facilities').select('*', { count: 'exact', head: true }),
      adminClient.from('rooms').select('*', { count: 'exact', head: true }),
      adminClient.from('bookings').select('*', { count: 'exact', head: true })
    ])
    
    if (userError || facilityError || roomError || bookingError) {
      console.error('Error fetching system stats:', userError || facilityError || roomError || bookingError)
      throw userError || facilityError || roomError || bookingError
    }
    
    // Get user growth data
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: userGrowth, error: growthError } = await adminClient
      .from('users')
      .select('date_created')
      .gte('date_created', thirtyDaysAgo.toISOString())
    
    if (growthError) {
      console.error('Error fetching user growth data:', growthError)
      throw growthError
    }
    
    // Process user growth by day
    const usersByDay: Record<string, number> = {}
    userGrowth?.forEach(user => {
      const day = new Date(user.date_created).toISOString().split('T')[0]
      usersByDay[day] = (usersByDay[day] || 0) + 1
    })
    
    return {
      totalUsers: userCount,
      totalFacilities: facilityCount,
      totalRooms: roomCount,
      totalBookings: bookingCount,
      userGrowth: usersByDay
    }
  } catch (error) {
    console.error('Exception in getSystemStats:', error)
    throw error
  }
}
```

## 4. API Endpoints

### Step 4.1: Create Facilities API Endpoints

```typescript
// app/api/facilities/route.ts
import { NextResponse } from 'next/server'
import { createFacility, getFacilities } from '@/lib/supabase-data'

export async function GET() {
  try {
    const facilities = await getFacilities()
    return NextResponse.json(facilities)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const facility = await createFacility(data)
    return NextResponse.json(facility)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

```typescript
// app/api/facilities/[id]/route.ts
import { NextResponse } from 'next/server'
import { getFacilityById, updateFacility, deleteFacility } from '@/lib/supabase-data'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const facility = await getFacilityById(params.id)
    if (!facility) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 404 })
    }
    return NextResponse.json(facility)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const facility = await updateFacility(params.id, data)
    return NextResponse.json(facility)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await deleteFacility(params.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

## 5. Frontend Implementation

### 5.1 Facility Manager Dashboard
- `/app/facility-manager/page.tsx`: Summary stats, pending requests, today's schedule, quick stats
- `/app/facility-manager/bookings/page.tsx`: All bookings, filters, approve/reject
- `/app/facility-manager/rooms/page.tsx`: All rooms, add/edit/delete
- `/app/facility-manager/resources/page.tsx`: All resources, add/edit/delete
- `/app/facility-manager/calendar/page.tsx`: Calendar view

### 5.2 Super Admin Dashboard
- `/app/super-admin/page.tsx`: System stats, activity feed, user growth
- `/app/super-admin/users/page.tsx`: All users, edit roles, activate/deactivate
- `/app/super-admin/facilities/page.tsx`: All facilities, add/edit/delete, assign managers
- `/app/super-admin/reports/page.tsx`: Generate/view/export reports
- `/app/super-admin/settings/page.tsx`: Global rules, notification management

## 6. Notifications System Enhancement
- Add new notification types: `facility_assignment`, `role_change`
- Add functions to notify facility managers and users of role changes
- Ensure real-time and email notifications for key events

## 7. Authentication & Authorization Updates
- Update auth context to support all roles
- Add role-based route protection (see previous code example)
- Ensure all API endpoints validate user roles and permissions

## 8. Implementation Strategy & Timeline

- **Phase 1:** Database & backend (Week 1)
- **Phase 2:** Facility Manager dashboard (Week 2)
- **Phase 3:** Super Admin dashboard (Week 3)
- **Phase 4:** Testing, bug fixes, optimization (Week 4)

## 9. Key Considerations
- Data access control: RLS, API validation
- Performance: pagination, query optimization
- User experience: consistent UI, responsive design
- Security: input validation, sensitive operation protection
- Notifications: real-time, email, in-app

## Conclusion

This plan provides a clear, actionable roadmap for implementing Facility Manager and Super Admin features in Conference Hub. Follow the steps, code, and best practices above for a robust, scalable solution.

You're on a strong path already — your schema, backend logic, and dashboard plan are very thorough. Since you want to integrate **Facility Manager** and **Super Admin** roles into your current system, here's a streamlined **implementation roadmap** to help bridge what you already have with what you want to achieve.

---

## ✅ Recommended Implementation Plan

---

### 🔁 1. Schema Migration Adjustments (from your current DB)

You're mostly there — just a few additions:

#### a. Update `users.role` enum

Your current enum only includes `'admin'` and `'user'`. Update it to support the facility manager:

```sql
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
ADD CONSTRAINT users_role_check CHECK (
  role IN ('admin', 'user', 'facility_manager')
);
```

#### b. Add `facilities` table

```sql
CREATE TABLE public.facilities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  location text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

#### c. Update `rooms` table to include `facility_id`

```sql
ALTER TABLE public.rooms
ADD COLUMN facility_id uuid REFERENCES public.facilities(id) ON DELETE SET NULL;
```

#### d. Create `facility_managers` table

```sql
CREATE TABLE public.facility_managers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_at timestamp with time zone DEFAULT now(),
  UNIQUE(facility_id, user_id)
);
```

#### e. (Optional) Create `reports` table

If you want usage reports:

```sql
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  type text NOT NULL,
  parameters jsonb,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);
```

---

### 🔐 2. Access Control Setup

#### a. Enable RLS on sensitive tables (optional, for Supabase)

If you're using Supabase and want tight data separation, use RLS policies for:

* `facilities`
* `rooms`
* `bookings`

Policies will allow facility managers to only see and manage their own assigned data.

---

### 🧠 3. Logic for Assigning & Resolving Roles

#### a. Assigning facility managers

Add backend API or admin dashboard functionality to:

* Select a user
* Select a facility
* Assign as manager by inserting into `facility_managers` table

#### b. Role-based access in frontend

Use your auth context to:

```ts
// utils/roles.ts
export const isFacilityManager = (user: User) => user.role === 'facility_manager';
export const isAdmin = (user: User) => user.role === 'admin';
```

And route-protect:

```ts
if (!isFacilityManager(user)) redirect('/unauthorized');
```

---

### 🧑‍💼 4. Facility Manager Pages (Recap with Suggested Routes)

| Feature   | Page                          | Purpose                                           |
| --------- | ----------------------------- | ------------------------------------------------- |
| Dashboard | `/facility-manager`           | Summary view (pending bookings, today's schedule) |
| Bookings  | `/facility-manager/bookings`  | View/manage bookings in their facility            |
| Rooms     | `/facility-manager/rooms`     | Add/edit/delete rooms                             |
| Resources | `/facility-manager/resources` | Manage resource inventory                         |
| Calendar  | `/facility-manager/calendar`  | Visual schedule of all rooms                      |

---

### 🧑‍⚖️ 5. Super Admin Pages (Recap with Suggested Routes)

| Feature    | Page                      | Purpose                            |
| ---------- | ------------------------- | ---------------------------------- |
| Dashboard  | `/super-admin`            | Overall stats and activity feed    |
| Users      | `/super-admin/users`      | View, edit roles, deactivate users |
| Facilities | `/super-admin/facilities` | Add/edit/delete, assign managers   |
| Reports    | `/super-admin/reports`    | Generate reports and export        |
| Settings   | `/super-admin/settings`   | Global app settings                |

---

### 📬 6. Notifications Updates

#### Add these types to your enum:

```sql
ALTER TYPE notification_type ADD VALUE 'role_change';
ALTER TYPE notification_type ADD VALUE 'facility_assignment';
```

#### Update notification logic in backend:

When a user is promoted to facility manager or assigned a facility, send:

* In-app notification
* Email (if desired)

---

### 🔐 7. Auth & Middleware Protection

#### In middleware:

```ts
// middleware.ts
if (pathname.startsWith('/super-admin') && user.role !== 'admin') {
  return redirect('/unauthorized');
}
if (pathname.startsWith('/facility-manager') && user.role !== 'facility_manager') {
  return redirect('/unauthorized');
}
```

---

### 🛠️ 8. Development Strategy

#### Week 1: Backend & Database

* Finalize DB schema
* Implement Supabase logic
* Create API endpoints

#### Week 2: Facility Manager Dashboard

* Build UI
* Connect endpoints
* Test role logic

#### Week 3: Super Admin Dashboard

* Build UI
* Enable role/permission control
* Add stats & reports

#### Week 4: QA & Optimization

* Add RLS (optional)
* Notification polish
* Final styling/responsiveness

---

### 🧠 Pro Tips

* Use **Supabase Admin API** (server-side) for updating roles.
* Add a **facility\_id field to rooms** and propagate all queries to filter based on that for facility manager views.
* Consider creating **reusable table and form components** to avoid repetition across dashboards.

---

If you like, I can help you next by:

1. Writing your `facility_managers` page routes.
2. Helping with Supabase RLS policy code.
3. Suggesting UI wireframes or React components.

Would you like that?
