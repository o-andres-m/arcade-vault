-- Security Audit Queries para Arcade Vault
-- Usar estas queries para validar configuración de seguridad en Supabase

-- ============================================================================
-- 1. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Verificar qué tablas tienen RLS habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Resultado esperado:
-- games    | true
-- profiles | true
-- scores   | true

-- ============================================================================
-- 2. POLÍTICAS RLS
-- ============================================================================

-- Listar todas las políticas de RLS
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS operation,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verificar políticas específicas por tabla
-- Tabla: games
SELECT * FROM pg_policies WHERE tablename = 'games';
-- Esperado: 1 política de SELECT para público

-- Tabla: profiles
SELECT * FROM pg_policies WHERE tablename = 'profiles';
-- Esperado: Políticas de SELECT público, UPDATE/DELETE autenticados

-- Tabla: scores
SELECT * FROM pg_policies WHERE tablename = 'scores';
-- Esperado: SELECT público, INSERT autenticados con user_id = auth.uid()

-- ============================================================================
-- 3. FUNCIONES SQL (search_path mutable check)
-- ============================================================================

-- Verificar funciones críticas y su configuración
SELECT
  p.proname AS function_name,
  p.prosecdef AS is_security_definer,
  p.proconfig AS config_settings,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('update_updated_at', 'update_profile_stats')
ORDER BY p.proname;

-- Verificar que tienen SET search_path = ''
-- Buscar en function_definition: "SET search_path TO ''"

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- Listar todos los triggers activos
SELECT
  t.tgname AS trigger_name,
  c.relname AS table_name,
  p.proname AS function_name,
  CASE t.tgtype::int & 66
    WHEN 2 THEN 'BEFORE'
    WHEN 64 THEN 'INSTEAD OF'
    ELSE 'AFTER'
  END AS trigger_timing,
  CASE t.tgtype::int & 28
    WHEN 4 THEN 'INSERT'
    WHEN 8 THEN 'DELETE'
    WHEN 16 THEN 'UPDATE'
    ELSE 'MULTIPLE'
  END AS trigger_event
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- ============================================================================
-- 5. STORAGE (Avatares públicos)
-- ============================================================================

-- Verificar políticas de storage.objects
SELECT
  policyname,
  tablename,
  roles,
  cmd AS operation,
  qual AS condition
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects';

-- Esperado: Políticas para avatares públicos en bucket 'avatars'

-- ============================================================================
-- 6. EXTENSIONES DE SEGURIDAD
-- ============================================================================

-- Listar extensiones instaladas
SELECT
  extname AS extension_name,
  extversion AS version
FROM pg_extension
ORDER BY extname;

-- Extensiones esperadas:
-- - uuid-ossp (para generación de UUIDs)
-- - pgcrypto (para encriptación, opcional)

-- ============================================================================
-- 7. USUARIOS Y ROLES
-- ============================================================================

-- Listar roles y sus permisos
SELECT
  rolname,
  rolsuper AS is_superuser,
  rolinherit AS can_inherit,
  rolcreaterole AS can_create_roles,
  rolcreatedb AS can_create_db,
  rolcanlogin AS can_login
FROM pg_roles
WHERE rolname NOT LIKE 'pg_%'
ORDER BY rolname;

-- ============================================================================
-- 8. TABLAS SIN RLS (VULNERABILIDAD CRÍTICA)
-- ============================================================================

-- Buscar tablas públicas sin RLS habilitado
SELECT
  schemaname,
  tablename,
  'CRITICAL: RLS not enabled' AS finding
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false;

-- Resultado esperado: NINGUNA fila (todas deben tener RLS)

-- ============================================================================
-- 9. POLÍTICAS PERMISIVAS (WARN si anónimo)
-- ============================================================================

-- Buscar políticas que permiten acceso anónimo (rol: public)
SELECT
  tablename,
  policyname,
  cmd AS operation,
  'WARN: Anonymous access enabled (expected for guest mode)' AS note
FROM pg_policies
WHERE schemaname = 'public'
  AND 'public' = ANY(roles)
ORDER BY tablename;

-- Esperado: Políticas SELECT en games, profiles, scores
-- Esto es INTENCIONAL para guest mode, no es vulnerabilidad

-- ============================================================================
-- 10. AUDIT LOG (si existe)
-- ============================================================================

-- Si hay tabla de audit log, verificar últimos eventos
-- SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 20;
-- (No implementado en SPEC 14, pero útil para futuro)
