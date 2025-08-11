# Cloudflare R2 Setup Guide

This guide will help you set up Cloudflare R2 for vehicle image storage in the Transport Protocol Management System.

## 1. Create a Cloudflare R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to R2 Object Storage
3. Click "Create bucket"
4. Name your bucket (e.g., `transport-protocol`)
5. Choose your preferred location
6. Click "Create bucket"

## 2. Create API Tokens

1. In your Cloudflare dashboard, go to R2 → Manage R2 API tokens
2. Click "Create API token"
3. Configure the token:
   - **Token name**: `transport-protocol-api`
   - **Permissions**: Object Read & Write
   - **Bucket**: Select your created bucket
4. Click "Create API token"
5. Copy the **Access Key ID** and **Secret Access Key**

## 3. Configure Public Access (Optional)

To serve images directly from R2:

1. Go to your bucket settings
2. Configure **Custom Domain** or use **R2.dev subdomain**
3. For custom domain:
   - Add a CNAME record in your DNS: `files.yourdomain.com` → `[bucket-name].[account-id].r2.cloudflarestorage.com`
   - Enable the custom domain in bucket settings

## 4. Environment Variables

Update your `.env.local` file with the following variables:

```bash
# Cloudflare R2 Configuration
CLOUDFLARE_R2_ENDPOINT=https://[account-id].r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key
CLOUDFLARE_R2_BUCKET_NAME=transport-protocol
CLOUDFLARE_R2_PUBLIC_URL=https://files.yourdomain.com
```

### Where to find values:

- **CLOUDFLARE_R2_ENDPOINT**: Found in R2 dashboard → your bucket → Settings
- **CLOUDFLARE_R2_ACCESS_KEY_ID**: From the API token you created
- **CLOUDFLARE_R2_SECRET_ACCESS_KEY**: From the API token you created
- **CLOUDFLARE_R2_BUCKET_NAME**: Your bucket name
- **CLOUDFLARE_R2_PUBLIC_URL**: Your custom domain or R2.dev URL

## 5. Bucket Structure

The system organizes files as follows:

```
transport-protocol/
├── vehicles/
│   ├── temp/                 # Temporary uploads before vehicle creation
│   └── [vehicle-id]/        # Vehicle-specific folders
│       ├── pickup_photos/
│       └── dropoff_photos/
```

## 6. Security Considerations

- Use **least privilege** API tokens (only Object Read & Write)
- Consider implementing **signed URLs** for sensitive images
- Set up **CORS policies** if needed for direct browser uploads
- Regularly rotate API tokens

## 7. Cost Optimization

- Enable **lifecycle policies** to delete old temporary files
- Use **image optimization** features if available
- Monitor usage through Cloudflare analytics

## 8. Testing the Setup

After configuring the environment variables:

1. Restart your development server: `npm run dev`
2. Go to Vehicle Management
3. Try adding a new vehicle with photos
4. Check if images upload successfully
5. Verify images display in the vehicle details

## Troubleshooting

### Common Issues:

1. **Upload fails with 403 error**
   - Check API token permissions
   - Verify bucket name is correct

2. **Images don't display**
   - Check public URL configuration
   - Verify CORS settings if using custom domain

3. **Slow uploads**
   - Consider using presigned URLs for large files
   - Check network connectivity to Cloudflare

### Debug Mode:

Enable debug logging by adding to your `.env.local`:

```bash
DEBUG_R2=true
```

This will log R2 operations to the console for troubleshooting.

## Support

For issues with this integration:
1. Check Cloudflare R2 documentation
2. Review browser network tab for failed requests
3. Check server logs for error details
