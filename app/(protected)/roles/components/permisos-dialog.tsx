'use client';

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ShieldCheck, AlertTriangle, LoaderCircle, ChevronRight, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
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

  // Módulos desplegados — todos cerrados al abrir el diálogo o cambiar de rol
  const [abiertos, setAbiertos] = useState<string[]>([]);
  const [resetKey, setResetKey] = useState(`${rol?.id}-${open}`);
  if (resetKey !== `${rol?.id}-${open}`) {
    setResetKey(`${rol?.id}-${open}`);
    setAbiertos([]);
  }

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

  // Cuenta permisos activos / totales de un módulo
  const contarModulo = (modulo: ModuloGroup) => {
    const ids = [
      ...modulo.directas.map((a) => a.id),
      ...modulo.submodulos.flatMap((s) => [
        ...(s.menuAccion ? [s.menuAccion.id] : []),
        ...s.hijos.map((h) => h.id),
      ]),
    ];
    return { activos: ids.filter((id) => permisosSet.has(id)).length, total: ids.length };
  };

  const todosAbiertos = moduloGroups.length > 0 && abiertos.length === moduloGroups.length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] lg:max-w-4xl p-0 gap-0 flex flex-col h-[90vh]">

        {/* ── Header fijo ──────────────────────────────────── */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
            Permisos — {rol?.rol}
          </DialogTitle>
          <div className="flex items-center justify-between gap-3 mt-0.5">
            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
              Despliega un módulo para activar o desactivar sus permisos.
            </DialogDescription>
            {moduloGroups.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={() => setAbiertos(todosAbiertos ? [] : moduloGroups.map((m) => m.clave))}
              >
                {todosAbiertos
                  ? <><ChevronsDownUp className="h-4 w-4" /> Contraer todo</>
                  : <><ChevronsUpDown className="h-4 w-4" /> Expandir todo</>}
              </Button>
            )}
          </div>
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
              <Accordion type="multiple" variant="outline" value={abiertos} onValueChange={setAbiertos}>
                {moduloGroups.map((modulo) => {
                  const { activos, total } = contarModulo(modulo);
                  return (
                    <AccordionItem key={modulo.clave} value={modulo.clave}>
                      <AccordionTrigger className="py-3 hover:no-underline">
                        <span className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {modulo.titulo}
                          </span>
                          <span
                            className={[
                              'text-[11px] tabular-nums rounded-full px-2 py-0.5 shrink-0',
                              activos > 0
                                ? 'bg-primary/10 text-primary'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
                            ].join(' ')}
                          >
                            {activos}/{total}
                          </span>
                        </span>
                      </AccordionTrigger>

                      <AccordionContent className="pb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-start">

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

                          {/* ── Submodulos (clave de 3+ partes) — acciones plegadas por defecto ── */}
                          {modulo.submodulos.map((sub) => {
                            const parentActive = sub.menuAccion ? permisosSet.has(sub.menuAccion.id) : false;
                            const activosHijos = sub.hijos.filter((h) => permisosSet.has(h.id)).length;

                            return (
                              <Collapsible
                                key={sub.key}
                                className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                              >
                                {/* Fila del submodulo (permiso padre) */}
                                <div
                                  className={[
                                    'flex items-center justify-between gap-2 px-3 py-2 transition-colors',
                                    parentActive ? 'bg-primary/5' : 'bg-gray-50 dark:bg-gray-800/50',
                                  ].join(' ')}
                                >
                                  {sub.hijos.length > 0 ? (
                                    <CollapsibleTrigger className="group flex items-center gap-1.5 flex-1 min-w-0 text-left cursor-pointer">
                                      <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-data-[state=open]:rotate-90" />
                                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {sub.titulo}
                                      </span>
                                      <span className="text-[11px] tabular-nums text-gray-400 dark:text-gray-500 shrink-0">
                                        {activosHijos}/{sub.hijos.length}
                                      </span>
                                    </CollapsibleTrigger>
                                  ) : (
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex-1 pl-5.5">
                                      {sub.titulo}
                                    </p>
                                  )}
                                  <Switch
                                    checked={parentActive}
                                    disabled={toggleMutation.isPending}
                                    onCheckedChange={(checked) => handleSubmoduloChange(sub, checked)}
                                  />
                                </div>

                                {/* Hijos del submodulo */}
                                {sub.hijos.length > 0 && (
                                  <CollapsibleContent>
                                    <div className="divide-y divide-gray-100 dark:divide-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                                      {sub.hijos.map((hijo) => {
                                        const isActive = permisosSet.has(hijo.id);
                                        return (
                                          <div
                                            key={hijo.id}
                                            className={[
                                              'flex items-center justify-between gap-3 pl-9 pr-3 py-2 transition-colors',
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
                                  </CollapsibleContent>
                                )}
                              </Collapsible>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
