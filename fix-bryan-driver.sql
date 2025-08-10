-- Fix Bryan's driver record to link with his user account and mark as approved
UPDATE drivers 
SET 
    status = 'approved',
    user_id = 'a09c353d-3907-4efe-baee-1259c573467a'
WHERE 
    email = 'ibryanhusman@me.com';

-- Verify the update
SELECT 
    d.id as driver_id,
    d.name,
    d.email,
    d.status,
    d.user_id,
    u.id as user_account_id,
    u.role
FROM drivers d
LEFT JOIN users u ON d.user_id = u.id
WHERE d.email = 'ibryanhusman@me.com';