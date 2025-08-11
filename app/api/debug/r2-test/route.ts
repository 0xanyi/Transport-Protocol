import { NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

export async function GET() {
  // Only allow this in development or if explicitly enabled
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_R2_DEBUG !== 'true') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    // Check environment variables first
    const requiredEnvVars = [
      'CLOUDFLARE_R2_ENDPOINT',
      'CLOUDFLARE_R2_ACCESS_KEY_ID',
      'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
      'CLOUDFLARE_R2_BUCKET_NAME'
    ]

    const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar])
    
    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        missingVars
      })
    }

    // Try to create R2 client
    const r2Client = new S3Client({
      region: 'auto',
      endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
      },
    })

    // Try to list objects (this will test the connection)
    const command = new ListObjectsV2Command({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      MaxKeys: 1
    })

    const response = await r2Client.send(command)

    return NextResponse.json({
      success: true,
      message: 'R2 connection successful',
      bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      objectCount: response.KeyCount || 0
    })

  } catch (error) {
    console.error('R2 connection test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'R2 connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}