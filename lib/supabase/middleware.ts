import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

async function getUniqueUsername(
  supabase: ReturnType<typeof createServerClient>,
  baseUsername: string
): Promise<string> {
  const { data } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', baseUsername)
    .maybeSingle()

  if (!data) return baseUsername

  let suffix = 1
  while (suffix < 100) {
    const candidate = `${baseUsername}_${suffix}`
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', candidate)
      .maybeSingle()

    if (!data) return candidate
    suffix++
  }

  // Fallback: usar timestamp
  return `${baseUsername}_${Date.now().toString().slice(-6)}`
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refrescar sesión
  const { data: { user } } = await supabase.auth.getUser()

  // Crear perfil automático para usuarios OAuth
  if (user && user.app_metadata.provider === 'github') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile) {
      const baseUsername = user.user_metadata.user_name || `user_${user.id.slice(0, 8)}`
      const username = await getUniqueUsername(supabase, baseUsername)

      await supabase.from('profiles').upsert({
        id: user.id,
        username: username,
        avatar_url: user.user_metadata.avatar_url || null,
      }, { onConflict: 'id' })
    }
  }

  return response
}
