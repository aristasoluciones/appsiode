// ============================================================
// TEMPLATE: app/(protected)/[module-name]/page.tsx
// Next.js Server Component — page entry point
//
// Replace all [Bracketed] placeholders before use:
//   [ModuleName]    → e.g. Sesiones, Bitacora, Integracion
//   [module-name]   → e.g. sesiones, bitacora, integracion
//   [module]        → e.g. sesion, bitacora (singular kebab)
//   [section-title] → e.g. Sesiones de Consejo
// ============================================================

import { Metadata } from 'next';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import [ModuleName]List from './components/[module-name]-list';

export const metadata: Metadata = {
  title: '[ModuleName]',
  description: 'Gestión de [module-name].',
};

export default async function Page() {
  return (
    <>
      {/* ── Page Header ─────────────────────────────────────── */}
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>[ModuleName]</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>[section-title]</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions />
        </Toolbar>
      </Container>

      {/* ── Module Content (Client Component) ───────────────── */}
      <Container>
        <[ModuleName]List />
      </Container>
    </>
  );
}
