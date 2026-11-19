'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from '@/components/auth/AuthForm.module.css'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tokenValid, setTokenValid] = useState<boolean | null>(null) // null = cargando
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  useEffect(() => {
    console.log('🔄 Reset page mounted. Hash:', window.location.hash)

    // Escuchar cambios en el estado de autenticación
    // Esto procesa automáticamente el hash de la URL con el token de recuperación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth event:', event, 'Session:', session ? 'present' : 'none', 'User:', session?.user?.email)

      if (event === 'PASSWORD_RECOVERY') {
        // Token de recuperación detectado y procesado
        console.log('✅ PASSWORD_RECOVERY event detected')
        setTokenValid(true)
        setIsCheckingSession(false)
      } else if (event === 'SIGNED_IN' && session) {
        // Sesión establecida
        console.log('✅ SIGNED_IN event detected')
        setTokenValid(true)
        setIsCheckingSession(false)
      } else if (event === 'INITIAL_SESSION') {
        // Verificar si hay sesión al cargar
        console.log('📊 INITIAL_SESSION event. Has session:', !!session)
        if (session) {
          setTokenValid(true)
        } else {
          // No hay sesión todavía, pero puede que el hash aún no se haya procesado
          console.log('⏳ No session yet, waiting for hash processing...')
        }
        setIsCheckingSession(false)
      }
    })

    // Timeout de seguridad: si después de 5 segundos no hay sesión, mostrar error
    const timeout = setTimeout(() => {
      console.log('⏱️ Timeout reached. isCheckingSession:', isCheckingSession)
      if (isCheckingSession) {
        console.error('❌ No session after timeout')
        setTokenValid(false)
        setIsCheckingSession(false)
      }
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [supabase.auth, isCheckingSession])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // Validación de contraseñas
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) throw updateError

      // Login automático y redirección
      router.push('/biblioteca')
    } catch (err) {
      let message = 'Error al actualizar contraseña'
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

  const handleRequestNewLink = () => {
    router.push('/auth')
  }

  // Mostrar loading mientras verificamos la sesión
  if (isCheckingSession) {
    return (
      <main className="av-main">
        <div className="av-auth-wrap">
          <div className={styles.card}>
            <div className={styles.header}>
              <div className={styles.mark} />
              <h2>VERIFICANDO...</h2>
            </div>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ color: 'var(--ink-dim)' }}>Verificando link de recuperación...</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (tokenValid === false) {
    return (
      <main className="av-main">
        <div className="av-auth-wrap">
          <div className={styles.card}>
            <div className={styles.header}>
              <div className={styles.mark} />
              <h2>LINK EXPIRADO</h2>
            </div>

            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ marginBottom: '20px', color: 'var(--ink-dim)' }}>
                Este link ha expirado o es inválido. Solicita un nuevo link de recuperación.
              </p>
              <button className="btn" onClick={handleRequestNewLink}>
                SOLICITAR NUEVO LINK
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="av-main">
      <div className="av-auth-wrap">
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.mark} />
            <h2>NUEVA CONTRASEÑA</h2>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="password">Nueva contraseña</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                minLength={6}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="confirmPassword">Confirmar contraseña</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className={`btn ${styles.submitBtn}`}
              disabled={loading}
            >
              {loading ? 'ACTUALIZANDO...' : 'CAMBIAR CONTRASEÑA'}
            </button>
          </form>

          <div className={styles.footer}>
            Al cambiar tu contraseña, iniciarás sesión automáticamente
          </div>
        </div>
      </div>
    </main>
  )
}
