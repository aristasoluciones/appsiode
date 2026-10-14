import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Container } from '@/components/common/container';

/** Esqueleto del módulo mientras carga la ruta: encabezado, filtros y renglones de la lista. */
export default function MecanismosLoading() {
  return (
    <>
      <Container>
        <div className="flex items-center justify-between flex-wrap gap-2.5 pb-5">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
      </Container>

      <Container>
        <div className="space-y-4" aria-busy="true" aria-label="Cargando">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-28 rounded-md" />
            ))}
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-9 w-72" />
              <Skeleton className="h-9 w-32" />
            </CardHeader>
            <div className="p-5 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/5" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-6 w-24 ms-auto rounded-md" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Container>
    </>
  );
}
