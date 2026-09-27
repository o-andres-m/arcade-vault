'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Profile } from '@/types'
import { ProfileForm } from '@/components/profile/ProfileForm'

export default function PerfilPage() {
  const router = useRouter()
  const { user, profile, loading, isAuthenticated } = useAuth()
  const [updatedProfile, setUpdatedProfile] = useState<Profile | null>(null)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth')
    }
  }, [loading, isAuthenticated, router])

  useEffect(() => {
    if (profile) {
      setUpdatedProfile(profile)
    }
  }, [profile])

  if (loading) {
    return (
      <main className="av-main">
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p>CARGANDO...</p>
        </div>
      </main>
    )
  }

  if (!isAuthenticated || !updatedProfile) {
    return (
      <main className="av-main">
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p>No tienes permiso para acceder a esta página</p>
        </div>
      </main>
    )
  }

  return (
    <main className="av-main">
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '32px' }}>MI PERFIL</h1>
        <ProfileForm profile={updatedProfile} onSave={setUpdatedProfile} />
      </div>
    </main>
  )
}
