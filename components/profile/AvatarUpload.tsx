'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AvatarUploadProps {
  userId: string
  currentAvatarUrl: string | null
  onUpload: (url: string) => void
}

export function AvatarUpload({ userId, currentAvatarUrl, onUpload }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')

    // Validar tipo
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Solo se permiten JPG, PNG y WebP')
      return
    }

    // Validar tamaño (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen debe ser menor a 2MB')
      return
    }

    // Mostrar preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Subir a Storage
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${userId}/avatar.${ext}`

      // Eliminar avatar anterior si existe
      await supabase.storage.from('avatars').remove([path]).catch(() => null)

      // Subir nuevo
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      // Obtener URL público
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)

      onUpload(publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir imagen')
      setPreview(currentAvatarUrl)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="avatar-upload">
      <div className="avatar-preview">
        {preview ? (
          <img src={preview} alt="Avatar" />
        ) : (
          <div className="avatar-placeholder">AVATAR</div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        disabled={uploading}
        style={{ display: 'none' }}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="btn ghost"
      >
        {uploading ? 'SUBIENDO...' : 'CAMBIAR AVATAR'}
      </button>

      {error && <div className="error">{error}</div>}

      <style jsx>{`
        .avatar-upload {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }

        .avatar-preview {
          width: 120px;
          height: 120px;
          border: 2px solid rgba(0, 245, 255, 0.3);
          border-radius: 4px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.3);
        }

        .avatar-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          color: rgba(0, 245, 255, 0.5);
          font-size: 12px;
          font-family: monospace;
          text-align: center;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error {
          color: #ff006e;
          font-size: 12px;
          font-family: monospace;
        }
      `}</style>
    </div>
  )
}
