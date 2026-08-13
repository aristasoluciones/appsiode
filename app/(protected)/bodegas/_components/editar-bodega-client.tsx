'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useBodegaDetalle } from '../_hooks/use-bodegas';
import { FormularioBodega } from './formulario-bodega';

interface EditarBodegaClientProps {
  id: string;
}

export function EditarBodegaClient({ id }: EditarBodegaClientProps) {
  const router = useRouter();
  const { data: result, isLoading, isError, refetch } = useBodegaDetalle(id);
  const bodega = result?.bodega;
  const meta = result?.meta;

  const backHref = useMemo(() => {
    if (!bodega) return '/bodegas';
    if (bodega.tipo === 'Oficina central') return '/bodegas/oficina-central';
    if (bodega.tipo_consejo === 'D') return `/bodegas/consejos/distritales/${bodega.id_consejo}`;
    if (bodega.tipo_consejo === 'M') return `/bodegas/consejos/municipales/${bodega.id_consejo}`;
    return '/bodegas';
  }, [bodega]);

  const consejoHref = useMemo(() => {
    if (!meta?.consejo) return undefined;
    const tipo = meta.consejo.tipo_consejo === 'D' ? 'distritales' : 'municipales';
    return `/bodegas/consejos/${tipo}/${meta.consejo.id}`;
  }, [meta]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Editar Bodega</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink href="/">Inicio</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><span>Bodegas Electorales</span></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbLink href="/bodegas">Bodegas</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Bodega #{id}</BreadcrumbPage></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Editar</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => router.push(backHref)}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Volver
            </Button>
          </ToolbarActions>
        </Toolbar>
        <div className="space-y-3" aria-busy="true" aria-label="Cargando datos">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !bodega) {
    return (
      <div className="space-y-4">
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Editar Bodega</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink href="/">Inicio</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><span>Bodegas Electorales</span></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbLink href="/bodegas">Bodegas</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Bodega #{id}</BreadcrumbPage></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Editar</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => router.push('/bodegas')}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Volver
            </Button>
          </ToolbarActions>
        </Toolbar>

        <div className="flex flex-col items-center justify-center py-12 text-center" role="alert">
          <AlertTriangle className="h-10 w-10 text-destructive mb-3" aria-hidden="true" />
          <h2 className="text-lg font-semibold mb-1">Error al cargar la bodega</h2>
          <p className="text-sm text-muted-foreground mb-4">
            No se pudo obtener los datos para editar. Intenta nuevamente.
          </p>
          <Button onClick={() => refetch()}>
            <Loader2 className="h-4 w-4 mr-1" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Toolbar>
        <ToolbarHeading>
          <ToolbarTitle>Editar Bodega</ToolbarTitle>
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

              {bodega.tipo === 'Consejo' && meta?.consejo && consejoHref && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <span>{meta.consejo.tipo_consejo_desc}</span>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href={consejoHref}>
                      {meta.consejo.clave_consejo}. {meta.consejo.consejo}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}

              {bodega.tipo === 'Oficina central' && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/bodegas/oficina-central">Oficina Central</BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}

              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/bodegas/${id}`}>Bodega #{id}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Editar</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </ToolbarHeading>
        <ToolbarActions>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => router.push(backHref)}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver
          </Button>
        </ToolbarActions>
      </Toolbar>

      <FormularioBodega modo="editar" bodega={bodega} readOnly={bodega.status === 'Determinada'} />
    </div>
  );
}
