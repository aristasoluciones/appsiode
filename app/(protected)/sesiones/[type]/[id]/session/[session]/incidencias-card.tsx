'use client';

import { useState } from 'react';
import { ChevronDown, Loader2, Plus, SearchX, Trash2, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  useCatalogoIncidencias,
  useIncidenciasSesion,
  useCrearIncidencia,
  useGuardarSeguimiento,
  useEliminarIncidencia,
  type IIncidencia,
  type ISeguimiento,
} from './incidencias-data';

// ─── Props ────────────────────────────────────────────────────────────────────

interface IncidenciasCardProps {
  idSesion: string;
  /** Si la sesión está concluida se oculta el alta de nuevas incidencias */
  readonly?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function formatFechaHora(iso: string): string {
  if (!iso) return '—';
  // Trunca microsegundos a milisegundos (JS Date solo soporta 3 decimales)
  const d = new Date(iso.replace(/(\.\d{3})\d+/, '$1'));
  if (Number.isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const mes = MESES[d.getMonth()];
  const year = d.getFullYear();
  const hh  = String(d.getHours()).padStart(2, '0');
  const mm  = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${mes} ${year}, ${hh}:${mm}`;
}

function EstatusChip({ status }: { status: 'ABIERTA' | 'CERRADA' }) {
  if (status === 'CERRADA') {
    return (
      <Badge variant="success" appearance="light" size="sm">
        Cerrada
      </Badge>
    );
  }
  return (
    <Badge variant="warning" appearance="light" size="sm">
      Abierta
    </Badge>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function IncidenciasCard({ idSesion, readonly = false }: IncidenciasCardProps) {
  const { data: incidencias = [], isLoading } = useIncidenciasSesion(idSesion);
  const [showForm, setShowForm] = useState(false);

  const handleToggleForm = () => setShowForm((v) => !v);
  const handleFormSuccess = () => setShowForm(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CardTitle>Incidencias</CardTitle>
          {incidencias.length > 0 && (
            <Badge variant="secondary" appearance="light" size="sm">
              {incidencias.length}
            </Badge>
          )}
        </div>
        {!readonly && (
          <Button
            size="sm"
            variant={showForm ? 'outline' : 'primary'}
            onClick={handleToggleForm}
          >
            {showForm ? (
              <>
                <X className="h-4 w-4" />
                Cancelar
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Nueva
              </>
            )}
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {/* ── Formulario inline ─── */}
        {showForm && (
          <NuevaIncidenciaInline idSesion={idSesion} onSuccess={handleFormSuccess} />
        )}

        {/* ── Lista ─── */}
        {isLoading ? (
          <div className="flex flex-col gap-3 p-5">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg animate-pulse" />
            ))}
          </div>
        ) : incidencias.length === 0 ? (
          <EmptyIncidencias />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Estatus
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    Fecha / Hora
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Periodo
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Incidencia
                  </th>
                  <th className="px-4 py-2.5 w-0" />
                  <th className="px-4 py-2.5 w-0" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {incidencias.map((inc) => (
                  <IncidenciaRow
                    key={`${inc.id}-${inc.id_sesion}`}
                    incidencia={inc}
                    idSesion={idSesion}
                    readonly={readonly}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Formulario inline nueva incidencia ───────────────────────────────────────

function NuevaIncidenciaInline({
  idSesion,
  onSuccess,
}: {
  idSesion: string;
  onSuccess: () => void;
}) {
  const { data: catalogo = {}, isLoading: loadingCatalogo } = useCatalogoIncidencias();
  const { mutate: crear, isPending: creando } = useCrearIncidencia(idSesion);

  const [periodoSel, setPeriodoSel] = useState('');
  const [idCatalogoSel, setIdCatalogoSel] = useState('');

  const periodos = Object.keys(catalogo).sort();
  const incidenciasDePeriodo = periodoSel
    ? [...(catalogo[periodoSel] ?? [])].sort((a, b) => a.incidencia.localeCompare(b.incidencia, 'es', { numeric: true }))
    : [];

  const handlePeriodoChange = (value: string) => {
    setPeriodoSel(value);
    setIdCatalogoSel('');
  };

  const incidenciaSelObj = incidenciasDePeriodo.find((i) => String(i.id) === idCatalogoSel);

  const handleSubmit = () => {
    if (!periodoSel || !idCatalogoSel || !incidenciaSelObj) return;
    crear(
      {
        id_catalogo: Number(idCatalogoSel),
        periodo: periodoSel,
        incidencia: incidenciaSelObj.incidencia,
      },
      { onSuccess },
    );
  };

  return (
    <div className="border-b border-border bg-muted/20 px-5 py-4">
      {loadingCatalogo ? (
        <div className="flex gap-3">
          <Skeleton className="h-9 w-40 animate-pulse" />
          <Skeleton className="h-9 w-64 animate-pulse" />
          <Skeleton className="h-9 w-24 animate-pulse" />
        </div>
      ) : (
        <div className="flex flex-wrap items-end gap-3">
          {/* Periodo */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inline-periodo">Periodo</Label>
            <Select indicatorVisibility={false} value={periodoSel} onValueChange={handlePeriodoChange}>
              <SelectTrigger id="inline-periodo" className="w-44">
                <SelectValue placeholder="Selecciona…" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {periodos.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Incidencia */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inline-incidencia">Incidencia</Label>
            <Select
              indicatorVisibility={false}
              value={idCatalogoSel}
              onValueChange={setIdCatalogoSel}
              disabled={!periodoSel}
            >
              <SelectTrigger id="inline-incidencia" className="w-72">
                <SelectValue
                  placeholder={
                    periodoSel
                      ? 'Selecciona una incidencia…'
                      : 'Primero selecciona un periodo'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {incidenciasDePeriodo.map((inc) => (
                    <SelectItem key={inc.id} value={String(inc.id)}>
                      {inc.incidencia}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Acción */}
          <Button disabled={!periodoSel || !idCatalogoSel || creando} onClick={handleSubmit}>
            {creando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Registrando...
              </>
            ) : (
              'Registrar'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Fila de incidencia con seguimiento expandible ────────────────────────────

function IncidenciaRow({
  incidencia,
  idSesion,
  readonly,
}: {
  incidencia: IIncidencia;
  idSesion: string;
  readonly: boolean;
}) {
  const seguimientos = incidencia.seguimiento ?? [];

  const [expanded, setExpanded] = useState(false);
  const [nuevoTexto, setNuevoTexto] = useState('');
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  const { mutate: guardar, isPending: guardando } = useGuardarSeguimiento(idSesion);
  const { mutate: eliminar, isPending: eliminando } = useEliminarIncidencia(idSesion);

  const handleToggleExpand = () => setExpanded((v) => !v);

  const handleInformar = () => {
    if (!nuevoTexto.trim()) return;
    guardar(
      { id_incidencia: incidencia.id, id_sesion: idSesion, seguimiento: nuevoTexto },
      { onSuccess: () => setNuevoTexto('') },
    );
  };

  const handleInformarYCerrar = () => {
    if (!nuevoTexto.trim()) return;
    guardar(
      { id_incidencia: incidencia.id, id_sesion: idSesion, seguimiento: nuevoTexto, status: 'CERRADA' },
      { onSuccess: () => setNuevoTexto('') },
    );
  };

  const handleEliminar = () => eliminar(incidencia.id);

  return (
    <>
      <tr className="hover:bg-muted/30 transition-colors">
        {/* Estatus */}
        <td className="px-4 py-3 align-middle">
          <EstatusChip status={incidencia.status} />
        </td>
        {/* Fecha / Hora */}
        <td className="px-4 py-3 align-middle text-xs text-muted-foreground whitespace-nowrap">
          {formatFechaHora(incidencia.fecha)}
        </td>
        {/* Periodo */}
        <td className="px-4 py-3 align-middle">
          <Badge variant="info" appearance="light" size="sm">
            {incidencia.periodo}
          </Badge>
        </td>
        {/* Incidencia */}
        <td className="px-4 py-3 align-middle text-sm font-medium text-foreground leading-tight">
          {incidencia.incidencia}
        </td>
        {/* Toggle seguimiento */}
        <td className="px-4 py-3 align-middle">
          <button
            type="button"
            onClick={handleToggleExpand}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            aria-expanded={expanded}
          >
            Seguimiento
            {seguimientos.length > 0 && (
              <span className="text-xs font-medium text-foreground">({seguimientos.length})</span>
            )}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            />
          </button>
        </td>
        {/* Eliminar */}
        <td className="px-4 py-3 align-middle">
          {!readonly && (
            <button
              type="button"
              onClick={() => setConfirmarEliminar(true)}
              disabled={eliminando}
              className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
              aria-label="Eliminar incidencia"
            >
              {eliminando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          )}
        </td>
      </tr>

      {/* Panel de seguimiento (fila extra) */}
      {expanded && (
        <tr>
          <td colSpan={6} className="px-4 pb-4 pt-0">
            <div className="bg-muted/40 rounded-lg p-3 space-y-3">

              {/* ── Lista de seguimientos (más reciente primero) ── */}
              {seguimientos.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  Sin seguimiento registrado.
                </p>
              )}
              {[...seguimientos].reverse().map((s) => (
                <div
                  key={s.id}
                  className="border-b border-border/60 pb-2 last:border-0 last:pb-0 space-y-0.5"
                >
                  <p className="text-sm text-foreground whitespace-pre-wrap">{s.seguimiento}</p>
                  <p className="text-xs text-muted-foreground">{formatFechaHora(s.fecha_registro)}</p>
                </div>
              ))}

              {/* ── Formulario nuevo seguimiento (siempre visible) ── */}
              {!readonly && incidencia.status !== 'CERRADA' && (
                <div className="space-y-2 pt-1 border-t border-border/60">
                  <Textarea
                    value={nuevoTexto}
                    onChange={(e) => setNuevoTexto(e.target.value)}
                    rows={3}
                    maxLength={400}
                    placeholder="Escribe el seguimiento..."
                    className="resize-none text-sm"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        disabled={guardando || !nuevoTexto.trim()}
                        onClick={handleInformar}
                      >
                        {guardando ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
                        ) : (
                          'Informar'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={guardando || !nuevoTexto.trim()}
                        onClick={handleInformarYCerrar}
                      >
                        {guardando ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
                        ) : (
                          'Informar y Cerrar'
                        )}
                      </Button>
                    </div>
                    <span className={`text-xs tabular-nums ${nuevoTexto.length >= 500 ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                      {nuevoTexto.length} / 400
                    </span>
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}

      {/* Confirmación eliminar */}
      <AlertDialog open={confirmarEliminar} onOpenChange={setConfirmarEliminar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta incidencia?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción <span className="font-semibold text-destructive">no es reversible</span>.
              Se eliminará la incidencia y todos sus seguimientos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleEliminar}
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyIncidencias() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-5">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <SearchX className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground mb-0.5">Sin incidencias</p>
      <p className="text-xs text-muted-foreground">
        No hay incidencias registradas para esta sesión.
      </p>
    </div>
  );
}
