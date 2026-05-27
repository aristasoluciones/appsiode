'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBodegaDetalle } from '../../../components/bodegas-data';
import { FormularioBodega } from '../../../nueva/components/formulario-bodega';

interface EditarBodegaClientProps {
  id: string;
}

export function EditarBodegaClient({ id }: EditarBodegaClientProps) {
  const { data: bodega, isLoading, isError, refetch } = useBodegaDetalle(id);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl" aria-busy="true" aria-label="Cargando datos">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !bodega) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 text-center"
        role="alert"
      >
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
    );
  }

  return <FormularioBodega modo="editar" bodega={bodega} />;
}
