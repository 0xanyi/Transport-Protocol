import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'

// Cloudflare R2 configuration
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'transport-protocol'
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL || ''

export interface UploadResult {
  url: string
  key: string
  publicUrl: string
}

/**
 * Generate a presigned URL for uploading a file directly from the client
 */
export async function generatePresignedUploadUrl(
  fileName: string,
  fileType: string,
  vehicleId?: string
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  const fileExtension = fileName.split('.').pop()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const uniqueId = uuidv4()
  
  // Create a structured key for better organization
  const folder = vehicleId ? `vehicles/${vehicleId}` : 'vehicles/temp'
  const key = `${folder}/${uniqueId}_${sanitizedFileName}`

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: fileType,
  })

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 }) // 1 hour

  return {
    uploadUrl,
    key,
    // Use our proxy route instead of direct R2 URL to avoid public access issues
    publicUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/images/${key}`
  }
}

/**
 * Upload a file directly from the server (for server-side uploads)
 */
export async function uploadFile(
  file: Buffer | Uint8Array,
  fileName: string,
  contentType: string,
  vehicleId?: string
): Promise<UploadResult> {
  const fileExtension = fileName.split('.').pop()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const uniqueId = uuidv4()
  
  const folder = vehicleId ? `vehicles/${vehicleId}` : 'vehicles/temp'
  const key = `${folder}/${uniqueId}_${sanitizedFileName}`

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  })

  await r2Client.send(command)

  return {
    url: `s3://${BUCKET_NAME}/${key}`,
    key,
    // Use our proxy route instead of direct R2 URL to avoid public access issues
    publicUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/images/${key}`
  }
}

/**
 * Delete a file from Cloudflare R2
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  await r2Client.send(command)
}

/**
 * Move files from temp folder to vehicle folder
 */
export async function moveFilesToVehicleFolder(tempKeys: string[], vehicleId: string): Promise<string[]> {
  const newKeys: string[] = []
  
  for (const tempKey of tempKeys) {
    // Extract filename from temp key
    const fileName = tempKey.split('/').pop()
    if (!fileName) continue
    
    const newKey = `vehicles/${vehicleId}/${fileName}`
    
    // Copy to new location (R2 doesn't have a native move operation)
    // This would require implementing a copy operation if needed
    // For now, we'll just update the key structure
    newKeys.push(newKey)
  }
  
  return newKeys
}

/**
 * Get public URL for a given key
 */
export function getPublicUrl(key: string): string {
  // Use our proxy route instead of direct R2 URL to avoid public access issues
  return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/images/${key}`
}

/**
 * Validate file type for vehicle images
 */
export function isValidImageType(fileType: string): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  return validTypes.includes(fileType.toLowerCase())
}

/**
 * Validate file size (max 10MB for vehicle images)
 */
export function isValidFileSize(fileSize: number): boolean {
  const maxSize = 10 * 1024 * 1024 // 10MB
  return fileSize <= maxSize
}
