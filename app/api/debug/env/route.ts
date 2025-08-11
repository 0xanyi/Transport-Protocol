import { NextResponse } from 'next/server'

export async function GET() {
  // Only allow this in development or if explicitly enabled
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_ENV_DEBUG !== 'true') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const requiredEnvVars = [
      'CLOUDFLARE_R2_ENDPOINT',
      'CLOUDFLARE_R2_ACCESS_KEY_ID',
      'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
      'CLOUDFLARE_R2_BUCKET_NAME',
      'CLOUDFLARE_R2_PUBLIC_URL'
    ]

    const envInfo: Record<string, any> = {}
    
    requiredEnvVars.forEach(envVar => {
      const value = process.env[envVar]
      envInfo[envVar] = {
        present: value !== undefined,
        hasValue: Boolean(value && value.trim() !== ''),
        length: value ? value.length : 0,
        // Only show first and last 4 characters for security
        preview: value ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : 'undefined',
        isPlaceholder: Boolean(value && (value.includes('your-') || value.includes('[account-id]') || value.includes('example')))
      }
    })

    return NextResponse.json({
      nodeEnv: process.env.NODE_ENV,
      envInfo
    })

  } catch (error) {
    console.error('Error checking environment variables:', error)
    return NextResponse.json({ 
      error: 'Error checking environment variables',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}