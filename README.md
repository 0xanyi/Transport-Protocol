# STPPL Transport Protocol Management System

A web-based transport and protocol management system for coordinating VIP transportation during the STPPL UK and Europe event.

## Features - MVP (Phase 1)

✅ **Driver Management**
- Driver self-registration with availability calendar
- Comprehensive driver information (email, emergency contact, driving experience)
- Admin approval/rejection workflow
- Driver deletion capability
- Driver status tracking (pending, approved, active, inactive)

✅ **Vehicle Management**
- Vehicle cataloging with pickup details
- Mileage and fuel gauge tracking
- Photo documentation support (ready for implementation)
- Rental/hired vehicle tracking

✅ **Admin Dashboard**
- Centralized management interface
- Driver approval/rejection
- Vehicle overview and management
- Status filtering and search

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (free tier works)

### 1. Clone and Install

```bash
cd transport-protocol
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor in your Supabase dashboard
3. Run the SQL schema from `supabase/schema.sql`
4. Get your project URL and anon key from Project Settings > API

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Admin Credentials

For the MVP demo:
- Email: `admin@stppl.org`
- Password: `admin123`

**Note:** Replace with proper authentication in production.

## Project Structure

```
transport-protocol/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   │   ├── login/         # Admin login
│   │   └── register/      # Driver registration
│   ├── dashboard/         # Admin dashboard
│   │   ├── drivers/       # Driver management
│   │   ├── vehicles/      # Vehicle management
│   │   ├── vips/          # VIP management (Phase 2)
│   │   └── assignments/   # Assignments (Phase 2)
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # UI components
│   ├── forms/            # Form components
│   └── tables/           # Table components
├── lib/                   # Utilities
│   ├── supabase/         # Supabase client
│   └── utils/            # Helper functions
├── types/                 # TypeScript types
└── supabase/             # Database schema
```

## Database Schema

The system uses PostgreSQL (via Supabase) with the following main tables:

- **drivers** - Driver information and availability
- **vehicles** - Vehicle details and tracking
- **vips** - VIP itineraries (Phase 2)
- **assignments** - Driver-Vehicle-VIP assignments (Phase 2)
- **location_updates** - Real-time tracking (Phase 2)

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

### Deploy to Railway

1. Create new project in [Railway](https://railway.app)
2. Connect GitHub repository
3. Add environment variables
4. Deploy

## Development Roadmap

### Phase 1 - MVP ✅ (Current)
- Driver registration and approval
- Vehicle cataloging
- Basic admin dashboard
- Simple authentication

### Phase 2 - Core Features (Week 2)
- VIP itinerary management
- Driver-Vehicle-VIP assignments
- Basic location tracking
- Mobile-responsive driver app

### Phase 3 - Advanced Features (Week 3+)
- Real-time tracking dashboard
- Department-specific views (hospitality, lounge)
- Notifications and alerts
- Comprehensive reporting
- Incident tracking (tickets, violations)

## API Endpoints (Ready for Mobile App)

The system exposes the following API endpoints:

- `POST /api/drivers` - Register new driver
- `GET /api/drivers` - List all drivers
- `PATCH /api/drivers/:id` - Update driver status
- `POST /api/vehicles` - Add new vehicle
- `GET /api/vehicles` - List all vehicles
- `POST /api/tracking` - Submit location update

## Security Notes

For production deployment:
1. Implement proper authentication (Supabase Auth recommended)
2. Enable Row Level Security (RLS) in Supabase
3. Use environment variables for all sensitive data
4. Implement rate limiting
5. Add input validation and sanitization

## Support

For issues or questions about this system, please contact the STPPL Transport Department.

## License

Private - STPPL UK and Europe Internal Use Only