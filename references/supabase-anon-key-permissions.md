# Anon Key Permissions

El `NEXT_PUBLIC_SUPABASE_ANON_KEY` tiene permisos limitados por RLS (Row Level Security).

## Permitido (público)

- Lectura de `games` (SELECT)
- Lectura de `profiles` (SELECT)
- Lectura de `scores` (SELECT)
- Inserción de scores propios (INSERT en `scores` con guest user_id)

## NO permitido

- Insertar/actualizar/eliminar en `games`
- Actualizar perfiles ajenos
- Eliminar scores ajenos
- Acceder a tablas de admin

## Verificación en Supabase

1. Auth → Policies
2. Verificar que cada tabla tiene RLS enabled
3. Verificar que políticas solo permiten operaciones anunciadas

## Implicaciones de seguridad

- El anon key es **público** (enviado al cliente)
- No puede modificar datos ajenos gracias a RLS
- Guest scores se guardan con `user_id: null`
- Scores autenticados se vinculan por `user_id`
