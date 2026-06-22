'use client';

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
import { VerificacionWizard } from '../../../_components/verificacion-wizard';
import { useBodegaDetalle } from '../../../_hooks/use-bodegas';
import { useAuth } from '@/providers/auth-provider';

interface EditarVerificacionPageProps {
  params: Promise<{ id: string; verificacionId: string }>;
}

export default function EditarVerificacionPage({ params }: EditarVerificacionPageProps) {
  const { id, verificacionId } = use(params);
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canVerificar = hasPermission('bodegas.be.actualizarverificacion');
  const idBodega = Number(id);
  const idVerif = Number(verificacionId);
  const { data: bodegaResult } = useBodegaDetalle(idBodega);
  const meta = bodegaResult?.meta;
  const bodega = bodegaResult?.bodega;

  if (!canVerificar) {
    return (
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Editar Verificación</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Editar Verificación</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
        </Toolbar>
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-12 text-center space-y-3">
          <ShieldOff className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-sm font-medium text-destructive">
            No tienes permiso para editar verificaciones.
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
            <ToolbarTitle>Editar Verificación</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/bodegas">Bodegas Electorales</BreadcrumbLink>
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
                  <BreadcrumbLink href={`/bodegas/${idBodega}/verificaciones`}>Verificaciones</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Verificación #{idVerif}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => router.push(`/bodegas/${idBodega}/verificaciones`)}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Volver
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <VerificacionWizard idBodega={idBodega} idVerificacion={idVerif} modo="editar" />
      </Container>
    </>
  );
}
