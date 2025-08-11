import { NextRequest, NextResponse } from 'next/server'
import { generatePresignedUploadUrl, isValidImageType, isValidFileSize } from '@/lib/cloudflare-r2'
import { getAuthContext } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // TODO: Re-enable authentication once user login system is implemented
    // const authResult = await getAuthContext(request)
    // if (!authResult.isAuthenticated || !authResult.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { fileName, fileType, fileSize, vehicleId } = body

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: 'File name and type are required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!isValidImageType(fileType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (fileSize && !isValidFileSize(fileSize)) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Generate presigned URL
    const uploadData = await generatePresignedUploadUrl(fileName, fileType, vehicleId)

    return NextResponse.json({
      uploadUrl: uploadData.uploadUrl,
      key: uploadData.key,
      publicUrl: uploadData.publicUrl
    })

  } catch (error) {
    console.error('Error generating presigned URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}
