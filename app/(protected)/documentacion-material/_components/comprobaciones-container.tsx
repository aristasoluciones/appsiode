'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type {
  IComprobacionDocumento,
  IComprobacionResumen,
  TEstatusComprobacion,
} from '@/types/material-electoral';
import { useAuth } from '@/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useComprobaciones } from '../_hooks/use-comprobaciones';
import { CapturaComprobacionDialog } from './captura-comprobacion-dialog';
import { ESTATUS_COMPROBACION, ESTATUS_ORDEN } from './comprobacion-estatus';
import {
  EmptyStateErrorComprobaciones,
  EmptyStateSinDocumentos,
  EmptyStateSinResultados,
} from './comprobaciones-empty-state';
import { ComprobacionesTable } from './comprobaciones-table';
import { HistorialComprobacionDialog } from './historial-comprobacion-dialog';

/** Filtro de elección: una clave del proceso o todas. */
const TODAS = 'TODAS';

// ─── Avance del consejo ───────────────────────────────────────────────────────

function ResumenAvance({
  resumen,
  isLoading,
}: {
  resumen: IComprobacionResumen;
  isLoading: boolean;
}) {
  // El esqueleto imita el bloque real para que no salte al cargar.
  if (isLoading) {
    return (
      <div
        className="rounded-lg border border-border bg-card p-4 space-y-3"
        aria-busy="true"
        aria-label="Cargando el avance de la comprobación"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-48 animate-pulse motion-reduce:animate-none" />
            <Skeleton className="h-3 w-56 animate-pulse motion-reduce:animate-none" />
          </div>
          <Skeleton className="h-6 w-14 animate-pulse motion-reduce:animate-none" />
        </div>
        <Skeleton className="h-2 w-full rounded-full animate-pulse motion-reduce:animate-none" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Avance de la comprobación
          </p>
          <p className="text-xs text-muted-foreground">
            {resumen.capturados} de {resumen.total} renglones capturados
          </p>
        </div>
        <div className="flex items-center gap-2">
          {resumen.completo && (
            <Badge variant="success" appearance="light" size="sm">
              Comprobación completa
            </Badge>
          )}
          <span className="text-lg font-bold text-foreground">
            {resumen.porcentaje}%
          </span>
        </div>
      </div>
      <Progress value={Number(resumen.porcentaje) || 0} />
    </div>
  );
}

// ─── Filtros por estatus ──────────────────────────────────────────────────────

function EstatusChips({
  conteos,
  activos,
  onToggle,
  disabled,
}: {
  conteos: Record<TEstatusComprobacion, number>;
  activos: TEstatusComprobacion[];
  onToggle: (estatus: TEstatusComprobacion) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Filtrar por estatus"
    >
      {ESTATUS_ORDEN.map((estatus) => {
        const activo = activos.includes(estatus);
        const { label } = ESTATUS_COMPROBACION[estatus];
        return (
          <button
            key={estatus}
            type="button"
            aria-pressed={activo}
            disabled={disabled}
            onClick={() => onToggle(estatus)}
            className={[
              'inline-flex items-center gap-2 h-8.5 px-3 rounded-md border text-[0.8125rem] font-medium',
              'transition-colors duration-150 motion-reduce:transition-none',
              'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:border-ring',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              activo
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-background border-input text-foreground hover:bg-accent',
            ].join(' ')}
          >
            <span>{label}</span>
            <span className="text-xs text-muted-foreground">
              {conteos[estatus]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Pills por elección ───────────────────────────────────────────────────────

function EleccionPills({
  opciones,
  value,
  onChange,
  disabled,
  isLoading,
}: {
  opciones: { value: string; label: string; total: number }[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex gap-2" aria-hidden="true">
        <Skeleton className="h-8.5 w-24 rounded-md" />
        <Skeleton className="h-8.5 w-32 rounded-md" />
      </div>
    );
  }

  if (opciones.length <= 1) return null;

  return (
    <div
      role="radiogroup"
      aria-label="Elección"
      className="flex flex-wrap gap-2"
    >
      {opciones.map((op) => {
        const activo = value === op.value;
        return (
          <button
            key={op.value}
            role="radio"
            type="button"
            aria-checked={activo}
            disabled={disabled}
            onClick={() => onChange(op.value)}
            className={[
              'inline-flex items-center gap-2 h-8.5 px-3 rounded-md border text-[0.8125rem] font-medium',
              'transition-colors duration-150 motion-reduce:transition-none',
              'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:border-ring',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              activo
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-background border-input text-foreground hover:bg-accent',
            ].join(' ')}
          >
            <span>{op.label}</span>
            <span className="text-xs text-muted-foreground">{op.total}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Contenedor principal ─────────────────────────────────────────────────────

export interface ComprobacionesContainerProps {
  /**
   * Consejo a consultar cuando la oficina central abra el detalle desde su
   * tablero. Sin estas props se usa el consejo del usuario autenticado.
   */
  tipoConsejo?: 'D' | 'M';
  idConsejo?: number;
}

export function ComprobacionesContainer({
  tipoConsejo: tipoConsejoProp,
  idConsejo: idConsejoProp,
}: ComprobacionesContainerProps = {}) {
  const { user, hasPermission } = useAuth();

  // Vista de oficina central: el consejo llega por la ruta y es solo lectura.
  const esVistaAdmin = tipoConsejoProp != null && idConsejoProp != null;

  const tipoConsejo = (tipoConsejoProp ??
    (user?.tipoConsejo === 'D' || user?.tipoConsejo === 'M'
      ? user.tipoConsejo
      : null)) as 'D' | 'M' | null;

  const idConsejo =
    idConsejoProp ?? (user?.idConsejo ? Number(user.idConsejo) : null);

  const puedeCapturar =
    hasPermission('documentacionymaterial.comprobaciones.registrar') &&
    !esVistaAdmin;
  const puedeVerHistorial = hasPermission(
    'documentacionymaterial.comprobaciones.detalle',
  );

  const { data, isLoading, isFetching, isError, refetch } = useComprobaciones(
    tipoConsejo,
    idConsejo,
  );

  // ── Filtros en pantalla ───────────────────────────────────────────────────
  const [eleccion, setEleccion] = useState<string>(TODAS);
  const [estatusActivos, setEstatusActivos] = useState<TEstatusComprobacion[]>(
    [],
  );
  const [busqueda, setBusqueda] = useState('');
  const [busquedaDiferida, setBusquedaDiferida] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setBusquedaDiferida(busqueda), 200);
    return () => clearTimeout(id);
  }, [busqueda]);

  const [documentoACapturar, setDocumentoACapturar] =
    useState<IComprobacionDocumento | null>(null);
  const [documentoDelHistorial, setDocumentoDelHistorial] =
    useState<IComprobacionDocumento | null>(null);

  const documentos = useMemo(() => data?.documentos ?? [], [data]);

  const opcionesEleccion = useMemo(() => {
    const elecciones = data?.elecciones ?? [];
    if (elecciones.length === 0) return [];
    return [
      {
        value: TODAS,
        label: 'Todas',
        total: elecciones.reduce((suma, e) => suma + e.total, 0),
      },
      ...elecciones.map((e) => ({
        value: e.clave,
        label: e.descripcion,
        total: e.total,
      })),
    ];
  }, [data]);

  // Elección → búsqueda → conteos por estatus → estatus. Los conteos de los
  // chips reflejan lo que queda tras los demás filtros.
  const porEleccion = useMemo(
    () =>
      eleccion === TODAS
        ? documentos
        : documentos.filter((d) => d.id_eleccion === eleccion),
    [documentos, eleccion],
  );

  const porBusqueda = useMemo(() => {
    const q = busquedaDiferida.trim().toLowerCase();
    if (!q) return porEleccion;
    return porEleccion.filter(
      (d) =>
        d.desc_documento?.toLowerCase().includes(q) ||
        d.id_documento?.toLowerCase().includes(q) ||
        d.desc_tipo?.toLowerCase().includes(q),
    );
  }, [porEleccion, busquedaDiferida]);

  const conteos = useMemo(() => {
    const base: Record<TEstatusComprobacion, number> = {
      SIN_INFORMACION: 0,
      SIN_INCONSISTENCIAS: 0,
      CON_FALTANTES: 0,
      CON_EXCEDENTES: 0,
    };
    for (const documento of porBusqueda) {
      if (documento.estatus in base) base[documento.estatus] += 1;
    }
    return base;
  }, [porBusqueda]);

  const dataFinal = useMemo(
    () =>
      estatusActivos.length === 0
        ? porBusqueda
        : porBusqueda.filter((d) => estatusActivos.includes(d.estatus)),
    [porBusqueda, estatusActivos],
  );

  const hayFiltros =
    eleccion !== TODAS || estatusActivos.length > 0 || busqueda.trim() !== '';

  const limpiarFiltros = useCallback(() => {
    setEleccion(TODAS);
    setEstatusActivos([]);
    setBusqueda('');
  }, []);

  const alternarEstatus = useCallback((estatus: TEstatusComprobacion) => {
    setEstatusActivos((previos) =>
      previos.includes(estatus)
        ? previos.filter((e) => e !== estatus)
        : [...previos, estatus],
    );
  }, []);

  if (isError) {
    return <EmptyStateErrorComprobaciones onReintentar={() => refetch()} />;
  }

  const emptyContent =
    documentos.length === 0 && !isLoading ? (
      <EmptyStateSinDocumentos />
    ) : (
      <EmptyStateSinResultados onLimpiar={limpiarFiltros} />
    );

  const headerContent = (
    <div className="flex flex-wrap items-start gap-2 w-full">
      <div className="relative w-full sm:w-80">
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por documento, clave o tipo..."
          disabled={isLoading}
          className="pl-9 pr-9"
          aria-label="Buscar documentación y material"
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
        <span className="sr-only" aria-live="polite">
          {dataFinal.length} resultados
        </span>
      </div>
      {hayFiltros && (
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={limpiarFiltros}
        >
          Limpiar filtros
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <ResumenAvance
        resumen={
          data?.resumen ?? {
            total: 0,
            capturados: 0,
            sin_informacion: 0,
            sin_inconsistencias: 0,
            con_faltantes: 0,
            con_excedentes: 0,
            porcentaje: 0,
            completo: false,
          }
        }
        isLoading={isLoading}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <EleccionPills
          opciones={opcionesEleccion}
          value={eleccion}
          onChange={setEleccion}
          isLoading={isLoading}
          disabled={isLoading}
        />
        <EstatusChips
          conteos={conteos}
          activos={estatusActivos}
          onToggle={alternarEstatus}
          disabled={isLoading}
        />
      </div>

      <div
        className={[
          'transition-opacity duration-150 motion-reduce:transition-none',
          isFetching && !isLoading ? 'opacity-60' : 'opacity-100',
        ].join(' ')}
      >
        <ComprobacionesTable
          data={dataFinal}
          isLoading={isLoading}
          emptyContent={emptyContent}
          headerContent={headerContent}
          onCapturar={puedeCapturar ? setDocumentoACapturar : undefined}
          onHistorial={puedeVerHistorial ? setDocumentoDelHistorial : undefined}
        />
      </div>

      {tipoConsejo && idConsejo && (
        <>
          <CapturaComprobacionDialog
            documento={documentoACapturar}
            idConsejo={idConsejo}
            tipoConsejo={tipoConsejo}
            open={documentoACapturar != null}
            onOpenChange={(v) => {
              if (!v) setDocumentoACapturar(null);
            }}
          />
          <HistorialComprobacionDialog
            documento={documentoDelHistorial}
            idConsejo={idConsejo}
            tipoConsejo={tipoConsejo}
            open={documentoDelHistorial != null}
            onOpenChange={(v) => {
              if (!v) setDocumentoDelHistorial(null);
            }}
          />
        </>
      )}
    </div>
  );
}
