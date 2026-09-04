'use client';

import { useState } from 'react';
import {
  CircleAlert,
  History,
  LoaderCircleIcon,
  RefreshCw,
  TriangleAlert,
  Undo2,
} from 'lucide-react';
import type { ILayoutImportacion } from '@/types/material-electoral';
import { formatFechaHora } from '@/lib/fechas';
import { getFirstBackendError } from '@/lib/helpers';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { Textarea } from '@/components/ui/textarea';
import {
  useImportacionesLayout,
  useRevertirImportacion,
} from '../_hooks/use-carga-layout';

/** Límites del motivo que exige el API. */
const MOTIVO_MIN = 5;
const MOTIVO_MAX = 500;

const numero = (n: number) => n.toLocaleString('es-MX');

/**
 * Confirmación de la reversión: explica el efecto y pide el motivo. El botón de
 * confirmar no es el `AlertDialogAction` de Radix para que la ventana siga
 * abierta mientras el API responde y pueda mostrar su rechazo tal cual.
 */
function RevertirDialog({
  importacion,
  onOpenChange,
}: {
  importacion: ILayoutImportacion | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const revertirMutation = useRevertirImportacion();

  const motivoLimpio = motivo.trim();
  const motivoValido =
    motivoLimpio.length >= MOTIVO_MIN && motivoLimpio.length <= MOTIVO_MAX;
  const ocupado = revertirMutation.isPending;

  function cerrar(valor: boolean) {
    if (ocupado) return;
    if (!valor) {
      setMotivo('');
      setError(null);
    }
    onOpenChange(valor);
  }

  function confirmar() {
    if (!importacion || !motivoValido) return;
    setError(null);
    revertirMutation.mutate(
      { id: importacion.id, motivo: motivoLimpio },
      {
        onSuccess: () => {
          setMotivo('');
          onOpenChange(false);
        },
        onError: (err) =>
          setError(
            getFirstBackendError(err) ??
              'No se pudo revertir la importación. Intenta nuevamente.',
          ),
      },
    );
  }

  return (
    <AlertDialog open={importacion !== null} onOpenChange={cerrar}>
      <AlertDialogContent
        className="sm:max-w-lg"
        onEscapeKeyDown={(e) => ocupado && e.preventDefault()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Revertir la importación</AlertDialogTitle>
          <AlertDialogDescription>
            {importacion && (
              <>
                Se deshace la carga del archivo{' '}
                <span className="font-medium text-foreground">
                  {importacion.archivo}
                </span>{' '}
                del {formatFechaHora(importacion.fecha_registro)}: se borran los{' '}
                {numero(importacion.nuevos)} documentos que creó y los{' '}
                {numero(importacion.actualizados)} que actualizó vuelven a sus
                valores anteriores. Los consejos dejarán de ver esos renglones
                en su comprobación.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-3">
          {error && (
            <Alert variant="destructive" appearance="light" close={false}>
              <AlertIcon>
                <CircleAlert />
              </AlertIcon>
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="motivo-reversion">Motivo de la reversión</Label>
            <Textarea
              id="motivo-reversion"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              maxLength={MOTIVO_MAX}
              rows={3}
              disabled={ocupado}
              placeholder="Explica por qué se deshace esta carga"
              aria-invalid={motivoLimpio.length > 0 && !motivoValido}
            />
            <p className="text-xs text-muted-foreground">
              Obligatorio, entre {MOTIVO_MIN} y {MOTIVO_MAX} caracteres. Queda
              registrado junto con quién revirtió y cuándo.
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => cerrar(false)}
            disabled={ocupado}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={confirmar}
            disabled={!motivoValido || ocupado}
          >
            {ocupado ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <Undo2 />
            )}
            Revertir
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const COLUMNAS = 8;

function FilasCargando() {
  return (
    <>
      {Array.from({ length: 3 }, (_, i) => (
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
 * Historial de importaciones del layout del proceso y del tipo de consejo
 * elegido. Vive dentro de la ventana de carga como segundo apartado; no tiene
 * pantalla propia.
 *
 * Revertir solo se ofrece en la importación aplicada más reciente (lo decide
 * el API con `reversible`) y a quien tiene el permiso de revertir. Una
 * importación revertida se muestra atenuada, sin acciones, con quién la
 * revirtió, cuándo y el motivo.
 */
export function CargaLayoutHistorial({
  tipoConsejo,
  activo,
  puedeRevertir,
}: {
  tipoConsejo: 'D' | 'M';
  /** Solo se consulta el historial cuando el apartado está a la vista. */
  activo: boolean;
  puedeRevertir: boolean;
}) {
  const {
    data: importaciones,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useImportacionesLayout(tipoConsejo, activo);
  const [aRevertir, setARevertir] = useState<ILayoutImportacion | null>(null);

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-10 text-center space-y-3">
        <TriangleAlert className="h-8 w-8 text-destructive mx-auto" />
        <p className="text-sm text-destructive">
          {getFirstBackendError(error) ??
            'No se pudo consultar el historial de importaciones.'}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw />
          Reintentar
        </Button>
      </div>
    );
  }

  const vacio = !isLoading && (importaciones?.length ?? 0) === 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Cargas de este tipo de consejo en el proceso, de la más reciente a la
          más antigua. Solo se puede revertir la última aplicada.
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="Actualizar el historial"
        >
          <RefreshCw className={isFetching ? 'animate-spin' : undefined} />
          Actualizar
        </Button>
      </div>

      {vacio ? (
        <div className="flex flex-col items-center justify-center gap-2 border border-dashed border-input rounded-lg py-10 text-center">
          <History className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">
            Todavía no hay cargas del layout para este tipo de consejo.
          </p>
          <p className="text-xs text-muted-foreground">
            Cuando se cargue un archivo aparecerá aquí con sus conteos.
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-lg">
          <ScrollArea className="max-h-[50vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[10rem]">Fecha y hora</TableHead>
                  <TableHead className="min-w-[10rem]">Cargó</TableHead>
                  <TableHead className="min-w-[12rem]">Archivo</TableHead>
                  <TableHead className="text-end">Nuevos</TableHead>
                  <TableHead className="text-end">Actualizados</TableHead>
                  <TableHead className="text-end">Omitidos</TableHead>
                  <TableHead className="min-w-[12rem]">Estatus</TableHead>
                  <TableHead className="text-end">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <FilasCargando />
                ) : (
                  importaciones?.map((imp) => {
                    const revertida = imp.estatus === 'REVERTIDA';
                    return (
                      <TableRow
                        key={imp.id}
                        className={revertida ? 'opacity-60' : undefined}
                      >
                        <TableCell className="whitespace-nowrap">
                          {formatFechaHora(imp.fecha_registro)}
                        </TableCell>
                        <TableCell>{imp.usuario || '—'}</TableCell>
                        <TableCell>
                          <span
                            className="font-medium break-all"
                            title={imp.archivo}
                          >
                            {imp.archivo}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {numero(imp.renglones)}{' '}
                            {imp.renglones === 1 ? 'renglón' : 'renglones'}
                          </span>
                        </TableCell>
                        <TableCell className="text-end">
                          {numero(imp.nuevos)}
                        </TableCell>
                        <TableCell className="text-end">
                          {numero(imp.actualizados)}
                        </TableCell>
                        <TableCell className="text-end">
                          {numero(imp.omitidos)}
                        </TableCell>
                        <TableCell>
                          {revertida ? (
                            <div className="flex flex-col gap-1">
                              <Badge variant="secondary" appearance="light">
                                Revertida
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Por {imp.usuario_reversion || '—'} el{' '}
                                {formatFechaHora(imp.fecha_reversion)}
                              </span>
                              {imp.motivo_reversion && (
                                <span className="text-xs text-muted-foreground italic">
                                  «{imp.motivo_reversion}»
                                </span>
                              )}
                            </div>
                          ) : (
                            <Badge variant="success" appearance="light">
                              Aplicada
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-end">
                          {!revertida && imp.reversible && puedeRevertir && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setARevertir(imp)}
                            >
                              <Undo2 />
                              Revertir
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      <RevertirDialog
        importacion={aRevertir}
        onOpenChange={(open) => !open && setARevertir(null)}
      />
    </div>
  );
}
