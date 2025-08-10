-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types (skip if they already exist)
DO $$ BEGIN
    CREATE TYPE driver_status AS ENUM ('pending', 'approved', 'active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE assignment_status AS ENUM ('scheduled', 'active', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE location_status AS ENUM ('enroute', 'at_airport', 'at_hotel', 'at_venue', 'available');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    kingschat_handle VARCHAR(100),
    home_address TEXT,
    home_post_code VARCHAR(20),
    church VARCHAR(255) NOT NULL,
    zone VARCHAR(100) NOT NULL,
    "group" VARCHAR(100) NOT NULL,
    emergency_contact_name VARCHAR(255) NOT NULL,
    emergency_contact_phone VARCHAR(50) NOT NULL,
    years_driving_experience INTEGER NOT NULL,
    license_duration_years INTEGER NOT NULL,
    availability_start DATE NOT NULL,
    availability_end DATE NOT NULL,
    status driver_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    registration VARCHAR(20) NOT NULL UNIQUE,
    is_hired BOOLEAN DEFAULT true,
    pickup_location VARCHAR(255) NOT NULL,
    pickup_mileage INTEGER NOT NULL,
    pickup_fuel_gauge INTEGER NOT NULL,
    pickup_photos TEXT[],
    pickup_date TIMESTAMPTZ NOT NULL,
    dropoff_mileage INTEGER,
    dropoff_fuel_gauge INTEGER,
    dropoff_date TIMESTAMPTZ,
    current_driver_id UUID REFERENCES drivers(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VIPs table
CREATE TABLE IF NOT EXISTS vips (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    arrival_date DATE NOT NULL,
    arrival_time TIME NOT NULL,
    arrival_airport VARCHAR(100) NOT NULL,
    arrival_terminal VARCHAR(50),
    departure_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    departure_airport VARCHAR(100) NOT NULL,
    departure_terminal VARCHAR(50),
    remarks TEXT,
    assigned_driver_id UUID REFERENCES drivers(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    driver_id UUID NOT NULL REFERENCES drivers(id),
    vip_id UUID REFERENCES vips(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    status assignment_status DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Location updates table
CREATE TABLE IF NOT EXISTS location_updates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    driver_id UUID NOT NULL REFERENCES drivers(id),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    status location_status DEFAULT 'available',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes (skip if they already exist)
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_availability ON drivers(availability_start, availability_end);
CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles(registration);
CREATE INDEX IF NOT EXISTS idx_assignments_driver ON assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_assignments_vehicle ON assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_assignments_vip ON assignments(vip_id);
CREATE INDEX IF NOT EXISTS idx_location_updates_driver ON location_updates(driver_id);
CREATE INDEX IF NOT EXISTS idx_location_updates_timestamp ON location_updates(timestamp);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (skip if they already exist)
DO $$ BEGIN
    CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_vips_updated_at BEFORE UPDATE ON vips
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Row Level Security (RLS)
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vips ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_updates ENABLE ROW LEVEL SECURITY;

-- Create policies (basic, to be refined based on auth requirements)
DO $$ BEGIN
    CREATE POLICY "Public read access" ON drivers FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Public insert for registration" ON drivers FOR INSERT WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Public read access" ON vehicles FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Public read access" ON vips FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Public read access" ON assignments FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Public read access" ON location_updates FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;