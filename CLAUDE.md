# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

This is the STPPL Transport Protocol Management System - a web application for coordinating VIP transportation during STPPL UK and Europe events. The system manages drivers, vehicles, VIP itineraries, and provides real-time tracking capabilities.

## Essential Commands

```bash
# Development
npm run dev        # Start development server on localhost:3000

# Build & Production
npm run build      # Create production build
npm run start      # Run production server

# Code Quality
npm run lint       # Run ESLint
```

## Database Setup Requirements

The application requires a Supabase PostgreSQL database. Before running:

1. Create a Supabase project at supabase.com
2. Execute the SQL schema from `/supabase/schema.sql` in Supabase SQL Editor
3. Create `.env.local` file with:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

See `.env.example` for all available environment variables.

## Architecture Overview

### Tech Stack
- **Next.js 15.4.6** with App Router - Server-side rendering and routing
- **TypeScript** - Type safety throughout
- **Supabase** - PostgreSQL database with real-time capabilities
- **Tailwind CSS** - Utility-first styling with custom design system
- **JWT Authentication** - Secure user sessions with bcrypt password hashing
- **Role-Based Access Control** - Multi-level permissions system

### Key Architectural Decisions

**Database Client Pattern**: The app uses two Supabase client configurations:
- `/lib/supabase/client.ts` - Browser client for client components
- `/lib/supabase/server.ts` - Server client with cookie handling for server components

**Authentication**: JWT-based authentication with HTTP-only cookies and bcrypt password hashing. User accounts are managed through the `/api/auth/login` and `/api/auth/logout` endpoints. The system includes comprehensive user management with role-based access control.

**Component Architecture**: 
- UI components in `/components/ui/` use forwardRef pattern for flexibility
- Dashboard pages are client components for interactivity
- Custom design system defined via CSS variables in `globals.css`

### Data Models

Core entities are defined in `/types/index.ts`:
- **User**: System users with roles (admin, coordinator, team_head, driver) and departments (hospitality, lounge, transport, operations, all)
- **Driver**: Comprehensive registration info including email, emergency contact, driving experience, availability dates, approval status, linked to User account
- **Vehicle**: Rental details, mileage/fuel tracking, assignment status, photo support
- **VIP**: Complete travel itinerary with arrival/departure details, airport/terminal info
- **Assignment**: Links drivers to vehicles and VIPs with status tracking
- **LocationUpdate**: Real-time tracking data for driver locations

### Database Schema

PostgreSQL schema uses:
- UUID primary keys with `uuid-ossp` extension
- Custom ENUM types for statuses, user roles, and departments
- Automatic `updated_at` triggers
- Row Level Security with role-based policies
- Foreign key relationships linking drivers to user accounts

### Current Implementation Status

**Phase 1 (Completed)**:
- Driver registration with comprehensive form (personal info, church details, emergency contact, driving experience, availability)
- Vehicle cataloging with pickup/dropoff tracking
- Admin dashboard with approval workflow
- Driver deletion capability
- Form validation and error handling

**Phase 2 (Completed)**:
- VIP travel itinerary management
- Driver assignment system with quick assignment interface
- Search and filtering functionality
- Real-time availability calculation
- API endpoints for mobile integration

**Phase 3 (Completed)**:
- Comprehensive user management system
- Role-based access control (admin, coordinator, team_head, driver)
- Department-specific permissions (hospitality, lounge, transport, operations)
- Automatic driver account creation upon approval
- JWT authentication with secure password hashing
- Email notification system for driver credentials
- Advanced user dashboard with filtering and statistics

**Phase 4 (Planned)**:
- Real-time location tracking
- Push notifications and alerts
- Advanced reporting and analytics
- Mobile app integration

### Development Patterns

**State Management**: Local state with React hooks, server state via Supabase
**Authentication**: JWT tokens with HTTP-only cookies, role-based middleware protection
**Authorization**: Permission-based access control with resource and action granularity
**Error Handling**: Try-catch blocks with user-friendly error messages
**Date Handling**: `date-fns` for formatting, native Date for storage
**Styling**: Tailwind utilities with `cn()` helper for conditional classes

### Important File Locations

**API Routes**:
- `/app/api/users/` - User management CRUD operations
- `/app/api/auth/` - Authentication endpoints (login/logout)
- `/app/api/drivers/` - Driver management with approval workflow
- `/app/api/vehicles/` - Vehicle management endpoints

**Authentication & Authorization**:
- `/lib/auth.ts` - JWT authentication and permission utilities
- `/lib/permissions.ts` - Role and department-based access control
- `/middleware.ts` - Route protection and access control

**Dashboard & UI**:
- `/app/dashboard/users/page.tsx` - User management interface (admin-only)
- `/app/dashboard/layout.tsx` - Auth check and navigation
- `/components/ui/` - Reusable UI components with custom design system
- `/app/auth/register/page.tsx` - Driver registration form

**Core Files**:
- `/supabase/schema.sql` - Complete database schema with user tables
- `/supabase/migrations/` - Database migration scripts
- `/types/index.ts` - All TypeScript interfaces including user management
- `/lib/email.ts` - Email notification service for driver credentials

### Testing Approach

No test framework is currently configured. When adding tests:
- Unit tests for utility functions
- Integration tests for API routes
- E2E tests for critical user flows

### Deployment Notes

- Application builds successfully with `npm run build`
- Optimized for Vercel deployment (automatic with Next.js)
- Static pages pre-rendered where possible
- Images configured for localhost domain in `next.config.js`

## Common Tasks

### Adding a New User
**For Admin Users:**
1. Log in as admin (admin@stppl.org with password from database)
2. Navigate to `/dashboard/users`
3. Click "Add User" and fill in details
4. Assign appropriate role and department

**For Drivers:**
1. Driver registers via `/auth/register`
2. Admin approves driver in `/dashboard/drivers`
3. System automatically creates user account and sends login credentials

### Adding a New Dashboard Page
1. Create page in `/app/dashboard/[feature]/page.tsx`
2. Add navigation item to `/components/ui/dashboard-nav.tsx` with appropriate role restrictions
3. Ensure client component with `'use client'` directive
4. Add permission checks using `requirePermission` middleware if needed
5. Include auth check via dashboard layout

### Working with Authentication
- Use `requireAuth`, `requirePermission`, or `requireRole` middleware for API protection
- Check user permissions with utilities in `/lib/permissions.ts`
- Handle JWT tokens through HTTP-only cookies
- Test with different user roles to ensure proper access control

### Working with Supabase
- Always handle errors from Supabase operations
- Use proper TypeScript types from `/types/index.ts`
- Consider RLS policies when adding new tables
- Test with both client and server components
- Update user permissions in ROLE_PERMISSIONS when adding new resources

### Modifying the Database Schema
1. Update `/supabase/schema.sql`
2. Create migration file in `/supabase/migrations/` if needed
3. Update TypeScript interfaces in `/types/index.ts`
4. Update permission system in `/lib/permissions.ts` if adding new resources
5. Run migration in Supabase dashboard
6. Test affected components with different user roles

### Email Configuration
- Configure email service credentials in environment variables
- Update `/lib/email.ts` to use your preferred email provider
- Test email sending in driver approval workflow
- Customize email templates for your organization