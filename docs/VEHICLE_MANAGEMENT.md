# Vehicle Management with Photo Documentation

## Overview
The vehicle management module now includes comprehensive photo documentation for pickup and return processes. This helps track vehicle condition and provides evidence for any damage claims.

## Features

### ✅ Vehicle Registration
- Complete vehicle details (make, model, registration)
- Pickup location and date tracking
- Mileage and fuel gauge recording
- Pickup photo documentation (up to 8 photos)

### ✅ Photo Documentation
- **Pickup Photos**: Document vehicle condition when picked up
- **Return Photos**: Document vehicle condition when returned
- **Secure Storage**: Images stored in Cloudflare R2
- **File Validation**: Only JPEG, PNG, WebP allowed (max 10MB each)
- **Unique Naming**: UUID-based file naming prevents conflicts

### ✅ Vehicle Return Process
- Dedicated return interface for each vehicle
- Side-by-side comparison with pickup details
- Return mileage and fuel tracking
- Damage notes and observations
- Return photo documentation

### ✅ Safety Features
- **Graceful Degradation**: Works without photo upload if R2 not configured
- **Production Safe**: Database migrations are non-destructive
- **Validation**: Client and server-side file validation
- **Error Handling**: Comprehensive error handling and user feedback

## How It Works

### For Administrators
1. **Add Vehicle**: Complete form with vehicle details and pickup photos
2. **Monitor Fleet**: View all vehicles with status indicators
3. **Process Returns**: Use dedicated return interface when vehicles come back
4. **View History**: Access pickup and return photos for comparison

### For Drivers (Future Enhancement)
- Mobile-friendly interface for photo capture
- GPS location tracking for pickup/return
- Digital signatures for handover

## Database Schema

### Updated Vehicles Table
```sql
vehicles (
  id UUID PRIMARY KEY,
  make VARCHAR(100),
  model VARCHAR(100),
  registration VARCHAR(20) UNIQUE,
  pickup_photos TEXT[],      -- Array of pickup photo URLs
  dropoff_photos TEXT[],     -- Array of return photo URLs (NEW)
  pickup_mileage INTEGER,
  dropoff_mileage INTEGER,
  pickup_fuel_gauge INTEGER,
  dropoff_fuel_gauge INTEGER,
  -- ... other existing fields
)
```

### Vehicle Observations Table
```sql
vehicle_observations (
  id UUID PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id),
  driver_id UUID REFERENCES drivers(id),
  observation_type VARCHAR(50), -- 'pickup', 'dropoff', 'maintenance_issue'
  photos TEXT[],                -- Array of observation photo URLs
  damage_notes TEXT,
  mileage INTEGER,
  fuel_level INTEGER,
  timestamp TIMESTAMPTZ
)
```

## Setup Instructions

### 1. Database Migration (Required)
Run this SQL in your Supabase SQL Editor to add the dropoff_photos column:

```sql
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'vehicles' 
                 AND column_name = 'dropoff_photos') THEN
    ALTER TABLE vehicles ADD COLUMN dropoff_photos TEXT[];
  END IF;
END $$;
```

**This is 100% safe for production - it only adds a new column.**

### 2. Cloudflare R2 Setup (Optional)
For photo upload functionality, set up Cloudflare R2:

1. Follow the guide in `docs/R2_SETUP.md`
2. Configure environment variables
3. Test with a new vehicle registration

**Without R2**: Vehicle management works normally, but photo upload is disabled.

### 3. Alternative: Use Migration Script
```bash
./scripts/migrate-safely.sh
```

## API Endpoints

### Photo Management
- `POST /api/upload/presigned-url` - Get upload URL for images
- `GET /api/upload/config-check` - Check if R2 is configured
- `POST /api/vehicles/[id]/photos` - Add photos to vehicle
- `DELETE /api/vehicles/[id]/photos` - Remove photo from vehicle

### Vehicle Operations
- `GET /api/vehicles` - List all vehicles with photo counts
- `POST /api/vehicles` - Create vehicle with pickup photos
- `PUT /api/vehicles/[id]` - Update vehicle (including return process)

## Security Considerations

### File Upload Security
- File type validation (images only)
- File size limits (10MB max)
- Unique UUID-based naming
- Presigned URL expiration (1 hour)

### Access Control
- Authentication required for all operations
- Role-based permissions for vehicle management
- Driver-specific access to assigned vehicles

### Data Privacy
- Images stored with non-guessable URLs
- Access logs for audit trail
- GDPR-compliant deletion capabilities

## Cost Estimation

### Cloudflare R2 Costs
For 100 vehicles with 8 photos each (average 2MB per photo):
- Storage: ~1.6GB = $0.025/month
- Operations: ~800 uploads = $0.004
- **Total monthly cost: ~$0.03 (essentially free)**

### Performance
- Presigned URLs for direct client upload (no server bandwidth)
- Optimized image display with lazy loading
- Responsive design for mobile devices

## Troubleshooting

### Image Upload Not Working
1. Check R2 configuration: `GET /api/upload/config-check`
2. Verify environment variables are set correctly
3. Check browser console for upload errors
4. Ensure file types are supported (JPEG, PNG, WebP)

### Database Issues
1. Verify migration was applied: Check for `dropoff_photos` column
2. Run the safe migration script if needed
3. Check Supabase logs for errors

### Performance Issues
1. Images are served from Cloudflare CDN (fast globally)
2. Use browser dev tools to check network timing
3. Consider image compression for large files

## Future Enhancements

### Phase 2 - Driver Mobile App
- Native camera integration
- Offline photo capture with sync
- GPS location tracking
- Digital signatures

### Phase 3 - Advanced Features
- AI-powered damage detection
- Automated comparison between pickup/return photos
- Integration with insurance systems
- Maintenance scheduling based on mileage

### Phase 4 - Analytics
- Vehicle utilization reports
- Damage frequency analysis
- Cost tracking per vehicle
- Driver performance metrics
