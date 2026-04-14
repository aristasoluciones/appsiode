---
name: metronic-nextjs-react-ts-twcss
description: Create new modules for the SIODE project using Metronic Tailwind CSS, Next.js App Router, React Server Components, Shadcn UI, and Lucide React icons. Use when building new features, pages, or modules following the established SIODE conventions with axios-based API integration and BFF proxy pattern.
---

# Metronic Next.js React TypeScript + Tailwind CSS Module Creator

This skill creates production-ready modules for the **SIODE** project using **Next.js App Router**, **Metronic Tailwind CSS** theme, and established patterns.

## Quick Start

When creating a new module you will:
1. Follow the App Router file-system-based routing structure
2. Use Next.js Server Components for pages (`async function Page()`)
3. Use `'use client'` only for interactive components
4. Integrate with the external .NET API via the BFF proxy pattern using axios
5. Define endpoints in `lib/api/endpoints.ts`
6. Configure the menu in `config/menu.config.tsx`
7. Use Metronic theme components, Shadcn UI, and Lucide React icons

## Documentation Structure

### 📁 [Patterns & Structure](./patterns.md)
- App Router directory organization
- Page vs. Client Component split
- Naming conventions
- Module creation checklist

### 🎨 [Components & UI](./components.md)
- Layout components (Container, Toolbar, Breadcrumb)
- Cards, Buttons, Badges, Dialogs
- Data tables with DataGrid
- Forms with Formik + Yup
- Lucide React icons usage

### 🎨 [Styling Conventions](./styling.md)
- Tailwind CSS patterns
- Metronic-specific classes
- Dark mode implementation
- Responsive design breakpoints

### 🔌 [API Integration](./api-integration.md)
- Axios clients and BFF proxy pattern
- Endpoint definitions in `lib/api/endpoints.ts`
- React Query patterns for client components
- Server-side fetching in Server Components

### 🛣️ [Routing & Menu](./routing-menu.md)
- App Router route structure
- `config/menu.config.tsx` menu setup
- Protected routes via `app/(protected)/layout.tsx`
- Breadcrumbs from Shadcn UI

### 📦 [Templates](./templates/)
- `page-template.tsx` — Next.js Server Component page
- `list-component-template.tsx` — Client component for lists/tables
- `data-layer-template.tsx` — React Query hooks with axios
- `form-template.tsx` — Formik + Yup form component
- `table-template.tsx` — DataGrid component

## Tech Stack

### Core
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict)
- **Theme**: Metronic Tailwind CSS v9
- **CSS**: Tailwind CSS v3
- **Components**: Shadcn UI (Radix UI primitives) in `components/ui/`
- **Icons**: Lucide React (`lucide-react`)
- **Layout**: Layout-1 (sidebar + fixed header) via `components/layouts/layout-1/`

### Libraries
- **HTTP Client**: Axios (`lib/api/axios-client.ts`, `lib/api/axios-auth.ts`, `lib/api/server-axios.ts`)
- **Server State**: TanStack React Query (client components only)
- **Forms**: Formik + Yup validation
- **Tables**: TanStack React Table via `DataGrid`
- **Notifications**: Sonner (`toast`)

## Key Architecture Rules

1. **Server vs. Client**: `app/(protected)/[module]/page.tsx` is a Server Component. All interactive UI is extracted into `'use client'` components.
2. **API Layer**:
   - `apiClient` (`lib/api/axios-client.ts`) — browser calls .NET API **directly** (`NEXT_PUBLIC_API_URL`); use in all React Query hooks
   - `authClient` (`lib/api/axios-auth.ts`) — browser calls auth BFF endpoints only (login/logout/refresh)
   - `serverApi` (`lib/api/server-axios.ts`) — server-side Route Handlers call the .NET API (avoid creating new BFF Routes for standard modules)
3. **Endpoints**: Always define new module endpoints in `lib/api/endpoints.ts` under `API_ENDPOINTS` (direct .NET paths). `BFF_ENDPOINTS` is reserved for auth routes only.
4. **Menu**: Add new items to `MENU_SIDEBAR` in `config/layout-1.config.tsx`.
5. **Protected routes**: All pages inside `app/(protected)/` are automatically auth-guarded.

## Quick Reference: Imports

```tsx
// Page (Server Component)
import { Metadata } from 'next';
import { Container } from '@/components/common/container';
import { Toolbar, ToolbarHeading, ToolbarTitle, ToolbarActions } from '@/components/common/toolbar';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Client components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DataGrid } from '@/components/data-grid';
// Icons (named imports — only import what you use)
import { Plus, Pencil, Trash2, Search, Filter, Download,
         Eye, Check, AlertTriangle, Folder, MoreVertical,
         Calendar, Settings, Info, ChevronDown } from 'lucide-react';

// Forms
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

// Data fetching (client components only)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints'; // ← API_ENDPOINTS, NOT BFF_ENDPOINTS

// Notifications
import { toast } from 'sonner';
```

## Workflow

1. **Understand** — What entity, what CRUD operations, what permissions?
2. **Define endpoints** — Add to `lib/api/endpoints.ts` under `API_ENDPOINTS`
3. **Create route** — Add folder `app/(protected)/[module-name]/page.tsx` (Server Component)
4. **Build client component** — `app/(protected)/[module-name]/components/[module]-list.tsx` with `'use client'`
5. **Data layer** — `app/(protected)/[module-name]/components/[module]-data.ts` with React Query hooks
6. **Menu** — Add entry to `MENU_SIDEBAR` in `config/menu.config.tsx`
7. **Finalize** — Responsive, dark mode, loading/error states

## Best Practices

1. **TypeScript First** — Always use TypeScript with interfaces (`I` prefix) and type aliases (`T` prefix)
2. **Server Components First** — Keep pages as Server Components; push `'use client'` to leaf nodes
3. **Endpoint Centralization** — Never hardcode API paths; always use `API_ENDPOINTS` for modules; `BFF_ENDPOINTS` for auth only
4. **Dark Mode** — Always use `dark:` Tailwind classes
5. **Mobile First** — Use responsive Tailwind breakpoints (`md:`, `lg:`)
6. **Handle All States** — Loading skeleton, error with retry, empty state
7. **Icons** — Use `lucide-react` for all icons; import only what is used
8. **Absolute Imports** — Use `@/` alias for all project imports

---

**Reference**: Look at `app/(protected)/sesiones/` for a real-world implementation example.
