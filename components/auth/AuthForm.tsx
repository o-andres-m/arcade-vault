'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './AuthForm.module.css'

type TabType = 'in' | 'up'

export function AuthForm() {
  const router = useRouter()
  const supabase = createClient()
  const [tab, setTab] = useState<TabType>('in')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (tab === 'up') {
        // Sign up
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password: pass,
          options: {
            emailRedirectTo: `${window.location.origin}/auth?next=/biblioteca`,
          },
        })

        if (signUpError) throw signUpError
        if (!data.user) throw new Error('Error al crear usuario')

        // Create profile
        const userName = username.trim().slice(0, 20) || email.split('@')[0]
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          username: userName,
        })

        if (profileError) throw profileError

        router.push('/biblioteca')
      } else {
        // Sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        })

        if (signInError) throw signInError
        router.push('/biblioteca')
      }
    } catch (err) {
      let message = 'Error de autenticación'
      if (err instanceof Error) {
        if (err.message.includes('rate limit') || err.message.includes('429')) {
          message = 'Demasiados intentos. Espera unos minutos e intenta de nuevo.'
        } else if (err.message.includes('User already registered')) {
          message = 'Este email ya está registrado. Intenta iniciar sesión.'
        } else if (err.message.includes('Invalid password')) {
          message = 'La contraseña debe tener al menos 8 caracteres.'
        } else {
          message = err.message
        }
      }
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleGitHub = async () => {
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (error) throw error
    } catch (err) {
      let message = 'Error al conectar con GitHub'
      if (err instanceof Error) {
        message = err.message
      }
      setError(message)
      setLoading(false)
    }
  }

  const handleGuest = async () => {
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInAnonymously()
      if (error) throw error

      // Create anonymous profile
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          username: `GUEST_${Date.now().toString().slice(-4)}`,
        }, {
          onConflict: 'id'
        }).select().single()
      }

      router.push('/biblioteca')
    } catch (err) {
      let message = 'Error al entrar como invitado'
      if (err instanceof Error) {
        if (err.message.includes('rate limit') || err.message.includes('429')) {
          message = 'Demasiados intentos. Espera unos minutos e intenta de nuevo.'
        } else {
          message = err.message
        }
      }
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setResetLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/reset`,
      })

      if (error) throw error
      setResetSent(true)
    } catch (err) {
      let message = 'Error al enviar email de recuperación'
      if (err instanceof Error) {
        if (err.message.includes('rate limit') || err.message.includes('429')) {
          message = 'Demasiados intentos. Espera unos minutos e intenta de nuevo.'
        } else {
          message = err.message
        }
      }
      setError(message)
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.mark} />
        <h2>ARCADE VAULT</h2>
      </div>

      {/* OAuth Providers */}
      <div className={styles.oauthSection}>
        <button
          type="button"
          onClick={handleGitHub}
          className={styles.githubBtn}
          disabled={loading}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          CONTINUAR CON GITHUB
        </button>

        <div className={styles.divider}>
          <span>O</span>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={tab === 'in' ? styles.on : ''} onClick={() => setTab('in')} disabled={loading}>
          INICIAR SESIÓN
        </button>
        <button className={tab === 'up' ? styles.on : ''} onClick={() => setTab('up')} disabled={loading}>
          CREAR CUENTA
        </button>
      </div>

      {/* Error message */}
      {error && <div className={styles.error}>{error}</div>}

      {/* Formulario */}
      <form onSubmit={handleSubmit}>
        {tab === 'up' && (
          <div className={`${styles.field} ${styles.slideIn}`}>
            <label htmlFor="username">Usuario</label>
            <input
              id="username"
              type="text"
              placeholder="Tu nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="pass">Contraseña</label>
          <input
            id="pass"
            type="password"
            placeholder="••••••••"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            disabled={loading}
            required
            minLength={8}
          />
        </div>

        {tab === 'in' && (
          <div className={styles.forgotPassword}>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className={styles.forgotLink}
              disabled={loading}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}

        <button type="submit" className={`btn ${styles.submitBtn}`} disabled={loading}>
          {loading ? 'CARGANDO...' : tab === 'in' ? 'ENTRAR AL VAULT' : 'CREAR Y JUGAR'}
        </button>
      </form>

      {/* Guest */}
      <button className={`btn ghost ${styles.guestBtn}`} onClick={handleGuest} disabled={loading}>
        JUGAR COMO INVITADO
      </button>

      {/* Footer */}
      <div className={styles.footer}>
        Al continuar, aceptas nuestros términos de servicio y política de privacidad
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className={styles.forgotModal}>
          <div className={styles.forgotCard}>
            <button
              className={styles.closeModal}
              onClick={() => {
                setShowForgotPassword(false)
                setResetSent(false)
                setResetEmail('')
              }}
            >
              ✕
            </button>

            <h3>Recuperar contraseña</h3>

            {!resetSent ? (
              <form onSubmit={handleForgotPassword}>
                <p>Ingresa tu email y te enviaremos un link para resetear tu contraseña.</p>

                <div className={styles.field}>
                  <label htmlFor="resetEmail">Email</label>
                  <input
                    id="resetEmail"
                    type="email"
                    placeholder="tu@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    disabled={resetLoading}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className={`btn ${styles.submitBtn}`}
                  disabled={resetLoading}
                >
                  {resetLoading ? 'ENVIANDO...' : 'ENVIAR LINK'}
                </button>
              </form>
            ) : (
              <div className={styles.resetSuccess}>
                <p>✓ Email enviado</p>
                <p>Revisa tu bandeja de entrada y haz clic en el link para resetear tu contraseña.</p>
                <button
                  className="btn ghost"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setResetSent(false)
                    setResetEmail('')
                  }}
                >
                  CERRAR
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
