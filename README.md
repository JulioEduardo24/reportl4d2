# ReportL4D2

Plataforma comunitaria para reportar jugadores de Left 4 Dead 2. Login con Steam (OpenID), feed público de reportes recientes, formulario de reporte, perfil por jugador con historial acumulado, búsqueda/filtro y panel de moderación.

## Stack

- **Next.js 14** (App Router) full-stack: frontend + backend en un solo proyecto (API Routes / Route Handlers), sin servidor Nest.js separado — ver nota de arquitectura más abajo.
- **shadcn/ui** + Tailwind, tema oscuro por defecto con toggle a modo claro (`next-themes`).
- **Supabase** (Postgres) como base de datos.
- **Steam OpenID 2.0** para login + **Steam Web API** para datos de perfil (avatar, nombre).

### Nota de arquitectura

No se incluyó Nest.js: Next.js ya cubre el backend necesario (Route Handlers) para este alcance, y mantener un solo servicio simplifica el despliegue. Si en el futuro el backend crece mucho (colas, jobs pesados, microservicios), separar un servicio Nest.js sí tendría sentido.

## 1. Crear el proyecto de Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta / proyecto nuevo (plan gratuito es suficiente).
2. Espera a que el proyecto termine de aprovisionarse (~2 min).
3. En **Project Settings > API** copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (sección "secret") → `SUPABASE_SERVICE_ROLE_KEY` (¡nunca la expongas al cliente!)
4. Ve a **SQL Editor > New query**, pega el contenido de `supabase/schema.sql` y ejecútalo. Esto crea las tablas `profiles` y `reports` con sus políticas de seguridad (RLS).
5. (Opcional) Para hacerte admin: después de iniciar sesión una vez en la app, ejecuta en el SQL Editor:
   ```sql
   update public.profiles set is_admin = true where steam_id = 'TU_STEAMID64';
   ```

## 2. Generar tu Steam Web API Key

1. Entra a [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey) con tu cuenta de Steam.
2. En "Domain Name" pon `localhost` para desarrollo (puedes cambiarlo luego al dominio real).
3. Copia la key generada a `STEAM_API_KEY`.

Esta key se usa para leer perfiles públicos (avatar, nombre) vía la Steam Web API. El login en sí usa Steam OpenID, que no requiere key.

## 3. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Completa `.env.local` con los valores de los pasos 1 y 2, y genera `APP_SESSION_SECRET` con:

```bash
openssl rand -hex 32
```

## 4. Instalar y correr en desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). El login con Steam redirige a `steamcommunity.com` y vuelve a `/api/auth/steam/callback`; para que esto funcione en local, Steam debe poder llegar a tu `localhost` — funciona porque el callback corre en el navegador del usuario, no en el servidor de Steam.

## 5. Desplegar

Cualquier hosting de Next.js (Vercel, etc.) funciona. Recuerda:
- Configurar las mismas variables de entorno en el panel del hosting.
- Cambiar el "Domain Name" de tu Steam API Key al dominio real una vez tengas uno.

## Estructura

```
app/
  page.tsx                  Feed público de reportes recientes (con búsqueda y filtro)
  report/page.tsx           Formulario para reportar un jugador (requiere login)
  players/[steamId]/page.tsx  Perfil de jugador + historial de reportes
  admin/page.tsx             Panel de moderación (solo admins)
  api/auth/steam/login       Redirige a Steam OpenID
  api/auth/steam/callback    Verifica el login y crea la sesión
  api/auth/logout            Cierra sesión
  api/reports                Crear reportes
  api/reports/[id]           Moderación: cambiar estado / eliminar
lib/
  steam.ts                   OpenID + Steam Web API
  session.ts                 Cookie de sesión firmada (HMAC)
  supabase/                  Clientes de Supabase (browser, server, service role)
  admin.ts, categories.ts, parse-steam-id.ts
supabase/schema.sql          Esquema completo + políticas RLS
```

## Ideas para más adelante

- Notificar al usuario cuando alguien acumula varios reportes en poco tiempo.
- Exportar reportes a CSV desde el panel de moderación.
- Rate-limiting por IP/cuenta para evitar spam de reportes.
- Página de estadísticas (categorías más comunes, jugadores con más reportes).
