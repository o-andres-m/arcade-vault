// Script para desarrollo local
// Ejecutar con: npx tsx scripts/seed-supabase.ts

import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role bypassa RLS
)

async function seed() {
  console.log('🌱 Iniciando seed de datos de prueba...')

  // Crear usuarios de prueba
  const users = [
    { email: 'neonfox@test.com', username: 'NEONFOX' },
    { email: 'pxkai@test.com', username: 'PX_KAI' },
    { email: 'z3r0cool@test.com', username: 'Z3R0COOL' },
    { email: 'vault07@test.com', username: 'VAULT_07' },
    { email: 'glitcha@test.com', username: 'GLITCHA' },
  ]

  const games = ['bloque-buster', 'caida', 'serpentina', 'invasores', 'glomton']

  for (const user of users) {
    try {
      // Crear usuario
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: 'test1234',
        email_confirm: true,
      })

      if (authError) {
        console.log(`⚠️ Usuario ${user.email} ya existe, saltando...`)
        continue
      }

      if (!authData.user) {
        console.log(`❌ Error al crear usuario ${user.email}`)
        continue
      }

      console.log(`✅ Usuario creado: ${user.email}`)

      // Crear profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        username: user.username,
      })

      if (profileError) throw profileError

      // Crear scores aleatorios
      for (let i = 0; i < 8; i++) {
        const gameId = games[i % games.length]
        const score = Math.floor(Math.random() * 150000) + 10000

        const { error: scoreError } = await supabase.from('scores').insert({
          user_id: authData.user.id,
          game_id: gameId,
          score,
        })

        if (scoreError) throw scoreError
      }

      console.log(`📊 Scores creados para ${user.username}`)
    } catch (err) {
      console.error(`Error procesando usuario ${user.email}:`, err)
    }
  }

  console.log('✅ Seed completado!')
}

seed().catch(console.error)
