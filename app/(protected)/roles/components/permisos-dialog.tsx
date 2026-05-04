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

// ── Tipos internos de jerarquía ───────────────────────────────────────────────

interface SubmoduloGroup {
  key: string;
  titulo: string;
  menuAccion: IAccionCatalogo | null; // acción con es_menu=true → es el permiso padre
  hijos: IAccionCatalogo[];           // acciones con es_menu=false del mismo subgrupo
}

interface ModuloGroup {
  clave: string;
  titulo: string;
  directas: IAccionCatalogo[];  // clave de 2 partes → sin subgrupo
  submodulos: SubmoduloGroup[]; // clave de 3+ partes → agrupadas por 2.ª posición
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function PermisosDialog({ rol, open, onOpenChange }: PermisosDialogProps) {
  const { data, isPending, isError } = usePermisosByRol(rol?.id ?? 0);
  const toggleMutation = useTogglePermiso();

  const permisosSet = useMemo(
    () => new Set(data?.permisos ?? []),
    [data?.permisos],
  );

  // Construye la jerarquía módulo → submodulos / directas
  const moduloGroups = useMemo((): ModuloGroup[] => {
    const acciones = data?.acciones ?? [];
    const modulos  = data?.modulos  ?? [];
    const tituloMap = new Map(modulos.map((m) => [m.clave, m.titulo]));

    const byModulo: Record<string, IAccionCatalogo[]> = {};
    for (const accion of acciones) {
      if (!byModulo[accion.modulo]) byModulo[accion.modulo] = [];
      byModulo[accion.modulo].push(accion);
    }

    return Object.entries(byModulo).map(([clave, accs]) => {
      const directas: IAccionCatalogo[] = [];
      const subMap: Record<string, { menuAccion: IAccionCatalogo | null; hijos: IAccionCatalogo[] }> = {};

      for (const accion of accs) {
        const parts = accion.clave.split('.');
        if (parts.length >= 3) {
          const sub = parts[1];
          if (!subMap[sub]) subMap[sub] = { menuAccion: null, hijos: [] };
          if (accion.es_menu) {
            subMap[sub].menuAccion = accion;
          } else {
            subMap[sub].hijos.push(accion);
          }
        } else {
          directas.push(accion);
        }
      }

      const submodulos: SubmoduloGroup[] = Object.entries(subMap).map(([key, val]) => ({
        key,
        titulo: val.menuAccion?.titulo ?? key,
        menuAccion: val.menuAccion,
        hijos: val.hijos.sort((a, b) => a.orden - b.orden),
      })).sort((a, b) => (a.menuAccion?.orden ?? 0) - (b.menuAccion?.orden ?? 0));

      return {
        clave,
        titulo: tituloMap.get(clave) ?? clave,
        directas: directas.sort((a, b) => a.orden - b.orden),
        submodulos,
      };
    });
  }, [data]);

  // ── Handlers de toggle con cascada ───────────────────────────────────────

  // Activa/desactiva el submodulo completo (menuAccion + todos sus hijos)
  const handleSubmoduloChange = (sub: SubmoduloGroup, isChecked: boolean) => {
    if (!rol) return;
    const ids: number[] = [];
    if (sub.menuAccion) ids.push(sub.menuAccion.id);
    ids.push(...sub.hijos.map((h) => h.id));

    // Snapshot antes de los optimistic updates para comparar correctamente
    const snapshot = new Set(permisosSet);
    for (const id of ids) {
      if (isChecked !== snapshot.has(id)) {
        toggleMutation.mutate({ idRol: rol.id, idAccion: id });
      }
    }
  };

  // Activa/desactiva un hijo; si se activa, también activa el padre (menuAccion)
  const handleHijoChange = (hijo: IAccionCatalogo, sub: SubmoduloGroup) => {
    if (!rol) return;
    const isActive = permisosSet.has(hijo.id);
    toggleMutation.mutate({ idRol: rol.id, idAccion: hijo.id });
    // Ascendente: al activar un hijo, activar el padre si no lo estaba
    if (!isActive && sub.menuAccion && !permisosSet.has(sub.menuAccion.id)) {
      toggleMutation.mutate({ idRol: rol.id, idAccion: sub.menuAccion.id });
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

          {isPending && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Cargando permisos...</p>
            </div>
          )}

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

          {!isPending && !isError && data && (
            moduloGroups.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
                Sin permisos disponibles.
              </p>
            ) : (
              <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
                {moduloGroups.map((modulo) => (
                  <section key={modulo.clave} className="break-inside-avoid mb-6">

                    {/* ── Cabecera de módulo ── */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 shrink-0">
                        {modulo.titulo}
                      </span>
                      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                    </div>

                    <div className="space-y-1">

                      {/* ── Acciones directas (clave de 2 partes) ── */}
                      {modulo.directas.map((accion) => {
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
                              {accion.titulo}
                            </p>
                            <Switch
                              checked={isActive}
                              disabled={toggleMutation.isPending}
                              onCheckedChange={() =>
                                toggleMutation.mutate({ idRol: rol!.id, idAccion: accion.id })
                              }
                            />
                          </div>
                        );
                      })}

                      {/* ── Submodulos (clave de 3+ partes) ── */}
                      {modulo.submodulos.map((sub) => {
                        const parentActive  = sub.menuAccion ? permisosSet.has(sub.menuAccion.id) : false;
                        const activosHijos  = sub.hijos.filter((h) => permisosSet.has(h.id)).length;

                        return (
                          <div
                            key={sub.key}
                            className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                          >
                            {/* Fila del submodulo (permiso padre) */}
                            <div
                              className={[
                                'flex items-center justify-between gap-3 px-3 py-2 transition-colors',
                                parentActive
                                  ? 'bg-primary/5 border-b border-primary/20 dark:border-primary/20'
                                  : 'bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700',
                              ].join(' ')}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {sub.titulo}
                                </p>
                                {sub.hijos.length > 0 && (
                                  <span className="text-[11px] tabular-nums text-gray-400 dark:text-gray-500 shrink-0">
                                    {activosHijos}/{sub.hijos.length}
                                  </span>
                                )}
                              </div>
                              <Switch
                                checked={parentActive}
                                disabled={toggleMutation.isPending}
                                onCheckedChange={(checked) => handleSubmoduloChange(sub, checked)}
                              />
                            </div>

                            {/* Hijos del submodulo */}
                            {sub.hijos.length > 0 && (
                              <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {sub.hijos.map((hijo) => {
                                  const isActive = permisosSet.has(hijo.id);
                                  return (
                                    <div
                                      key={hijo.id}
                                      className={[
                                        'flex items-center justify-between gap-3 pl-6 pr-3 py-2 transition-colors',
                                        isActive
                                          ? 'bg-primary/[.03]'
                                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/30',
                                      ].join(' ')}
                                    >
                                      <p className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                                        {hijo.titulo}
                                      </p>
                                      <Switch
                                        checked={isActive}
                                        disabled={toggleMutation.isPending}
                                        onCheckedChange={() => handleHijoChange(hijo, sub)}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
