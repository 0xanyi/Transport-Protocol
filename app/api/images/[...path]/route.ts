import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'transport-protocol'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params
    const imagePath = resolvedParams.path.join('/')
    
    console.log('Fetching image from R2:', imagePath)

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: imagePath,
    })

    const response = await r2Client.send(command)
    
    if (!response.Body) {
      return new NextResponse('Image not found', { status: 404 })
    }

    // Convert the stream to buffer
    const chunks: Uint8Array[] = []
    const reader = response.Body.transformToWebStream().getReader()
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
    
    const buffer = Buffer.concat(chunks)

    // Return the image with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': response.ContentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Content-Length': buffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Error fetching image from R2:', error)
    return new NextResponse('Error fetching image', { status: 500 })
  }
}