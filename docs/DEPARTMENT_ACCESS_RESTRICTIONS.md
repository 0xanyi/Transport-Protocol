# Department Access Restrictions

## Overview

This document outlines the access restrictions implemented for different departments in the STPPL Transport Protocol Management System. The system now enforces strict access controls to ensure that hospitality, lounge services, and operations departments can only access tracking functionality while maintaining full access for the transport department.

## Department Access Matrix

| Department | Dashboard | Tracking | Drivers | Vehicles | VIPs | Assignments | Users |
|------------|-----------|----------|---------|----------|------|-------------|-------|
| **Transport** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ❌ |
| **Hospitality** | ✅ Limited | ✅ Limited | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Lounge** | ✅ Limited | ✅ Limited | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Operations** | ✅ Limited | ✅ Limited | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Admin** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |

## Access Levels Explained

### Full Access
- Can view all information including sensitive details
- Can create, edit, and delete records
- Can access all management features

### Limited Access
- Can view basic tracking information
- Cannot access sensitive vehicle details
- Cannot modify any records
- Read-only access to essential coordination data

### No Access
- Cannot access the section at all
- Navigation items are hidden
- Automatic redirection if attempting to access

## Restricted Departments (Hospitality, Lounge, Operations)

### What They CAN Access:

#### Dashboard
- **Streamlined Welcome Dashboard**: Custom dashboard focused on tracking coordination
- **Department-specific Information**: Tailored content for their role
- **Quick Access to Tracking**: Direct link to tracking dashboard
- **Status Overview**: General system status and coordination information

#### Tracking (Limited View)
- **Driver Names**: ✅ Visible for coordination purposes
- **VIP Names**: ✅ Visible for service coordination
- **Driver Status**: Current location status (At Airport, At Hotel, etc.)
- **Check-in Updates**: Last check-in type and timestamp
- **General Location**: Basic location information (city/area level)

### What They CANNOT Access:

#### Hidden Information in Tracking
- **Driver Phone Numbers**: Hidden for privacy
- **Vehicle Details**: Make, model, registration hidden
- **Detailed Location**: Exact coordinates hidden
- **Session IDs**: Technical details hidden
- **Check-in Notes**: Detailed notes hidden

#### Completely Restricted Sections
- **Drivers Management**: Cannot view driver profiles, applications, or management
- **Vehicles Management**: Cannot access vehicle information or management
- **VIP Management**: Cannot access VIP itineraries or detailed information
- **Assignments Management**: Cannot create or manage driver assignments
- **Users Management**: Cannot access user management (admin only)

## Transport Department Access

### Full Access Maintained
- **All Management Features**: Complete access to drivers, vehicles, VIPs, assignments
- **Full Tracking Information**: All details including phone numbers, vehicle info, exact locations
- **Administrative Functions**: Can create, edit, and delete all records
- **Detailed Reports**: Access to all system data and reports

## Technical Implementation

### Permission Functions
- `hasTrackingOnlyAccess(user)`: Identifies restricted departments
- `canViewResource(user, resource)`: Controls resource access
- `canManageResource(user, resource)`: Controls management permissions

### Navigation Control
- Dynamic navigation based on user department and role
- Automatic hiding of restricted menu items
- Redirect protection for unauthorized access attempts

### Data Filtering
- Conditional rendering based on user permissions
- Sensitive information filtering in tracking displays
- Department-specific dashboard content

## Security Features

### Access Control
- **Route Protection**: Automatic redirection from unauthorized pages
- **Component-level Security**: Conditional rendering of sensitive information
- **Session Validation**: Continuous permission checking

### Data Privacy
- **Information Hiding**: Sensitive details hidden from restricted users
- **Selective Display**: Only necessary information shown for coordination
- **Role-based Filtering**: Different data views based on user role and department

## User Experience

### Restricted Departments
- **Clean Interface**: Simplified navigation with only relevant options
- **Focused Dashboard**: Tracking-centric welcome screen
- **Clear Messaging**: Informative content about their access level
- **Easy Navigation**: Direct access to tracking functionality

### Transport Department
- **Full Functionality**: No changes to existing workflow
- **Complete Access**: All features remain available
- **Enhanced Security**: Better protection of sensitive information

## Compliance and Governance

### Data Protection
- **Need-to-Know Basis**: Users only see information necessary for their role
- **Privacy Compliance**: Personal information protected from unauthorized access
- **Audit Trail**: All access attempts logged and monitored

### Operational Security
- **Segregation of Duties**: Clear separation between departments
- **Least Privilege**: Minimum necessary access granted
- **Regular Review**: Permissions subject to periodic review

## Troubleshooting

### Common Issues

#### Restricted User Cannot Access Page
- **Cause**: User attempting to access unauthorized section
- **Solution**: Automatic redirection to dashboard
- **Prevention**: Navigation items hidden for restricted users

#### Missing Information in Tracking
- **Cause**: Information filtered for restricted users
- **Solution**: This is intentional - contact transport department for detailed info
- **Verification**: Check user department and role

#### Transport User Losing Access
- **Cause**: Incorrect department assignment
- **Solution**: Verify user department is set to 'transport'
- **Admin Action**: Update user department in user management

## Future Considerations

### Potential Enhancements
- **Granular Permissions**: More specific permission levels
- **Temporary Access**: Time-limited access grants
- **Audit Dashboard**: Comprehensive access logging
- **Mobile Optimization**: Enhanced mobile experience for tracking

### Monitoring
- **Access Patterns**: Monitor department access patterns
- **Security Events**: Log unauthorized access attempts
- **Performance Impact**: Monitor system performance with restrictions
- **User Feedback**: Collect feedback on restricted experience

## Support

For questions about access restrictions or permission issues:
1. Check user department assignment
2. Verify role permissions
3. Contact system administrator
4. Review this documentation

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Author**: System Architecture Team