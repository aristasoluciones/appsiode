'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import type { ICae } from '@/types/mecanismos';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ErrorState } from '@/components/common/error-state';
import { EstadoVacio } from '@/components/common/estado-vacio';
import { useCaes } from '../_hooks/use-caes';

interface CaesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipoConsejo: 'D' | 'M';
  idConsejo: number;
  /** Con esta función la ventana sirve para elegir un CAE activo (informe del mecanismo). */
  onSeleccionar?: (cae: ICae) => void;
  /** Folio ya asignado, para marcarlo al elegir. */
  folioActual?: string | null;
}

/**
 * Catálogo de CAE del consejo, de solo consulta: se lee de la tabla semilla o
 * del sistema que administra a los CAE; no se captura a mano. Con
 * `onSeleccionar` funciona como selector de CAE activos.
 */
export function CaesDialog({
  open,
  onOpenChange,
  tipoConsejo,
  idConsejo,
  onSeleccionar,
  folioActual,
}: CaesDialogProps) {
  const selector = !!onSeleccionar;
  const [busqueda, setBusqueda] = useState('');
  const [verInactivos, setVerInactivos] = useState(false);

  const { data, isLoading, isError, refetch } = useCaes(
    { tipoConsejo, idConsejo, incluirInactivos: !selector && verInactivos },
    open,
  );

  useEffect(() => {
    if (open) setBusqueda('');
  }, [open]);

  const caes = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const lista = (data?.caes ?? []).filter((c) => !selector || c.activo);
    if (!q) return lista;
    return lista.filter(
      (c) =>
        c.folio.toLowerCase().includes(q) ||
        c.nombre_completo.toLowerCase().includes(q) ||
        c.categoria.toLowerCase().includes(q),
    );
  }, [data, busqueda, selector]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {selector ? 'Elegir el CAE del mecanismo' : 'Catálogo de CAE'}
          </DialogTitle>
          <DialogDescription>
            {selector
              ? 'Solo se muestran los CAE activos del consejo. Al elegir uno, su folio y nombre quedan congelados en el mecanismo.'
              : 'Capacitadores asistentes electorales del consejo y cuántos mecanismos atiende cada uno. El catálogo no se captura aquí: lo carga oficina central o viene del sistema que administra a los CAE.'}
            {data?.fuente === 'API' && ' Fuente: sistema externo.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <Input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por folio, nombre o categoría..."
                className="pl-9 pr-9"
                aria-label="Buscar CAE"
                disabled={isLoading}
              />
              {busqueda && (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  onClick={() => setBusqueda('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-muted"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            {!selector && (
              <Label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={verInactivos}
                  onCheckedChange={(v) => setVerInactivos(v === true)}
                />
                Ver inactivos
              </Label>
            )}
            <span className="text-xs text-muted-foreground sm:ml-auto">
              {caes.length} {caes.length === 1 ? 'CAE' : 'CAE'}
            </span>
          </div>

          {isError ? (
            <ErrorState
              title="No se pudo cargar el catálogo de CAE."
              onRetry={() => refetch()}
            />
          ) : isLoading ? (
            <div className="space-y-2" aria-busy="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : caes.length === 0 ? (
            <EstadoVacio
              titulo={
                busqueda ? 'Ningún CAE coincide' : 'Sin CAE en el catálogo'
              }
              descripcion={
                busqueda
                  ? 'Prueba con otro folio o nombre.'
                  : 'Oficina central todavía no carga el listado de CAE de este consejo.'
              }
              busqueda={!!busqueda}
              onLimpiar={() => setBusqueda('')}
            />
          ) : (
            <div className="max-h-[50vh] overflow-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Folio</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="w-24">Categoría</TableHead>
                    <TableHead className="w-28 text-center">
                      Mecanismos
                    </TableHead>
                    {!selector && (
                      <TableHead className="w-24">Estatus</TableHead>
                    )}
                    {selector && <TableHead className="w-28" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {caes.map((c) => {
                    const actual = folioActual === c.folio;
                    return (
                      <TableRow
                        key={c.folio}
                        className={c.activo ? '' : 'opacity-60'}
                      >
                        <TableCell className="font-medium tabular-nums">
                          {c.folio}
                        </TableCell>
                        <TableCell>{c.nombre_completo}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            appearance="light"
                            size="sm"
                          >
                            {c.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          {c.mecanismos_asignados}
                        </TableCell>
                        {!selector && (
                          <TableCell>
                            <Badge
                              variant={c.activo ? 'success' : 'destructive'}
                              appearance="light"
                              size="sm"
                            >
                              {c.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                        )}
                        {selector && (
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant={actual ? 'secondary' : 'outline'}
                              disabled={actual}
                              onClick={() => onSeleccionar!(c)}
                            >
                              {actual && (
                                <Check className="h-4 w-4" aria-hidden="true" />
                              )}
                              {actual ? 'Asignado' : 'Elegir'}
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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
