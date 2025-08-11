# Cloudflare R2 CORS Configuration

## Problem
Direct uploads from the browser to R2 are blocked by CORS policy because R2 doesn't allow cross-origin requests by default.

## Solution
Configure CORS rules for your R2 bucket to allow uploads from your application domain.

## Steps to Configure CORS

### 1. Using Cloudflare Dashboard
1. Go to your Cloudflare Dashboard
2. Navigate to R2 Object Storage
3. Select your bucket (`transport-protocol`)
4. Go to Settings → CORS policy
5. Add the following CORS configuration:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-production-domain.com"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

### 2. Using AWS CLI (Alternative)
If you have AWS CLI configured with your R2 credentials:

```bash
aws s3api put-bucket-cors \
  --bucket transport-protocol \
  --cors-configuration file://cors-config.json \
  --endpoint-url https://5a55af19c90ac4b6f06f617aaf2de80f.r2.cloudflarestorage.com
```

Where `cors-config.json` contains the CORS configuration above.

### 3. Verify CORS Configuration
Test that CORS is working by checking the preflight response:

```bash
curl -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: PUT" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://transport-protocol.5a55af19c90ac4b6f06f617aaf2de80f.r2.cloudflarestorage.com/
```

You should see `Access-Control-Allow-Origin` headers in the response.