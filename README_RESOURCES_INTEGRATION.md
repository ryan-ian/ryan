# Room Resources Integration

This feature allows administrators to select multiple resources from the available resources table when creating or editing a room.

## Changes Made

1. **Updated Room Type**
   - Added a `resources` field to the `Room` interface in `types/index.ts`

2. **Updated Room Creation Form**
   - Added a multi-select component using checkboxes in `app/admin/conference/rooms/new/page.tsx`
   - Added state to track selected resources
   - Fetches available resources from the API
   - Includes selected resources in form submission

3. **Updated Room Edit Form**
   - Added the same multi-select component in `app/admin/conference/rooms/[id]/edit/page.tsx`
   - Loads existing resources for the room
   - Allows adding/removing resources

4. **Updated Room Detail View**
   - Added a section to display selected resources in `app/admin/conference/rooms/[id]/page.tsx`
   - Fetches resource details to show names and types

5. **Updated API Functions**
   - Modified `createRoom` and `updateRoom` functions in `lib/supabase-data.ts` to include resources

6. **Database Schema Update**
   - Created SQL script `update_rooms_schema.sql` to add a resources column to the rooms table

## How to Update the Database

To update your Supabase database schema, you need to run the SQL script in the Supabase SQL editor:

1. Log in to your Supabase dashboard
2. Select your project
3. Go to the SQL Editor
4. Copy the contents of `update_rooms_schema.sql`
5. Paste into the SQL Editor and run the script

The script will:
- Add a `resources` column to the `rooms` table if it doesn't exist
- Update the Row Level Security (RLS) policies to ensure proper access control

## Usage

When creating or editing a room, administrators will now see a section labeled "Available Resources" with checkboxes for each resource. They can select multiple resources to associate with the room.

The selected resources will be displayed on the room detail page, showing the resource name and type.

## Technical Notes

- Resources are stored as an array of resource IDs in the `resources` column of the `rooms` table
- The relationship between rooms and resources is a many-to-many relationship
- The UI uses checkboxes for a simple multi-select interface
- Resources are fetched asynchronously to avoid blocking the UI 