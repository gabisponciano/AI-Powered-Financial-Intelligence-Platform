'use client'
import { useState } from 'react'
import { uploadFile } from '@/lib/api'

export function useUpload() {
  const [uploading, setUploading] = useState(false)
  const [uploadId, setUploadId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function upload(file: File) {
    setUploading(true)
    setError(null)
    try {
      const res = await uploadFile(file)
      setUploadId(res.upload_id)
      return res.upload_id as number
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao fazer upload')
      return null
    } finally {
      setUploading(false)
    }
  }

  return { upload, uploading, uploadId, setUploadId, error }
}
