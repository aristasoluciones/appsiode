'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
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
import { useSesionesConsejo } from './sesiones-consejo-data';
import { SesionesConsejoList } from './sesiones-consejo-list';

interface Props {
  type: string;
  idConsejo: string;
}

export function SesionesConsejoPage({ type, idConsejo }: Props) {
  const { data, isLoading, isError, refetch } = useSesionesConsejo(type, idConsejo);

  const sessions  = data?.sessions  ?? [];
  const meta      = data?.meta      ?? null;
  const notFound  = data?.notFound  ?? false;

  // Título del consejo: desde el meta real o fallback mientras carga
  const tipoLabel    = type === 'd' ? 'Distrital' : 'Municipal';
  const consejoNombre = meta?.consejo ? `Consejo ${meta.consejo.tipo_consejo_desc}: ${meta.consejo.clave_consejo}. ${meta.consejo.consejo}` : `Consejo ${tipoLabel} ${idConsejo}`;

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
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link href="/sesiones">Sesiones</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{consejoNombre}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </>
            )}
          </ToolbarHeading>
          <ToolbarActions>
            <Button variant="outline" size="sm" asChild>
              <Link href="/sesiones">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Link>
            </Button>
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
