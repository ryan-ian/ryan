-- Make Sam a facility manager and assign to College of Science
-- Sam's ID: 42c77b95-82ac-4a04-8306-96c4aa645425
-- College of Science ID: a2311611-cb0d-4c1a-b318-eee95f507485

-- Step 1: Update Sam's role to facility_manager
UPDATE users 
SET role = 'facility_manager' 
WHERE id = '42c77b95-82ac-4a04-8306-96c4aa645425';

-- Step 2: Assign Sam as manager of College of Science
-- (This will remove Mills as manager and make Sam the manager)
UPDATE facilities 
SET manager_id = '42c77b95-82ac-4a04-8306-96c4aa645425' 
WHERE id = 'a2311611-cb0d-4c1a-b318-eee95f507485';

-- Verification queries (run these to check the changes)
SELECT 'Updated User:' as check_type, name, email, role FROM users WHERE id = '42c77b95-82ac-4a04-8306-96c4aa645425'
UNION ALL
SELECT 'Updated Facility:', f.name, u.email, 'manager_assigned' 
FROM facilities f 
JOIN users u ON f.manager_id = u.id 
WHERE f.id = 'a2311611-cb0d-4c1a-b318-eee95f507485';
