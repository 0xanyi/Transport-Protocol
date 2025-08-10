-- Migration: Add User Management System
-- Run this if you already have existing tables

-- Create new ENUM types (skip if they already exist)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'coordinator', 'team_head', 'driver');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE department_type AS ENUM ('hospitality', 'lounge', 'transport', 'operations', 'all');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'driver',
    department department_type NOT NULL DEFAULT 'transport',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add user_id column to drivers table (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'drivers' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE drivers ADD COLUMN user_id UUID REFERENCES users(id);
    END IF;
END $$;

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(role, department);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);

-- Create trigger for users updated_at
DO $$ BEGIN
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
DO $$ BEGIN
    CREATE POLICY "Users can read own data" ON users 
    FOR SELECT USING (auth.uid()::text = id::text);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can manage all users" ON users 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Insert default admin user (password hash for 'admin123')
-- Note: You should change this password in production
INSERT INTO users (id, email, password_hash, name, role, department, status) 
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'admin@stppl.org',
    '$2b$10$rQ8K4Zf3yY7HxTzF9FqJHu5b3xS6w8vN4cR5jL7mD9tW2pE1oQ3xK',
    'System Administrator',
    'admin',
    'all',
    'active'
) ON CONFLICT (email) DO NOTHING;