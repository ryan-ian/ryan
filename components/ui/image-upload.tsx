import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import Image from "next/image"

interface ImageUploadProps {
  onImageUploaded: (url: string) => void
  currentImage?: string | null
  className?: string
}

export function ImageUpload({ onImageUploaded, currentImage, className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create a preview URL
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    setError(null)
    setIsUploading(true)

    try {
      // Create form data
      const formData = new FormData()
      formData.append("file", file)

      // Upload the file
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload image")
      }

      const data = await response.json()
      onImageUploaded(data.url)
    } catch (error) {
      console.error("Upload error:", error)
      setError(error instanceof Error ? error.message : "Failed to upload image")
      // Revert preview if there was an error
      setPreviewUrl(currentImage)
    } finally {
      setIsUploading(false)
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveImage = () => {
    setPreviewUrl(null)
    onImageUploaded("")
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="image-upload">Room Image</Label>
      
      <div className="border border-dashed border-gray-300 rounded-md p-4">
        {previewUrl ? (
          <div className="relative">
            <div className="relative aspect-video w-full overflow-hidden rounded-md">
              <Image 
                src={previewUrl} 
                alt="Room preview" 
                fill 
                className="object-cover"
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemoveImage}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <label
            htmlFor="image-upload"
            className="flex flex-col items-center justify-center py-6 cursor-pointer"
          >
            <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
            <span className="text-sm font-medium mb-1">Click to upload image</span>
            <span className="text-xs text-muted-foreground">JPEG, PNG, WEBP, or GIF (max 5MB)</span>
          </label>
        )}
        
        <input
          id="image-upload"
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>
      
      {isUploading && (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Uploading image...
        </div>
      )}
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
} 