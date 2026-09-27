# 02 — Página About con Formulario de Contacto

**Estado:** Implementado  
**Depende de:** SPEC 01  
**Fecha:** 2026-09-26

**Objetivo:** Implementar la página `/about` con sección informativa sobre
Arcade Vault y formulario de contacto funcional integrado con Resend para envío
de emails.

---

## Alcance

### Incluido en esta especificación

- Página `/about` con estructura de dos secciones principales:
  - **Sección Acerca de**: Hero con misión del proyecto y 3 highlights con
    iconos pixel art
  - **Sección Contacto**: Formulario funcional con validación y envío de emails
- Divider animado con píxeles entre secciones (efecto reveal)
- Integración con Resend para envío de emails:
  - Route Handler de Next.js (`app/api/contact/route.ts`)
  - Validación de campos (no vacíos, formato email)
  - Manejo de estados (enviando, éxito, error)
- Componente `ContactForm` con:
  - 3 campos: nombre, email, mensaje (máx 1000 caracteres)
  - Validación en cliente antes de enviar
  - Efecto shake si la validación falla
  - Estado de éxito con terminal retro animado
  - Estado de error con mensaje estilo terminal
- Variables de entorno para configuración:
  - `RESEND_API_KEY`: API key de Resend (privada, servidor)
  - `CONTACT_EMAIL`: Email de destino para mensajes de contacto
- Efectos visuales retro coherentes con el resto del proyecto:
  - Animaciones reveal con IntersectionObserver
  - Tips con LEDs de colores
  - Terminal retro para confirmación de envío
- Responsive design (mobile y desktop)

### NO incluido en esta especificación (se difiere)

- Captcha o protección anti-spam avanzada (se confía en rate limiting de Resend)
- Rate limiting en el cliente (más allá del límite de caracteres)
- Historial de mensajes enviados en localStorage
- Categorías o tipos de mensaje (bug, sugerencia, general)
- Adjuntos o imágenes en el formulario
- Email en formato HTML (solo texto plano)
- Confirmación por email al remitente
- Panel de administración para ver mensajes recibidos
- Integración con servicios de analytics para trackear envíos

---

## Modelo de datos

### Variables de entorno (`.env.local`)

```bash
# API key de Resend (privada, solo servidor)
RESEND_API_KEY=re_xxxxxxxxxxxx

# Email de destino para mensajes de contacto
CONTACT_EMAIL=team@arcadevault.com
```

### Payload del formulario

```typescript
interface ContactFormData {
  name: string; // Nombre del remitente (trimmed, no vacío)
  email: string; // Email del remitente (validado formato)
  msg: string; // Mensaje (trimmed, 1-1000 caracteres)
}
```

### Request/Response del API route

**POST `/api/contact`**

Request body:

```typescript
{
  name: string;
  email: string;
  msg: string;
}
```

Response (éxito):

```typescript
{
  success: true,
  message: "Mensaje enviado correctamente"
}
```

Response (error):

```typescript
{
  success: false,
  error: "Descripción del error"
}
```

### Email enviado (formato texto plano)

```
Asunto: Nuevo mensaje desde Arcade Vault
From: [valor de CONTACT_EMAIL]
Reply-To: [email del usuario]

Nuevo mensaje de contacto desde Arcade Vault:

Nombre: [nombre del usuario]
Email: [email del usuario]

Mensaje:
[contenido del mensaje]

---
Enviado desde Arcade Vault
```

---

## Plan de implementación

Cada paso deja el sistema en estado funcional (compilable y navegable).

### 1. Instalar dependencia Resend y configurar variables de entorno

**Archivos nuevos:**

- `.env.local` — Variables de entorno (RESEND_API_KEY, CONTACT_EMAIL)
- `.env.example` — Template de variables de entorno para referencia

**Comandos:**

```bash
npm install resend
```

**Contenido de `.env.example`:**

```bash
# Resend API key (obtener en https://resend.com/api-keys)
RESEND_API_KEY=

# Email de destino para mensajes de contacto
CONTACT_EMAIL=
```

**Verificación:** `npm run build` pasa sin errores, `.env.local` existe con las
keys configuradas.

---

### 2. Crear Route Handler para envío de emails

**Archivos nuevos:**

- `app/api/contact/route.ts` — API route que maneja el envío de emails con
  Resend

**Lógica:**

- Validar método POST
- Parsear body JSON
- Validar campos requeridos:
  - `name`: trimmed, no vacío
  - `email`: trimmed, formato válido (regex básica)
  - `msg`: trimmed, 1-1000 caracteres
- Crear cliente Resend con `RESEND_API_KEY`
- Enviar email con:
  - `from`: valor de `CONTACT_EMAIL` (o `onboarding@resend.dev` en desarrollo)
  - `to`: valor de `CONTACT_EMAIL`
  - `reply_to`: email del usuario (permite responder directamente)
  - `subject`: "Nuevo mensaje desde Arcade Vault"
  - `text`: template con nombre, email y mensaje del usuario
- Manejar errores de Resend y devolver respuesta apropiada
- Retornar JSON con `{ success: true }` o `{ success: false, error: string }`

**Verificación:** Se puede llamar al endpoint con curl/Postman y se recibe un
email.

---

### 3. Crear componente ContactForm

**Archivos nuevos:**

- `components/contact/ContactForm.tsx` — Formulario de contacto con validación y
  estados
- `components/contact/ContactForm.module.css` — Estilos del formulario

**Props:**

```typescript
// Sin props, es un componente standalone
```

**Estado local:**

- `form: { name: string; email: string; msg: string }` — Valores del formulario
- `status: 'idle' | 'sending' | 'success' | 'error'` — Estado del envío
- `errorMsg: string` — Mensaje de error si falla
- `shake: boolean` — Flag para animar shake en validación fallida

**Lógica:**

- Inputs controlados que actualizan `form` en `onChange`
- Contador de caracteres para el campo mensaje (X/1000)
- `onSubmit`:
  1. `preventDefault()`
  2. Validar campos:
     - Si algún campo vacío → `setShake(true)`, return
     - Si email no tiene formato válido → `setShake(true)`, return
     - Si mensaje > 1000 chars → `setShake(true)`, return
  3. `setStatus('sending')`
  4. Llamar `POST /api/contact` con `fetch`
  5. Si éxito → `setStatus('success')`, guardar nombre en estado
  6. Si error → `setStatus('error')`, guardar mensaje de error
- Renderizado condicional según `status`:
  - `idle` o `sending`: Mostrar formulario (disabled si sending)
  - `success`: Mostrar terminal retro con mensaje de confirmación
  - `error`: Mostrar terminal retro con mensaje de error
- Botón "ENVIAR OTRO MENSAJE" en estado success → resetear form y status
- Botón "REINTENTAR" en estado error → volver a status idle
- Efecto `shake`: CSS animation que se dispara cuando `shake === true`, y se
  auto-limpia después de 400ms

**Verificación:** El formulario se puede renderizar en una página de prueba y
muestra los 3 campos correctamente.

---

### 4. Crear página About

**Archivos nuevos:**

- `app/about/page.tsx` — Página principal con secciones About y Contacto

**Estructura:**

```tsx
export default function AboutPage() {
  return (
    <div className="about fade-in">
      {/* SECCIÓN ABOUT */}
      <section className="about-hero">
        {/* Kicker + título + misión */}
        {/* Highlight row con 3 highlights + iconos */}
      </section>

      {/* DIVIDER ANIMADO */}
      <div className="about-divider reveal">
        {/* Barra + píxeles animados + barra */}
      </div>

      {/* SECCIÓN CONTACTO */}
      <section className="about-contact reveal">
        <div className="contact-grid">
          {/* Intro con kicker + título + descripción + tips */}
          {/* ContactForm */}
        </div>
      </section>
    </div>
  );
}
```

**Contenido:**

- **Kicker**: "▸ ACERCA DE" (neon-yellow)
- **Título**: "ACERCA DE ARCADE VAULT"
- **Misión**: "ARCADE VAULT nació del amor por los videojuegos clásicos. Nuestra
  misión es preservar y celebrar los arcades que definieron una generación,
  haciéndolos accesibles para todos, en cualquier lugar y sin costo."
- **Highlights** (3 cards con iconos SVG pixel art):
  1. Corazón pixel (magenta): "HECHO CON ❤️ PARA JUGADORES"
  2. Browser pixel (cyan): "JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR"
  3. Planta pixel (green): "PROYECTO EN CONSTANTE CRECIMIENTO"
- **Divider**: Barra horizontal + 24 píxeles animados (stagger 80ms)
- **Contacto intro**:
  - Kicker: "▸ CONTACTO" (neon-cyan)
  - Título: "CONTÁCTANOS"
  - Descripción: "¿Tienes alguna sugerencia, quieres proponer un juego, o
    simplemente quieres saludar? Escríbenos."
  - Tips (3 líneas con LED de colores):
    - LED cyan: "RESPUESTA EN 24-48H"
    - LED yellow: "SUGERENCIAS BIENVENIDAS"
    - LED magenta: "SIN SPAM, JAMÁS"
- **Formulario**: `<ContactForm />`

**Efectos:**

- Hook `useReveal()`: IntersectionObserver que agrega clase `.in` a elementos
  `.reveal` cuando entran en viewport (threshold 0.12)
- Highlights con `transitionDelay` escalonado (0ms, 80ms, 160ms)
- Píxeles del divider con `animationDelay` escalonado (0-1840ms en incrementos
  de 80ms)

**Verificación:** La página `/about` se renderiza con ambas secciones, el efecto
reveal funciona al hacer scroll.

---

### 5. Estilos de la página About

**Archivos modificados:**

- `app/globals.css` — Agregar estilos de la página about (o crear módulo CSS
  separado)

**Estilos requeridos:**

- `.about`: Container principal (fade-in al cargar)
- `.about-hero`: Hero section con padding vertical, max-width, centrado
- `.kicker`: Texto pequeño pixel con neon glow
- `.about-title`: Título grande (3-4rem) con text-stroke y glow
- `.about-mission`: Párrafo de misión con line-height 1.8
- `.highlight-row`: Grid de 3 columns (1 en mobile), gap, animaciones
- `.highlight`: Card con border neon, padding, icon + texto, hover glow
- `.hl-icon`: Ícono SVG 48px con glow del color del highlight
- `.about-divider`: Divider con barras horizontales y píxeles
- `.div-pixels span`: Píxeles animados (opacity fade-in, stagger)
- `.about-contact`: Section de contacto con padding
- `.contact-grid`: Grid 2 cols (1 en mobile): intro + form
- `.contact-intro`: Intro con kicker, título, descripción, tips
- `.contact-tips`: Tips con LEDs de colores (::before con border-radius)
- `.tip-led`: LED circular (8px) con glow (cyan, yellow, magenta)
- `.contact-form`: Form con max-width, background semi-transparente
- `.field`: Campo de formulario con label + input/textarea
- `.field label`: Label en mayúsculas, pixel, pequeño
- `.field input, .field textarea`: Inputs con border neon cyan, bg oscuro
- `.shake`: Animación keyframes shake (translateX -10px → 10px)
- `.terminal-success`: Terminal retro con barra de título y cuerpo
- `.term-bar`: Barra con 3 dots (rojo, amarillo, verde) + título
- `.term-body`: Cuerpo del terminal con líneas de comando
- `.line`: Línea del terminal con prompt y output
- `.prompt`: Prompt estilo `vault@arcade:~$` en cyan
- `.caret`: Cursor parpadeante con animación blink

**Responsive:**

- Mobile: highlights en 1 columna, contact-grid en 1 columna, form full-width

**Verificación:** La página se ve correctamente en desktop y mobile, los efectos
visuales funcionan.

---

### 6. Iconos SVG pixel art para highlights

**Archivos modificados:**

- `app/about/page.tsx` — Agregar componente `HighlightIcon` inline o en archivo
  separado

**Componente:**

```tsx
function HighlightIcon({ kind }: { kind: "HEART" | "BROWSER" | "PLANT" }) {
  // SVG pixel art con rects, fill=currentColor
}
```

**Iconos requeridos** (copiar de `about.jsx` de referencia):

- `HEART`: Corazón pixel de 16x16
- `BROWSER`: Ventana de navegador de 16x16
- `PLANT`: Planta pixel de 16x16

**Verificación:** Los iconos se renderizan correctamente con el color del
highlight parent.

---

### 7. Agregar archivo .env.example al repositorio

**Archivos nuevos:**

- `.env.example` — Template de variables de entorno

**Verificación:** El archivo existe en el repo y está documentado en el README
(opcional).

---

### 8. Verificación del nav

**Archivos a revisar:**

- `components/navigation/Nav.tsx` (o donde esté el componente Nav)

**Acción:** Verificar que el link a `/about` ya existe en el Nav. Según la
referencia (`nav.jsx`), el link "Acerca de" ya está implementado y apunta a
`{ name: "about" }`.

En Next.js App Router debe ser:

```tsx
<Link href="/about" className={pathname === "/about" ? "active" : ""}>
  Acerca de
</Link>
```

Si el Nav no tiene el link, agregarlo siguiendo el patrón de los otros links.

**Verificación:** El link "Acerca de" aparece en el Nav y navega correctamente a
`/about`.

---

### 9. Testing manual del flujo completo

**Escenarios de prueba:**

1. **Validación de campos vacíos**:
   - Dejar campos vacíos → Submit → Debe mostrar shake y no enviar

2. **Validación de formato email**:
   - Ingresar email inválido (`test`, `test@`, `test@.com`) → Submit → Debe
     mostrar shake

3. **Validación de límite de caracteres**:
   - Ingresar mensaje > 1000 chars → El textarea debe truncar o mostrar error

4. **Envío exitoso**:
   - Llenar formulario correctamente → Submit → Debe mostrar estado "sending" →
     Mostrar terminal de éxito
   - Verificar que el email llega a `CONTACT_EMAIL`
   - Verificar que el reply-to es el email del usuario
   - Botón "ENVIAR OTRO MENSAJE" debe resetear el form

5. **Error de envío**:
   - Configurar API key inválida o apagar internet → Submit → Debe mostrar
     terminal de error
   - Botón "REINTENTAR" debe volver al formulario

6. **Responsive**:
   - Verificar que la página se ve bien en mobile y desktop
   - Verificar que el formulario es usable en pantallas pequeñas

7. **Efectos visuales**:
   - Scroll hacia abajo → Las secciones con `.reveal` deben animarse al entrar
     en viewport
   - Highlights deben tener efecto glow en hover (desktop)

**Verificación final:**

- ✅ La página `/about` existe y se renderiza correctamente
- ✅ La navegación desde el Nav funciona
- ✅ Los highlights muestran los iconos y textos correctos
- ✅ El divider animado funciona
- ✅ El formulario valida campos correctamente
- ✅ El envío de emails funciona con Resend
- ✅ Los estados de éxito y error se muestran correctamente
- ✅ El diseño es responsive
- ✅ Los efectos visuales (reveal, shake, terminal) funcionan
- ✅ No hay errores en consola
- ✅ Variables de entorno están documentadas en .env.example

---

## Criterios de aceptación

- [ ] La página `/about` se renderiza correctamente con ambas secciones (About +
      Contacto)
- [ ] La sección About muestra:
  - Kicker, título y texto de misión
  - 3 highlights con iconos pixel art (corazón, browser, planta)
  - Divider animado con píxeles que aparecen con stagger
- [ ] La sección Contacto muestra:
  - Intro con kicker, título, descripción y 3 tips con LEDs de colores
  - Formulario con 3 campos (nombre, email, mensaje)
  - Contador de caracteres en campo mensaje (X/1000)
- [ ] El formulario valida:
  - Campos vacíos → muestra efecto shake y no envía
  - Formato de email inválido → muestra efecto shake y no envía
  - Mensaje > 1000 caracteres → trunca o muestra error
- [ ] Al enviar el formulario con datos válidos:
  - Muestra estado "sending" (botón disabled)
  - Llama a `POST /api/contact` con los datos
  - Si éxito → muestra terminal retro con mensaje de confirmación
  - Si error → muestra terminal retro con mensaje de error
- [ ] El Route Handler `/api/contact`:
  - Valida campos requeridos y formatos
  - Se conecta a Resend con `RESEND_API_KEY`
  - Envía email a `CONTACT_EMAIL` con formato texto plano
  - Configura reply-to con el email del usuario
  - Devuelve respuesta JSON apropiada (success o error)
- [ ] El email recibido contiene:
  - Asunto: "Nuevo mensaje desde Arcade Vault"
  - Cuerpo con nombre, email y mensaje del usuario
  - Reply-to configurado al email del usuario (permite responder directamente)
- [ ] El terminal de éxito muestra:
  - Barra de título con dots (rojo, amarillo, verde)
  - Líneas de comando simuladas con prompts y outputs
  - Mensaje "MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, [NOMBRE]_"
  - Botón "ENVIAR OTRO MENSAJE" que resetea el formulario
- [ ] El terminal de error muestra:
  - Barra de título con dots
  - Mensaje de error descriptivo
  - Botón "REINTENTAR" que vuelve al formulario
- [ ] Las animaciones reveal funcionan:
  - Al hacer scroll, los elementos `.reveal` aparecen con fade-in cuando entran
    en viewport
  - Los highlights tienen `transitionDelay` escalonado
  - Los píxeles del divider tienen `animationDelay` escalonado
- [ ] El link "Acerca de" en el Nav navega correctamente a `/about`
- [ ] El diseño es responsive:
  - Desktop: highlights en 3 columnas, contact-grid en 2 columnas
  - Mobile: highlights en 1 columna, contact-grid en 1 columna, form full-width
- [ ] Los efectos visuales retro funcionan:
  - Iconos SVG con glow del color parent
  - LEDs de tips con colores (cyan, yellow, magenta)
  - Inputs con border neon cyan
  - Terminal con fuente monospace y colores retro
  - Cursor parpadeante en terminal (_)
- [ ] Variables de entorno están configuradas:
  - `.env.local` existe con `RESEND_API_KEY` y `CONTACT_EMAIL`
  - `.env.example` existe en el repo con template documentado
- [ ] No hay errores de TypeScript ni de compilación (`npm run build` pasa)
- [ ] No hay errores en consola del navegador
- [ ] La página cumple con la estética retro arcade del resto del proyecto

---

## Decisiones tomadas

1. **Route Handler en lugar de Client-side API call directo**: Se usa un Route
   Handler de Next.js (`app/api/contact/route.ts`) para manejar la lógica de
   envío con Resend. Esto mantiene la API key segura en el servidor y no la
   expone al cliente. Es el patrón recomendado por Next.js para operaciones
   sensibles.

2. **Formato de email en texto plano**: Se envía el email en formato texto plano
   en lugar de HTML. Es más simple, más compatible con todos los clientes de
   email, y suficiente para un formulario de contacto. Si en el futuro se
   necesita HTML con estilos, se puede agregar fácilmente.

3. **Reply-to con email del usuario**: El campo reply-to se configura con el
   email que el usuario ingresó en el formulario. Esto permite que el
   destinatario responda directamente desde su cliente de email sin tener que
   copiar el email del cuerpo del mensaje. Es más conveniente y profesional.

4. **Sin historial de mensajes en localStorage**: No se guarda un historial de
   mensajes enviados en localStorage. Esto simplifica la implementación y
   respeta la privacidad del usuario. Si en el futuro se quiere agregar rate
   limiting por usuario, se puede implementar guardando solo un timestamp del
   último envío.

5. **Validación básica sin mensajes específicos por campo**: Se implementa
   validación básica (campos no vacíos + formato email) con un único efecto
   shake visual. No se muestran mensajes de error específicos por campo ("El
   email es inválido", "El mensaje es muy corto") para mantener la interfaz
   limpia. El shake es suficiente feedback para indicar que algo está mal.

6. **Límite de 1000 caracteres en el mensaje**: Se establece un límite razonable
   para evitar mensajes excesivamente largos que puedan abrumar o causar
   problemas de rendimiento. 1000 caracteres son suficientes para la mayoría de
   mensajes de contacto (aproximadamente 150-200 palabras).

7. **Iconos SVG inline en lugar de componentes separados**: Los iconos pixel art
   se definen como componente inline (`HighlightIcon`) dentro de la página
   `about/page.tsx` en lugar de crear archivos separados. Son pocos iconos (3) y
   solo se usan en esta página, así que inline es más simple.

8. **Estados del formulario con terminal retro**: Los estados de éxito y error
   se muestran con un diseño de terminal retro coherente con la estética del
   proyecto. Esto es más interesante visualmente que un simple mensaje de texto
   y refuerza la identidad arcade del sitio.

9. **Sin captcha o rate limiting avanzado**: No se implementa captcha
   (reCAPTCHA, hCaptcha) ni rate limiting avanzado en el cliente. Se confía en
   las protecciones de Resend y en el límite de caracteres. Si en el futuro hay
   problemas de spam, se puede agregar rate limiting por IP en el Route Handler.

10. **Ruta `/about` en inglés**: Aunque el contenido está en español, la ruta es
    `/about` (en inglés) porque es el estándar internacional más reconocible y
    ya está referenciada en la plantilla original del Nav. Es más importante la
    consistencia con la plantilla que la coherencia lingüística.

11. **Efectos reveal con IntersectionObserver**: Se usa IntersectionObserver
    para detectar cuando las secciones entran en viewport y activar las
    animaciones. Es más performante que scroll events y es el estándar moderno
    para este tipo de efectos.

12. **Variables de entorno en `.env.local`**: Las variables sensibles
    (`RESEND_API_KEY`, `CONTACT_EMAIL`) se guardan en `.env.local` que está en
    `.gitignore`. Se incluye un `.env.example` en el repo para documentar qué
    variables se necesitan. Esto facilita el deploy en Render o cualquier
    plataforma que soporte variables de entorno.

---

## Decisiones descartadas

1. **Email en formato HTML con estilos retro**: Descartado porque añade
   complejidad innecesaria. El formato texto plano es suficiente para un
   formulario de contacto y es más compatible. Si el cliente quiere emails más
   visuales en el futuro, se puede agregar.

2. **Múltiples destinatarios según categoría del mensaje**: Descartado porque no
   hay necesidad de categorizar mensajes en este MVP. Todos los mensajes van a
   un único email de contacto. Si en el futuro se necesita routing (bugs →
   bugs@, sugerencias → ideas@), se puede agregar un campo de categoría.

3. **Confirmación por email al remitente**: Descartado porque añade complejidad
   (requiere enviar 2 emails por cada mensaje) y puede ser percibido como spam.
   Es mejor simplemente mostrar un mensaje de confirmación en la UI y responder
   manualmente al usuario.

4. **Rate limiting en el cliente con localStorage**: Descartado porque
   localStorage puede ser limpiado fácilmente y no es una protección real contra
   spam. Es mejor confiar en las protecciones de Resend o implementar rate
   limiting por IP en el servidor si es necesario.

5. **Historial de mensajes enviados**: Descartado porque no hay un caso de uso
   claro. El usuario no necesita revisar los mensajes que envió. Si se quiere
   agregar en el futuro, se puede implementar fácilmente con localStorage.

6. **Captcha (reCAPTCHA, hCaptcha)**: Descartado porque añade fricción al
   usuario y requiere configuración adicional. Se prefiere confiar en las
   protecciones de Resend y agregar captcha solo si hay problemas reales de
   spam.

7. **Adjuntos o imágenes en el formulario**: Descartado porque añade mucha
   complejidad (upload, validación de archivos, storage) y no es necesario para
   un formulario de contacto básico. Si se necesita en el futuro, se puede
   agregar como feature separada.

8. **Panel de administración para ver mensajes**: Descartado porque los mensajes
   llegan por email y pueden ser gestionados con un cliente de email normal. No
   hay necesidad de construir un panel admin en el MVP.

9. **Ruta `/acerca-de` en español**: Descartado porque el Nav de la plantilla ya
   usa `/about` y es el estándar más reconocible internacionalmente. Mantener
   consistencia con la plantilla es más importante.

10. **Validación completa con mensajes específicos por campo**: Descartado
    porque añade complejidad visual (mensajes de error bajo cada campo) y rompe
    la estética minimalista. El efecto shake es suficiente feedback.

---

## Riesgos identificados

1. **Límites de la cuenta gratuita de Resend**: La cuenta gratuita de Resend
   tiene límites de envío (100 emails/día en el tier gratuito). **Mitigación**:
   Documentar estos límites en el README y monitorear el uso. Si se alcanza el
   límite, considerar upgrade o implementar rate limiting más estricto.

2. **Email de destino hardcoded en error**: Si el valor de `CONTACT_EMAIL` no
   está configurado en `.env.local`, el Route Handler fallará. **Mitigación**:
   Agregar validación al inicio del Route Handler que verifique que las
   variables de entorno existen, y devolver error 500 descriptivo si faltan.

3. **Spam sin protección de captcha**: Sin captcha, el formulario es vulnerable
   a spam automatizado. **Mitigación**: Confiar en las protecciones de Resend
   inicialmente. Si hay problemas reales de spam, agregar captcha o rate
   limiting por IP en una spec posterior.

4. **Reply-to con email potencialmente falso**: El usuario puede ingresar
   cualquier email en el campo, incluyendo emails que no le pertenecen.
   **Mitigación**: Esto es común en formularios de contacto. El destinatario
   debe verificar la legitimidad del email antes de responder. No hay forma de
   validar ownership sin confirmación por email.

5. **Errores de Resend no manejados adecuadamente**: Si Resend devuelve errores
   específicos (rate limit, API key inválida, etc.), el usuario solo verá "error
   al enviar". **Mitigación**: Loguear el error completo en servidor
   (console.error) para debugging, pero mostrar mensaje genérico al usuario. No
   exponer detalles técnicos de Resend al cliente.

6. **IntersectionObserver no soportado en navegadores antiguos**: Aunque es
   soportado en navegadores modernos, puede fallar en navegadores muy antiguos.
   **Mitigación**: Los efectos reveal son progresive enhancement. Si no
   funcionan, el contenido sigue visible, solo sin animación. Se puede agregar
   polyfill si es crítico.

7. **Validación de email con regex simple puede permitir emails inválidos**: La
   regex básica de validación de email no cubre todos los casos edge.
   **Mitigación**: Es suficiente para un formulario de contacto. Emails
   realmente inválidos rebotarán en Resend. No vale la pena implementar
   validación RFC-compliant.

8. **Deploy en Render sin variables de entorno configuradas**: Si se hace deploy
   sin configurar las variables de entorno en Render, el envío de emails
   fallará. **Mitigación**: Documentar claramente en el README las variables
   requeridas y cómo configurarlas en Render. El Route Handler debe fallar
   gracefully con error descriptivo si las variables faltan.
