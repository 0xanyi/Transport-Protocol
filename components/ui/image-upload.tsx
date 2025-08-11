'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'

interface UploadedImage {
  key: string
  publicUrl: string
  file?: File
}

interface ImageUploadProps {
  onImagesChange: (images: UploadedImage[]) => void
  existingImages?: string[]
  maxImages?: number
  vehicleId?: string
  disabled?: boolean
  className?: string
}

export default function ImageUpload({
  onImagesChange,
  existingImages = [],
  maxImages = 10,
  vehicleId,
  disabled = false,
  className = ''
}: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>(
    existingImages.map(url => ({
      key: url.split('/').pop() || '',
      publicUrl: url
    }))
  )

  // Update images when existingImages prop changes (for edit mode)
  useEffect(() => {
    const existingImageObjects = existingImages.map(url => ({
      key: url.split('/').pop() || '',
      publicUrl: url
    }))
    setImages(existingImageObjects)
  }, [existingImages])
  const [uploading, setUploading] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isR2Configured, setIsR2Configured] = useState<boolean | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check if R2 is configured on component mount
  useEffect(() => {
    checkR2Configuration()
  }, [])

  const checkR2Configuration = async () => {
    try {
      const response = await fetch('/api/upload/config-check')
      const data = await response.json()
      setIsR2Configured(data.configured)
    } catch {
      setIsR2Configured(false)
    }
  }

  const uploadImage = async (file: File): Promise<UploadedImage | null> => {
    try {
      // Create form data for server-side upload
      const formData = new FormData()
      formData.append('file', file)
      if (vehicleId) {
        formData.append('vehicleId', vehicleId)
      }

      // Upload via server-side API (bypasses CORS issues)
      const response = await fetch('/api/upload/direct', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload file')
      }

      const { key, publicUrl } = await response.json()
      
      return { key, publicUrl, file }
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // Check if we would exceed max images
    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`)
      return
    }

    setError(null)
    const newUploading = files.map(file => file.name)
    setUploading(prev => [...prev, ...newUploading])

    try {
      const uploadPromises = files.map(uploadImage)
      const uploadResults = await Promise.all(uploadPromises)
      
      const successfulUploads = uploadResults.filter(result => result !== null) as UploadedImage[]
      const newImages = [...images, ...successfulUploads]
      
      setImages(newImages)
      onImagesChange(newImages)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(prev => prev.filter(name => !newUploading.includes(name)))
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    onImagesChange(newImages)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const canAddMore = images.length < maxImages && !disabled && isR2Configured

  // If R2 is not configured, show a message
  if (isR2Configured === false) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="border-2 border-dashed border-yellow-300 rounded-lg p-6 text-center bg-yellow-50">
          <Camera className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
          <p className="text-yellow-800 font-medium mb-1">Image Upload Not Available</p>
          <p className="text-yellow-700 text-sm">
            Cloudflare R2 is not configured. Vehicle management will work normally without photos.
          </p>
          <p className="text-yellow-600 text-xs mt-2">
            See docs/R2_SETUP.md for setup instructions.
          </p>
        </div>
      </div>
    )
  }

  // Loading state while checking configuration
  if (isR2Configured === null) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">Checking upload configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Controls */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={triggerFileInput}
          disabled={!canAddMore || uploading.length > 0}
          className="flex items-center gap-2"
        >
          {uploading.length > 0 ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
          {uploading.length > 0 ? 'Uploading...' : 'Add Photos'}
        </Button>
        
        <span className="text-sm text-gray-500">
          {images.length} / {maxImages} photos
        </span>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error display */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
          {error}
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                <img
                  src={image.publicUrl}
                  alt={`Vehicle photo ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to placeholder on error
                    const target = e.target as HTMLImageElement
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiAxNkM5Ljc5IDEzLjc5IDkuNzkgMTAuMjEgMTIgOEMxNC4yMSAxMC4yMSAxNC4yMSAxMy43OSAxMiAxNloiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+'
                  }}
                />
              </div>
              
              {/* Remove button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload progress for individual files */}
      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map((fileName, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Uploading {fileName}...</span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && uploading.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No photos uploaded yet</p>
          <Button
            type="button"
            variant="outline"
            onClick={triggerFileInput}
            disabled={disabled}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Photos
          </Button>
        </div>
      )}
    </div>
  )
}
