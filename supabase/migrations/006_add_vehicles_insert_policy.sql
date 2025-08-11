-- Add INSERT policy for vehicles table
-- Since the app doesn't have user authentication yet, we'll allow public inserts
-- This should be restricted once proper authentication is implemented

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow public insert on vehicles" ON vehicles;
DROP POLICY IF EXISTS "Allow public update on vehicles" ON vehicles;
DROP POLICY IF EXISTS "Allow public delete on vehicles" ON vehicles;

-- Create new policies
CREATE POLICY "Allow public insert on vehicles" ON vehicles 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on vehicles" ON vehicles 
FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on vehicles" ON vehicles 
FOR DELETE USING (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'vehicles';