'use client';

import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { useAuth } from '@/providers/auth-provider';
import { useBodegasLista } from '../_hooks/use-bodegas';
import { TablaBodegas } from './tabla-bodegas';
import { ShieldOff } from 'lucide-react';

interface BodegasListaClientProps {
  tipo: 'OC' | 'C';
  tipoConsejo?: string;
  idConsejo?: number;
}

export function BodegasListaClient({
  tipo,
  tipoConsejo,
  idConsejo,
}: BodegasListaClientProps) {
  const { user, hasPermission } = useAuth();
  const canCrear = hasPermission('bodegas.be.registrar');

  // Usuario con consejo asignado (idConsejo > 0) solo puede ver su consejo
  const isCapturista = parseInt(user?.idConsejo ?? '0') > 0;
  const hasAccess = !isCapturista || (
    tipoConsejo?.toUpperCase() === user?.tipoConsejo.toUpperCase() &&
    idConsejo === Number(user?.idConsejo)
  );

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useBodegasLista(tipo, tipoConsejo, idConsejo, hasAccess);

  const bodegas = data?.bodegas ?? [];
  const meta = data?.meta ?? null;

  // Labels para breadcrumb y título
  const isOC = tipo === 'OC';
  const tipoLabel = tipoConsejo === 'D' ? 'Distrital' : 'Municipal';
  const tipoPlural = tipoConsejo === 'D' ? 'Distritales' : 'Municipales';
  const consejoLabel = meta?.consejo
    ? `${meta.consejo.clave_consejo}. ${meta.consejo.consejo}`
    : `${idConsejo}. ${tipoLabel}`;
  const pageTitle = isOC ? 'Oficina Central' : consejoLabel;

  if (!hasAccess) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-12 text-center space-y-3">
          <ShieldOff className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-sm font-medium text-destructive">
            No tienes permiso para acceder a este consejo.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Tu acceso está restringido al consejo que te fue asignado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar con breadcrumb */}
      <Toolbar>
        <ToolbarHeading>
          {isOC ? (
            <ToolbarTitle>Oficina Central</ToolbarTitle>
          ) : (
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
                  <span>{tipoPlural}</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{consejoLabel}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          )}
          {isOC && (
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
                  <BreadcrumbPage>Oficina Central</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </ToolbarHeading>
        <ToolbarActions />
      </Toolbar>

      {/* Header: nueva + volver */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex items-center gap-2">
          {canCrear && (
            <Button
              variant="primary"
              size="sm"
              className="gap-1.5"
              asChild
            >
              <Link href="/bodegas/nueva">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nueva Bodega
              </Link>
            </Button>
          )}
        </div>

        <Button variant="outline" size="sm" className="gap-1.5 self-start sm:self-auto" asChild>
          <Link href={isCapturista ? `/bodegas/consejos/${tipoConsejo === 'D' ? 'distritales' : 'municipales'}/${idConsejo}` : '/bodegas'}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver
          </Link>
        </Button>
      </div>

      {/* Tabla */}
      <TablaBodegas
        data={bodegas ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        tipo={tipo}
        tipoConsejo={tipoConsejo}
      />
    </div>
  );
}
