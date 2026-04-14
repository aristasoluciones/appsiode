# Styling Conventions

This document covers Tailwind CSS patterns, Metronic-specific classes, dark mode, and responsive design for SIODE modules. The content is identical to the base Metronic conventions — see the parent `metronic-module` skill for the full reference.

## Tailwind CSS Patterns

### Layout Utilities

```tsx
// Horizontal flex
<div className="flex items-center justify-between gap-4">
  <span>Left</span>
  <span>Right</span>
</div>

// Vertical stack
<div className="flex flex-col gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
  <div>Col 1</div>
  <div>Col 2</div>
  <div>Col 3</div>
</div>

// 12-col grid
<div className="grid grid-cols-12 gap-5">
  <div className="col-span-12 lg:col-span-8">Main</div>
  <div className="col-span-12 lg:col-span-4">Sidebar</div>
</div>
```

### Spacing

```tsx
<div className="space-y-5">        {/* vertical child spacing */}
<div className="p-5">              {/* all-side padding */}
<div className="px-6 py-4">       {/* horizontal / vertical padding */}
<div className="mt-4 mb-6">       {/* top / bottom margin */}
<div className="mx-auto">         {/* center horizontally */}
```

### Typography

```tsx
<h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Heading</h1>
<h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Sub-heading</h2>
<h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Section</h3>
<p  className="text-base text-gray-700 dark:text-gray-300">Body text</p>
<p  className="text-sm text-gray-500 dark:text-gray-400">Small / secondary text</p>
<p  className="text-xs text-gray-400 dark:text-gray-500">Caption / label</p>
```

### Color System

```tsx
// Contextual colors (use these consistently)
<div className="text-primary bg-primary/10">Primary</div>
<div className="text-success bg-success/10">Success / active</div>
<div className="text-danger bg-danger/10">Danger / error</div>
<div className="text-warning bg-warning/10">Warning</div>
<div className="text-info bg-info/10">Info</div>

// Borders
<div className="border border-gray-200 dark:border-gray-700">Default border</div>
<div className="border-2 border-primary">Accent border</div>

// Backgrounds
<div className="bg-white dark:bg-gray-800">Card background</div>
<div className="bg-gray-50 dark:bg-gray-900">Page background</div>
<div className="bg-gray-100 dark:bg-gray-800">Section background</div>
```

## Dark Mode

**Always** include `dark:` variants for all color-related classes.

```tsx
// Text
<p className="text-gray-900 dark:text-gray-100">Primary text</p>
<p className="text-gray-600 dark:text-gray-400">Secondary text</p>
<p className="text-gray-400 dark:text-gray-500">Muted text</p>

// Background
<div className="bg-white dark:bg-gray-800">Card</div>
<div className="bg-gray-50 dark:bg-gray-900">Page</div>

// Border
<div className="border-gray-200 dark:border-gray-700">Divider</div>

// Hover
<button className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700">
  Hover me
</button>
```

### Complete Dark Mode Card

```tsx
<Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
  <CardHeader className="border-b border-gray-200 dark:border-gray-700">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
      Título
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400">
      Descripción
    </p>
  </CardHeader>
  <CardBody>
    <p className="text-gray-700 dark:text-gray-300">Contenido</p>
  </CardBody>
</Card>
```

## Responsive Design (Mobile-First)

| Prefix | Min Width | Device |
|--------|-----------|--------|
| (none) | 0px | Mobile |
| `sm:` | 640px | Large mobile |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Laptop |
| `xl:` | 1280px | Desktop |

```tsx
// Stack on mobile, row on tablet+
<div className="flex flex-col md:flex-row gap-4">
  <div className="w-full md:w-1/2">Left</div>
  <div className="w-full md:w-1/2">Right</div>
</div>

// Responsive visibility
<div className="hidden lg:block">Solo escritorio</div>
<div className="block lg:hidden">Solo móvil</div>

// Responsive padding
<div className="p-4 md:p-6 lg:p-8">Adaptable</div>
```

## Borders & Radius

```tsx
<div className="rounded">sm (0.25rem)</div>
<div className="rounded-md">md (0.375rem)</div>
<div className="rounded-lg">lg (0.5rem)</div>
<div className="rounded-xl">xl (0.75rem)</div>
<div className="rounded-full">pill / circle</div>
```

## Shadows

```tsx
<div className="shadow-sm">Subtle</div>
<div className="shadow">Default</div>
<div className="shadow-md">Medium</div>
<div className="shadow-lg">Large</div>
```

## Common Patterns

### Loading State

```tsx
<div className="flex flex-col items-center justify-center py-12">
  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3" />
  <p className="text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
</div>

// Skeleton rows
<div className="space-y-3">
  {[...Array(5)].map((_, i) => (
    <div key={i} className="animate-pulse h-14 bg-gray-100 dark:bg-gray-800 rounded-lg" />
  ))}
</div>
```

### Empty State

```tsx
<div className="flex flex-col items-center justify-center py-14 text-center">
  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
    <Folder className="h-8 w-8 text-gray-400" />
  </div>
  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
    Sin registros
  </h3>
  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
    Comienza creando el primer elemento.
  </p>
  <Button variant="primary">
    <Plus className="h-4 w-4" />
    Crear nuevo
  </Button>
</div>
```

### Error State

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <AlertTriangle className="h-10 w-10 text-danger mb-3" />
  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
    Error al cargar
  </h3>
  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
    {error?.message}
  </p>
  <Button variant="primary" onClick={() => refetch()}>
    Reintentar
  </Button>
</div>
```

### Form Layout

```tsx
<div className="space-y-5">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        Campo A
      </label>
      <Input />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        Campo B
      </label>
      <Input />
    </div>
  </div>

  <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
    <Button variant="light">Cancelar</Button>
    <Button variant="primary" type="submit">Guardar</Button>
  </div>
</div>
```

## Metronic CSS Classes (when Shadcn is insufficient)

```tsx
/* Buttons */
<button className="btn btn-primary btn-sm">Primary</button>
<button className="btn btn-light">Light</button>
<button className="btn btn-danger">Danger</button>

/* Form */
<select className="form-select w-full" />
<textarea className="form-textarea w-full" />

/* Cards */
<div className="card">
  <div className="card-header"><span className="card-title">Title</span></div>
  <div className="card-body">Content</div>
</div>

/* Alerts */
<div className="alert alert-success"><div className="alert-text">Éxito</div></div>
<div className="alert alert-danger"><div className="alert-text">Error</div></div>
```

**Prefer Shadcn UI** components over raw Metronic CSS classes whenever possible.

---

**Best Practices:**
1. Mobile-first: design for mobile, then add `md:` / `lg:` variants
2. Always include `dark:` pairs for all color classes
3. Use Tailwind spacing scale (1, 2, 3, 4, 5, 6, 8, 10, 12…)
4. Use semantic colors (`success`, `danger`, `warning`, `info`, `primary`)
5. Extract repeated class groups into components, not magic strings
