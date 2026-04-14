# Components & UI Patterns

This document covers component usage for SIODE modules. All components use correct import paths for this project.

## Icons — Lucide React

All icons come from `lucide-react`. Import **only** the icons you use.

```tsx
// Named imports — tree-shakeable
import {
  Plus, Pencil, Trash2, Search, Filter, Download,
  Eye, Check, AlertTriangle, Folder, MoreVertical,
  Calendar, Settings, Info, ChevronDown, ArrowLeft,
  Users, BookOpen, User, X, BarChart2, FileText,
  LoaderCircle,
} from 'lucide-react';

// Usage — standard sizing with className
<Plus className="h-4 w-4" />          // 16px (button icon)
<AlertTriangle className="h-5 w-5" /> // 20px (inline)
<Folder className="h-8 w-8" />        // 32px (empty state)
<AlertTriangle className="h-10 w-10 text-danger" /> // 40px (error state)
```

**Common icon mapping:**

| Use case | Component |
|----------|-----------|
| Add / create | `Plus`, `PlusCircle` |
| Edit | `Pencil` |
| Delete | `Trash2` |
| Search | `Search` |
| Filter | `Filter` |
| Download | `Download` |
| View | `Eye` |
| Confirm | `Check` |
| Error / warning | `AlertTriangle`, `AlertCircle` |
| Empty folder | `Folder` |
| More actions | `MoreVertical`, `MoreHorizontal` |
| Date | `Calendar` |
| Settings | `Settings` |
| Back | `ArrowLeft` |
| Users | `Users`, `User` |
| Loading | `LoaderCircle` |

## Layout Components

### Container

```tsx
import { Container } from '@/components/common/container';

<Container>
  {/* Page content */}
</Container>
```

### Toolbar Components

```tsx
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarActions,
} from '@/components/common/toolbar';

<Toolbar>
  <ToolbarHeading>
    <ToolbarTitle>Sesiones</ToolbarTitle>
    {/* Breadcrumb goes here */}
  </ToolbarHeading>
  <ToolbarActions>
    <Button variant="primary" size="sm">
      <Plus className="h-4 w-4" />
      Nueva sesión
    </Button>
  </ToolbarActions>
</Toolbar>
```

### Full Page Header (The Standard Pattern)

```tsx
import { Metadata } from 'next';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Container } from '@/components/common/container';
import {
  Toolbar, ToolbarActions, ToolbarHeading, ToolbarTitle,
} from '@/components/common/toolbar';

export const metadata: Metadata = {
  title: 'Sesiones',
  description: 'Gestión de sesiones de consejo.',
};

export default async function Page() {
  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Sesiones</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Sesiones</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions />
        </Toolbar>
      </Container>

      <Container>
        <SesionesList />
      </Container>
    </>
  );
}
```

## Card Components

```tsx
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/card';
import { Settings } from 'lucide-react';

<Card>
  <CardHeader className="border-b border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Todas las sesiones
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Lista de sesiones registradas
        </p>
      </div>
      <Button variant="light" size="sm">
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  </CardHeader>
  <CardBody>
    {/* Content */}
  </CardBody>
</Card>
```

### Card Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
  <Card><CardBody>Card 1</CardBody></Card>
  <Card><CardBody>Card 2</CardBody></Card>
  <Card><CardBody>Card 3</CardBody></Card>
</div>
```

### Stats Card

```tsx
import { BarChart2 } from 'lucide-react';

<Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
  <CardBody>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Sesiones</p>
        <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100">42</h3>
      </div>
      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
        <BarChart2 className="h-6 w-6 text-primary" />
      </div>
    </div>
  </CardBody>
</Card>
```

## Button Components

```tsx
import { Button } from '@/components/ui/button';
import { Plus, Download, Trash2 } from 'lucide-react';

// Variants
<Button variant="primary">Guardar</Button>
<Button variant="secondary">Secundario</Button>
<Button variant="outline">Contorno</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="light">Ligero</Button>
<Button variant="destructive">Eliminar</Button>

// Sizes
<Button size="sm">Pequeño</Button>
<Button size="default">Normal</Button>
<Button size="lg">Grande</Button>
<Button size="icon"><MoreVertical className="h-4 w-4" /></Button>

// With icons (leading)
<Button variant="primary" size="sm">
  <Plus className="h-4 w-4" />
  Nuevo
</Button>

// With icons (trailing)
<Button variant="light" size="sm">
  Exportar
  <Download className="h-4 w-4" />
</Button>

// Icon-only
<Button variant="light" size="icon">
  <Trash2 className="h-4 w-4" />
</Button>
```

## Badge Components

```tsx
import { Badge } from '@/components/ui/badge';

<Badge variant="success">Activo</Badge>
<Badge variant="danger">Inactivo</Badge>
<Badge variant="warning">Pendiente</Badge>
<Badge variant="info">En proceso</Badge>
<Badge variant="default">Default</Badge>
```

## Data Table (DataGrid)

### Patrón canónico — con loading skeleton

El layout obligatorio es:

```
DataGrid(table, recordCount, isLoading, emptyMessage, tableClassNames)
  Card
    CardHeader        ← toolbar JSX directo (búsqueda + botón Nuevo)
    CardTable         ← NO CardContent — flush sin padding
      ScrollArea → DataGridTable + ScrollBar(horizontal)
    CardFooter → DataGridPagination
```

**Reglas críticas:**
- `DataGrid` recibe `isLoading` del hook React Query.
- Cada columna de datos lleva `meta: { skeleton: <Skeleton className="..." /> }`.
- La columna `actions` (`enableHiding: false`) **no lleva** `meta.skeleton`.
- El `loadingMode` default del componente es `'skeleton'` — no hace falta declararlo.
- `Input` de búsqueda y botón Nuevo deben recibir `disabled={isLoading}`.

```tsx
'use client';
import { useMemo, useState } from 'react';
import {
  getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel,
  useReactTable, type ColumnDef,
} from '@tanstack/react-table';
import { Folder, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useItemsData, useDeleteItem } from './items-data';
import type { IItem } from './items-data';

export default function ItemsList() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, isError, error, refetch } = useItemsData();
  const deleteMutation = useDeleteItem();

  // ── Columnas inline — NO archivo separado ──────────────────────────────────
  const columns = useMemo<ColumnDef<IItem>[]>(
    () => [
      {
        accessorKey: 'nombre',
        header: 'Nombre',
        cell: ({ row }) => <span className="font-medium">{row.original.nombre}</span>,
        // ↓ skeleton obligatorio en TODAS las columnas de datos
        meta: { skeleton: <Skeleton className="w-32 h-4" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'descripcion',
        header: 'Descripción',
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">{row.original.descripcion}</span>
        ),
        meta: { skeleton: <Skeleton className="w-48 h-4" /> },
        enableSorting: false,
      },
      {
        id: 'actions',
        header: '',
        size: 88,
        // ↓ columna de acciones: SIN meta.skeleton (se oculta durante la carga)
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button variant="outline" size="icon" onClick={() => {}}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={deleteMutation.isPending}
              onClick={() => {}}
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
    () => (data ?? []).filter((r) => r.nombre.toLowerCase().includes(search.toLowerCase())),
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

  // ── Error state — ANTES del return principal ───────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
        <h3 className="text-lg font-semibold mb-1">Error al cargar</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {(error as any)?.message ?? 'Ocurrió un error inesperado.'}
        </p>
        <Button onClick={() => refetch()}>Reintentar</Button>
      </div>
    );
  }

  // ── Render principal ───────────────────────────────────────────────────────
  return (
    <DataGrid
      table={table}
      recordCount={filtered.length}
      isLoading={isLoading}   // ← activa los skeleton rows automáticamente
      emptyMessage={
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Folder className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="font-medium mb-1">Sin registros</p>
          <p className="text-sm text-muted-foreground mb-3">
            {search ? 'No hay resultados.' : 'Comienza creando el primero.'}
          </p>
          {!search && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> Crear
            </Button>
          )}
        </div>
      }
      tableClassNames={{ edgeCell: 'px-5' }}
    >
      <Card>
        <CardHeader className="flex-wrap gap-2.5 py-5">
          {/* Toolbar JSX directo — NO const Toolbar = () => (...) */}
          <div className="relative">
            <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={isLoading}   // ← deshabilitado mientras carga
              className="ps-9 w-full sm:w-40 md:w-64"
            />
          </div>
          <Button onClick={() => setShowForm(true)} disabled={isLoading}>
            <Plus /> Nuevo
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
  );
}
```

### Cómo funciona el skeleton

| Elemento | Comportamiento |
|----------|----------------|
| `isLoading={true}` en `DataGrid` | Activa `loadingMode='skeleton'` (default) |
| `meta: { skeleton: <Skeleton/> }` en columna | Define el placeholder por celda |
| Columna `actions` sin `meta.skeleton` | La celda queda vacía durante la carga |
| `disabled={isLoading}` en Input/Button | Evita interacción durante la carga |

## Dialog / Modal Components

```tsx
'use client';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar eliminación</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. ¿Deseas continuar?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="light" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## Dropdown Menu

```tsx
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Eye, Pencil, Trash2 } from 'lucide-react';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="light" size="icon">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={handleView}>
      <Eye className="mr-2 h-4 w-4" />
      Ver detalle
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleEdit}>
      <Pencil className="mr-2 h-4 w-4" />
      Editar
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleDelete} className="text-danger">
      <Trash2 className="mr-2 h-4 w-4" />
      Eliminar
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Tabs

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

<Tabs defaultValue="general">
  <TabsList>
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="asistencia">Asistencia</TabsTrigger>
    <TabsTrigger value="documentos">Documentos</TabsTrigger>
  </TabsList>
  <TabsContent value="general">Contenido general</TabsContent>
  <TabsContent value="asistencia">Lista de asistencia</TabsContent>
  <TabsContent value="documentos">Documentos adjuntos</TabsContent>
</Tabs>
```

## Form Components (Formik + Yup)

```tsx
'use client';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const schema = Yup.object({
  titulo: Yup.string().required('El título es obligatorio').min(3),
  fecha: Yup.string().required('La fecha es obligatoria'),
});

<Formik
  initialValues={{ titulo: '', fecha: '' }}
  validationSchema={schema}
  onSubmit={(values, { setSubmitting }) => {
    // handle submit
    setSubmitting(false);
  }}
>
  {({ errors, touched, isSubmitting }) => (
    <Form className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Título *
        </label>
        <Field name="titulo" as={Input} placeholder="Ingresa el título" />
        {errors.titulo && touched.titulo && (
          <p className="text-danger text-sm mt-1">{errors.titulo}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="light">Cancelar</Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? (
            'Guardando...'
          ) : (
            <>
              <Check className="h-4 w-4" />
              Guardar
            </>
          )}
        </Button>
      </div>
    </Form>
  )}
</Formik>
```

## Toast Notifications

```tsx
import { toast } from 'sonner';

toast.success('Sesión creada correctamente.');
toast.error('Error al guardar los datos.');
toast.info('Procesando solicitud...');
toast.warning('Esta acción no se puede deshacer.');
```

---

**Remember:** All interactive components must have `'use client'` at the top. Shadcn UI components are in `@/components/ui/`. Use `lucide-react` for all icons — import only the ones you use.
