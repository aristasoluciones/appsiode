# Patterns & Structure — Next.js App Router

This document outlines file structure, naming conventions, and the Server/Client Component split for SIODE modules.

## App Router Directory Structure

```
app/
└── (protected)/
    └── [module-name]/              # e.g. sesiones, bitacora, integracion
        ├── page.tsx                # Server Component — page entry point
        ├── layout.tsx              # Optional nested layout
        ├── loading.tsx             # Optional Suspense loading UI
        ├── [id]/                   # Dynamic route segment
        │   └── page.tsx
        └── components/             # Client components for this route
            ├── [module]-list.tsx   # 'use client' — list/table + columns inline
            ├── [module]-form.tsx   # 'use client' — create/edit form (Dialog)
            └── [module]-data.ts    # React Query hooks + axios calls
```

> ⚠️ **No crear `[module]-columns.tsx` separado.** Las columnas se definen con `useMemo` directamente dentro de `[module]-list.tsx`.

## Fundamental Rule: Server vs. Client Components

| File | Type | Rule |
|------|------|------|
| `app/(protected)/[module]/page.tsx` | **Server Component** | `async function Page()`, exports `metadata`, renders layout shell |
| `components/[module]-list.tsx` | **Client Component** | `'use client'`, React Query, `useState`, columnas inline, event handlers |
| `components/[module]-data.ts` | **Client-side hooks** | `'use client'` hooks only — importado por client components |
| `components/[module]-form.tsx` | **Client Component** | `'use client'`, Formik, mutations |

**Never** put `useQuery`, `useState`, or event handlers in `page.tsx`.

## Page Component Pattern (`page.tsx`)

The page is a **Next.js Server Component**:
- Exports `metadata` for SEO
- Renders `Container + Toolbar + Breadcrumb` (the header)
- Delegates interactive content to a `'use client'` component

```tsx
// app/(protected)/[module]/page.tsx
import { Metadata } from 'next';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Container } from '@/components/common/container';
import {
  Toolbar, ToolbarActions, ToolbarHeading, ToolbarTitle,
} from '@/components/common/toolbar';
import [Module]List from './components/[module]-list';

export const metadata: Metadata = {
  title: '[Module Title]',
  description: '[Module description].',
};

export default async function Page() {
  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>[Module Title]</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>[Module Title]</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions />
        </Toolbar>
      </Container>

      <Container>
        <[Module]List />
      </Container>
    </>
  );
}
```

## Client Component Pattern — List with DataGrid

La estructura canónica de una pantalla de listado. **Referencia real: `app/(protected)/roles/components/roles-list.tsx`**

```
DataGrid          ← context provider; REQUIERE table + recordCount
  Card
    Toolbar()     ← función interna que renderiza <CardHeader>
    CardTable     ← tabla flush, sin padding interior (NO CardContent)
      ScrollArea
        DataGridTable
        ScrollBar orientation="horizontal"
    CardFooter
      DataGridPagination
```

```tsx
// app/(protected)/[module]/components/[module]-list.tsx
'use client';

import { useMemo, useState } from 'react';
import {
  getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel,
  useReactTable, type ColumnDef,
} from '@tanstack/react-table';
import { AlertTriangle, Folder, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { use[Module]Data, useDelete[ModuleName] } from './[module]-data';
import type { I[ModuleName] } from './[module]-data';
import [ModuleName]Form from './[module]-form';

export default function [Module]List() {
  const [search, setSearch]           = useState('');
  const [showForm, setShowForm]       = useState(false);
  const [editingItem, setEditingItem] = useState<I[ModuleName] | null>(null);
  const [deletingItem, setDeletingItem] = useState<I[ModuleName] | null>(null);

  const { data, isLoading, isError, error, refetch } = use[Module]Data();
  const deleteMutation = useDelete[ModuleName]();

  function handleEdit(item: I[ModuleName]) { setEditingItem(item); setShowForm(true); }
  function handleCloseForm() { setShowForm(false); setEditingItem(null); }

  // ── Columnas inline (NO archivo separado) ──────────────────────────────────
  const columns = useMemo<ColumnDef<I[ModuleName]>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 60,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">#{row.original.id}</span>,
        meta: { skeleton: <Skeleton className="w-8 h-4" /> },
        enableSorting: false,
        enableHiding: false,
      },
      // ... columnas de la entidad ...
      {
        id: 'actions',
        header: '',
        size: 88,
        // Botones independientes — NO DropdownMenu con MoreVertical
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => handleEdit(row.original)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon"
              onClick={() => setDeletingItem(row.original)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deleteMutation.isPending],
  );

  const filtered = useMemo(
    () => (data ?? []).filter((r) => /* campos de búsqueda */ true),
    [data, search],
  );

  const table = useReactTable({
    columns,
    data: filtered,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  // ⚠️ NO hacer: const Toolbar = () => (<CardHeader>...)
  // Eso causa re-mount en cada render → el Input pierde el foco al escribir.
  // El JSX del toolbar va DIRECTO en el CardHeader dentro del return.

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
        <h3 className="text-lg font-semibold mb-1">Error al cargar</h3>
        <p className="text-sm text-muted-foreground mb-4">{(error as any)?.message}</p>
        <Button onClick={() => refetch()}>Reintentar</Button>
      </div>
    );
  }

  return (
    <>
      <DataGrid
        table={table}
        recordCount={filtered.length}
        isLoading={isLoading}
        emptyMessage={
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Folder className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="font-medium mb-1">Sin registros</p>
            {!search && (
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4" /> Crear registro
              </Button>
            )}
          </div>
        }
        tableClassNames={{ edgeCell: 'px-5' }}
      >
        <Card>
          <CardHeader className="flex-wrap gap-2.5 py-5">
            <div className="relative">
              <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
              <Input placeholder="Buscar..." value={search}
                onChange={(e) => setSearch(e.target.value)} disabled={isLoading}
                className="ps-9 w-full sm:w-40 md:w-64" />
            </div>
            <Button onClick={() => setShowForm(true)} disabled={isLoading}>
              <Plus className="h-4 w-4" /> Nuevo
            </Button>
          </CardHeader>
          <CardTable>
            <ScrollArea>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
          <CardFooter>
            <DataGridPagination />
          </CardFooter>
        </Card>
      </DataGrid>

      <[ModuleName]Form
        open={showForm}
        onOpenChange={(v) => { if (!v) handleCloseForm(); else setShowForm(true); }}
        initialData={editingItem ?? undefined}
        onSuccess={handleCloseForm}
      />

      {/* Confirmación de eliminación: AlertDialog, NUNCA confirm() nativo */}
      <AlertDialog open={deletingItem !== null} onOpenChange={(v) => { if (!v) setDeletingItem(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => {
              if (deletingItem) deleteMutation.mutate(deletingItem.id);
              setDeletingItem(null);
            }}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| **Page** | `page.tsx` (App Router) | `app/(protected)/sesiones/page.tsx` |
| **Client list** | `[module]-list.tsx` | `roles-list.tsx` — incluye columnas inline |
| **Client form** | `[module]-form.tsx` | `rol-form.tsx` |
| **Data hooks** | `[module]-data.ts` | `roles-data.ts` |
| **Interfaces** | `I` prefix | `IRol`, `ISesionFilters` |
| **Type aliases** | `T` prefix | `TEstadoSesion` |
| **Directories** | kebab-case | `roles/`, `bitacora-aperturas/` |
| **Components** | PascalCase export | `export default function RolesList()` |

## Import Organization

```tsx
// 1. External / framework
import { Metadata } from 'next';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Layout / common components
import { Container } from '@/components/common/container';
import { Toolbar, ToolbarHeading, ToolbarTitle } from '@/components/common/toolbar';

// 3. UI components (Shadcn)
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// 4. Icons (named imports only)
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

// 4. Local module components
import SesionesTable from './sesiones-columns';

// 5. Data layer
import { useSesionesData } from './sesiones-data';

// 6. Lib / API
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints'; // ← API_ENDPOINTS para módulos, no BFF_ENDPOINTS

// 7. Types
import type { ISesion } from './sesiones-data';
```

## TypeScript Conventions

```tsx
// Interfaces (entities)
interface ISesion {
  id: string;
  tipo: TEstadoSesion;
  fecha: string;
  consejo: IConsejo;
  createdAt: string;
}

// Type aliases (unions/literals)
type TEstadoSesion = 'ordinaria' | 'extraordinaria' | 'especial';

// Component props
interface SesionesListProps {
  filters?: ISesionFilters;
  onSelect?: (sesion: ISesion) => void;
}

// Prefer interfaces over types for objects
// Use 'function' keyword for pure functions
// Use arrow functions for event handlers and callbacks
```

## Module Creation Checklist

### File Structure
- [ ] `app/(protected)/[module-name]/page.tsx` — Server Component
- [ ] `app/(protected)/[module-name]/components/[module]-list.tsx` — `'use client'`, columnas inline
- [ ] `app/(protected)/[module-name]/components/[module]-data.ts` — React Query hooks
- [ ] `app/(protected)/[module-name]/components/[module]-form.tsx` — Dialog Formik+Yup
- [ ] ~~`[module]-columns.tsx`~~ — **NO crear**; columnas van dentro de `[module]-list.tsx`

### API
- [ ] Agregar `API_ENDPOINTS.[MODULE]` en `lib/api/endpoints.ts` (paths directos del .NET API)
- [ ] **NO crear** `app/api/[module]/route.ts` — `apiClient` llama directo al .NET API
- [ ] Si las mutations necesitan auditoría: importar `getDataAuditoria` de `lib/auditoria.ts`

### Navigation
- [ ] Agregar ítem en `MENU_SIDEBAR` de `config/layout-1.config.tsx` con `icon: ComponentRef` (no string)

### UI
- [ ] Estructura de tabla: `DataGrid` → `Card` → `CardHeader/CardTable/CardFooter`
- [ ] `CardTable` (no `CardContent`) para tablas flush
- [ ] Acciones en columna: botones independientes (`Button variant="outline" size="icon"`)
- [ ] Confirmación de eliminación: `AlertDialog` (NO `confirm()` nativo)
- [ ] Loading skeleton via `meta: { skeleton: <Skeleton/> }` en columnas + `isLoading` en DataGrid
- [ ] Error state con botón Reintentar (antes del return principal)
- [ ] Empty state con mensaje contextual (search vs vacío)
- [ ] Dark mode con `dark:` classes
- [ ] Responsive con Tailwind breakpoints

### TypeScript
- [ ] Interfaces con prefijo `I` (`IRol`, `ISesion`)
- [ ] Type aliases con prefijo `T` (`TEstado`)
- [ ] Tipado de todos los props de componentes

---

**Referencia real:** `app/(protected)/roles/` — implementación completa con DataGrid, AlertDialog, permisos y auditoría.
