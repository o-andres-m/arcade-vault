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
          message = 'La contraseña debe tener al menos 6 caracteres.'
        } else {
          message = err.message
        }
      }
      setError(message)
    } finally {
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
        await supabase.from('profiles').insert({
          id: user.id,
          username: `GUEST_${Date.now().toString().slice(-4)}`,
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

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.mark} />
        <h2>ARCADE VAULT</h2>
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
          />
        </div>

        <button type="submit" className={`btn ${styles.submitBtn}`} disabled={loading}>
          {loading ? 'CARGANDO...' : tab === 'in' ? 'ENTRAR AL VAULT' : 'CREAR Y JUGAR'}
        </button>
      </form>

      {/* Guest */}
      <button className={`btn ghost ${styles.guestBtn}`} onClick={handleGuest} disabled={loading}>
        JUGAR COMO INVITADO
      </button>

      {/* Divider */}
      <div className={styles.divider}>O CONTINÚA CON</div>

      {/* Social buttons */}
      <div className={styles.social}>
        <button className={`btn ghost ${styles.socialBtn}`} disabled>
          ◆ GOOGLE
        </button>
        <button className={`btn ghost ${styles.socialBtn}`} disabled>
          ▣ GITHUB
        </button>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        Al continuar, aceptas nuestros términos de servicio y política de privacidad
      </div>
    </div>
  )
}
