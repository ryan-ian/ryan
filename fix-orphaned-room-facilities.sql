-- Fix orphaned room facility references
-- This script identifies and fixes rooms that reference non-existent facilities

-- First, let's see what we're dealing with
SELECT 
    r.id as room_id,
    r.name as room_name,
    r.facility_id,
    r.facility_name,
    CASE 
        WHEN f.id IS NULL THEN 'MISSING'
        ELSE 'EXISTS'
    END as facility_status
FROM rooms r
LEFT JOIN facilities f ON r.facility_id = f.id
WHERE f.id IS NULL;

-- Option 1: Create a default facility for orphaned rooms
INSERT INTO facilities (id, name, location, description, created_at, updated_at)
VALUES (
    'a2311611-cb0d-4c1a-b318-eee95f507485',
    'Default Facility', 
    'Main Campus',
    'Default facility created to fix orphaned room references',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Option 2: If you prefer to create a new facility and update rooms
-- First create a new facility
-- INSERT INTO facilities (id, name, location, description, created_at, updated_at)
-- VALUES (
--     gen_random_uuid(),
--     'Main Facility', 
--     'Campus Building A',
--     'Main facility for conference rooms',
--     NOW(),
--     NOW()
-- );

-- Then update orphaned rooms to use the new facility
-- UPDATE rooms 
-- SET facility_id = (SELECT id FROM facilities WHERE name = 'Main Facility' LIMIT 1)
-- WHERE facility_id = 'a2311611-cb0d-4c1a-b318-eee95f507485';

-- Verify the fix
SELECT 
    r.id as room_id,
    r.name as room_name,
    r.facility_id,
    f.name as facility_name,
    f.location as facility_location
FROM rooms r
LEFT JOIN facilities f ON r.facility_id = f.id
WHERE r.facility_id = 'a2311611-cb0d-4c1a-b318-eee95f507485';
