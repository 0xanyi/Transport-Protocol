-- Fix admin password with correct bcrypt hash
-- Generated using bcryptjs with 12 salt rounds for password 'admin123'

UPDATE users 
SET password_hash = '$2b$12$KkMuzEuU.SZivG9KWAsoCeZGjWk1NTehnweigqFHxEKTBoND7Swo6'
WHERE email = 'admin@stppl.org';

-- Verify the update
SELECT email, name, role, 
       CASE WHEN password_hash = '$2b$12$KkMuzEuU.SZivG9KWAsoCeZGjWk1NTehnweigqFHxEKTBoND7Swo6' 
            THEN 'Hash Updated ✓' 
            ELSE 'Hash NOT Updated ✗' 
       END as password_status
FROM users 
WHERE email = 'admin@stppl.org';