'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Building2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { uploadOrganisationLogo } from '../actions/organisation.actions'

interface LogoUploadProps {
  currentLogoUrl: string | null
  readOnly?: boolean
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export function LogoUpload({ currentLogoUrl, readOnly = false }: LogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [clientError, setClientError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const displayUrl = preview ?? currentLogoUrl

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setClientError(null)
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setClientError('Only image files are allowed.')
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      setClientError('File size must be under 5 MB.')
      return
    }

    setSelectedFile(file)
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
  }

  function handleUpload() {
    if (!selectedFile) return
    startTransition(async () => {
      const formData = new FormData()
      formData.append('logo', selectedFile)
      const result = await uploadOrganisationLogo(formData)
      if (result.success) {
        toast.success('Logo uploaded successfully.')
        setSelectedFile(null)
        // Keep preview showing the newly uploaded image
      } else {
        toast.error(result.error ?? 'Failed to upload logo.')
      }
    })
  }

  function handleSelectClick() {
    fileInputRef.current?.click()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organisation Logo</CardTitle>
        <CardDescription>
          Upload a logo image (PNG, JPG, SVG). Maximum file size: 5 MB.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo preview */}
        <div className="flex items-center gap-6">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
            {displayUrl ? (
              <Image
                src={displayUrl}
                alt="Organisation logo"
                fill
                sizes="96px"
                className="object-contain p-1"
                unoptimized={preview !== null} // blob URLs can't be optimised
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <Building2 className="h-10 w-10" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {displayUrl ? 'Current logo' : 'No logo uploaded'}
            </p>
            <p className="text-xs text-muted-foreground">Recommended: 256 × 256 px or larger</p>
          </div>
        </div>

        {/* Upload controls — hidden when readOnly */}
        {!readOnly && (
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isPending}
            />

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectClick}
                disabled={isPending}
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Button>

              {selectedFile && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleUpload}
                  disabled={isPending}
                >
                  {isPending ? 'Uploading...' : 'Upload Logo'}
                </Button>
              )}
            </div>

            {selectedFile && !clientError && (
              <p className="text-xs text-muted-foreground">
                Selected: <span className="font-medium">{selectedFile.name}</span> (
                {(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}

            {clientError && (
              <p className="text-sm font-medium text-destructive">{clientError}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
