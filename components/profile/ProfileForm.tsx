'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { AvatarUpload } from './AvatarUpload'

interface ProfileFormProps {
  profile: Profile
  onSave: (updated: Profile) => void
}

export function ProfileForm({ profile, onSave }: ProfileFormProps) {
  const [username, setUsername] = useState(profile.username)
  const [bio, setBio] = useState(profile.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const supabase = createClient()

  const handleSave = async () => {
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // Validar username
      if (!username.trim()) {
        throw new Error('El username es obligatorio')
      }
      if (username.length < 3 || username.length > 20) {
        throw new Error('El username debe tener entre 3 y 20 caracteres')
      }
      if (bio.length > 200) {
        throw new Error('La biografía no puede exceder 200 caracteres')
      }

      // Actualizar en Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: username.trim(),
          bio: bio.trim() || null,
          avatar_url: avatarUrl,
        })
        .eq('id', profile.id)

      if (updateError) throw updateError

      // Actualizar estado local
      onSave({
        ...profile,
        username: username.trim(),
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
      })

      setSuccess('Perfil actualizado exitosamente')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setUsername(profile.username)
    setBio(profile.bio || '')
    setAvatarUrl(profile.avatar_url)
    setError('')
  }

  return (
    <div className="profile-form">
      <div className="form-section">
        <h3>Avatar</h3>
        <AvatarUpload
          userId={profile.id}
          currentAvatarUrl={avatarUrl}
          onUpload={setAvatarUrl}
        />
      </div>

      <div className="form-section">
        <h3>Información Personal</h3>

        <div className="form-field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
            disabled={loading}
            placeholder="Tu nombre de usuario"
          />
          <small>{username.length}/20</small>
        </div>

        <div className="form-field">
          <label htmlFor="bio">Biografía (opcional)</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
            disabled={loading}
            placeholder="Cuéntanos sobre ti..."
            rows={3}
          />
          <small>{bio.length}/200</small>
        </div>
      </div>

      <div className="form-section">
        <h3>Estadísticas</h3>
        <div className="stats">
          <div className="stat">
            <div className="stat-value">{profile.total_games}</div>
            <div className="stat-label">JUEGOS JUGADOS</div>
          </div>
          <div className="stat">
            <div className="stat-value">{profile.total_score.toLocaleString()}</div>
            <div className="stat-label">PUNTOS TOTALES</div>
          </div>
        </div>
      </div>

      {error && <div className="message error">{error}</div>}
      {success && <div className="message success">{success}</div>}

      <div className="form-actions">
        <button
          onClick={handleReset}
          className="btn ghost"
          disabled={loading}
        >
          CANCELAR
        </button>
        <button
          onClick={handleSave}
          className="btn"
          disabled={loading}
        >
          {loading ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
        </button>
      </div>

      <style jsx>{`
        .profile-form {
          max-width: 500px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(0, 245, 255, 0.1);
        }

        .form-section h3 {
          font-family: var(--pixel);
          font-size: 12px;
          letter-spacing: 0.1em;
          color: var(--cyan);
          text-shadow: 0 0 6px rgba(0, 245, 255, 0.3);
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-field label {
          font-family: var(--mono);
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .form-field input,
        .form-field textarea {
          padding: 10px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(0, 245, 255, 0.2);
          color: var(--ink);
          font-family: var(--mono);
          font-size: 13px;
          border-radius: 2px;
          transition: all 200ms;
        }

        .form-field input:focus,
        .form-field textarea:focus {
          outline: none;
          border-color: var(--cyan);
          box-shadow: 0 0 12px rgba(0, 245, 255, 0.25);
        }

        .form-field input:disabled,
        .form-field textarea:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .form-field small {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          font-family: var(--mono);
        }

        .stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .stat {
          padding: 12px;
          background: rgba(0, 245, 255, 0.05);
          border: 1px solid rgba(0, 245, 255, 0.15);
          border-radius: 2px;
          text-align: center;
        }

        .stat-value {
          font-family: var(--pixel);
          font-size: 18px;
          color: var(--cyan);
          text-shadow: 0 0 6px rgba(0, 245, 255, 0.3);
          margin-bottom: 4px;
        }

        .stat-label {
          font-family: var(--mono);
          font-size: 10px;
          color: rgba(255, 255, 255, 0.5);
          letter-spacing: 0.08em;
        }

        .message {
          padding: 12px;
          border-radius: 2px;
          font-family: var(--mono);
          font-size: 12px;
        }

        .message.error {
          background: rgba(255, 0, 110, 0.1);
          border: 1px solid rgba(255, 0, 110, 0.3);
          color: #ff006e;
        }

        .message.success {
          background: rgba(0, 200, 100, 0.1);
          border: 1px solid rgba(0, 200, 100, 0.3);
          color: #00c864;
        }

        .form-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}
