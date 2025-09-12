# Code Documentation - BulkImageUpload Component

## 📋 Overview

This document provides comprehensive code documentation for the BulkImageUpload component, including detailed explanations of all functions, classes, interfaces, and implementation details.

## 🏗️ Component Structure

### File: `src/components/ImageDetails/BulkImageUpload.tsx`

```typescript
/**
 * BulkImageUpload Component
 * 
 * A comprehensive image upload interface for traffic officers to efficiently
 * upload and manage violation images with real-time progress tracking,
 * batch management, and seamless AWS S3 integration.
 * 
 * @author TrafficEye Development Team
 * @version 1.0.0
 * @since 2024-12-19
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { apiService } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Trash2,
  FileImage
} from 'lucide-react'
```

## 🔧 Interfaces & Types

### UploadedImage Interface

```typescript
/**
 * Interface defining the structure of an uploaded image object
 * 
 * @interface UploadedImage
 * @property {string} id - Unique identifier for the image
 * @property {File} file - Original file object from the file system
 * @property {string} preview - URL for image preview/thumbnail
 * @property {'uploading' | 'success' | 'error'} status - Current upload status
 * @property {number} progress - Upload progress percentage (0-100)
 * @property {string} [error] - Error message if upload failed (optional)
 * @property {string} [s3Key] - S3 object key for successful uploads (optional)
 */
interface UploadedImage {
  id: string
  file: File
  preview: string
  status: 'uploading' | 'success' | 'error'
  progress: number
  error?: string
  s3Key?: string
}
```

## 📊 Constants & Configuration

### Upload Limits

```typescript
/**
 * Maximum number of images that can be uploaded in a single session
 * Set to 20 to balance usability with performance
 */
const MAX_IMAGES = 20

/**
 * Array of accepted MIME types for image files
 * Supports common web image formats
 */
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
```

## 🎯 Main Component

### Component Declaration

```typescript
/**
 * BulkImageUpload Component
 * 
 * Main functional component that provides the bulk image upload interface
 * 
 * @returns {JSX.Element} The rendered upload interface
 */
const BulkImageUpload: React.FC = () => {
  // Component implementation
}
```

### State Management

```typescript
/**
 * Authentication context hook
 * Provides access to current officer information
 */
const { currentOfficer } = useAuth()

/**
 * State for managing uploaded images
 * Array of UploadedImage objects representing the current upload session
 */
const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])

/**
 * State for drag and drop visual feedback
 * Boolean indicating if files are being dragged over the upload area
 */
const [isDragOver, setIsDragOver] = useState(false)

/**
 * Reference to the hidden file input element
 * Used to trigger file selection programmatically
 */
const fileInputRef = useRef<HTMLInputElement>(null)
```

## 🔍 Core Functions

### File Validation

```typescript
/**
 * Validates a file against upload requirements
 * 
 * @param {File} file - The file to validate
 * @returns {string | null} Error message if invalid, null if valid
 * 
 * @example
 * const error = validateFile(file)
 * if (error) {
 *   console.error('Validation failed:', error)
 * }
 */
const validateFile = (file: File): string | null => {
  // Check if file type is in accepted types array
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Only image files (JPG, JPEG, PNG, WebP) are allowed'
  }
  
  // Check if file size exceeds 10MB limit
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    return 'File size must be less than 10MB'
  }
  
  return null // File is valid
}
```

### Preview Generation

```typescript
/**
 * Creates a preview URL for an image file
 * 
 * @param {File} file - The image file to create preview for
 * @returns {string} Object URL for the file preview
 * 
 * @example
 * const previewUrl = createPreview(file)
 * // Use previewUrl in img src attribute
 */
const createPreview = (file: File): string => {
  return URL.createObjectURL(file)
}
```

### Image Upload with Progress Tracking

```typescript
/**
 * Uploads a single image file to S3 with real-time progress tracking
 * 
 * @param {File} file - The file to upload
 * @returns {Promise<UploadedImage>} Promise resolving to the uploaded image object
 * 
 * @throws {Error} When presigned URL generation fails
 * @throws {Error} When S3 upload fails
 * 
 * @example
 * try {
 *   const uploadedImage = await uploadImage(file)
 *   console.log('Upload successful:', uploadedImage)
 * } catch (error) {
 *   console.error('Upload failed:', error)
 * }
 */
const uploadImage = async (file: File): Promise<UploadedImage> => {
  // Generate unique ID for this upload
  const id = Math.random().toString(36).substr(2, 9)
  
  // Create preview URL for immediate display
  const preview = createPreview(file)
  
  // Initialize upload state
  const uploadedImage: UploadedImage = {
    id,
    file,
    preview,
    status: 'uploading',
    progress: 0
  }

  try {
    // Step 1: Request presigned URL from backend
    const presignedResponse = await apiService.generatePresignedUrl(
      currentOfficer?.id || 'unknown'
    )
    
    if (!presignedResponse.success) {
      throw new Error('Failed to get upload URL')
    }

    // Step 2: Upload to S3 with progress tracking using XMLHttpRequest
    const xhr = new XMLHttpRequest()
    
    return new Promise((resolve, reject) => {
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          
          // Update UI with current progress
          setUploadedImages(prev => 
            prev.map(img => 
              img.id === id ? { ...img, progress } : img
            )
          )
        }
      })

      // Handle successful upload
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          // Update state to success
          setUploadedImages(prev => 
            prev.map(img => 
              img.id === id 
                ? { ...img, status: 'success', progress: 100, s3Key: presignedResponse.data.key }
                : img
            )
          )
          
          // Resolve with success data
          resolve({
            ...uploadedImage,
            status: 'success',
            progress: 100,
            s3Key: presignedResponse.data.key
          })
        } else {
          throw new Error(`Upload failed with status ${xhr.status}`)
        }
      })

      // Handle upload errors
      xhr.addEventListener('error', () => {
        setUploadedImages(prev => 
          prev.map(img => 
            img.id === id 
              ? { ...img, status: 'error', error: 'Upload failed' }
              : img
          )
        )
        reject(new Error('Upload failed'))
      })

      // Configure and start upload
      xhr.open('PUT', presignedResponse.data.uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.send(file)
    })

  } catch (error) {
    // Update state with error information
    setUploadedImages(prev => 
      prev.map(img => 
        img.id === id 
          ? { ...img, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
          : img
      )
    )
    throw error
  }
}
```

### File Handling

```typescript
/**
 * Handles file selection and validation
 * Processes multiple files, validates them, and initiates uploads
 * 
 * @param {FileList | null} files - The selected files
 * 
 * @example
 * // Called when files are selected via input or drag & drop
 * handleFiles(event.target.files)
 */
const handleFiles = useCallback(async (files: FileList | null) => {
  if (!files) return

  // Convert FileList to Array for easier processing
  const fileArray = Array.from(files)
  const validFiles: File[] = []
  const errors: string[] = []

  // Validate each file
  fileArray.forEach(file => {
    const error = validateFile(file)
    if (error) {
      errors.push(`${file.name}: ${error}`)
    } else if (uploadedImages.length + validFiles.length < MAX_IMAGES) {
      validFiles.push(file)
    } else {
      errors.push(`${file.name}: Maximum ${MAX_IMAGES} images allowed`)
    }
  })

  // Display validation errors to user
  if (errors.length > 0) {
    alert(errors.join('\n'))
  }

  // Create UploadedImage objects for valid files
  const newImages: UploadedImage[] = validFiles.map(file => ({
    id: Math.random().toString(36).substr(2, 9),
    file,
    preview: createPreview(file),
    status: 'uploading',
    progress: 0
  }))

  // Add new images to state
  setUploadedImages(prev => [...prev, ...newImages])

  // Upload files sequentially to avoid overwhelming the server
  for (const image of newImages) {
    try {
      await uploadImage(image.file)
    } catch (error) {
      console.error('Upload failed for', image.file.name, error)
    }
  }
}, [uploadedImages.length, currentOfficer?.id])
```

### File Input Handling

```typescript
/**
 * Handles file input change events
 * Resets input value to allow selecting the same file again
 * 
 * @param {React.ChangeEvent<HTMLInputElement>} e - The change event
 */
const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  handleFiles(e.target.files)
  
  // Reset input value to allow selecting the same file again
  if (fileInputRef.current) {
    fileInputRef.current.value = ''
  }
}
```

### Drag & Drop Handling

```typescript
/**
 * Handles drag over events for visual feedback
 * 
 * @param {React.DragEvent} e - The drag event
 */
const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault()
  setIsDragOver(true)
}

/**
 * Handles drag leave events
 * 
 * @param {React.DragEvent} e - The drag event
 */
const handleDragLeave = (e: React.DragEvent) => {
  e.preventDefault()
  setIsDragOver(false)
}

/**
 * Handles file drop events
 * 
 * @param {React.DragEvent} e - The drop event
 */
const handleDrop = (e: React.DragEvent) => {
  e.preventDefault()
  setIsDragOver(false)
  handleFiles(e.dataTransfer.files)
}
```

### Image Management

```typescript
/**
 * Removes an image from the upload list
 * Also cleans up the preview URL to prevent memory leaks
 * 
 * @param {string} id - The ID of the image to remove
 * 
 * @example
 * removeImage('abc123')
 */
const removeImage = (id: string) => {
  setUploadedImages(prev => {
    // Find the image to remove
    const image = prev.find(img => img.id === id)
    
    // Clean up preview URL to prevent memory leaks
    if (image) {
      URL.revokeObjectURL(image.preview)
    }
    
    // Remove image from state
    return prev.filter(img => img.id !== id)
  })
}
```

### Memory Management

```typescript
/**
 * Cleanup effect to prevent memory leaks
 * Revokes all preview URLs when component unmounts
 */
useEffect(() => {
  return () => {
    uploadedImages.forEach(image => {
      URL.revokeObjectURL(image.preview)
    })
  }
}, [])
```

## 📊 Computed Values

### Upload Statistics

```typescript
/**
 * Calculates upload statistics for display
 * These values are computed on every render to ensure accuracy
 */
const successfulUploads = uploadedImages.filter(img => img.status === 'success').length
const failedUploads = uploadedImages.filter(img => img.status === 'error').length
const uploadingCount = uploadedImages.filter(img => img.status === 'uploading').length
```

## 🎨 JSX Structure

### Header Section

```typescript
/**
 * Header section with title, description, and officer information
 * Provides context and branding for the upload interface
 */
<div className="mb-8">
  <h1 className="text-3xl font-bold text-gray-900 mb-2">Image Upload</h1>
  <p className="text-gray-600 text-lg">
    Upload traffic violation images for analysis. Maximum {MAX_IMAGES} images allowed.
  </p>
  {currentOfficer && (
    <p className="text-sm text-gray-500 mt-1">
      Officer: {currentOfficer.name} ({currentOfficer.id}) - {currentOfficer.psName}
    </p>
  )}
</div>
```

### Upload Counter Panel

```typescript
/**
 * Upload counter panel showing current upload status
 * Displays success, failed, and uploading counts with appropriate icons
 */
<div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-4">
      {/* Success count */}
      <div className="flex items-center space-x-2">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <span className="text-sm font-medium text-gray-700">
          Uploaded: {successfulUploads}/{MAX_IMAGES}
        </span>
      </div>
      
      {/* Failed count - only shown if there are failures */}
      {failedUploads > 0 && (
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-sm font-medium text-red-700">
            Failed: {failedUploads}
          </span>
        </div>
      )}
      
      {/* Uploading count - only shown if uploads are in progress */}
      {uploadingCount > 0 && (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm font-medium text-blue-700">
            Uploading: {uploadingCount}
          </span>
        </div>
      )}
    </div>
    
    {/* Clear all button - only shown if there are uploaded images */}
    {uploadedImages.length > 0 && (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          uploadedImages.forEach(img => URL.revokeObjectURL(img.preview))
          setUploadedImages([])
        }}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Clear All
      </Button>
    )}
  </div>
</div>
```

### Upload Area

```typescript
/**
 * Main upload area with drag & drop functionality
 * Provides visual feedback for drag states and handles file selection
 */
<div
  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
    isDragOver
      ? 'border-blue-400 bg-blue-50'
      : 'border-gray-300 hover:border-gray-400'
  }`}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
>
  {/* Hidden file input for programmatic file selection */}
  <input
    ref={fileInputRef}
    type="file"
    multiple
    accept="image/jpeg,image/jpg,image/png,image/webp"
    onChange={handleFileInputChange}
    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
    disabled={uploadedImages.length >= MAX_IMAGES}
  />
  
  <div className="space-y-4">
    {/* Upload icon */}
    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
      <Upload className="h-8 w-8 text-blue-600" />
    </div>
    
    {/* Upload instructions */}
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {uploadedImages.length >= MAX_IMAGES 
          ? 'Maximum images reached' 
          : 'Upload Images'
        }
      </h3>
      <p className="text-gray-600 mb-4">
        {uploadedImages.length >= MAX_IMAGES
          ? `You have reached the maximum of ${MAX_IMAGES} images. Remove some images to upload more.`
          : 'Drag and drop images here, or click to select files'
        }
      </p>
      <p className="text-sm text-gray-500">
        Supported formats: JPG, JPEG, PNG, WebP (max 10MB each)
      </p>
    </div>

    {/* Upload button - only shown if under limit */}
    {uploadedImages.length < MAX_IMAGES && (
      <Button
        size="lg"
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
        onClick={() => fileInputRef.current?.click()}
      >
        <FileImage className="h-5 w-5 mr-2" />
        Select Images
      </Button>
    )}
  </div>
</div>
```

### Image Grid

```typescript
/**
 * Responsive grid displaying uploaded images
 * Shows thumbnails, progress, status, and management controls
 */
{uploadedImages.length > 0 && (
  <div className="mt-8">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">Uploaded Images</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {uploadedImages.map((image) => (
        <div
          key={image.id}
          className="relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          {/* Image preview */}
          <div className="aspect-square relative">
            <img
              src={image.preview}
              alt={image.file.name}
              className="w-full h-full object-cover"
            />
            
            {/* Status overlays */}
            {image.status === 'uploading' && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-sm">{image.progress}%</p>
                </div>
              </div>
            )}
            
            {image.status === 'success' && (
              <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                <CheckCircle className="h-4 w-4" />
              </div>
            )}
            
            {image.status === 'error' && (
              <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1">
                <AlertCircle className="h-4 w-4" />
              </div>
            )}
          </div>

          {/* Image information */}
          <div className="p-3">
            <p className="text-sm font-medium text-gray-900 truncate mb-1">
              {image.file.name}
            </p>
            <p className="text-xs text-gray-500 mb-2">
              {(image.file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            
            {/* Status and actions */}
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${
                image.status === 'success' 
                  ? 'text-green-600' 
                  : image.status === 'error' 
                  ? 'text-red-600' 
                  : 'text-blue-600'
              }`}>
                {image.status === 'uploading' && `Uploading ${image.progress}%`}
                {image.status === 'success' && 'Uploaded'}
                {image.status === 'error' && 'Failed'}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeImage(image.id)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Error message */}
            {image.status === 'error' && image.error && (
              <p className="text-xs text-red-600 mt-1 truncate" title={image.error}>
                {image.error}
              </p>
            )}
          </div>

          {/* Progress bar */}
          {image.status === 'uploading' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
              <div
                className="h-full bg-blue-600 transition-all duration-300 ease-out"
                style={{ width: `${image.progress}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
)}
```

### Action Buttons

```typescript
/**
 * Action buttons for processing uploaded images
 * Only shown when there are successful uploads
 */
{successfulUploads > 0 && (
  <div className="mt-8 flex justify-center space-x-4">
    <Button
      size="lg"
      className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
      onClick={() => {
        // Here you would typically submit the uploaded images for processing
        alert(`${successfulUploads} images ready for processing!`)
      }}
    >
      <CheckCircle className="h-5 w-5 mr-2" />
      Process {successfulUploads} Images
    </Button>
  </div>
)}
```

## 🔧 Performance Considerations

### Memory Management

1. **Preview URL Cleanup**: All preview URLs are properly revoked to prevent memory leaks
2. **State Optimization**: Efficient state updates minimize re-renders
3. **File Size Limits**: 10MB per file prevents memory issues

### Network Optimization

1. **Direct S3 Upload**: Bypasses server for better performance
2. **Progress Tracking**: Real-time feedback without polling
3. **Batch Processing**: Efficient handling of multiple uploads

### Browser Compatibility

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+
- **File API Support**: Required for drag & drop functionality
- **XMLHttpRequest**: Used for progress tracking

## 🧪 Testing Considerations

### Unit Tests

```typescript
// Example test structure
describe('BulkImageUpload', () => {
  test('validates file types correctly', () => {
    const validFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
    const invalidFile = new File([''], 'test.pdf', { type: 'application/pdf' })
    
    expect(validateFile(validFile)).toBeNull()
    expect(validateFile(invalidFile)).toBe('Only image files are allowed')
  })
  
  test('handles upload progress correctly', () => {
    // Test progress tracking
  })
  
  test('manages state correctly', () => {
    // Test state updates
  })
})
```

### Integration Tests

- Test API integration with mock responses
- Test drag & drop functionality
- Test responsive behavior
- Test error handling scenarios

## 📚 Dependencies

### Required Dependencies

```json
{
  "react": "^18.0.0",
  "typescript": "^5.0.0",
  "tailwindcss": "^3.0.0",
  "lucide-react": "^0.400.0",
  "@radix-ui/react-slot": "^1.0.0"
}
```

### Internal Dependencies

- `@/components/ui/button` - Button component
- `@/services/api` - API service for backend communication
- `@/context/AuthContext` - Authentication context

## 🚀 Deployment Notes

### Build Requirements

- Node.js 18+
- npm or yarn
- TypeScript compiler
- Tailwind CSS processor

### Environment Variables

```env
VITE_BACKEND_API_URL=https://your-backend-url.com
```

### Browser Support

- Modern browsers with ES6+ support
- File API support for drag & drop
- XMLHttpRequest for progress tracking

---

*Last updated: December 2024*
*Version: 1.0.0*
