'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use } from 'react';
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
import { VerificacionesList } from '../../_components/verificaciones-list';
import { useBodegaDetalle } from '../../_hooks/use-bodegas';
import { useAuth } from '@/providers/auth-provider';

interface VerificacionesPageProps {
  params: Promise<{ id: string }>;
}

export default function VerificacionesPage({ params }: VerificacionesPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canVer = hasPermission('bodegas.be.verificaciones');
  const idBodega = Number(id);
  const { data: bodegaResult } = useBodegaDetalle(idBodega);
  const meta = bodegaResult?.meta;
  const bodega = bodegaResult?.bodega;

  if (!canVer) {
    return (
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Verificaciones</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Verificaciones</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
        </Toolbar>
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-12 text-center space-y-3">
          <ShieldOff className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-sm font-medium text-destructive">
            No tienes permiso para ver verificaciones.
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
            <ToolbarTitle>Verificaciones de Bodega</ToolbarTitle>
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

                {bodega?.tipo === 'Consejo' && meta?.consejo && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        href={`/bodegas/consejos/${meta.consejo.tipo_consejo === 'D' ? 'distritales' : 'municipales'}`}
                      >
                        {meta.consejo.tipo_consejo_desc}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        href={`/bodegas/consejos/${meta.consejo.tipo_consejo === 'D' ? 'distritales' : 'municipales'}/${meta.consejo.id}`}
                      >
                        {meta.consejo.clave_consejo}. {meta.consejo.consejo}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </>
                )}

                {bodega?.tipo === 'Oficina central' && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/bodegas/oficina-central">Oficina Central</BreadcrumbLink>
                    </BreadcrumbItem>
                  </>
                )}

                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Verificaciones</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => router.push(`/bodegas/${idBodega}`)}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Volver
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <VerificacionesList idBodega={idBodega} bodegaStatus={bodega?.status} />
      </Container>
    </>
  );
}
