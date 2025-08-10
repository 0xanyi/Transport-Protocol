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
```

## Architecture Overview

### Tech Stack
- **Next.js 15.4.6** with App Router - Server-side rendering and routing
- **TypeScript** - Type safety throughout
- **Supabase** - PostgreSQL database with real-time capabilities
- **Tailwind CSS** - Utility-first styling with custom design system

### Key Architectural Decisions

**Database Client Pattern**: The app uses two Supabase client configurations:
- `/lib/supabase/client.ts` - Browser client for client components
- `/lib/supabase/server.ts` - Server client with cookie handling for server components

**Authentication**: Currently uses sessionStorage for MVP demo (admin@stppl.org / admin123). This is temporary - production should use Supabase Auth with proper RLS policies.

**Component Architecture**: 
- UI components in `/components/ui/` use forwardRef pattern for flexibility
- Dashboard pages are client components for interactivity
- Custom design system defined via CSS variables in `globals.css`

### Data Models

Core entities are defined in `/types/index.ts`:
- **Driver**: Comprehensive registration info including email, emergency contact, driving experience, availability dates, approval status
- **Vehicle**: Rental details, mileage/fuel tracking, assignment status, photo support
- **VIP**: Complete travel itinerary with arrival/departure details, airport/terminal info
- **Assignment**: Links drivers to vehicles and VIPs with status tracking
- **LocationUpdate**: Real-time tracking data for driver locations

### Database Schema

PostgreSQL schema uses:
- UUID primary keys with `uuid-ossp` extension
- Custom ENUM types for statuses
- Automatic `updated_at` triggers
- Row Level Security (basic policies implemented)

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

**Phase 3 (Planned)**:
- Real-time location tracking
- Department-specific views (hospitality, lounge)
- Push notifications and alerts
- Advanced reporting and analytics

### Development Patterns

**State Management**: Local state with React hooks, server state via Supabase
**Error Handling**: Try-catch blocks with user-friendly error messages
**Date Handling**: `date-fns` for formatting, native Date for storage
**Styling**: Tailwind utilities with `cn()` helper for conditional classes

### Important File Locations

- **API Routes**: `/app/api/drivers/` and `/app/api/vehicles/` - RESTful endpoints with validation
- **Dashboard protection**: `/app/dashboard/layout.tsx` handles auth check
- **Form components**: `/app/auth/register/page.tsx` - Sectioned driver registration form
- **Dashboard pages**: `/app/dashboard/[drivers|vehicles|vips|assignments]/page.tsx`
- **Migration scripts**: `/supabase/migrations/` - Database schema updates
- **Types**: `/types/index.ts` - All TypeScript interfaces

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

### Adding a New Dashboard Page
1. Create page in `/app/dashboard/[feature]/page.tsx`
2. Add navigation item to `/components/ui/dashboard-nav.tsx`
3. Ensure client component with `'use client'` directive
4. Include auth check via dashboard layout

### Working with Supabase
- Always handle errors from Supabase operations
- Use proper TypeScript types from `/types/index.ts`
- Consider RLS policies when adding new tables
- Test with both client and server components

### Modifying the Database Schema
1. Update `/supabase/schema.sql`
2. Update TypeScript interfaces in `/types/index.ts`
3. Run migration in Supabase dashboard
4. Test affected components