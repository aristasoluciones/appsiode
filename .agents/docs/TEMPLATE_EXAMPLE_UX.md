# TEMPLATE_EXAMPLE_UX — Patrones UX / Layout establecidos en SIODE

> **Referencia de proyecto:** Módulo "Bodegas Electorales" (`app/(protected)/bodegas/`)
>
> Este archivo complementa el skill `metronic-nextjs-react-ts-twcss` documentando patrones de
> maquetado, jerarquía tipográfica y componentes UX que **no están cubiertos** en los archivos
> base del skill (`styling.md`, `components.md`). Úsalo como referencia canónica al crear nuevos
> módulos o trasladar patrones a otro proyecto.

---

## 1. Jerarquía tipográfica vigente

La siguiente escala es la que se aplica en todos los módulos del proyecto. Se diferencia de los
tamaños genéricos del skill en que usa `text-foreground` / `text-muted-foreground` en lugar de
clases `gray-*` directas, **excepto** en celdas de tabla y tarjetas de datos donde se usan los
tokens explícitos `gray-900 dark:gray-100` / `gray-400 dark:gray-500` para máximo contraste.

| Uso | Clases |
|---|---|
| Título de sección (Card heading) | `text-sm font-semibold text-foreground` |
| Subtítulo / descripción de sección | `text-xs text-muted-foreground` |
| Label de campo (form) | `text-sm font-medium text-gray-700 dark:text-gray-300` |
| Label de dato (detail view) | `text-xs font-medium text-muted-foreground` |
| Valor de dato (detail view) | `text-sm text-foreground` |
| Texto principal de fila de tabla | `text-sm font-semibold text-gray-900 dark:text-gray-100` |
| Subtexto de fila de tabla | `text-xs text-gray-400 dark:text-gray-500 mt-0.5` |
| Metadata inline (header) | `text-xs text-muted-foreground` |
| Valores numéricos / mono | `text-[0.8125rem] font-mono text-muted-foreground` |

---

## 2. Status Badge

En este proyecto los badges de estado usan `rounded-md` (no `rounded-full`) y borde explícito.

```tsx
const STATUS_STYLES: Record<TStatus, string> = {
  Registrada: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  Verificada:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Comprobada:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Informada:   'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
};

function StatusBadge({ status }: { status: TStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
```

Para la tabla (con borde explícito):
```tsx
// Agrega border + colorBorder a STATUS_CONFIG
className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border
  ${cfg.colorBg} ${cfg.colorText} ${cfg.colorBorder}`}
```

---

## 3. Header de página de detalle

El encabezado de una página de detalle distribuye los elementos en una sola fila:
- **Izquierda**: badge de estado + metadata inline (fechas)
- **Derecha**: botón Regresar + botón Editar

```tsx
<div className="flex items-center justify-between gap-x-4 gap-y-2 flex-wrap">
  {/* Izquierda: status + metadatos */}
  <div className="flex items-center gap-2.5 flex-wrap">
    <StatusBadge status={record.status} />
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span>
        Creado&nbsp;
        {new Date(record.created_at).toLocaleDateString('es-MX', {
          day: '2-digit', month: 'short', year: 'numeric',
        })}
      </span>
      <span aria-hidden="true">·</span>
      <span>
        Act.&nbsp;
        {new Date(record.updated_at).toLocaleDateString('es-MX', {
          day: '2-digit', month: 'short', year: 'numeric',
        })}
      </span>
    </div>
  </div>

  {/* Derecha: acciones */}
  <div className="flex items-center gap-2">
    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => router.push('/modulo')}>
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Regresar
    </Button>
    {canEditar && (
      <Link href={`/modulo/${record.id}/editar`}>
        <Button size="sm" className="gap-1.5">
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Editar
        </Button>
      </Link>
    )}
  </div>
</div>
```

**Reglas:**
- `min-h-[44px]` **no se usa** en botones de cabecera; todos usan `size="sm"`.
- El separador `·` lleva `aria-hidden="true"`.
- `flex-wrap` en el contenedor y en el grupo izquierdo para colapsar correctamente en móvil.

---

## 4. Layout de detalle en dos columnas

Patrón establecido para páginas de detalle con datos + acciones/documentos complementarios.

```tsx
<div className="space-y-5">
  {/* Header de página (patrón §3) */}

  {/* Grid principal */}
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

    {/* Columna principal — datos del registro */}
    <div className="lg:col-span-8 space-y-5">
      <Card>
        <CardHeader className="pb-2">
          <h2 className="text-sm font-semibold text-foreground">Datos Generales</h2>
        </CardHeader>
        <CardContent>
          <dl>
            <DataRow label="Campo A" value={record.campoA} />
            <DataRow label="Campo B" value={record.campoB} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <h2 className="text-sm font-semibold text-foreground">Características</h2>
        </CardHeader>
        <CardContent>
          <dl>{/* más DataRows */}</dl>
        </CardContent>
      </Card>
    </div>

    {/* Columna secundaria — documentos, acciones, uploads */}
    <div className="lg:col-span-4 space-y-5">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-foreground">Documento</h2>
          </div>
        </CardHeader>
        <CardContent>
          {/* Upload / preview */}
        </CardContent>
      </Card>
    </div>

  </div>
</div>
```

**Reglas:**
- `space-y-5` entre secciones (no `space-y-4` ni `space-y-6`).
- `gap-5` en el grid.
- La columna secundaria puede tener 3–4 cards apiladas; usar `space-y-5`.
- Íconos de cabecera de card: `h-3.5 w-3.5 text-muted-foreground`.
- No hay `max-w-*` en el contenedor del grid — usa el ancho disponible.

---

## 5. DataRow — componente de fila de dato

Para vistas de detalle (no tablas). La etiqueta va arriba, el valor abajo (diseño vertical compacto).

```tsx
function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 border-b border-border last:border-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value ?? '—'}</dd>
    </div>
  );
}
```

**Uso dentro de `<dl>`:**
```tsx
<CardContent>
  <dl>
    <DataRow label="Tipo de Consejo" value="Distrital" />
    <DataRow label="Estado" value={<StatusBadge status={record.status} />} />
    <DataRow label="Superficie" value={record.superficie_m2 != null ? `${record.superficie_m2} m²` : null} />
  </dl>
</CardContent>
```

**Reglas:**
- `py-2.5` por fila, separador `border-b border-border`, `last:border-0`.
- El valor acepta `React.ReactNode` para mostrar badges, botones, etc.
- Valor nulo o undefined renderiza `'—'`.

---

## 6. Columna "Consejo" en tabla (patrón sesiones)

Cuando una fila de tabla tiene un consejo asociado se usa nombre en negrita + tipo como subtexto.
Esta columna reemplaza las columnas separadas "Clave" y "Tipo".

```tsx
// Columna Clave — solo el número identificador
{
  accessorKey: 'id_consejo',
  header: 'Clave',
  size: 72,
  cell: ({ row }) => (
    <span className="text-[0.8125rem] font-mono text-muted-foreground">
      #{row.original.id_consejo}
    </span>
  ),
  meta: {
    skeleton: <Skeleton className="h-4 w-10 animate-pulse motion-reduce:animate-none" />,
  },
  enableSorting: true,
},

// Columna Consejo — nombre completo + tipo como subtexto
{
  accessorKey: 'nombre_consejo',
  header: 'Consejo',
  cell: ({ row }) => (
    <div>
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {row.original.nombre_consejo}
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
        {row.original.tipo_consejo === 'D' ? 'Consejo Distrital' : 'Consejo Municipal'}
      </p>
    </div>
  ),
  meta: {
    skeleton: (
      <div className="space-y-1.5">
        <Skeleton className="w-44 h-4 animate-pulse motion-reduce:animate-none" />
        <Skeleton className="w-28 h-3 animate-pulse motion-reduce:animate-none" />
      </div>
    ),
  },
  enableSorting: true,
},
```

**Tarjeta móvil equivalente:**
```tsx
<div>
  <p className="text-xs font-mono text-muted-foreground">#{row.id_consejo}</p>
  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
    {row.nombre_consejo}
  </h3>
  <p className="text-xs text-gray-400 dark:text-gray-500">
    {row.tipo_consejo === 'D' ? 'Consejo Distrital' : 'Consejo Municipal'}
  </p>
</div>
```

---

## 7. Stats cards row — dashboard compacto

Fila de tarjetas de indicadores clave. Diseño compacto, sin gradiente, con icono pequeño.

```tsx
// Contenedor
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
  {stats.map((stat) => (
    <div
      key={stat.key}
      className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3"
    >
      <div className={`rounded-md p-2 shrink-0 ${stat.colorBg}`}>
        <stat.Icon className={`h-4 w-4 ${stat.colorText}`} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-semibold text-foreground leading-none">
          {stat.value ?? '—'}
        </p>
        <p className="text-xs font-medium text-muted-foreground mt-0.5 truncate">
          {stat.label}
        </p>
      </div>
    </div>
  ))}
</div>

// Skeleton equivalente
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
  {Array.from({ length: 5 }).map((_, i) => (
    <div key={i} className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3">
      <Skeleton className="h-8 w-8 rounded-md shrink-0 motion-reduce:animate-none" />
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-10 motion-reduce:animate-none" />
        <Skeleton className="h-3 w-20 motion-reduce:animate-none" />
      </div>
    </div>
  ))}
</div>
```

---

## 8. Pills de filtro tipo/categoría (toggle)

Para filtros de tipo mutuamente excluyentes (Distrital / Municipal).

```tsx
// Contenedor
<div role="radiogroup" aria-label="Tipo de consejo" className="flex items-center gap-1.5">
  {OPTIONS.map((opt) => {
    const active = current === opt.value;
    return (
      <button
        key={opt.value}
        role="radio"
        aria-checked={active}
        onClick={() => onChange(opt.value)}
        className={[
          'inline-flex items-center gap-1.5 h-8.5 px-3 rounded-md border',
          'text-[0.8125rem] font-medium transition-colors',
          active
            ? 'bg-primary/10 border-primary text-primary'
            : 'bg-background border-input text-foreground hover:bg-accent',
        ].join(' ')}
      >
        <opt.Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {opt.label}
      </button>
    );
  })}
</div>
```

**Skeleton:**
```tsx
<div className="flex items-center gap-1.5">
  {[72, 80].map((w) => (
    <Skeleton key={w} className={`h-8.5 w-${w / 4} rounded-md motion-reduce:animate-none`} />
  ))}
</div>
```

---

## 9. Formulario multi-sección

Patrón para formularios de creación / edición con múltiples grupos de campos.

### Estructura general

```tsx
// Contenedor
<div className="space-y-4 max-w-3xl">

  {/* Sección */}
  <Card>
    <CardHeader className="pb-2">
      <h2 className="text-sm font-semibold text-foreground">Identificación</h2>
      <p className="text-xs text-muted-foreground">Descripción opcional de la sección.</p>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* Campos */}
    </CardContent>
  </Card>

  {/* Botones de acción */}
  <div className="flex items-center justify-between gap-3 pb-4">
    <Button type="button" variant="secondary" className="gap-1.5" onClick={onCancel}>
      <ArrowLeft className="h-4 w-4" />
      Cancelar
    </Button>
    <Button type="submit" className="gap-1.5" disabled={isPending}>
      {isPending
        ? <Loader2 className="h-4 w-4 animate-spin" />
        : <Save className="h-4 w-4" />
      }
      {modo === 'crear' ? 'Registrar' : 'Guardar Cambios'}
    </Button>
  </div>

</div>
```

### Campos de un formulario

```tsx
{/* Label */}
<label htmlFor="campo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
  Etiqueta <span aria-hidden="true" className="text-destructive">*</span>
</label>

{/* Input estándar */}
<Field as={Input} id="campo" name="campo" disabled={isPending} />

{/* Campo de solo lectura */}
<div className="flex h-9 items-center px-3 rounded-md border border-input bg-muted/50 text-sm text-foreground">
  Valor fijo
</div>

{/* Textarea */}
<textarea
  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm
    placeholder:text-muted-foreground resize-y
    focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-sm
    disabled:opacity-50"
  rows={4}
/>
```

### Grid para campos relacionados

```tsx
{/* Dos campos en la misma fila */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div>
    <label ...>Campo A</label>
    <Field as={Input} name="campoA" />
  </div>
  <div>
    <label ...>Campo B</label>
    <Field as={Input} name="campoB" />
  </div>
</div>
```

**Reglas de formulario:**
- `max-w-3xl` en el wrapper principal (limita el ancho).
- `space-y-4` entre campos dentro de `CardContent`.
- `space-y-4` entre cards de sección.
- Labels: `mb-1.5` (no `mb-1` ni `mb-2`).
- `min-h-[44px]` **no se usa** en ningún input ni botón de formulario.
- Botón cancelar: `variant="secondary"`. Botón submit: default.

---

## 10. Combobox Popover+Command (catálogos)

Para selección de entidades de catálogo con búsqueda. Patrón extraído de `nueva-sesion-view.tsx`
y aplicado en `formulario-bodega.tsx` para el campo "Consejo".

```tsx
import { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';

// Estado
const [open, setOpen] = useState(false);

// Render
<Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger asChild>
    <Button
      type="button"
      variant="outline"
      role="combobox"
      disabled={isPending || isLoadingCatalogo}
      className="w-full justify-between font-normal"
    >
      {isLoadingCatalogo ? (
        <span className="text-muted-foreground">Cargando…</span>
      ) : selectedLabel ? (
        <span className="truncate">{selectedLabel}</span>
      ) : (
        <span className="text-muted-foreground">Selecciona…</span>
      )}
      <span className="flex items-center gap-0.5 shrink-0 ml-2">
        {selectedValue && (
          <span
            role="button"
            aria-label="Limpiar selección"
            onClick={(e) => { e.stopPropagation(); clearValue(); }}
            className="rounded p-0.5 hover:bg-muted transition-colors"
          >
            <X className="h-3.5 w-3.5 opacity-50 hover:opacity-100" />
          </span>
        )}
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      </span>
    </Button>
  </PopoverTrigger>

  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
    <Command>
      <CommandInput placeholder="Buscar…" />
      <CommandList>
        <CommandEmpty>Sin resultados</CommandEmpty>
        <CommandGroup>
          {items.map((item) => (
            <CommandItem
              key={item.id}
              value={`${item.id} ${item.nombre}`}
              onSelect={() => { selectValue(item.id); setOpen(false); }}
            >
              <Check
                className={`mr-2 h-4 w-4 shrink-0 ${
                  selectedValue === item.id ? 'opacity-100' : 'opacity-0'
                }`}
              />
              {/* Clave abreviada opcional */}
              <span className="text-xs text-muted-foreground w-5 shrink-0 mr-1">
                {item.clave}
              </span>
              <span className="truncate">{item.nombre}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
```

**Reglas:**
- `w-[var(--radix-popover-trigger-width)]` en `PopoverContent` para que el ancho coincida con el trigger.
- Si el campo tiene `useState` para el popover, el componente form debe ser una función React propia
  (no un render prop de Formik directo) para poder llamar hooks. Extraer a `FormularioInner`.
- El botón X de limpiar usa `role="button"` + `e.stopPropagation()` para no cerrar el popover.

---

## 11. Skeletons — convenciones

```tsx
// motion-reduce en TODOS los skeletons
<Skeleton className="h-4 w-32 animate-pulse motion-reduce:animate-none" />

// Skeleton de celda con dos líneas (columna consejo)
<div className="space-y-1.5">
  <Skeleton className="w-44 h-4 animate-pulse motion-reduce:animate-none" />
  <Skeleton className="w-28 h-3 animate-pulse motion-reduce:animate-none" />
</div>

// Skeleton de stats card
<div className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3">
  <Skeleton className="h-8 w-8 rounded-md shrink-0 motion-reduce:animate-none" />
  <div className="space-y-1.5">
    <Skeleton className="h-5 w-10 motion-reduce:animate-none" />
    <Skeleton className="h-3 w-20 motion-reduce:animate-none" />
  </div>
</div>
```

**Regla general:** toda clase `animate-pulse` va acompañada de `motion-reduce:animate-none`.

---

## 12. Empty state con icono circular

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center px-4">
  <div
    className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4"
    aria-hidden="true"
  >
    <Folder className="h-8 w-8 text-muted-foreground" />
  </div>
  <h3 className="text-base font-semibold text-foreground mb-2">Sin registros</h3>
  <p className="text-sm text-muted-foreground max-w-xs">
    No hay datos para los filtros aplicados.
  </p>
</div>
```

---

## 13. Error state con icono circular

```tsx
<div
  className="flex flex-col items-center justify-center py-14 text-center"
  role="alert"
>
  <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
    <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
  </div>
  <h2 className="text-base font-semibold text-foreground mb-1">Error al cargar</h2>
  <p className="text-sm text-muted-foreground mb-5">
    Descripción del error. Intenta nuevamente.
  </p>
  <div className="flex gap-2">
    <Button variant="outline" size="sm" className="gap-1.5" onClick={onBack}>
      <ArrowLeft className="h-4 w-4" /> Volver
    </Button>
    <Button size="sm" onClick={onRetry}>Reintentar</Button>
  </div>
</div>
```

---

## Resumen de diferencias con el skill base

| Aspecto | skill `styling.md` / `components.md` | Este documento |
|---|---|---|
| Typography tokens | `gray-*` directo | `text-foreground` / `text-muted-foreground` + `gray-*` solo en tabla |
| Status badge | `rounded-full` sugerido | `rounded-md px-2 py-0.5` |
| Detail layout | Single column `max-w-3xl` | `lg:grid-cols-12` col-8 + col-4 |
| DataRow | No definido | Stacked label/value `text-xs` + `text-sm` |
| Metadata en header | No definido | `text-xs text-muted-foreground` inline |
| Columna consejo tabla | No definido | `nombre_consejo` bold + tipo subtexto |
| Stats cards | `bg-gradient` grande | Compact `px-4 py-3` sin gradiente, icon `h-4 w-4 rounded-md` |
| Pills de filtro | No definido | `h-8.5 px-3 rounded-md border` con `role="radiogroup"` |
| Combobox catálogo | No definido | Popover + Command + X clear + clave abreviada |
| Espaciado entre secciones | `space-y-5` | `space-y-4` en forms, `space-y-5` en layouts |
| Botones form | No especificado | `variant="secondary"` cancelar, default submit, sin `min-h-[44px]` |
| Skeletons | `animate-pulse` | + `motion-reduce:animate-none` obligatorio |
