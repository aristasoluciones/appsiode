'use client';

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { ShieldCheck, AlertTriangle, LoaderCircle } from 'lucide-react';
import { usePermisosByRol, useTogglePermiso } from './roles-data';
import type { IRol, IAccionCatalogo } from './roles-data';

interface PermisosDialogProps {
  rol: IRol | null;
  open: boolean;
  onOpenChange: (val: boolean) => void;
}

export default function PermisosDialog({ rol, open, onOpenChange }: PermisosDialogProps) {
  const { data, isPending, isError } = usePermisosByRol(rol?.id ?? 0);
  const toggleMutation = useTogglePermiso();

  const permisosSet = useMemo(
    () => new Set((data?.permisos ?? []).map((p) => p.id_accion)),
    [data?.permisos],
  );

  const grouped = useMemo(() => {
    const acciones = data?.acciones?.data?.acciones ?? [];
    const map: Record<string, IAccionCatalogo[]> = {};
    for (const accion of acciones) {
      const key = accion.grupo_adm || accion.grupo || 'General';
      if (!map[key]) map[key] = [];
      map[key].push(accion);
    }
    return map;
  }, [data]);

  const gruposKeys = useMemo(() => Object.keys(grouped), [grouped]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* flex + h-[90vh] → header fijo, cuerpo scrolleable */}
      <DialogContent className="w-full max-w-[95vw] lg:max-w-6xl p-0 gap-0 flex flex-col h-[90vh]">

        {/* ── Header fijo ──────────────────────────────────── */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
            Permisos — {rol?.rol}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Activa o desactiva los permisos asignados a este rol.
          </DialogDescription>
        </DialogHeader>

        {/* ── Cuerpo scrolleable ───────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* Loading */}
          {isPending && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Cargando permisos...</p>
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <AlertTriangle className="h-10 w-10 text-danger mb-3" />
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Error al cargar los permisos
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Verifica la conexión e intenta de nuevo.
              </p>
            </div>
          )}

          {/* Matrix — grupos en columnas CSS (masonry natural) */}
          {!isPending && !isError && data && (
            gruposKeys.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
                Sin permisos disponibles.
              </p>
            ) : (
              <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
                {gruposKeys.map((grupo) => {
                  const acciones = grouped[grupo];
                  const activosCount = acciones.filter((a) => permisosSet.has(a.id)).length;

                  return (
                    <section key={grupo} className="break-inside-avoid mb-6">
                      {/* Separador de grupo */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 shrink-0">
                          {grupo}
                        </span>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                        <span className="text-[11px] tabular-nums text-gray-400 dark:text-gray-500 shrink-0">
                          {activosCount}/{acciones.length}
                        </span>
                      </div>

                      {/* Acciones del grupo */}
                      <div className="space-y-1">
                        {acciones.map((accion) => {
                          const isActive = permisosSet.has(accion.id);
                          return (
                            <div
                              key={accion.id}
                              className={[
                                'flex items-center justify-between gap-3 px-3 py-2 rounded-lg border transition-colors',
                                isActive
                                  ? 'border-primary/40 dark:border-primary/30'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                              ].join(' ')}
                            >
                              <p className="text-sm text-gray-900 dark:text-gray-100 truncate flex-1">
                                {accion.descripcion || accion.accion}
                              </p>
                              <Switch
                                checked={isActive}
                                disabled={toggleMutation.isPending}
                                onCheckedChange={() =>
                                  toggleMutation.mutate({
                                    idRol: rol!.id,
                                    idAccion: accion.id,
                                  })
                                }
                              />
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
