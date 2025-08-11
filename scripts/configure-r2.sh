#!/bin/bash

echo "🔧 Cloudflare R2 Configuration Helper"
echo "===================================="
echo ""
echo "This script will help you configure Cloudflare R2 environment variables."
echo ""

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env.local"

echo "📍 Environment file: $ENV_FILE"
echo ""

# Check if .env.local exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: .env.local file not found!"
    exit 1
fi

echo "Please enter your Cloudflare R2 credentials:"
echo ""

# Collect R2 credentials
read -p "🔑 Access Key ID: " ACCESS_KEY_ID
echo ""
read -p "🔒 Secret Access Key: " SECRET_ACCESS_KEY
echo ""
read -p "🌐 Endpoint URL (e.g., https://abc123.r2.cloudflarestorage.com): " ENDPOINT_URL
echo ""
read -p "🪣 Bucket Name [transport-protocol-images]: " BUCKET_NAME
BUCKET_NAME=${BUCKET_NAME:-transport-protocol-images}
echo ""
read -p "🔗 Public URL (optional, for custom domain): " PUBLIC_URL

# If no public URL provided, use the default R2.dev URL
if [ -z "$PUBLIC_URL" ]; then
    # Extract account ID from endpoint
    ACCOUNT_ID=$(echo "$ENDPOINT_URL" | sed 's/https:\/\/\([^.]*\).*/\1/')
    PUBLIC_URL="https://pub-${ACCOUNT_ID}.r2.dev/${BUCKET_NAME}"
fi

echo ""
echo "📝 Configuration Summary:"
echo "========================"
echo "Access Key ID: ${ACCESS_KEY_ID:0:8}..."
echo "Secret Access Key: ${SECRET_ACCESS_KEY:0:8}..."
echo "Endpoint: $ENDPOINT_URL"
echo "Bucket: $BUCKET_NAME"
echo "Public URL: $PUBLIC_URL"
echo ""

read -p "✅ Does this look correct? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔧 Updating .env.local file..."
    
    # Create backup
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Remove old R2 configuration (commented lines)
    sed -i '' '/^# CLOUDFLARE_R2_/d' "$ENV_FILE"
    
    # Add new R2 configuration
    echo "" >> "$ENV_FILE"
    echo "# Cloudflare R2 Configuration - Added $(date)" >> "$ENV_FILE"
    echo "CLOUDFLARE_R2_ENDPOINT=$ENDPOINT_URL" >> "$ENV_FILE"
    echo "CLOUDFLARE_R2_ACCESS_KEY_ID=$ACCESS_KEY_ID" >> "$ENV_FILE"
    echo "CLOUDFLARE_R2_SECRET_ACCESS_KEY=$SECRET_ACCESS_KEY" >> "$ENV_FILE"
    echo "CLOUDFLARE_R2_BUCKET_NAME=$BUCKET_NAME" >> "$ENV_FILE"
    echo "CLOUDFLARE_R2_PUBLIC_URL=$PUBLIC_URL" >> "$ENV_FILE"
    
    echo "✅ Configuration updated successfully!"
    echo ""
    echo "🚀 NEXT STEPS:"
    echo "1. Restart your development server: npm run dev"
    echo "2. Go to http://localhost:3000/dashboard/vehicles"
    echo "3. Try adding a new vehicle with photos"
    echo "4. Test the photo upload functionality"
    echo ""
    echo "🔍 VERIFICATION:"
    echo "- The photo upload section should now be available"
    echo "- You should be able to select and upload images"
    echo "- Images should display in the vehicle gallery"
    echo ""
    echo "💾 BACKUP:"
    echo "A backup of your original .env.local was created:"
    echo "$(basename "$ENV_FILE").backup.$(date +%Y%m%d_%H%M%S)"
    
else
    echo "❌ Configuration cancelled. No changes made."
    echo ""
    echo "You can run this script again anytime:"
    echo "  ./scripts/configure-r2.sh"
fi

echo ""
echo "📚 Need help? Check docs/R2_SETUP.md for troubleshooting."
