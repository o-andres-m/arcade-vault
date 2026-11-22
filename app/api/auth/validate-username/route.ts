import { createClient } from '@/lib/supabase/server'

const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/

export async function POST(req: Request) {
  try {
    const { username } = await req.json()

    if (!USERNAME_REGEX.test(username)) {
      return Response.json({ valid: false, error: 'Formato inválido' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single()

    return Response.json({ valid: !data })
  } catch (error) {
    console.error('Validation error:', error)
    return Response.json({ valid: false, error: 'Error en la validación' }, { status: 500 })
  }
}
