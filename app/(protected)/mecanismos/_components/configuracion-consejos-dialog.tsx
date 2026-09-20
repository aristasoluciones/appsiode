'use client';

import { useMemo, useState } from 'react';
import { Loader2, RotateCcw, Search } from 'lucide-react';
import type { IMecanismoConfiguracion } from '@/types/mecanismos';
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
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { ErrorState } from '@/components/common/error-state';
import { EstadoVacio } from '@/components/common/estado-vacio';
import {
  useConfiguracionConsejos,
  useGuardarConfiguracionConsejo,
} from '../_hooks/use-mecanismos-config';

interface ConfiguracionConsejosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipoConsejo: 'D' | 'M';
}

/**
 * Banderas de captura por consejo: si captura el costo cotizado de la cédula y
 * si asigna CAE al mecanismo. Cada interruptor guarda al momento; «Por omisión»
 * regresa al valor del tipo (municipal sí, distrital no).
 */
export function ConfiguracionConsejosDialog({
  open,
  onOpenChange,
  tipoConsejo,
}: ConfiguracionConsejosDialogProps) {
  const { data, isLoading, isError, refetch } = useConfiguracionConsejos(
    tipoConsejo,
    open,
  );
  const guardar = useGuardarConfiguracionConsejo();
  const [busqueda, setBusqueda] = useState('');

  const consejos = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter(
      (c) =>
        c.consejo.toLowerCase().includes(q) || String(c.id_consejo).includes(q),
    );
  }, [data, busqueda]);

  const pendiente = guardar.isPending ? guardar.variables?.idConsejo : null;

  function cambiar(
    c: IMecanismoConfiguracion,
    cambio: Partial<{ captura_costo: boolean; asigna_cae: boolean }>,
  ) {
    guardar.mutate({
      tipoConsejo,
      idConsejo: c.id_consejo,
      payload: {
        captura_costo: cambio.captura_costo ?? c.captura_costo,
        asigna_cae: cambio.asigna_cae ?? c.asigna_cae,
      },
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !guardar.isPending && onOpenChange(v)}
    >
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Configuración de captura ·{' '}
            {tipoConsejo === 'D'
              ? 'consejos distritales'
              : 'consejos municipales'}
          </DialogTitle>
          <DialogDescription>
            Define para cada consejo si captura el costo cotizado de la cédula y
            si asigna CAE a sus mecanismos. Sin configuración rige el valor por
            omisión del tipo: los municipales sí, los distritales no.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3">
          <div className="relative w-full sm:w-72">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar consejo..."
              className="pl-9"
              aria-label="Buscar consejo"
              disabled={isLoading}
            />
          </div>

          {isError ? (
            <ErrorState
              title="No se pudo cargar la configuración."
              onRetry={() => refetch()}
            />
          ) : isLoading ? (
            <div className="space-y-2" aria-busy="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : consejos.length === 0 ? (
            <EstadoVacio
              titulo={
                busqueda ? 'Ningún consejo coincide' : 'Sin consejos activos'
              }
              busqueda={!!busqueda}
              onLimpiar={() => setBusqueda('')}
            />
          ) : (
            <div className="max-h-[55vh] overflow-auto rounded-md border border-border divide-y divide-border">
              <div className="grid grid-cols-[1fr_8rem_8rem_7rem] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/40 sticky top-0">
                <span>Consejo</span>
                <span className="text-center">Captura costo</span>
                <span className="text-center">Asigna CAE</span>
                <span />
              </div>
              {consejos.map((c) => {
                const ocupado = pendiente === c.id_consejo;
                return (
                  <div
                    key={c.id_consejo}
                    className="grid grid-cols-[1fr_8rem_8rem_7rem] gap-2 items-center px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {c.id_consejo}. {c.consejo}
                      </p>
                      {c.por_omision && (
                        <Badge variant="secondary" appearance="light" size="sm">
                          Por omisión
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={c.captura_costo}
                        onCheckedChange={(v) =>
                          cambiar(c, { captura_costo: v })
                        }
                        disabled={guardar.isPending}
                        aria-label={`${c.consejo}: captura costo`}
                      />
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={c.asigna_cae}
                        onCheckedChange={(v) => cambiar(c, { asigna_cae: v })}
                        disabled={guardar.isPending}
                        aria-label={`${c.consejo}: asigna CAE`}
                      />
                    </div>
                    <div className="flex justify-end">
                      {ocupado ? (
                        <Loader2
                          className="h-4 w-4 animate-spin text-muted-foreground"
                          aria-hidden="true"
                        />
                      ) : (
                        !c.por_omision && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            disabled={guardar.isPending}
                            onClick={() =>
                              guardar.mutate({
                                tipoConsejo,
                                idConsejo: c.id_consejo,
                                payload: {
                                  captura_costo: null,
                                  asigna_cae: null,
                                },
                              })
                            }
                          >
                            <RotateCcw
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            Por omisión
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={guardar.isPending}
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
