import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check if all required R2 environment variables are configured
    const requiredEnvVars = [
      'CLOUDFLARE_R2_ENDPOINT',
      'CLOUDFLARE_R2_ACCESS_KEY_ID',
      'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
      'CLOUDFLARE_R2_BUCKET_NAME',
      'CLOUDFLARE_R2_PUBLIC_URL'
    ]

    const configured = requiredEnvVars.every(envVar => {
      const value = process.env[envVar]
      return value && value.trim() !== '' && !value.includes('your-') && !value.includes('[account-id]')
    })

    return NextResponse.json({ 
      configured,
      message: configured 
        ? 'Cloudflare R2 is properly configured' 
        : 'Cloudflare R2 configuration is missing or incomplete'
    })

  } catch (error) {
    return NextResponse.json({ 
      configured: false,
      message: 'Error checking R2 configuration'
    })
  }
}
