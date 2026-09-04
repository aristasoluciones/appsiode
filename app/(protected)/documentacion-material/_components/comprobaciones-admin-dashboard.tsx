'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Building,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FolderOpen,
  MapPin,
  Search,
  Upload,
  X,
} from 'lucide-react';
import type {
  IAvanceConsejo,
  IAvanceResumen,
} from '@/types/material-electoral';
import { useProceso } from '@/hooks/use-proceso';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  TODAS_ELECCIONES,
  useAvanceComprobaciones,
  useDescargarReporteComprobaciones,
} from '../_hooks/use-avance-comprobaciones';
import { CargaLayoutDialog } from './carga-layout-dialog';
import { EmptyStateErrorComprobaciones } from './comprobaciones-empty-state';

// ─── Pills por tipo de consejo ───────────────────────────────────────────────

const PILLS: { value: 'D' | 'M'; label: string; icon: typeof Building }[] = [
  { value: 'D', label: 'Distritales', icon: Building },
  { value: 'M', label: 'Municipales', icon: MapPin },
];

/** Estilo común de los botones de filtro (pills y chips). */
const PILL_BASE = [
  'inline-flex items-center gap-2 h-8.5 px-3 rounded-md border text-[0.8125rem] font-medium',
  'transition-colors duration-150 motion-reduce:transition-none',
  'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:border-ring',
  'disabled:opacity-50 disabled:cursor-not-allowed',
].join(' ');

const PILL_ACTIVO = 'bg-primary/10 border-primary text-primary';
const PILL_INACTIVO =
  'bg-background border-input text-foreground hover:bg-accent';

function TipoConsejoPills({
  opciones,
  value,
  onChange,
  disabled,
}: {
  opciones: typeof PILLS;
  value: 'D' | 'M' | null;
  onChange: (v: 'D' | 'M') => void;
  disabled?: boolean;
}) {
  if (opciones.length <= 1) return null;

  return (
    <div
      role="radiogroup"
      aria-label="Tipo de consejo"
      className="flex flex-wrap gap-2"
    >
      {opciones.map((op) => {
        const activo = value === op.value;
        const Icon = op.icon;
        return (
          <button
            key={op.value}
            role="radio"
            aria-checked={activo}
            type="button"
            disabled={disabled}
            onClick={() => onChange(op.value)}
            className={[PILL_BASE, activo ? PILL_ACTIVO : PILL_INACTIVO].join(
              ' ',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{op.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Pills por elección ──────────────────────────────────────────────────────

function EleccionPills({
  opciones,
  value,
  onChange,
  disabled,
}: {
  opciones: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  if (opciones.length <= 2) return null;

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
            aria-checked={activo}
            type="button"
            disabled={disabled}
            onClick={() => onChange(op.value)}
            className={[PILL_BASE, activo ? PILL_ACTIVO : PILL_INACTIVO].join(
              ' ',
            )}
          >
            <span>{op.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Chips de estatus (filtrado local) ───────────────────────────────────────

/** Conteo por consejo con que se filtra y se pinta cada columna. */
type TConteoConsejo =
  | 'sin_informacion'
  | 'sin_inconsistencias'
  | 'con_inconsistencias'
  | 'con_faltantes'
  | 'con_excedentes';

interface IColumnaConteo {
  value: TConteoConsejo;
  label: string;
  corto: string;
  /** Qué cuenta la columna; se muestra al pasar el ratón por su chip. */
  ayuda: string;
  activeClass: string;
}

/**
 * Columnas de conteo, en el mismo orden en que se pintan. Las tres primeras
 * —sin información, sin inconsistencias y con inconsistencias— suman el total
 * del consejo; con faltantes y con excedentes son el desglose de las
 * inconsistencias y por eso no entran en esa suma.
 */
const COLUMNAS: IColumnaConteo[] = [
  {
    value: 'sin_informacion',
    label: 'Sin información',
    corto: 'Sin info.',
    ayuda:
      'Registros que el consejo todavía no comprueba: no ha capturado su cantidad física.',
    activeClass:
      'bg-gray-100 border-gray-500 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
  {
    value: 'sin_inconsistencias',
    label: 'Sin inconsistencias',
    corto: 'Sin inconsist.',
    ayuda:
      'Registros comprobados en los que la cantidad física coincide con la entregada.',
    activeClass:
      'bg-green-50 border-green-500 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  },
  {
    value: 'con_inconsistencias',
    label: 'Con inconsistencias',
    corto: 'Con inconsist.',
    ayuda:
      'Registros comprobados en los que la cantidad física no coincide con la entregada: la suma de faltantes y excedentes.',
    activeClass:
      'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  },
  {
    value: 'con_faltantes',
    label: 'Con faltantes',
    corto: 'Faltantes',
    ayuda:
      'Registros donde el consejo contó menos de lo entregado. Es parte de las inconsistencias, no se suma aparte al total.',
    activeClass:
      'bg-red-50 border-red-500 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  },
  {
    value: 'con_excedentes',
    label: 'Con excedentes',
    corto: 'Excedentes',
    ayuda:
      'Registros donde el consejo contó más de lo entregado. Es parte de las inconsistencias, no se suma aparte al total.',
    activeClass:
      'bg-orange-50 border-orange-500 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
  },
];

/** Las tres columnas que, junto con el total, tienen que cuadrar. */
const COLUMNAS_TOTAL = COLUMNAS.slice(0, 3);

/** Desglose de las inconsistencias: no suma al total, lo explica. */
const COLUMNAS_DETALLE = COLUMNAS.slice(3);

function EstatusChips({
  activos,
  totales,
  onToggle,
  disabled,
}: {
  activos: TConteoConsejo[];
  totales: Record<TConteoConsejo, number>;
  onToggle: (v: TConteoConsejo) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="flex flex-wrap gap-1.5 lg:justify-end"
      role="group"
      aria-label="Filtrar por estatus"
    >
      {COLUMNAS.map((chip) => {
        const activo = activos.includes(chip.value);
        return (
          <Tooltip key={chip.value}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-pressed={activo}
                disabled={disabled}
                onClick={() => onToggle(chip.value)}
                className={[
                  'inline-flex items-center gap-1 h-8 px-2 rounded-md border text-xs font-medium whitespace-nowrap',
                  'transition-colors duration-150 motion-reduce:transition-none',
                  'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:border-ring',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  activo
                    ? chip.activeClass
                    : 'bg-background border-input text-muted-foreground hover:bg-accent',
                ].join(' ')}
              >
                <span>{chip.label}</span>
                <span className="tabular-nums font-semibold">
                  {totales[chip.value]}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-64 text-pretty">
              {chip.ayuda}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

// ─── Resumen del estado ──────────────────────────────────────────────────────

function ResumenEstado({
  resumen,
  tipoLabel,
  isLoading,
}: {
  resumen: IAvanceResumen;
  /** Tipo de consejo activo, para dejar claro qué se está midiendo. */
  tipoLabel: string;
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-64 animate-pulse motion-reduce:animate-none" />
            <Skeleton className="h-3 w-56 animate-pulse motion-reduce:animate-none" />
          </div>
          <Skeleton className="h-6 w-14 animate-pulse motion-reduce:animate-none" />
        </div>
        <Skeleton className="h-2 w-full rounded-full animate-pulse motion-reduce:animate-none" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton
              key={i}
              className="h-12 rounded-md animate-pulse motion-reduce:animate-none"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Avance de la comprobación · {tipoLabel}
          </p>
          <p className="text-xs text-muted-foreground">
            {resumen.capturados} de {resumen.total} registros con comprobación
            física
          </p>
        </div>
        <span className="text-lg font-bold text-foreground tabular-nums">
          {resumen.porcentaje}%
        </span>
      </div>

      <Progress value={Number(resumen.porcentaje) || 0} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="rounded-md bg-muted/50 px-3 py-2">
          <span className="block text-muted-foreground">Total consejos</span>
          <span className="font-semibold text-foreground tabular-nums">
            {resumen.consejos}
          </span>
        </div>
        <div className="rounded-md bg-muted/50 px-3 py-2">
          <span className="block text-muted-foreground">
            Consejos con comprobación física completa
          </span>
          <span className="font-semibold text-foreground tabular-nums">
            {resumen.consejos_completos}
          </span>
        </div>
        <div className="rounded-md bg-muted/50 px-3 py-2">
          <span className="block text-muted-foreground">
            Consejos sin documentación y/o material asignado
          </span>
          <span className="font-semibold text-foreground tabular-nums">
            {resumen.consejos_sin_layout}
          </span>
        </div>
        <div className="rounded-md bg-muted/50 px-3 py-2">
          <span className="block text-muted-foreground">
            Registros sin comprobación física
          </span>
          <span className="font-semibold text-foreground tabular-nums">
            {resumen.sin_informacion}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Fila / tarjeta por consejo ──────────────────────────────────────────────

function hrefConsejo(c: IAvanceConsejo): string {
  const tipo = c.tipo_consejo === 'D' ? 'distritales' : 'municipales';
  return `/documentacion-material/comprobaciones/consejos/${tipo}/${c.id_consejo}`;
}

function tipoTexto(c: IAvanceConsejo): string {
  return c.tipo_consejo === 'D' ? 'Consejo Distrital' : 'Consejo Municipal';
}

function ConsejoRow({ consejo }: { consejo: IAvanceConsejo }) {
  return (
    <Link
      href={hrefConsejo(consejo)}
      className="grid grid-cols-10 gap-2 items-center py-2.5 px-3 text-sm border-b border-border last:border-b-0
        hover:bg-accent/50 transition-colors text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <div className="col-span-3">
        <div className="font-medium text-foreground truncate">
          {consejo.id_consejo}. {consejo.nombre_consejo}
        </div>
        <p className="text-[0.6875rem] text-muted-foreground mt-0.5">
          {tipoTexto(consejo)}
        </p>
      </div>

      {/* Lo que cuadra con el total del consejo. */}
      <div className="col-span-4 grid grid-cols-4 gap-2 rounded-md border border-border bg-background py-1">
        <div className="text-center tabular-nums font-semibold">
          {consejo.total}
        </div>
        {COLUMNAS_TOTAL.map((col) => (
          <div key={col.value} className="text-center tabular-nums">
            {consejo[col.value]}
          </div>
        ))}
      </div>

      {/* Desglose de las inconsistencias: aparte, porque no suma al total. */}
      <div className="col-span-2 grid grid-cols-2 gap-2 rounded-md bg-muted/40 py-1">
        {COLUMNAS_DETALLE.map((col) => (
          <div
            key={col.value}
            className="text-center tabular-nums text-muted-foreground"
          >
            {consejo[col.value]}
          </div>
        ))}
      </div>

      <div className="text-center tabular-nums font-medium">
        {consejo.total === 0 ? (
          <span className="text-xs text-muted-foreground">Sin asignar</span>
        ) : (
          `${consejo.porcentaje}%`
        )}
      </div>
    </Link>
  );
}

function ConsejoMobileCard({ consejo }: { consejo: IAvanceConsejo }) {
  return (
    <Link href={hrefConsejo(consejo)} className="block">
      <article className="border border-border rounded-lg p-4 space-y-3 bg-card">
        <header className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              #{consejo.id_consejo} · {tipoTexto(consejo)}
            </p>
            <h3 className="text-base font-semibold text-foreground mt-0.5 truncate">
              {consejo.nombre_consejo}
            </h3>
          </div>
          <span className="text-sm font-bold text-foreground tabular-nums shrink-0">
            {consejo.total === 0 ? '—' : `${consejo.porcentaje}%`}
          </span>
        </header>
        {/* Lo que cuadra con el total del consejo. */}
        <div className="rounded-md border border-border p-2">
          <div
            className="grid grid-cols-4 gap-2"
            role="list"
            aria-label="Registros que suman el total del consejo"
          >
            <div
              role="listitem"
              className="flex flex-col items-center justify-center rounded-md p-2 bg-muted/50 text-center"
            >
              <span className="text-base font-bold text-foreground tabular-nums">
                {consejo.total}
              </span>
              <span className="text-[0.625rem] font-medium text-muted-foreground leading-tight">
                Total
              </span>
            </div>
            {COLUMNAS_TOTAL.map((col) => (
              <div
                key={col.value}
                role="listitem"
                className="flex flex-col items-center justify-center rounded-md p-2 bg-muted/50 text-center"
              >
                <span className="text-base font-bold text-foreground tabular-nums">
                  {consejo[col.value]}
                </span>
                <span className="text-[0.625rem] font-medium text-muted-foreground leading-tight">
                  {col.corto}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Desglose de las inconsistencias: no entra en la suma. */}
        <div className="rounded-md bg-muted/40 p-2">
          <div
            className="grid grid-cols-2 gap-2"
            role="list"
            aria-label="Desglose de las inconsistencias"
          >
            {COLUMNAS_DETALLE.map((col) => (
              <div
                key={col.value}
                role="listitem"
                className="flex flex-col items-center justify-center rounded-md p-2 bg-background text-center"
              >
                <span className="text-base font-bold text-foreground tabular-nums">
                  {consejo[col.value]}
                </span>
                <span className="text-[0.625rem] font-medium text-muted-foreground leading-tight">
                  {col.corto}
                </span>
              </div>
            ))}
          </div>
        </div>
        <footer className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">
            Ver comprobación
          </span>
          <ChevronRight
            className="h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
        </footer>
      </article>
    </Link>
  );
}

function DesktopSkeleton() {
  return (
    <div className="space-y-1" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="grid grid-cols-10 gap-2 items-center py-2 px-3">
          <div className="col-span-3 space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          {Array.from({ length: 7 }, (_, j) => (
            <Skeleton key={j} className="h-4 w-8 mx-auto" />
          ))}
        </div>
      ))}
    </div>
  );
}

function MobileSkeletons() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className="border border-border rounded-lg p-4 space-y-3 bg-card"
        >
          <div className="space-y-1.5">
            <Skeleton className="w-28 h-3" />
            <Skeleton className="w-44 h-5" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }, (_, j) => (
              <Skeleton key={j} className="h-14 rounded-md" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Paginación simple ───────────────────────────────────────────────────────

const TAMANOS_PAGINA = [10, 20, 30, 50, 100, 200];

function PaginacionSimple({
  pagina,
  totalPaginas,
  onPaginaChange,
  totalRegistros,
  tamano,
  onTamanoChange,
}: {
  pagina: number;
  totalPaginas: number;
  onPaginaChange: (p: number) => void;
  totalRegistros: number;
  tamano: number;
  onTamanoChange: (t: number) => void;
}) {
  if (totalPaginas <= 1 && totalRegistros <= TAMANOS_PAGINA[0]) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">
          {totalRegistros} consejo{totalRegistros === 1 ? '' : 's'}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[0.6875rem] text-muted-foreground">
            Mostrar
          </span>
          <select
            value={tamano}
            onChange={(e) => onTamanoChange(Number(e.target.value))}
            className="h-7 rounded border border-input bg-background px-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Registros por página"
          >
            {TAMANOS_PAGINA.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      {totalPaginas > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPaginaChange(pagina - 1)}
            disabled={pagina === 1}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
            {pagina} / {totalPaginas}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPaginaChange(pagina + 1)}
            disabled={pagina === totalPaginas}
            aria-label="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Tablero ─────────────────────────────────────────────────────────────────

/**
 * Tablero de oficina central: avance de la comprobación de todos los consejos
 * del tipo, con búsqueda, filtros y paginado, y la descarga de los reportes que
 * genera el API. Desde cada consejo se abre su detalle documento por documento.
 */
export function ComprobacionesAdminDashboard() {
  const { hasPermission } = useAuth();
  const { data: proceso, isLoading: isLoadingProceso } = useProceso();

  const puedeExportar = hasPermission(
    'documentacionymaterial.comprobaciones.exportar',
  );
  // La carga del layout se abre en ventana desde aquí: no tiene pantalla propia.
  const puedeCargarLayout = hasPermission(
    'documentacionymaterial.comprobaciones.layout',
  );
  const [layoutAbierto, setLayoutAbierto] = useState(false);

  // Pills disponibles según los tipos de consejo del proceso activo.
  const pillsDisponibles = useMemo(() => {
    const tipos = new Set(
      (proceso?.elecciones ?? []).map((e) => e.consejo_tipo as 'D' | 'M'),
    );
    return PILLS.filter((p) => tipos.has(p.value));
  }, [proceso]);

  const [tipoSeleccionado, setTipoSeleccionado] = useState<'D' | 'M' | null>(
    null,
  );
  const tipoConsejo = tipoSeleccionado ?? pillsDisponibles[0]?.value ?? null;

  const [eleccion, setEleccion] = useState<string>(TODAS_ELECCIONES);
  const [estatusActivos, setEstatusActivos] = useState<TConteoConsejo[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [tamano, setTamano] = useState(30);

  const { data, isLoading, isFetching, isError, refetch } =
    useAvanceComprobaciones(tipoConsejo, eleccion, !isLoadingProceso);

  const descargarReporte = useDescargarReporteComprobaciones();

  const consejos = useMemo(() => data?.consejos ?? [], [data]);
  const resumen = data?.resumen;

  const opcionesEleccion = useMemo(
    () => [
      { value: TODAS_ELECCIONES, label: 'Todas' },
      ...(data?.elecciones ?? []).map((e) => ({
        value: e.clave,
        label: e.descripcion,
      })),
    ],
    [data],
  );

  const totales: Record<TConteoConsejo, number> = {
    sin_informacion: resumen?.sin_informacion ?? 0,
    sin_inconsistencias: resumen?.sin_inconsistencias ?? 0,
    con_inconsistencias: resumen?.con_inconsistencias ?? 0,
    con_faltantes: resumen?.con_faltantes ?? 0,
    con_excedentes: resumen?.con_excedentes ?? 0,
  };

  // Contexto de lo que se está midiendo, para el encabezado del resumen.
  const tipoLabel =
    tipoConsejo === 'D'
      ? 'Consejos distritales'
      : tipoConsejo === 'M'
        ? 'Consejos municipales'
        : 'Sin tipo de consejo';

  // Filtrado en pantalla: búsqueda por consejo + chips de estatus.
  const consejosFiltrados = useMemo(() => {
    let filtrados = consejos;

    const q = busqueda.trim().toLowerCase();
    if (q) {
      filtrados = filtrados.filter(
        (c) =>
          c.nombre_consejo.toLowerCase().includes(q) ||
          String(c.id_consejo).includes(q),
      );
    }

    if (estatusActivos.length > 0) {
      filtrados = filtrados.filter((c) =>
        estatusActivos.some((estatus) => c[estatus] > 0),
      );
    }

    return filtrados;
  }, [consejos, busqueda, estatusActivos]);

  const totalPaginas = Math.ceil(consejosFiltrados.length / tamano);
  const paginaSegura = Math.min(pagina, Math.max(totalPaginas, 1));
  const paginados = useMemo(() => {
    const inicio = (paginaSegura - 1) * tamano;
    return consejosFiltrados.slice(inicio, inicio + tamano);
  }, [consejosFiltrados, paginaSegura, tamano]);

  function cambiarTipo(v: 'D' | 'M') {
    setTipoSeleccionado(v);
    setEleccion(TODAS_ELECCIONES);
    setEstatusActivos([]);
    setBusqueda('');
    setPagina(1);
  }

  function cambiarEleccion(v: string) {
    setEleccion(v);
    setEstatusActivos([]);
    setPagina(1);
  }

  function alternarEstatus(v: TConteoConsejo) {
    setEstatusActivos((previos) =>
      previos.includes(v) ? previos.filter((e) => e !== v) : [...previos, v],
    );
    setPagina(1);
  }

  function limpiarFiltros() {
    setEstatusActivos([]);
    setBusqueda('');
    setPagina(1);
  }

  if (isLoadingProceso) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Cargando avance">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-8.5 w-48 rounded-md" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return <EmptyStateErrorComprobaciones onReintentar={() => refetch()} />;
  }

  const hayFiltros = estatusActivos.length > 0 || busqueda.trim().length > 0;
  const descargando = descargarReporte.isPending;

  return (
    <div className="space-y-4">
      <ResumenEstado
        resumen={
          resumen ?? {
            consejos: 0,
            consejos_completos: 0,
            consejos_sin_layout: 0,
            total: 0,
            capturados: 0,
            sin_informacion: 0,
            sin_inconsistencias: 0,
            con_inconsistencias: 0,
            con_faltantes: 0,
            con_excedentes: 0,
            porcentaje: 0,
          }
        }
        tipoLabel={tipoLabel}
        isLoading={isLoading}
      />

      {/* Filtros en dos columnas: a la izquierda qué se está mirando —tipo de
          consejo y, debajo, las elecciones de ese tipo—; a la derecha el
          estatus de los registros. */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Tipo de consejo y elección van juntos: los dos eligen qué se está
            mirando. Ocupan solo lo que miden sus pills, para que la cinta de
            estatus tenga el resto del ancho. */}
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3 lg:shrink-0">
          <TipoConsejoPills
            opciones={pillsDisponibles}
            value={tipoConsejo}
            onChange={cambiarTipo}
            disabled={isLoading}
          />
          <EleccionPills
            opciones={opcionesEleccion}
            value={eleccion}
            onChange={cambiarEleccion}
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center lg:min-w-0 lg:flex-1 lg:justify-end">
          <EstatusChips
            activos={estatusActivos}
            totales={totales}
            onToggle={alternarEstatus}
            disabled={isLoading}
          />
        </div>
      </div>

      <div
        className={[
          'rounded-lg border border-border bg-card',
          'transition-opacity duration-150 motion-reduce:transition-none',
          isFetching && !isLoading ? 'opacity-60' : 'opacity-100',
        ].join(' ')}
      >
        {/* Encabezado: búsqueda, contador y reportes */}
        <div className="px-4 py-3 border-b border-border flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <Input
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPagina(1);
                }}
                placeholder="Buscar consejo..."
                disabled={isLoading}
                className="pl-9 pr-9"
                aria-label="Buscar consejo"
              />
              {busqueda && (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  onClick={() => {
                    setBusqueda('');
                    setPagina(1);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-muted"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            {hayFiltros && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {consejosFiltrados.length} de {consejos.length} consejos
              </span>
            )}
          </div>

          {(puedeCargarLayout || (puedeExportar && tipoConsejo)) && (
            <div className="flex flex-wrap items-center gap-2">
              {puedeCargarLayout && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLayoutAbierto(true)}
                >
                  <Upload className="h-4 w-4" />
                  Cargas por consejo
                </Button>
              )}
              {puedeExportar && tipoConsejo && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isLoading || descargando}
                    onClick={() =>
                      descargarReporte.mutate({
                        reporte: 'general',
                        tipoConsejo,
                        idEleccion: eleccion,
                      })
                    }
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Reporte general
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isLoading || descargando}
                    onClick={() =>
                      descargarReporte.mutate({
                        reporte: 'general-detallado',
                        tipoConsejo,
                        idEleccion: eleccion,
                      })
                    }
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    General detallado
                  </Button>
                  <span className="sr-only" aria-live="polite">
                    {descargando ? 'Generando el reporte' : ''}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Vacíos */}
        {!isLoading && consejos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <FolderOpen
              className="h-8 w-8 text-muted-foreground mb-3"
              aria-hidden="true"
            />
            <h3 className="text-base font-semibold text-foreground mb-1">
              Sin consejos que mostrar
            </h3>
            <p className="text-sm text-muted-foreground">
              El proceso no tiene consejos activos de este tipo.
            </p>
          </div>
        )}
        {!isLoading &&
          consejos.length > 0 &&
          consejosFiltrados.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Search
                className="h-8 w-8 text-muted-foreground mb-3"
                aria-hidden="true"
              />
              <h3 className="text-base font-semibold text-foreground mb-1">
                Sin resultados
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Ningún consejo coincide con los filtros seleccionados.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={limpiarFiltros}
              >
                Limpiar filtros
              </Button>
            </div>
          )}

        {(isLoading || consejosFiltrados.length > 0) && (
          <>
            {/* Móvil: tarjetas */}
            <div className="md:hidden p-3 space-y-3">
              {isLoading ? (
                <MobileSkeletons />
              ) : (
                paginados.map((c) => (
                  <ConsejoMobileCard
                    key={`${c.tipo_consejo}-${c.id_consejo}`}
                    consejo={c}
                  />
                ))
              )}
            </div>

            {/* Escritorio: tabla */}
            <div className="hidden md:block overflow-x-auto">
              <div className="min-w-[980px]">
                {/* El recuadro agrupa las columnas que cuadran con el total;
                    el desglose de las inconsistencias va aparte. */}
                <div className="grid grid-cols-10 gap-2 items-center py-2 px-3 text-xs font-medium text-muted-foreground border-b border-border bg-muted/40">
                  <div className="col-span-3">Consejo</div>
                  <div className="col-span-4 grid grid-cols-4 gap-2 rounded-md border border-border bg-background py-1">
                    <div className="text-center">Total</div>
                    {COLUMNAS_TOTAL.map((col) => (
                      <div key={col.value} className="text-center">
                        {col.label}
                      </div>
                    ))}
                  </div>
                  <div className="col-span-2 grid grid-cols-2 gap-2 rounded-md bg-muted/70 py-1">
                    {COLUMNAS_DETALLE.map((col) => (
                      <div key={col.value} className="text-center">
                        {col.label}
                      </div>
                    ))}
                  </div>
                  <div className="text-center">Avance</div>
                </div>
                {isLoading ? (
                  <DesktopSkeleton />
                ) : (
                  paginados.map((c) => (
                    <ConsejoRow
                      key={`${c.tipo_consejo}-${c.id_consejo}`}
                      consejo={c}
                    />
                  ))
                )}
              </div>
            </div>

            <PaginacionSimple
              pagina={paginaSegura}
              totalPaginas={totalPaginas}
              onPaginaChange={setPagina}
              totalRegistros={consejosFiltrados.length}
              tamano={tamano}
              onTamanoChange={(t) => {
                setTamano(t);
                setPagina(1);
              }}
            />
          </>
        )}
      </div>

      {puedeCargarLayout && (
        <CargaLayoutDialog
          open={layoutAbierto}
          onOpenChange={setLayoutAbierto}
        />
      )}
    </div>
  );
}
