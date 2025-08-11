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

    const envStatus: Record<string, { present: boolean; hasValue: boolean; isPlaceholder: boolean }> = {}
    
    requiredEnvVars.forEach(envVar => {
      const value = process.env[envVar]
      envStatus[envVar] = {
        present: value !== undefined,
        hasValue: Boolean(value && value.trim() !== ''),
        isPlaceholder: Boolean(value && (value.includes('your-') || value.includes('[account-id]') || value.includes('example')))
      }
    })

    const configured = requiredEnvVars.every(envVar => {
      const status = envStatus[envVar]
      return status.present && status.hasValue && !status.isPlaceholder
    })

    // For debugging: also check if at least the core variables are present
    const coreConfigured = ['CLOUDFLARE_R2_ENDPOINT', 'CLOUDFLARE_R2_ACCESS_KEY_ID', 'CLOUDFLARE_R2_SECRET_ACCESS_KEY', 'CLOUDFLARE_R2_BUCKET_NAME'].every(envVar => {
      const value = process.env[envVar]
      return value && value.trim() !== ''
    })

    return NextResponse.json({ 
      configured: configured || coreConfigured, // Use core config as fallback
      fullConfigured: configured,
      coreConfigured,
      envStatus,
      message: configured 
        ? 'Cloudflare R2 is properly configured' 
        : coreConfigured 
        ? 'Cloudflare R2 core configuration present (missing PUBLIC_URL)'
        : 'Cloudflare R2 configuration is missing or incomplete'
    })

  } catch (error) {
    console.error('Error checking R2 configuration:', error)
    return NextResponse.json({ 
      configured: false,
      message: 'Error checking R2 configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
