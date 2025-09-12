

# TrafficEye - AI-Powered Traffic Violation Management System

A comprehensive React-based web application for traffic violation detection, analysis, and challan generation using AI and computer vision technologies.

## 🚀 Features

- **AI-Powered Image Analysis**: Automated traffic violation detection using computer vision
- **Bulk Image Upload**: Efficient batch processing of violation images
- **Real-time Progress Tracking**: Live upload progress with animated indicators
- **Officer Management**: Role-based access control for traffic officers
- **Challan Generation**: Automated challan creation and management
- **RTA Integration**: Vehicle registration verification
- **Responsive Design**: Mobile-first approach for field operations

## 📋 Table of Contents

- [Project Structure](#project-structure)
- [BulkImageUpload Component](#bulkimageupload-component)
  - [Overview](#overview)
  - [Features](#features)
  - [API Integration](#api-integration)
  - [Component Architecture](#component-architecture)
  - [Usage Guide](#usage-guide)
  - [Technical Implementation](#technical-implementation)
  - [Styling & Theming](#styling--theming)
  - [Error Handling](#error-handling)
  - [Performance Considerations](#performance-considerations)
- [Installation & Setup](#installation--setup)
- [Development](#development)
- [Deployment](#deployment)

## Project Structure

```
├── src/                    # Frontend React application
│   ├── components/         # UI components
│   │   ├── ImageDetails/   # Image-related components
│   │   │   ├── BulkImageUpload.tsx  # Main bulk upload component
│   │   │   ├── ChallanCard.tsx      # Challan display component
│   │   │   ├── ImageDetails.tsx     # Image details component
│   │   │   └── ImageZoom.tsx        # Image zoom functionality
│   │   ├── layout/         # Layout components
│   │   ├── ui/             # Reusable UI components
│   │   └── toast/          # Toast notification system
│   ├── services/          # API services & TSeChallan integration
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript definitions
│   ├── context/           # React context providers
│   ├── stores/            # State management
│   └── pages/             # Page components
├── backend/               # Backend proxy service
│   ├── index.js           # Express server
│   ├── package.json       # Backend dependencies
│   └── README.md          # Backend documentation
└── README.md              # This file
```

---

# BulkImageUpload Component

## Overview

The `BulkImageUpload` component is a sophisticated, production-ready image upload interface designed specifically for traffic officers to efficiently upload and manage violation images. It provides a modern, intuitive user experience with real-time progress tracking, batch management capabilities, and seamless integration with AWS S3 storage.

### Key Capabilities

- **Batch Upload Management**: Handle up to 20 images simultaneously
- **Real-time Progress Tracking**: Live upload progress with smooth animations
- **Drag & Drop Interface**: Intuitive file selection with visual feedback
- **File Validation**: Comprehensive validation for image formats and sizes
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Professional Styling**: Government-appropriate design with accessibility focus

## Features

### 🎯 Core Functionality

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **File Selection** | Multiple file selection with drag & drop | `handleFiles()`, `handleDrop()` |
| **File Validation** | Type and size validation | `validateFile()` |
| **Progress Tracking** | Real-time upload progress | XMLHttpRequest with progress events |
| **Batch Management** | Upload multiple files simultaneously | Async/await with Promise handling |
| **Image Preview** | Thumbnail generation and display | `URL.createObjectURL()` |
| **Error Handling** | Comprehensive error management | Try-catch with user feedback |

### 📱 User Interface

| Element | Purpose | Styling |
|---------|---------|---------|
| **Upload Area** | Primary file selection interface | Dashed border with hover effects |
| **Progress Bars** | Visual upload progress indication | Animated blue progress bars |
| **Image Grid** | Responsive thumbnail display | CSS Grid with aspect-ratio preservation |
| **Status Indicators** | Upload status visualization | Color-coded icons (success/error/uploading) |
| **Counter Display** | Upload progress summary | Blue-themed status panel |

### 🔧 Technical Features

| Feature | Technology | Purpose |
|---------|------------|---------|
| **Presigned URLs** | AWS S3 Integration | Secure direct uploads |
| **Memory Management** | URL.revokeObjectURL() | Prevent memory leaks |
| **Type Safety** | TypeScript interfaces | Compile-time error prevention |
| **Responsive Design** | Tailwind CSS Grid | Mobile-first approach |
| **Accessibility** | ARIA labels, keyboard navigation | WCAG compliance |

## API Integration

### Presigned URL Flow

```typescript
// 1. Request presigned URL from backend
const presignedResponse = await apiService.generatePresignedUrl(officerId)

// 2. Upload directly to S3 using presigned URL
const xhr = new XMLHttpRequest()
xhr.open('PUT', presignedResponse.data.uploadUrl)
xhr.setRequestHeader('Content-Type', file.type)
xhr.send(file)
```

### API Endpoints Used

| Endpoint | Method | Purpose | Parameters |
|----------|--------|---------|------------|
| `/api/generate-presigned-url` | POST | Get S3 upload URL | `{ constable_id: string }` |
| S3 Direct Upload | PUT | Upload file to S3 | File binary data |

### Response Structure

```typescript
interface PresignedResponse {
  success: boolean
  data: {
    uploadUrl: string    // S3 presigned URL
    key: string         // S3 object key
    expiresIn: number   // URL expiration time
  }
}
```

## Component Architecture

### State Management

```typescript
interface UploadedImage {
  id: string                    // Unique identifier
  file: File                   // Original file object
  preview: string              // Preview URL
  status: 'uploading' | 'success' | 'error'  // Upload status
  progress: number             // Upload progress (0-100)
  error?: string               // Error message if failed
  s3Key?: string               // S3 object key
}
```

### Component Structure

```
BulkImageUpload
├── Header Section
│   ├── Title & Description
│   └── Officer Information
├── Upload Counter
│   ├── Success Count
│   ├── Failed Count
│   ├── Uploading Count
│   └── Clear All Button
├── Upload Area
│   ├── Drag & Drop Zone
│   ├── File Input (hidden)
│   └── Upload Button
├── Image Grid
│   ├── Image Thumbnails
│   ├── Progress Overlays
│   ├── Status Indicators
│   └── Delete Buttons
└── Action Buttons
    └── Process Images Button
```

### Key Functions

#### File Validation
```typescript
const validateFile = (file: File): string | null => {
  // Check file type
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Only image files (JPG, JPEG, PNG, WebP) are allowed'
  }
  
  // Check file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    return 'File size must be less than 10MB'
  }
  
  return null // Valid file
}
```

#### Upload with Progress Tracking
```typescript
const uploadImage = async (file: File): Promise<UploadedImage> => {
  // Create progress tracking with XMLHttpRequest
  const xhr = new XMLHttpRequest()
  
  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) {
      const progress = Math.round((e.loaded / e.total) * 100)
      // Update UI with progress
    }
  })
  
  // Handle upload completion
  xhr.addEventListener('load', () => {
    // Update status to success
  })
  
  // Handle upload errors
  xhr.addEventListener('error', () => {
    // Update status to error
  })
}
```

## Usage Guide

### Basic Usage

```tsx
import BulkImageUpload from '@/components/ImageDetails/BulkImageUpload'

function App() {
  return (
    <div>
      <BulkImageUpload />
    </div>
  )
}
```

### Navigation Integration

The component is accessible via the `/bulk-upload` route and appears in the main navigation sidebar.

### User Workflow

1. **Access Upload Page**: Navigate to "Bulk Upload" in the sidebar
2. **Select Images**: 
   - Click "Select Images" button, or
   - Drag and drop files onto the upload area
3. **Monitor Progress**: Watch real-time upload progress
4. **Review Results**: Check uploaded images in the grid
5. **Manage Images**: Remove individual images or clear all
6. **Process Images**: Click "Process Images" when ready

### File Requirements

| Requirement | Specification |
|-------------|---------------|
| **File Types** | JPG, JPEG, PNG, WebP |
| **File Size** | Maximum 10MB per file |
| **Quantity** | Maximum 20 files per session |
| **Officer Authentication** | Required (automatic) |

## Technical Implementation

### Dependencies

```json
{
  "react": "^18.0.0",
  "typescript": "^5.0.0",
  "tailwindcss": "^3.0.0",
  "lucide-react": "^0.400.0",
  "@radix-ui/react-slot": "^1.0.0"
}
```

### Key Imports

```typescript
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { apiService } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { 
  Upload, X, CheckCircle, AlertCircle, 
  Trash2, FileImage 
} from 'lucide-react'
```

### Performance Optimizations

1. **Memory Management**
   ```typescript
   // Cleanup preview URLs on unmount
   useEffect(() => {
     return () => {
       uploadedImages.forEach(image => {
         URL.revokeObjectURL(image.preview)
       })
     }
   }, [])
   ```

2. **Efficient State Updates**
   ```typescript
   // Batch state updates to prevent excessive re-renders
   setUploadedImages(prev => 
     prev.map(img => 
       img.id === id ? { ...img, progress } : img
     )
   )
   ```

3. **Lazy Loading**
   - Images are loaded only when needed
   - Preview URLs are created on-demand

### Error Handling Strategy

```typescript
// Comprehensive error handling
try {
  const presignedResponse = await apiService.generatePresignedUrl(officerId)
  // ... upload logic
} catch (error) {
  setUploadedImages(prev => 
    prev.map(img => 
      img.id === id 
        ? { ...img, status: 'error', error: error.message }
        : img
    )
  )
}
```

## Styling & Theming

### Design System

The component follows a professional government theme with:

- **Primary Colors**: Blue (#2563eb), White (#ffffff), Gray (#6b7280)
- **Typography**: Clear, accessible fonts with proper contrast
- **Spacing**: Consistent 4px grid system
- **Shadows**: Subtle elevation for depth

### Responsive Breakpoints

```css
/* Mobile First Approach */
.grid-cols-1                    /* Mobile: 1 column */
sm:grid-cols-2                  /* Tablet: 2 columns */
lg:grid-cols-3                  /* Desktop: 3 columns */
xl:grid-cols-4                  /* Large Desktop: 4 columns */
```

### Accessibility Features

- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Proper ARIA labels
- **Color Contrast**: WCAG AA compliant
- **Focus Management**: Clear focus indicators
- **Error Announcements**: Screen reader accessible error messages

## Error Handling

### Validation Errors

| Error Type | Message | User Action |
|------------|---------|-------------|
| **Invalid File Type** | "Only image files (JPG, JPEG, PNG, WebP) are allowed" | Select valid image files |
| **File Too Large** | "File size must be less than 10MB" | Compress or select smaller files |
| **Too Many Files** | "Maximum 20 images allowed" | Remove some files before adding more |

### Upload Errors

| Error Type | Handling | Recovery |
|------------|----------|----------|
| **Network Error** | Retry mechanism | User can retry upload |
| **S3 Upload Failed** | Clear error message | Remove failed image and retry |
| **Authentication Error** | Redirect to login | Automatic redirect |

### User Feedback

- **Success**: Green checkmark with "Uploaded" status
- **Error**: Red alert icon with error message
- **Uploading**: Blue spinner with progress percentage

## Performance Considerations

### Memory Management

1. **Preview URL Cleanup**: Automatic cleanup of object URLs
2. **State Optimization**: Minimal re-renders with efficient updates
3. **File Size Limits**: 10MB per file to prevent memory issues

### Network Optimization

1. **Direct S3 Upload**: Bypasses server for better performance
2. **Progress Tracking**: Real-time feedback without polling
3. **Batch Processing**: Efficient handling of multiple uploads

### Browser Compatibility

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+
- **File API Support**: Required for drag & drop functionality
- **XMLHttpRequest**: Used for progress tracking

---

## Installation & Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- AWS S3 bucket configured
- Backend API running

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd tfeye-2

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

```env
VITE_BACKEND_API_URL=https://your-backend-url.com
```

## Development

### Running the Application

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Formatting
npm run format
```

## Deployment

### Production Build

```bash
npm run build
```

### Deployment Options

- **Vercel**: Automatic deployment from Git
- **Netlify**: Drag & drop deployment
- **AWS S3**: Static website hosting
- **Docker**: Containerized deployment

### Environment Configuration

Ensure the following environment variables are set:

- `VITE_BACKEND_API_URL`: Backend API endpoint
- AWS credentials for S3 access (configured in backend)

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.


