-- Migration: Add INSERT policy for VIPs table
-- This allows users to create new VIP entries

-- Add INSERT policy for VIPs
CREATE POLICY "Allow public insert on vips" ON vips 
FOR INSERT WITH CHECK (true);

-- Add UPDATE policy for VIPs (in case editing is needed later)
CREATE POLICY "Allow public update on vips" ON vips 
FOR UPDATE USING (true);

-- Add DELETE policy for VIPs (in case deletion is needed later)
CREATE POLICY "Allow public delete on vips" ON vips 
FOR DELETE USING (true);