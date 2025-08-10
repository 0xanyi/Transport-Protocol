# Supabase Setup Guide

## Quick Setup Steps

### 1. Create a Supabase Account
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" 
3. Sign up with GitHub or email

### 2. Create a New Project
1. Click "New project"
2. Enter project details:
   - **Name**: STPPL Transport Protocol
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to UK (e.g., London)
3. Click "Create new project" (takes ~2 minutes)

### 3. Set Up Database Schema
1. In your Supabase dashboard, click on "SQL Editor" (left sidebar)
2. Click "New query"
3. Copy the entire contents of `/supabase/schema.sql`
4. Paste into the SQL editor
5. Click "Run" to execute the schema

### 4. Get Your API Keys
1. Go to Settings → API (in left sidebar)
2. You'll see two important values:

   **Project URL**: 
   ```
   https://[your-project-ref].supabase.co
   ```

   **Anon/Public Key**: 
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 5. Update Your .env.local File
Edit `.env.local` and replace the placeholders:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 6. Restart Your Development Server
```bash
# Stop the server (Ctrl+C) then:
npm run dev
```

## Testing the Setup

1. Go to http://localhost:3000
2. Click "Driver Registration"
3. Fill out the form and submit
4. Check your Supabase dashboard → Table Editor → drivers table
5. You should see the new registration!

## Troubleshooting

### Still getting the error?
- Make sure `.env.local` is in the root directory (same level as package.json)
- Ensure there are no quotes around the values in `.env.local`
- Restart the development server after adding environment variables
- Check that the URL starts with `https://` and ends with `.supabase.co`

### Database tables not showing?
- Make sure you ran the SQL schema in the SQL Editor
- Check for any error messages when running the SQL
- Refresh the Table Editor page

### Can't see data after registration?
- Check the browser console for errors
- Ensure Row Level Security (RLS) policies are set correctly
- Try disabling RLS temporarily for testing (not for production!)

## Production Deployment

When deploying to Vercel or other platforms, add these environment variables in the deployment settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Never commit `.env.local` to git!