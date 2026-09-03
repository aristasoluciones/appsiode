'use client';

import { Fragment } from 'react';
import { useAuth } from '@/providers/auth-provider';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { Container } from '@/components/common/container';
import { ModuloEnDesarrollo } from '@/components/common/modulo-en-desarrollo';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { ComprobacionesAdminDashboard } from './comprobaciones-admin-dashboard';
import { ComprobacionesContainer } from './comprobaciones-container';

/**
 * Comprobación física. Misma bifurcación que aperturas: sin consejo en la ruta
 * se usa el del usuario autenticado; el usuario de oficina central ve el tablero
 * con el avance de todos los consejos.
 */
export function ComprobacionesClient() {
  const { user, isLoading, hasPermission } = useAuth();

  const tieneConsejo =
    (user?.tipoConsejo === 'D' || user?.tipoConsejo === 'M') &&
    Number(user?.idConsejo) > 0;

  // El consejo propio se anuncia en la ruta de navegación igual que cuando la
  // oficina central abre el detalle de un consejo desde su tablero.
  const tipoPlural = user?.tipoConsejo === 'D' ? 'Distritales' : 'Municipales';
  // Misma etiqueta que el tablero: el número del consejo tal como lo maneja el
  // avance (`id_consejo`) y su nombre.
  const consejoLabel =
    `${Number(user?.idConsejo) || user?.idConsejo}. ${user?.consejo ?? ''}`.trim();

  if (isLoading) {
    return (
      <Container>
        <div className="space-y-4 py-6" aria-hidden="true">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </Container>
    );
  }

  // Oficina central sin el permiso del resumen: no hay tablero que mostrarle.
  if (
    !tieneConsejo &&
    !hasPermission('documentacionymaterial.comprobaciones.resumen')
  ) {
    return (
      <ModuloEnDesarrollo
        titulo="Comprobación Física"
        seccion="Documentación y Material"
        descripcion="Tu cuenta no tiene acceso al seguimiento de la comprobación de los consejos."
      />
    );
  }

  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Comprobación Física</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <span>Documentación y Material</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                {tieneConsejo ? (
                  <>
                    <BreadcrumbItem>
                      <span>Comprobación Física</span>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <span>{tipoPlural}</span>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{consejoLabel}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                ) : (
                  <BreadcrumbItem>
                    <BreadcrumbPage>Comprobación Física</BreadcrumbPage>
                  </BreadcrumbItem>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions />
        </Toolbar>
      </Container>

      <Container>
        {tieneConsejo ? (
          <ComprobacionesContainer />
        ) : (
          <ComprobacionesAdminDashboard />
        )}
      </Container>
    </Fragment>
  );
}
