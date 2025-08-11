import { NextRequest, NextResponse } from 'next/server'
import { uploadFile, isValidImageType, isValidFileSize } from '@/lib/cloudflare-r2'

export async function POST(request: NextRequest) {
  try {
    // TODO: Re-enable authentication once user login system is implemented
    // const authResult = await getAuthContext(request)
    // if (!authResult.isAuthenticated || !authResult.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const vehicleId = formData.get('vehicleId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!isValidImageType(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (!isValidFileSize(file.size)) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload file directly from server
    const uploadResult = await uploadFile(buffer, file.name, file.type, vehicleId)

    return NextResponse.json({
      key: uploadResult.key,
      publicUrl: uploadResult.publicUrl
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}