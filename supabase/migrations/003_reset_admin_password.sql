-- Reset admin password
-- This will set the admin password to 'admin123' with a fresh bcrypt hash

-- Delete existing admin user if it exists and recreate with correct hash
DELETE FROM users WHERE email = 'admin@stppl.org';

-- Insert admin user with correct bcrypt hash for 'admin123'
INSERT INTO users (id, email, password_hash, name, role, department, status) 
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'admin@stppl.org',
    '$2b$12$LQv3c1yqBWVHxkd0LQ4bEeCnTNt5K/L4/ZQ8m7TRJx4K8GXjY5W5K',
    'System Administrator',
    'admin',
    'all',
    'active'
);

-- Verify the user was created
SELECT id, email, name, role, department, status FROM users WHERE email = 'admin@stppl.org';