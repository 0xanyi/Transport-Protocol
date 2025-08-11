# Cloudflare R2 Setup Guide

## Overview
This guide will help you set up Cloudflare R2 for storing vehicle images safely in production.

## Step 1: Create Cloudflare R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2 Object Storage**
3. Click **Create bucket**
4. Name your bucket: `transport-protocol-images`
5. Choose a region close to your users

## Step 2: Create API Tokens

1. In R2 dashboard, go to **Manage R2 API tokens**
2. Click **Create API token**
3. Configure permissions:
   - **Permissions**: Object Read & Write
   - **Bucket**: Select your created bucket
   - **Account**: Your account
4. Copy the generated credentials:
   - Access Key ID
   - Secret Access Key
   - Endpoint URL

## Step 3: Configure Environment Variables

Update your `.env.local` file:

```bash
# Cloudflare R2 Configuration
CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id_here
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key_here
CLOUDFLARE_R2_BUCKET_NAME=transport-protocol-images
CLOUDFLARE_R2_PUBLIC_URL=https://your-bucket-public-url.com
```

## Step 4: Set Up Custom Domain (Optional but Recommended)

1. In your R2 bucket settings, go to **Settings** → **Custom Domains**
2. Add a custom domain (e.g., `images.yourdomain.com`)
3. Update `CLOUDFLARE_R2_PUBLIC_URL` with your custom domain

## Step 5: Database Migration

Run this SQL command in your Supabase SQL editor to add the dropoff_photos column:

```sql
-- Add dropoff_photos column to vehicles table if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'vehicles' 
                 AND column_name = 'dropoff_photos') THEN
    ALTER TABLE vehicles ADD COLUMN dropoff_photos TEXT[];
  END IF;
END $$;
```

**This migration is 100% safe for production - it only adds a new column and doesn't modify existing data.**

## Step 6: Test the Setup

1. Restart your development server: `npm run dev`
2. Go to Vehicle Management
3. Try adding a new vehicle with photos
4. Verify images are uploaded and displayed correctly

## Security Considerations

- API tokens have limited permissions (only your specific bucket)
- Images are stored with unique UUIDs to prevent conflicts
- File types are validated (only JPEG, PNG, WebP allowed)
- File sizes are limited (max 10MB per image)

## Cost Estimation

Cloudflare R2 pricing (as of 2024):
- Storage: $0.015 per GB per month
- Class A operations (uploads): $4.50 per million
- Class B operations (downloads): $0.36 per million

For typical vehicle management:
- ~100 vehicles with 8 photos each = ~800 images
- Average 2MB per image = ~1.6GB storage
- Monthly cost: ~$0.025 (essentially free)

## Fallback Behavior

If R2 is not configured, the vehicle management will:
- Hide image upload components
- Continue to work normally for all other features
- Show a message that image upload is not available
