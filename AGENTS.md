# AGENTS.md — siode (frontend Next.js)

Instrucciones para **cualquier IA o desarrollador** que trabaje en este repositorio. Léelo completo antes de tocar código. Responde siempre en español.

**SIODE — Sistema Integral de Órganos Desconcentrados (IEPC Chiapas, DEOE)**. Gestiona la operación de los órganos desconcentrados durante el proceso electoral en 6 módulos: **Sesiones**, **Bodegas Electorales**, **Documentación y Material Electoral**, **Mecanismos de Recolección**, **Recepción de Paquetes y Cómputos** y **Entrega de Paquetes a las PMDC**.

Arquitectura separada en dos repos:

| Parte | Repo local | Remoto GitHub |
|---|---|---|
| **Frontend (este repo)** | `C:\Users\DESARROLLO\Documents\nextjs-projects\siode` | `aristasoluciones/appsiode` |
| API REST (.NET) | `C:\Users\DESARROLLO\source\repos\apisiode` | `aristasoluciones/apisiode` |

## Entorno local

- **Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind 4 + **plantilla Metronic** (componentes Radix/shadcn en `components/ui/`) · TanStack Query · react-hook-form + Zod · axios · i18next · ApexCharts/Recharts.
- **Comunicación con la API:** `lib/api/axios-client.ts` (`apiClient`, datos) y `lib/api/axios-auth.ts` (`authClient`, auth) — ambos van del navegador directo al API .NET con `NEXT_PUBLIC_API_URL` y `withCredentials`. **Todas las rutas del backend se declaran en `lib/api/endpoints.ts`** (`API_ENDPOINTS`) — nunca escribas URLs literales en componentes o hooks.
- El interceptor de respuesta **desenvuelve el sobre** `{ status, message, data }` de la API: en el código `response.data` ya es el payload. El interceptor de petición añade el header `X-CSRF-TOKEN` y los campos `dispositivo`/`mac` a toda mutación, y gestiona el refresh de sesión con reintento en cola.
- **Autenticación:** cookies HttpOnly emitidas por el API (`AccessToken`, `RefreshToken`) + cookie CSRF. `middleware.ts` protege las rutas leyendo y verificando la expiración del JWT; el login/logout/refresh/perfil se llaman directo al API .NET desde el navegador con `authClient` (`lib/api/axios-auth.ts`); el API emite y limpia las cookies vía Set-Cookie y debe tener CORS con credenciales para el origen del frontend. El contexto de usuario y permisos vive en `providers/auth-provider.tsx`.
- **Configuración:** `.env` local (plantilla en `.env.example`); `.env.staging` para `npm run build:staging`. Variables clave: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_BASE_PATH`.
- **Comandos:** `npm run dev` · `npm run build` · `npm run lint` · `npm run format` (Prettier con ordenado de imports y clases Tailwind).
- **Bóveda Obsidian del proyecto:** `h:\Mi unidad\Bovedas Obsidian\developer\01 Proyectos IEPC\Sistema Integral de Órganos Desconcentrados\` — documentación funcional, tablero y bitácora. Accesible por ruta absoluta desde cualquier terminal. Archivos clave: `📋 SIODE.md` (hub) y `Tablero SIODE.md` (Kanban).

## Estructura

```
siode/
├── app/
│   ├── (auth)/          # signin, reset/change password (+ forms/ con esquemas Zod)
│   ├── (protected)/     # módulos del sistema — una carpeta por módulo
│   │   └── <modulo>/    # page.tsx (server) + _components/ + _hooks/
│   └── api/             # route handlers (solo proxys necesarios: device, pdf, sice)
├── components/          # ui/ (Metronic/shadcn), common/, layouts/ — transversales
├── hooks/               # hooks globales (use-proceso, use-menu…)
├── lib/api/             # axios-client, server-axios, endpoints, auth
├── lib/                 # helpers, toast, export-xlsx, auditoria
├── providers/           # auth, query, i18n, theme, settings
├── types/               # interfaces por dominio (bodegas.ts, sesiones.ts…)
└── config/              # configuración de layouts y menús de Metronic
```

### Convenciones de código

- **Colocación por módulo:** lo que solo usa un módulo vive en su carpeta `_components/` y `_hooks/`; solo se sube a `components/` o `hooks/` lo realmente transversal. Carpetas con guion bajo (`_components`) no generan rutas.
- **Datos con TanStack Query:** un hook por dominio en `_hooks/use-<dominio>.ts` que exporta un objeto de **query keys** (`BODEGAS_KEYS`) y los hooks de lectura/mutación. Las mutaciones invalidan las keys afectadas y notifican con `toastSuccess` / `toastError` de `lib/toast`.
- **Tipos:** interfaces con prefijo `I` (`IBodega`) y tipos con `T` (`TComponenteFoto`) en `types/<dominio>.ts`; los payloads llevan sufijo `Payload`. Nada de `any` en las respuestas del API.
- **Componentes:** `'use client'` solo donde hace falta interactividad; las páginas (`page.tsx`) se mantienen como server components que montan el cliente del módulo.
- **Archivos y nombres:** archivos en `kebab-case.tsx`, componentes en `PascalCase`, hooks `useAlgo`. Formularios con react-hook-form + esquema Zod.
- **UI:** reutiliza los componentes de `components/ui/` (Metronic) antes de crear uno nuevo; textos de interfaz en español.

## Sistemas legacy (fuente para recuperar lógica)

SIODE reescribe dos sistemas anteriores que siguen siendo la referencia funcional. **Solo se consultan cuando el usuario lo pida explícitamente** con estos nombres:

| Cómo lo pide el usuario | Ruta a revisar | Qué es |
|---|---|---|
| **«legacy odes»** | `C:\Users\DESARROLLO\source\repos\peODE` | Portal de los órganos desconcentrados: lo que usaban los consejos distritales y municipales |
| **«legacy administrador»** | `C:\Users\DESARROLLO\source\repos\peODEAdmin` | Panel de la oficina central: catálogos, usuarios, roles y permisos, procesos, partidos, sorteos |

- **Stack legacy (ambos):** ASP.NET Core MVC **.NET 8** con vistas **Razor** (`Views/<Módulo>/`) y JavaScript/jQuery en `wwwroot/`, PostgreSQL con Npgsql + Dapper sobre funciones por esquema. No hay React ni componentes reutilizables: la interfaz es servidor-renderizada.
- **Cobertura funcional:** entre los dos están los seis módulos —sesiones, bodegas, documentación y material electoral, mecanismos de recolección, recepción de paquetes y cómputos, entrega a PMDC— más incidencias, expedientes, grupos de trabajo y evaluación.
- **Cambio de arquitectura importante:** el legacy son **dos aplicaciones separadas**, una por tipo de usuario. SIODE es **un solo frontend para ambos**: las pantallas se adaptan según el usuario tenga o no un consejo asignado (contexto de `providers/auth-provider.tsx`). Los módulos de **sesiones** y **bodegas**, ya construidos, son la muestra de cómo se hace — mira `app/(protected)/bodegas/` con sus vistas de consejos y de oficina central. No dupliques páginas por tipo de usuario.

**Al recuperar lógica de un legacy:**

1. **Rescata la regla de negocio y el flujo de pantalla, no el código.** Las vistas Razor sirven para entender qué campos se piden, en qué orden y qué valida el formulario; la implementación se rehace con React, react-hook-form y Zod.
2. **La validación autoritativa vive en el API**, no en el front: si el legacy validaba en la vista, eso normalmente le toca ahora al backend (coordínalo con `apisiode`).
3. **Adáptalo a las convenciones de este repo**: módulo en `app/(protected)/`, hooks de TanStack Query con sus query keys, tipos en `types/`, componentes de Metronic.
4. **Unifica los dos flujos en uno** (consejo vs. oficina central) siguiendo el patrón de bodegas, en lugar de portar dos pantallas paralelas.
5. **Nunca escribas en los repos legacy**: son de solo lectura, ni siquiera para corregir un detalle.
6. Deja constancia en el detalle de la tarjeta de qué módulo legacy se tomó como base.

## Reglas duras

1. **Toda llamada al API pasa por `apiClient` / `authClient` con una ruta de `lib/api/endpoints.ts`.** Nada de `fetch` suelto ni URLs literales.
2. **No dupliques lógica de negocio del backend**: la validación de reglas y permisos es autoritativa en el API; en el front es solo experiencia de usuario.
3. **Errores**: muestra el `message` que devuelve el API con toast; nunca expongas trazas técnicas ni el objeto de error crudo al usuario.
4. **Nunca** tokens, contraseñas ni secretos en el repo ni en la bóveda: `.env` no se versiona, usa `.env.example` como plantilla. Los tokens de sesión viven en cookies HttpOnly, nunca en `localStorage`.
5. **No modifiques la plantilla base de Metronic** (`components/ui/`, `config/layout-*.config.tsx`) salvo necesidad real: complica las actualizaciones. Extiende en `components/common/` o en el módulo.
6. **Autocommit prohibido**: nunca hagas `git commit`, `git push` ni ninguna operación de escritura en el repositorio. Los commits los hace siempre el usuario de forma manual.
7. **Cambios de contrato** (rutas, forma del JSON, nombres de campos) se coordinan con el repo `apisiode`: revisa ahí `Controllers/` y `docs/ARQUITECTURA.md`, y menciona la relación en el detalle de la tarjeta.
8. Antes de dar por terminado un cambio, corre `npm run lint` (y `npm run build` si tocaste rutas, layouts o tipos compartidos).

## Protocolo de sincronización al terminar una tarea (obligatorio)

> Ambos pasos son obligatorios. El **tablero Kanban es la única fuente de datos**; la nota `🗄️ Base de datos` es su espejo. Nunca crees archivos de registro paralelos.

### Paso 1 — Mover la tarjeta a Hecho en el Tablero, con detalle

Edita `Tablero SIODE.md` (ruta: `h:\Mi unidad\Bovedas Obsidian\developer\01 Proyectos IEPC\Sistema Integral de Órganos Desconcentrados\Tablero SIODE.md`). **Corta la línea completa** de su sección actual (`## Backlog`, `## Listo para trabajar`, `## En curso` o `## En revisión`) y **pégala dentro de `## Hecho`**, añadiendo al final `✅ YYYY-MM-DD` y el detalle del cambio en el comentario oculto `%%d:…%%` (una viñeta por `<br>`). La tarjeta debe quedar **únicamente** en `## Hecho`. Si el trabajo no tenía tarjeta, créala directamente en `## Hecho`.

Etiquetas de la tarjeta, en este orden: **ámbito `#frontend`** (el de este repo; usa `#general` si el cambio abarca backend y frontend) + **módulo** (`#sesiones`, `#bodegas`, `#documentacion`, `#recoleccion`, `#computos`, `#pmdc`, o `#general` si es transversal, como infraestructura o autenticación).

```
- [x] #frontend #bodegas Descripción 🛫 2026-08-12 📅 2026-08-12 🔼 ✅ 2026-08-12 %%d:detalle%%
```

> El tablero es **solo trabajo de desarrollo**. Las fases comprometidas con el IEPC (análisis, simulacros, entregas de cada módulo) viven aparte, en `Base de Conocimiento/📅 Cronograma.md` de la bóveda; no crees tarjetas para ellas.

La tarjeta es **UNA sola línea**: nunca escribas saltos de línea reales dentro de ella ni del `%%d:…%%` (los saltos van como `<br>`).

### Paso 2 — Bitácora IA del hub

Añade una fila en `📋 SIODE.md` → sección `## 🤖 Bitácora IA`:

```
| 2026-08-12 | **Nombre de la tarea** | ✅ Ejecutado |
```

### Estilo de redacción (regla dura)

Todo lo que registres en la bóveda (detalle `%%d:…%%` de la tarjeta y Bitácora IA) va en **lenguaje llano: preciso, ejecutivo y claro** — qué se hizo y qué cambia para el usuario. Sin detalles técnicos innecesarios que inflen el texto (nombres de componentes, hooks, clases de Tailwind, salidas de build); incluye un identificador técnico solo si es imprescindible para retomar el trabajo. Nunca pegues texto con secuencias de escape sin resolver (`\t`, `\n`, `$var` de shell): rompen las tablas del hub.

---
La documentación funcional (alcance, decisiones, reuniones, cronograma de los 6 módulos) vive en la bóveda Obsidian del usuario, accesible por ruta absoluta desde cualquier terminal.
