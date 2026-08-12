# siode (frontend Next.js — SIODE)

Lee y sigue **AGENTS.md** (en esta misma carpeta) antes de tocar código. Resumen ejecutivo:

- **SIODE — Sistema Integral de Órganos Desconcentrados (IEPC Chiapas)**, arquitectura separada: este repo es el **frontend** (`aristasoluciones/appsiode`); la API REST .NET está en `C:\Users\DESARROLLO\source\repos\apisiode` (`aristasoluciones/apisiode`) — coordina los cambios de contrato que afecten a ambos.
- **Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind 4 + plantilla **Metronic** · TanStack Query · react-hook-form + Zod · axios · i18next.
- Patrón: `app/(protected)/<modulo>/` con `page.tsx` (server) + `_components/` + `_hooks/`. **Toda lectura va por `useQuery` y toda escritura por `useMutation`** (nada de llamadas sueltas en componentes o `useEffect`); las **llaves de caché** viven centralizadas en `lib/query-keys/` (una por dominio) y de ahí las toman queries e invalidaciones. Las mutaciones invalidan las llaves afectadas y avisan con `toastSuccess`/`toastError`. Tipos por dominio en `types/` (`IBodega`, `TComponenteFoto`).
- **Toda llamada al API** pasa por `apiClient` / `authClient` usando rutas de `lib/api/endpoints/` — nunca URLs literales ni `fetch` suelto. El interceptor ya desenvuelve el sobre `{ status, message, data }` del API y añade CSRF; la sesión vive en cookies HttpOnly, nunca en `localStorage`.
- Evita modificar la plantilla base de Metronic (`components/ui/`, `config/layout-*`); extiende en `components/common/` o en el módulo. Antes de cerrar, corre `npm run lint` (y `npm run build` si tocaste rutas, layouts o tipos compartidos).
- **Sistemas legacy** (solo si el usuario lo pide con ese nombre): **«legacy odes»** → `C:\Users\DESARROLLO\source\repos\peODE` (portal de los consejos) y **«legacy administrador»** → `C:\Users\DESARROLLO\source\repos\peODEAdmin` (panel de oficina central). Ambos ASP.NET Core MVC .NET 8 con vistas Razor y jQuery. Son **solo lectura**: sirven para entender el flujo de pantalla y las reglas, no para copiar código. En SIODE hay **un solo frontend para los dos tipos de usuario** y las pantallas se adaptan según el consejo asignado — sesiones y bodegas son la muestra del patrón. Ver **AGENTS.md**.
- **Protocolo de sincronización al terminar** (2 pasos obligatorios): (1) mover la tarjeta a `## Hecho` en `Tablero SIODE.md` con `✅ YYYY-MM-DD` y el detalle en su comentario `%%d:…%%` (ámbito `#frontend` + etiqueta de módulo; el tablero es la única fuente de datos y lleva solo trabajo de desarrollo, no el cronograma), (2) fila en la Bitácora IA de `📋 SIODE.md`. Ver **AGENTS.md** para rutas y formato exacto.
- **Lenguaje llano al registrar en la bóveda**: detalle de tarjetas y bitácoras precisos, ejecutivos y claros; sin detalles técnicos innecesarios que hagan crecer el texto.
- **Autocommit prohibido** — los commits son siempre manuales.

Documentación funcional: `h:\Mi unidad\Bovedas Obsidian\developer\01 Proyectos IEPC\Sistema Integral de Órganos Desconcentrados\` — hub `📋 SIODE.md`, tablero `Tablero SIODE.md`.

Nunca guardes secretos en el repo ni en la bóveda. Responde siempre en español.
