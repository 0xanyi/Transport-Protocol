# Vehicle Reassignment Feature

## Overview
The vehicle reassignment feature allows coordinators to reassign vehicles to drivers when the original vehicle is returned, damaged, or needs to be changed for any reason.

## How It Works

### 1. Edit Assignment
- Click the edit button (pencil icon) next to any assignment
- In the edit modal, you can now change:
  - **Vehicle Assignment**: Select a different available vehicle
  - **VIP Assignment**: Change or remove VIP assignments
  - **Start/End Times**: Adjust assignment timing

### 2. Vehicle Reassignment Process
When you change a vehicle in an assignment:

1. **Validation**: The system checks if the new vehicle is available
2. **Old Vehicle Release**: The previous vehicle is automatically unassigned from the driver
3. **New Vehicle Assignment**: The new vehicle is assigned to the driver
4. **Database Update**: All related records are updated atomically

### 3. Available Vehicles
The vehicle dropdown shows:
- Vehicles that are currently unassigned
- The vehicle currently assigned to this assignment (for no-change scenarios)

### 4. Warning Indicators
- A warning message appears when selecting a different vehicle
- The system prevents assigning vehicles that are already assigned to other drivers

## Use Cases

### Vehicle Return Scenario
1. A driver returns a vehicle they don't like
2. Coordinator opens the assignment edit modal
3. Selects a different available vehicle
4. Saves the changes
5. Driver is now assigned to the new vehicle

### Vehicle Maintenance
1. A vehicle needs maintenance during an assignment
2. Coordinator reassigns the driver to a different vehicle
3. The maintenance vehicle becomes available for reassignment later

### Vehicle Upgrade/Downgrade
1. A VIP requires a different class of vehicle
2. Coordinator can swap vehicles between assignments
3. Both drivers get updated vehicle assignments

## API Changes

### Updated Endpoint
- `PUT /api/assignments/{id}` now accepts `vehicle_id` parameter
- Handles vehicle reassignment logic automatically
- Maintains data consistency across vehicles and assignments tables

### Database Updates
- `assignments.vehicle_id` is updated
- `vehicles.current_driver_id` is updated for both old and new vehicles
- All changes are atomic to prevent data inconsistency

## Security & Permissions
- Only users with `assignments:update` permission can reassign vehicles
- Coordinators and admins have this permission by default
- Drivers cannot reassign their own vehicles

## Future Enhancements
- Vehicle reassignment history tracking
- Notification system for drivers when vehicles are changed
- Bulk vehicle reassignment for multiple assignments
- Vehicle preference matching system