# Routing & Menu — Next.js App Router

SIODE uses **Next.js App Router** with file-system routing. There is no React Router or manual route config.

## Route Structure

Routes live inside `app/(protected)/` which is auto-protected by `app/(protected)/layout.tsx` (auth guard).

### Adding a New Route

Simply create a directory and a `page.tsx` file:

```
app/
└── (protected)/
    └── sesiones/                   # → /sesiones
        ├── page.tsx
        ├── new/                    # → /sesiones/new
        │   └── page.tsx
        └── [id]/                   # → /sesiones/[id]  (dynamic)
            ├── page.tsx
            └── edit/               # → /sesiones/[id]/edit
                └── page.tsx
```

### Page Component Requirements

```tsx
// app/(protected)/sesiones/page.tsx
import { Metadata } from 'next';

// Required: metadata for <head>
export const metadata: Metadata = {
  title: 'Sesiones',
  description: 'Gestión de sesiones de consejo.',
};

// Required: default export, async Server Component
export default async function Page() {
  return (
    <>
      {/* Toolbar with breadcrumbs */}
      {/* Module content component */}
    </>
  );
}
```

### Dynamic Route Parameters

```tsx
// app/(protected)/sesiones/[id]/page.tsx
import { Metadata } from 'next';

interface PageProps {
  params: { id: string };
}

export const metadata: Metadata = { title: 'Detalle de sesión' };

export default async function Page({ params }: PageProps) {
  const { id } = params;
  // Can do server-side data fetching here with serverApi if needed
  return (
    <>
      <SesionDetail id={id} />
    </>
  );
}
```

### Nested Dynamic Routes (SIODE pattern)

Example from sesiones: `/sesiones/[type]/[id]`

```tsx
// app/(protected)/sesiones/[type]/[id]/page.tsx
interface PageProps {
  params: { type: string; id: string };
}

export default async function Page({ params }: PageProps) {
  const { type, id } = params; // type: 'd' | 'm', id: '01', '124', etc.
  return <SesionDetailClient type={type} id={id} />;
}
```

## Protected Routes

All pages under `app/(protected)/` are automatically protected.

The auth guard in `app/(protected)/layout.tsx` checks `useAuth()` and redirects unauthenticated users to `/signin`.

**No manual wrapping needed.** Just place the page inside `(protected)/`.

## Navigation (Client Components)

```tsx
'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Programmatic navigation
const router = useRouter();
router.push('/sesiones');
router.push(`/sesiones/${id}`);
router.back();

// Declarative link
<Link href="/sesiones" className="text-primary hover:underline">
  Ver sesiones
</Link>

// From Server Components — use Link directly (no useRouter)
import Link from 'next/link';
<Link href={`/sesiones/${id}`}>Ver detalle</Link>
```

## Breadcrumbs (Shadcn UI)

Use the `Breadcrumb` components from Shadcn UI inside the Toolbar:

```tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Two-level breadcrumb
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

// Three-level breadcrumb
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/sesiones">Sesiones</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Detalle</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

## Sidebar Menu Configuration

The sidebar is driven by `config/menu.config.tsx`. Edit **`MENU_SIDEBAR`** to add new items.

### MenuItem Type

```ts
// config/types.ts
interface MenuItem {
  title?: string;     // Display label
  heading?: string;   // Section heading (renders as label, not link)
  icon?: React.ComponentType<{ className?: string }>; // lucide-react component
  path?: string;      // Route path (href)
  children?: MenuItem[];
  disabled?: boolean;
  badge?: {
    dot?: boolean;
    value?: string;
    color?: 'brand' | 'warning' | 'success' | 'danger' | 'info';
  };
}
```

### Adding a Simple Item

```tsx
// config/menu.config.tsx
import { Calendar, PlusCircle } from 'lucide-react';
import { MenuConfig } from '@/config/types';

export const MENU_SIDEBAR: MenuConfig = [
  {
    heading: 'Sesiones de Consejo',
  },
  {
    title: 'Sesiones',
    icon: Calendar,
    path: '/sesiones',
  },
  {
    title: 'Nueva sesión',
    icon: PlusCircle,
    path: '/sesiones/new',
  },
  // ...
];
```

### Adding a Section with Children

```tsx
import { Calendar } from 'lucide-react';

{
  title: 'Sesiones de Consejo',
  icon: Calendar,
  children: [
    {
      title: 'Todas las sesiones',
      path: '/sesiones',
    },
    {
      title: 'Nueva sesión',
      path: '/sesiones/new',
    },
    {
      title: 'Bitácora',
      path: '/bitacora',
    },
  ],
},
```

### Adding a Section Heading

```tsx
import { BookOpen } from 'lucide-react';

{
  heading: 'Bodega Electoral',
},
{
  title: 'Bitácora de Aperturas',
  icon: BookOpen,
  path: '/bitacora',
},
```

### Full Example with Badge and Disabled Item

```tsx
import { Calendar, Users, BookOpen, User } from 'lucide-react';
import { MenuConfig } from '@/config/types';

export const MENU_SIDEBAR: MenuConfig = [
  // --- Section 1 ---
  { heading: 'Sesiones de Consejo' },
  {
    title: 'Sesiones',
    icon: Calendar,
    path: '/sesiones',
  },
  {
    title: 'Integración de Consejos',
    icon: Users,
    path: '/integracion',
    badge: { dot: true, color: 'success' },
  },

  // --- Section 2 ---
  { heading: 'Bodega Electoral' },
  {
    title: 'Bitácora de Aperturas',
    icon: BookOpen,
    path: '/bitacora',
    disabled: true,  // shows as greyed out
  },

  // --- Section 3 ---
  { heading: 'Administración' },
  {
    title: 'Usuarios',
    icon: User,
    path: '/usuarios',
    badge: { value: '3', color: 'danger' },
  },
];
```

## Loading UI (Automatic Suspense)

Create `loading.tsx` next to `page.tsx` to show a loading state while the Server Component renders:

```tsx
// app/(protected)/sesiones/loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );
}
```

---

**Remember:** Routes are filesystem based — just create the folder and `page.tsx`. Update `MENU_SIDEBAR` in `config/menu.config.tsx` to make the route appear in the sidebar.
