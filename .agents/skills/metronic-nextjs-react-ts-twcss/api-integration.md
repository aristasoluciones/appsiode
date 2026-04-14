# API Integration — Axios Direct + BFF Auth Pattern

SIODE uses **two distinct patterns**:
1. **Authenticated modules** (post-login): `apiClient` calls the .NET API **directly** from the browser — no proxy needed
2. **Auth flow only**: `authClient` calls Next.js BFF routes (`app/api/auth/...`) which proxy to the .NET API

The .NET API URL is public via `NEXT_PUBLIC_API_URL`. The BFF layer exists **only for cookie-based auth operations** (login, logout, refresh).

## API Response Envelope

The .NET API always returns a wrapper object:

```ts
interface IApiResponse<T> {
  status: number;
  message: string;
  data: T;
  isSuccess: boolean;
}
```

**`apiClient` unwraps this automatically** via a response interceptor in `lib/api/axios-client.ts`.
When you do `apiClient.get<IRol[]>(...)`, `response.data` is already `IRol[]` — not the wrapper.

```ts
// ✅ Correct — types match directly
const { data } = await apiClient.get<IRol[]>(API_ENDPOINTS.ROLES.LIST);
// data → IRol[]

// ❌ Wrong — do NOT type as IApiResponse<IRol[]>
const { data } = await apiClient.get<IApiResponse<IRol[]>>(API_ENDPOINTS.ROLES.LIST);
```

## Axios Clients

```
lib/api/
├── axios-client.ts     # Browser → .NET API directly (NEXT_PUBLIC_API_URL) — use in ALL React Query hooks
├── axios-auth.ts       # Browser → BFF auth endpoints only (/api/auth/...)
└── server-axios.ts     # Server-side Route Handlers → .NET API (used ONLY in app/api/ routes)
```

### `apiClient` — browser client (primary client for all modules)

```ts
// lib/api/axios-client.ts
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // → .NET API directly (e.g. http://api.siode.mx/api)
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // sends JWT cookie automatically
});
// Automatically attaches X-CSRF-TOKEN for mutating requests
```

### `serverApi` — server-side only (do NOT use in client components)

```ts
// lib/api/server-axios.ts — only inside app/api/ Route Handlers
const serverApi = axios.create({
  baseURL: process.env.API_AUTH_URL, // same .NET API, server-side env var
});
```

## Endpoint Definitions

**Always define endpoints in `lib/api/endpoints.ts`** — never hardcode paths.

```ts
// lib/api/endpoints.ts

// BFF_ENDPOINTS: ONLY for auth proxy routes (/api/auth/...)
export const BFF_ENDPOINTS = {
  AUTH: {
    LOGIN:   '/api/auth/login',
    LOGOUT:  '/api/auth/logout',
    ME:      '/api/auth/me',
    REFRESH: '/api/auth/refresh',
  },
} as const;

// API_ENDPOINTS: .NET API paths — use with apiClient (browser) and serverApi (server)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN:   '/Auth/login',
    REFRESH: '/Auth/refresh',
  },
  // Add new modules here:
  ROLES: {
    LIST:           '/Roles',
    CREATE:         '/Roles',
    UPDATE:         (id: string | number) => `/Roles/${id}`,
    DELETE:         (id: string | number) => `/Roles/${id}`,
    PERMISOS:       (id: string | number) => `/Roles/${id}/permisos`,
    TOGGLE_PERMISO: (idRol: string | number, idAccion: string | number) => `/Roles/${idRol}/permisos/${idAccion}`,
  },
} as const;
```

> ⚠️ **DO NOT add module entries to `BFF_ENDPOINTS`**. Only auth routes go there.
> ⚠️ **DO NOT create `app/api/[module]/` Route Handlers** for authenticated modules — `apiClient` already calls the .NET API directly.

## React Query Data Hooks (Client Components)

Data hooks live in `[module]/components/[module]-data.ts` and are only used in `'use client'` components.

```ts
// roles/components/roles-data.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';  // ← API_ENDPOINTS, NOT BFF_ENDPOINTS
import { toast } from 'sonner';

export interface IRol {
  idRol: number;
  nombre: string;
  descripcion?: string;
}

const QK = 'roles' as const;

// GET list — apiClient hits NEXT_PUBLIC_API_URL/Roles directly
export function useRolesData() {
  return useQuery({
    queryKey: [QK],
    queryFn: async () => {
      const { data } = await apiClient.get<IRol[]>(API_ENDPOINTS.ROLES.LIST);
      return data;
    },
  });
}

// CREATE
export function useCreateRol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<IRol, 'idRol'>) => {
      const { data } = await apiClient.post<IRol>(API_ENDPOINTS.ROLES.CREATE, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK] });
      toast.success('Rol creado correctamente.');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? 'Error al crear el rol.');
    },
  });
}

// UPDATE
export function useUpdateRol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ idRol, data }: { idRol: number; data: Partial<IRol> }) => {
      const { data: updated } = await apiClient.put<IRol>(
        API_ENDPOINTS.ROLES.UPDATE(idRol),
        data,
      );
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK] });
      toast.success('Rol actualizado.');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? 'Error al actualizar el rol.');
    },
  });
}

// DELETE
export function useDeleteRol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (idRol: number) => {
      await apiClient.delete(API_ENDPOINTS.ROLES.DELETE(idRol));
      return idRol;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK] });
      toast.success('Rol eliminado.');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? 'Error al eliminar el rol.');
    },
  });
}
```

## When to Use BFF Route Handlers

Only create `app/api/` Route Handlers for:
- **Auth operations** — already exist in `app/api/auth/`
- **Server-side secrets** — operations that must not expose API keys or internal endpoints to the browser

For all standard authenticated CRUD modules: **use `apiClient` + `API_ENDPOINTS` directly**.

## Loading States

```tsx
if (isLoading) {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse h-14 bg-gray-100 dark:bg-gray-800 rounded-lg" />
      ))}
    </div>
  );
}
```

## Error States

```tsx
if (isError) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertTriangle className="h-10 w-10 text-danger mb-3" />
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
        Error al cargar los datos
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {error?.message}
      </p>
      <Button variant="primary" onClick={() => refetch()}>
        Reintentar
      </Button>
    </div>
  );
}
```

## Empty State

```tsx
if (!data || data.length === 0) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Folder className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Sin registros
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Comienza creando el primer registro.
      </p>
      <Button variant="primary">
        <Plus className="h-4 w-4" />
        Crear nuevo
      </Button>
    </div>
  );
}
```

---

**Quick reference:**
- `apiClient` + `API_ENDPOINTS` → all authenticated module data fetching (React Query hooks)
- `authClient` + `BFF_ENDPOINTS.AUTH` → login / logout / refresh only
- `serverApi` → only inside `app/api/` Route Handlers (avoid creating these for standard modules)

## Module-Specific API Conventions

### Sesiones — Parámetro `sesion` en Indicadores

El endpoint `GET /Sesiones/indicadores?tipo=...&sesion=...` **siempre** recibe el param `sesion`:

| Selección | Valor del param `sesion` |
|-----------|--------------------------|
| Todas las sesiones | `TODAS;TODAS` |
| Sesión específica | `no_sesion;tipo;fecha_hora` |

Los valores vienen del endpoint `GET /Sesiones/distinct` que retorna `ISesionDistinct[]`. El campo `ISesionOption.id` almacena ya el string con formato `;` para pasar directamente al API.

```ts
// useSesionesOptions — construye el id con separador ";"
id: `${s.no_sesion};${s.tipo};${s.fecha_hora}`

// useIndicadoresData — sesionId null → "TODAS;TODAS"
API_ENDPOINTS.SESIONES.INDICADORES(tipoConsejo, sesionId)
// → /Sesiones/indicadores?tipo=D&sesion=TODAS;TODAS  (sin sesión)
// → /Sesiones/indicadores?tipo=D&sesion=5;ORDINARIA;2025-04-01T10:00:00  (específica)
```

### Sesiones — Lista de sesiones por consejo

El endpoint `GET /Sesiones/consejo/{tipoConsejo}/{idConsejo}` retorna las sesiones de un consejo.

- `tipoConsejo`: carácter `'D'` | `'M'` (**NO el string** `'distrital'`/`'municipal'`)
- `idConsejo`: clave numérica del consejo (viene del campo `clave_consejo` en la respuesta de indicadores)
- El param de URL `[type]` en la ruta es `'d'` | `'m'` → convertir con `.toUpperCase()` al llamar el endpoint

```ts
// URL del router: /sesiones/d/1   →  API: /Sesiones/consejo/D/1
const tipoChar = type.toUpperCase(); // 'd' → 'D'
API_ENDPOINTS.SESIONES.CONSEJO_SESIONES(tipoChar, idConsejo)
```

**Conversión canónica `TTipoConsejo` ↔ char:**

```ts
import { TIPO_CONSEJO_CHAR } from '@/hooks/use-proceso';
// TIPO_CONSEJO_CHAR['distrital'] → 'D'
// TIPO_CONSEJO_CHAR['municipal'] → 'M'
```

Usar `TIPO_CONSEJO_CHAR` cuando se parte de `TTipoConsejo` (e.g. en `useIndicadoresData`).
Usar `.toUpperCase()` directamente cuando el param de entrada ya es `'d'`/`'m'` (e.g. route params).



Todas las interfaces de un módulo van en `types/[modulo].ts` (no en el `-data.ts`).
El `-data.ts` importa de `types/` y re-exporta lo que necesitan los componentes.

```ts
// types/sesiones.ts          ← fuente de verdad
export interface IIndicadorAPI { ... }
export interface IConsejoIndicador { ... }
export interface ISesionOption { ... }
export interface ISesionDistinct { ... }

// sesiones/components/indicadores-data.ts
import type { ... } from '@/types/sesiones';
export type { IConsejoIndicador, ISesionOption } from '@/types/sesiones';  // re-export
```

