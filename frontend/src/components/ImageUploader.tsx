import { useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'

import { apiUrl } from '../utils/api'

const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

interface ImageUploaderProps {
  onAnalysisCreated: (analysisId: string) => void
}

export default function ImageUploader({ onAnalysisCreated }: ImageUploaderProps) {
  const { token } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      return 'Only JPEG, PNG, and WEBP images are supported.'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File is too large. Maximum size is 10 MB.'
    }
    return null
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      setPreviewUrl(null)
      setSelectedFile(null)
      e.target.value = ''
      return
    }

    setError(null)
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleClear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setSelectedFile(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  const handleSubmit = async () => {
    if (!selectedFile || !token) return

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)

      const res = await fetch(apiUrl('/analyses'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string }
        throw new Error(body.message ?? `Upload failed (${res.status})`)
      }

      const { analysisId } = (await res.json()) as { analysisId: string }
      handleClear()
      onAnalysisCreated(analysisId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Upload image from device"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Capture image with camera"
      />

      {/* Upload / Camera buttons */}
      {!previewUrl && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 w-full rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/50 py-8 text-sm font-medium text-purple-600 hover:border-purple-400 hover:bg-purple-50 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Choose a photo
          </button>

          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center justify-center gap-2 w-full rounded-2xl gradient-primary py-3.5 text-sm font-semibold text-white shadow-glow transition-all hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Take a photo
          </button>
        </div>
      )}

      {/* Image preview */}
      {previewUrl && (
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden bg-gray-100">
            <img src={previewUrl} alt="Selected product" className="w-full object-contain max-h-64" />
            <button
              type="button"
              onClick={handleClear}
              aria-label="Remove selected image"
              className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isUploading}
            className="w-full rounded-2xl gradient-primary py-3.5 text-sm font-semibold text-white shadow-glow transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Analyzing…
              </>
            ) : (
              '✨ Analyze product'
            )}
          </button>
        </div>
      )}

      {/* Inline error */}
      {error && (
        <p role="alert" className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">
          {error}
        </p>
      )}
    </div>
  )
}
