'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading
} from '@/components/common/toolbar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/auth-provider';
import { useSesionesConsejo } from './sesiones-consejo-data';
import { SesionesConsejoList } from './sesiones-consejo-list';

interface Props {
  type: string;
  idConsejo: string;
}

export function SesionesConsejoPage({ type, idConsejo }: Props) {
  const { user } = useAuth();

  // Capturistas (idRol=1) solo pueden ver su consejo asignado
  const isCapturista = user?.idRol === '1';
  const hasAccess = !isCapturista || (
    type.toUpperCase() === user?.tipoConsejo.toUpperCase() &&
    idConsejo === user?.idConsejo
  );

  const { data, isLoading, isError, refetch } = useSesionesConsejo(type, idConsejo, hasAccess);

  const sessions  = data?.sessions  ?? [];
  const meta      = data?.meta      ?? null;
  const notFound  = data?.notFound  ?? false;

  // Título del consejo: desde el meta real o fallback mientras carga
  const tipoLabel    = type === 'd' ? 'Distrital' : 'Municipal';
  const consejoNombre = meta?.consejo ? `Consejo ${meta.consejo.tipo_consejo_desc}: ${meta.consejo.clave_consejo}. ${meta.consejo.consejo}` : `Consejo ${tipoLabel} ${idConsejo}`;

  if (!hasAccess) {
    return (
      <>
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Sesiones de Consejo</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </ToolbarHeading>
          </Toolbar>
        </Container>
        <Container>
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-12 text-center space-y-3">
            <ShieldOff className="h-10 w-10 text-destructive mx-auto" />
            <p className="text-sm font-medium text-destructive">
              No tienes permiso para acceder a este consejo.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Tu acceso está restringido al consejo que te fue asignado.
            </p>
          </div>
        </Container>
      </>
    );
  }

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-56 animate-pulse motion-reduce:animate-none" />
                <Skeleton className="h-4 w-40 animate-pulse motion-reduce:animate-none" />
              </div>
            ) : (
              <>
               
                <Breadcrumb>
                  <BreadcrumbList>
                    {!isCapturista && (
                      <>
                        <BreadcrumbItem>
                          <BreadcrumbLink asChild>
                            <Link href="/sesiones">Sesiones</Link>
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                      </>
                    )}
                    <BreadcrumbItem>
                      <BreadcrumbPage>{consejoNombre}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </>
            )}
          </ToolbarHeading>
          <ToolbarActions>
            {!isCapturista && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/sesiones">
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </Link>
              </Button>
            )}
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <SesionesConsejoList
          type={type}
          idConsejo={idConsejo}
          sessions={sessions}
          isLoading={isLoading}
          isError={isError}
          notFound={notFound}
          onRetry={refetch}
        />
      </Container>
    </>
  );
}
