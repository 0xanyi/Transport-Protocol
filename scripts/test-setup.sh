#!/bin/bash

echo "🧪 Testing STPPL Transport Protocol Setup"
echo "========================================"
echo ""

# Test server is running
echo "1. Testing server connection..."
if curl -s http://localhost:3000/api/upload/config-check >/dev/null 2>&1; then
    echo "   ✅ Server is running on http://localhost:3000"
else
    echo "   ❌ Server is not responding. Run: npm run dev"
    exit 1
fi

# Test R2 configuration
echo ""
echo "2. Testing Cloudflare R2 configuration..."
R2_RESPONSE=$(curl -s http://localhost:3000/api/upload/config-check)
if echo "$R2_RESPONSE" | grep -q '"configured":true'; then
    echo "   ✅ Cloudflare R2 is properly configured"
else
    echo "   ❌ Cloudflare R2 configuration issue"
    echo "   Response: $R2_RESPONSE"
fi

# Check environment variables
echo ""
echo "3. Checking environment variables..."
if [ -n "$CLOUDFLARE_R2_ENDPOINT" ]; then
    echo "   ✅ R2_ENDPOINT is set"
else
    echo "   ❌ R2_ENDPOINT is missing"
fi

if [ -n "$CLOUDFLARE_R2_ACCESS_KEY_ID" ]; then
    echo "   ✅ R2_ACCESS_KEY_ID is set"
else
    echo "   ❌ R2_ACCESS_KEY_ID is missing"
fi

if [ -n "$CLOUDFLARE_R2_SECRET_ACCESS_KEY" ]; then
    echo "   ✅ R2_SECRET_ACCESS_KEY is set"
else
    echo "   ❌ R2_SECRET_ACCESS_KEY is missing"
fi

if [ -n "$CLOUDFLARE_R2_BUCKET_NAME" ]; then
    echo "   ✅ R2_BUCKET_NAME is set"
else
    echo "   ❌ R2_BUCKET_NAME is missing"
fi

echo ""
echo "4. Testing database connection..."
if curl -s http://localhost:3000/api/vehicles >/dev/null 2>&1; then
    echo "   ✅ Database connection working"
else
    echo "   ❌ Database connection issue"
fi

echo ""
echo "🎯 NEXT STEPS:"
echo "============="
echo "1. Go to: http://localhost:3000/dashboard/vehicles"
echo "2. Click 'Add Vehicle'"
echo "3. Fill in vehicle details"
echo "4. Try uploading photos in the 'Pickup Photos' section"
echo "5. Submit the form"
echo ""
echo "Expected behavior:"
echo "- Photo upload section should be visible"
echo "- You should be able to drag/drop or click to select images"
echo "- Images should upload and show thumbnails"
echo "- Vehicle should be created with photos"
echo ""
echo "If you see any issues, check the browser console (F12) for errors."
