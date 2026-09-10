'use client';

import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircleIcon,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react';
import type {
  ILayoutImportacion,
  ILayoutImportacionRenglon,
} from '@/types/material-electoral';
import { formatFechaHora } from '@/lib/fechas';
import { getFirstBackendError } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  IMPORTACION_POR_PAGINA,
  useImportacionLayout,
} from '../_hooks/use-carga-layout';

const numero = (n: number | null) =>
  n === null ? '—' : n.toLocaleString('es-MX');

const COLUMNAS = 8;

function FilasCargando() {
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => (
        <TableRow key={i}>
          {Array.from({ length: COLUMNAS }, (_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

/**
 * Cantidad y paquetes o cajas con que quedó el renglón. En una importación
 * revertida los renglones nuevos ya no existen y los actualizados regresaron a
 * su valor anterior; por eso se muestra lo que la carga dejó y, en los
 * actualizados, de qué valor venía.
 */
function CeldaCantidad({
  renglon,
  campo,
}: {
  renglon: ILayoutImportacionRenglon;
  campo: 'cantidad' | 'paquetes_cajas';
}) {
  const actual = renglon[`${campo}_actual`];
  const anterior = renglon[`${campo}_anterior`];
  const cambio =
    renglon.accion === 'ACTUALIZADO' &&
    anterior !== null &&
    anterior !== actual;

  return (
    <TableCell className="text-end whitespace-nowrap">
      {numero(actual)}
      {cambio && (
        <span className="block text-xs text-muted-foreground">
          antes {numero(anterior)}
        </span>
      )}
    </TableCell>
  );
}

/**
 * Detalle de una importación del layout: los renglones que creó o actualizó,
 * con el código y la descripción del artículo del catálogo, su versión,
 * cantidad y paquetes o cajas. Se consulta por páginas porque una carga puede
 * traer miles de renglones.
 */
export function CargaLayoutImportacionDialog({
  importacion,
  onOpenChange,
}: {
  importacion: ILayoutImportacion | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [pagina, setPagina] = useState(1);
  const abierto = importacion !== null;

  // Cada importación que se abre empieza en la primera página.
  useEffect(() => {
    if (abierto) setPagina(1);
  }, [abierto, importacion?.id]);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useImportacionLayout(importacion?.id ?? null, pagina, abierto);

  const total = data?.total_detalle ?? 0;
  const paginas = Math.max(1, Math.ceil(total / IMPORTACION_POR_PAGINA));
  const desde = total === 0 ? 0 : (pagina - 1) * IMPORTACION_POR_PAGINA + 1;
  const hasta = Math.min(pagina * IMPORTACION_POR_PAGINA, total);
  const revertida = importacion?.estatus === 'REVERTIDA';

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Detalle de la importación</DialogTitle>
          <DialogDescription>
            {importacion && (
              <>
                Archivo{' '}
                <span className="font-medium text-foreground">
                  {importacion.archivo}
                </span>
                , cargado por {importacion.usuario || '—'} el{' '}
                {formatFechaHora(importacion.fecha_registro)}.
                {revertida &&
                  ' Esta carga se revirtió: los renglones nuevos ya no existen y los actualizados regresaron a su valor anterior.'}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-3 min-h-0">
          {importacion && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" appearance="light">
                {numero(importacion.renglones)} renglones
              </Badge>
              <Badge variant="success" appearance="light">
                {numero(importacion.nuevos)} nuevos
              </Badge>
              <Badge variant="info" appearance="light">
                {numero(importacion.actualizados)} actualizados
              </Badge>
              {importacion.omitidos > 0 && (
                <Badge variant="warning" appearance="light">
                  {numero(importacion.omitidos)} omitidos
                </Badge>
              )}
              {revertida && (
                <Badge variant="secondary" appearance="light">
                  Revertida
                </Badge>
              )}
            </div>
          )}

          {isError ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-10 text-center space-y-3">
              <TriangleAlert className="h-8 w-8 text-destructive mx-auto" />
              <p className="text-sm text-destructive">
                {getFirstBackendError(error) ??
                  'No se pudo consultar el detalle de la importación.'}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw />
                Reintentar
              </Button>
            </div>
          ) : (
            <div className="border border-border rounded-lg">
              <ScrollArea className="max-h-[55vh]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[10rem]">Consejo</TableHead>
                      <TableHead>Elección</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead className="min-w-[14rem]">Artículo</TableHead>
                      <TableHead>Versión</TableHead>
                      <TableHead className="text-end">Cantidad</TableHead>
                      <TableHead className="text-end whitespace-nowrap">
                        Paquetes o cajas
                      </TableHead>
                      <TableHead>Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <FilasCargando />
                    ) : (
                      data?.detalle.map((r) => (
                        <TableRow
                          key={r.id_renglon}
                          className={!r.existe ? 'opacity-60' : undefined}
                        >
                          <TableCell>
                            {r.consejo || `Consejo ${r.id_consejo}`}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {r.id_eleccion}
                          </TableCell>
                          <TableCell className="font-medium whitespace-nowrap">
                            {r.codigo}
                          </TableCell>
                          <TableCell
                            className="max-w-[22rem] truncate"
                            title={r.descripcion_articulo}
                          >
                            {r.descripcion_articulo}
                          </TableCell>
                          <TableCell>
                            {r.version_actual ?? r.version_anterior ?? '—'}
                          </TableCell>
                          <CeldaCantidad renglon={r} campo="cantidad" />
                          <CeldaCantidad renglon={r} campo="paquetes_cajas" />
                          <TableCell>
                            {r.accion === 'NUEVO' ? (
                              <Badge variant="success" appearance="light">
                                Nuevo
                              </Badge>
                            ) : (
                              <Badge variant="info" appearance="light">
                                Actualizado
                              </Badge>
                            )}
                            {!r.existe && (
                              <span className="block text-xs text-muted-foreground">
                                Ya no existe
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}

          {!isError && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {isLoading
                  ? 'Consultando los renglones…'
                  : total === 0
                    ? 'Esta importación no tocó ningún renglón.'
                    : `Renglones ${numero(desde)} a ${numero(hasta)} de ${numero(total)}`}
              </p>
              {paginas > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    disabled={pagina <= 1 || isFetching}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft />
                    Anterior
                  </Button>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {isFetching ? (
                      <LoaderCircleIcon className="inline h-3.5 w-3.5 animate-spin" />
                    ) : (
                      `Página ${pagina} de ${paginas}`
                    )}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagina((p) => Math.min(paginas, p + 1))}
                    disabled={pagina >= paginas || isFetching}
                    aria-label="Página siguiente"
                  >
                    Siguiente
                    <ChevronRight />
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
