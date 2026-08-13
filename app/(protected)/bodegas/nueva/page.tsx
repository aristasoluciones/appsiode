'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { FormularioBodega } from '../_components/formulario-bodega';
import { useAuth } from '@/providers/auth-provider';

export default function NuevaBodegaPage() {
  const { hasPermission, user } = useAuth();
  const canCrear = hasPermission('bodegas.be.registrar');

  // Usuario con consejo asignado (idConsejo > 0)
  const isCapturista = parseInt(user?.idConsejo ?? '0') > 0;
  const backHref = isCapturista && user?.tipoConsejo && user?.idConsejo
    ? `/bodegas/consejos/${user.tipoConsejo.toUpperCase() === 'D' ? 'distritales' : 'municipales'}/${user.idConsejo}`
    : '/bodegas';

  if (!canCrear) {
    return (
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Nueva Bodega</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <span>Bodegas Electorales</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Bodegas</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
        </Toolbar>
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-12 text-center space-y-3">
          <ShieldOff className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-sm font-medium text-destructive">
            No tienes permiso para registrar bodegas.
          </p>
        </div>
      </Container>
    );
  }

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Nueva Bodega</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <span>Bodegas Electorales</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/bodegas">Bodegas</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Nueva Bodega</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions>
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <Link href={backHref}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Volver
              </Link>
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <FormularioBodega modo="crear" />
      </Container>
    </>
  );
}
