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
import { useBodegasLista } from '../../../../components/bodegas-data';
import { TablaBodegas } from '../../../../components/tabla-bodegas';

interface BodegasConsejoListaClientProps {
  tipo: 'OC' | 'C';
  tipoConsejo?: string;
  idConsejo?: number;
  tipoConsejoUrl: string;
}

export function BodegasConsejoListaClient({
  tipo,
  tipoConsejo,
  idConsejo,
  tipoConsejoUrl,
}: BodegasConsejoListaClientProps) {
  const { hasPermission } = useAuth();
  const canCrear = hasPermission('bodegas.ver');

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useBodegasLista(tipo, tipoConsejo, idConsejo, true);

  const bodegas = data?.bodegas ?? [];
  const meta = data?.meta ?? null;

  // Construir el nombre del consejo desde el meta real o fallback
  const tipoLabel = tipoConsejo === 'D' ? 'Distrital' : 'Municipal';
  const consejoLabel = meta?.consejo
    ? `${meta.consejo.clave_consejo}. ${meta.consejo.consejo}`
    : `${idConsejo}. ${tipoLabel}`;

  return (
    <div className="space-y-4">
      {/* Toolbar con breadcrumb dinámico */}
      <Toolbar>
        <ToolbarHeading>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/bodegas">Bodegas Electorales</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/bodegas/c/${tipoConsejoUrl}`}>
                  {tipoConsejo === 'D' ? 'Distritales' : 'Municipales'}
                </BreadcrumbLink>
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
          <Link href="/bodegas">
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
