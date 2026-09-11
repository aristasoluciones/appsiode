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
import { ActasConsejoContainer } from './actas-consejo-container';

/**
 * Actas circunstanciadas. Misma bifurcación que comprobaciones: el usuario de
 * consejo ve y genera sus actas; el de oficina central verá el tablero por tipo
 * de consejo (tarjeta 44), que se enchufa aquí como la otra rama.
 */
export function ActasClient() {
  const { user, isLoading } = useAuth();

  const tieneConsejo =
    (user?.tipoConsejo === 'D' || user?.tipoConsejo === 'M') &&
    Number(user?.idConsejo) > 0;

  const tipoPlural = user?.tipoConsejo === 'D' ? 'Distritales' : 'Municipales';
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

  if (!tieneConsejo) {
    return (
      <ModuloEnDesarrollo
        titulo="Actas Circunstanciadas"
        seccion="Documentación y Material"
        descripcion="El tablero de actas por consejo para oficina central está en construcción."
      />
    );
  }

  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Actas Circunstanciadas</ToolbarTitle>
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
                <BreadcrumbItem>
                  <span>Actas Circunstanciadas</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <span>{tipoPlural}</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{consejoLabel}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions />
        </Toolbar>
      </Container>

      <Container>
        <ActasConsejoContainer />
      </Container>
    </Fragment>
  );
}
