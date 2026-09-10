'use client';

import { Fragment } from 'react';
import { ShieldOff } from 'lucide-react';
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
import { useTiposDocumentacion } from '../_hooks/use-carga-layout';
import { ArticulosList } from './articulos-list';

/**
 * Catálogo de artículos de documentación y material. Es trabajo de oficina
 * central: un usuario de consejo con el permiso de ver puede consultarlo, pero
 * las escrituras se ofrecen solo a oficina central, igual que las exige el API.
 */
export function ArticulosClient() {
  const { user, isLoading, hasPermission } = useAuth();
  const { data: tipos } = useTiposDocumentacion(!isLoading);

  const puedeVer = hasPermission('documentacionymaterial.articulos.ver');
  const esOficinaCentral = Number(user?.idConsejo ?? 0) === 0;

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

  if (!puedeVer) {
    return (
      <ModuloEnDesarrollo
        titulo="Artículos"
        seccion="Documentación y Material"
        descripcion="Tu cuenta no tiene acceso al catálogo de artículos."
      />
    );
  }

  const permisos = {
    agregar:
      esOficinaCentral &&
      hasPermission('documentacionymaterial.articulos.agregar'),
    editar:
      esOficinaCentral &&
      hasPermission('documentacionymaterial.articulos.editar'),
    inactivar:
      esOficinaCentral &&
      hasPermission('documentacionymaterial.articulos.inactivar'),
    fotografia:
      esOficinaCentral &&
      hasPermission('documentacionymaterial.articulos.imagen'),
  };

  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Artículos</ToolbarTitle>
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
                  <BreadcrumbPage>Artículos</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions />
        </Toolbar>
      </Container>

      <Container>
        {!esOficinaCentral && (
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <ShieldOff className="h-4 w-4" />
            El catálogo lo administra oficina central; aquí solo se consulta.
          </p>
        )}
        <ArticulosList tipos={tipos ?? []} permisos={permisos} />
      </Container>
    </Fragment>
  );
}
