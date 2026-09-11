'use client';

import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Building,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  MapPin,
  Search,
  Settings2,
  X,
} from 'lucide-react';
import type {
  IActasResumen,
  IActasResumenConsejo,
} from '@/types/material-electoral';
import { formatFechaHora } from '@/lib/fechas';
import { useProceso } from '@/hooks/use-proceso';
import { useAuth } from '@/providers/auth-provider';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ProcesoConfiguracionesDialog } from '@/app/(protected)/procesos/components/proceso-configuraciones-dialog';
import { useActasResumen } from '../_hooks/use-actas';
import { ActasConsejoDialog } from './actas-consejo-dialog';
import { EmptyStateErrorActas } from './actas-empty-state';

// ─── Pills por tipo de consejo ───────────────────────────────────────────────

const PILLS: { value: 'D' | 'M'; label: string; icon: typeof Building }[] = [
  { value: 'D', label: 'Distritales', icon: Building },
  { value: 'M', label: 'Municipales', icon: MapPin },
];

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

// ─── Chips de estatus (filtrado local) ───────────────────────────────────────

/** Conteo por consejo con que se filtra y se pinta cada columna. */
type TConteoConsejo =
  | 'generadas'
  | 'en_revision'
  | 'requeridas'
  | 'aceptadas'
  | 'anuladas'
  | 'descartadas';

interface IColumnaConteo {
  value: TConteoConsejo;
  label: string;
  ayuda: string;
  activeClass: string;
}

/** Columnas del desglose por estatus, en el mismo orden en que se pintan. */
const COLUMNAS: IColumnaConteo[] = [
  {
    value: 'generadas',
    label: 'Generadas',
    ayuda: 'El consejo generó el Word y todavía no sube el PDF firmado.',
    activeClass:
      'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  },
  {
    value: 'en_revision',
    label: 'En revisión',
    ayuda:
      'El consejo subió el PDF firmado y espera la revisión de oficina central.',
    activeClass:
      'bg-cyan-50 border-cyan-500 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400',
  },
  {
    value: 'requeridas',
    label: 'Requeridas',
    ayuda: 'Oficina central envió observaciones y el consejo debe corregir.',
    activeClass:
      'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  },
  {
    value: 'aceptadas',
    label: 'Aceptadas',
    ayuda: 'Actas aceptadas por oficina central; ya no admiten cambios.',
    activeClass:
      'bg-green-50 border-green-500 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  },
  {
    value: 'anuladas',
    label: 'Anuladas',
    ayuda: 'Actas aceptadas que oficina central anuló con motivo.',
    activeClass:
      'bg-red-50 border-red-500 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  },
  {
    value: 'descartadas',
    label: 'Descartadas',
    ayuda: 'Actas que el consejo descartó con motivo antes de ser aceptadas.',
    activeClass:
      'bg-gray-100 border-gray-500 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
];

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
  totales,
  tipoLabel,
  isLoading,
}: {
  totales: IActasResumen['totales'];
  tipoLabel: string;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div
        className="rounded-lg border border-border bg-card p-4 space-y-3"
        aria-busy="true"
        aria-label="Cargando el resumen de actas"
      >
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-64 animate-pulse motion-reduce:animate-none" />
          <Skeleton className="h-3 w-56 animate-pulse motion-reduce:animate-none" />
        </div>
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

  const pendientes = totales.en_revision;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-foreground">
          Actas circunstanciadas · {tipoLabel}
        </p>
        <p className="text-xs text-muted-foreground">
          {totales.con_actas} de {totales.consejos} consejos con al menos un
          acta
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="rounded-md bg-muted/50 px-3 py-2">
          <span className="block text-muted-foreground">Total de actas</span>
          <span className="font-semibold text-foreground tabular-nums">
            {totales.total}
          </span>
        </div>
        <div className="rounded-md bg-muted/50 px-3 py-2">
          <span className="block text-muted-foreground">
            Pendientes de revisar
          </span>
          <span className="font-semibold text-foreground tabular-nums">
            {pendientes}
          </span>
        </div>
        <div className="rounded-md bg-muted/50 px-3 py-2">
          <span className="block text-muted-foreground">Aceptadas</span>
          <span className="font-semibold text-foreground tabular-nums">
            {totales.aceptadas}
          </span>
        </div>
        <div className="rounded-md bg-muted/50 px-3 py-2">
          <span className="block text-muted-foreground">Consejos sin acta</span>
          <span className="font-semibold text-foreground tabular-nums">
            {totales.consejos - totales.con_actas}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Fila / tarjeta por consejo ──────────────────────────────────────────────

function tipoTexto(c: IActasResumenConsejo): string {
  return c.tipo_consejo === 'D' ? 'Consejo Distrital' : 'Consejo Municipal';
}

/** Número de actas: al hacer clic abre la lista del consejo. */
function BotonConteo({
  valor,
  onClick,
  etiqueta,
  destacado,
}: {
  valor: number;
  onClick: () => void;
  etiqueta: string;
  destacado?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      className={[
        'inline-flex items-center justify-center min-w-8 h-7 px-1.5 rounded-md tabular-nums',
        'transition-colors duration-150 motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30',
        destacado
          ? 'font-semibold text-primary hover:bg-primary/10'
          : valor === 0
            ? 'text-muted-foreground/60 hover:bg-accent'
            : 'text-foreground hover:bg-accent',
      ].join(' ')}
    >
      {valor}
    </button>
  );
}

function ConsejoRow({
  consejo,
  onAbrir,
}: {
  consejo: IActasResumenConsejo;
  onAbrir: (c: IActasResumenConsejo) => void;
}) {
  const abrir = () => onAbrir(consejo);
  return (
    <div className="grid grid-cols-12 gap-2 items-center py-2 px-3 text-sm border-b border-border last:border-b-0 hover:bg-accent/30 transition-colors">
      <div className="col-span-3">
        <button
          type="button"
          onClick={abrir}
          className="font-medium text-foreground truncate text-left hover:text-primary focus-visible:outline-none focus-visible:underline max-w-full"
        >
          {consejo.id_consejo}. {consejo.consejo}
        </button>
        <p className="text-[0.6875rem] text-muted-foreground mt-0.5">
          {tipoTexto(consejo)}
          {consejo.con_borrador && ' · borrador abierto'}
        </p>
      </div>

      <div className="text-center">
        <BotonConteo
          valor={consejo.total}
          onClick={abrir}
          etiqueta={`Ver las ${consejo.total} actas de ${consejo.consejo}`}
          destacado
        />
      </div>

      <div className="col-span-6 grid grid-cols-6 gap-2 rounded-md border border-border bg-background py-0.5">
        {COLUMNAS.map((col) => (
          <div key={col.value} className="text-center">
            <BotonConteo
              valor={consejo[col.value]}
              onClick={abrir}
              etiqueta={`${col.label}: ${consejo[col.value]} de ${consejo.consejo}`}
            />
          </div>
        ))}
      </div>

      <div className="col-span-2 text-xs text-muted-foreground text-right">
        {consejo.ultima_generacion
          ? formatFechaHora(consejo.ultima_generacion)
          : '—'}
      </div>
    </div>
  );
}

function ConsejoMobileCard({
  consejo,
  onAbrir,
}: {
  consejo: IActasResumenConsejo;
  onAbrir: (c: IActasResumenConsejo) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onAbrir(consejo)}
      className="block w-full text-left"
    >
      <article className="border border-border rounded-lg p-4 space-y-3 bg-card">
        <header className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              #{consejo.id_consejo} · {tipoTexto(consejo)}
            </p>
            <h3 className="text-base font-semibold text-foreground mt-0.5 truncate">
              {consejo.consejo}
            </h3>
          </div>
          <span className="text-lg font-bold text-primary tabular-nums shrink-0">
            {consejo.total}
          </span>
        </header>
        <div
          className="grid grid-cols-3 gap-2"
          role="list"
          aria-label="Actas por estatus"
        >
          {COLUMNAS.map((col) => (
            <div
              key={col.value}
              role="listitem"
              className="flex flex-col items-center justify-center rounded-md p-2 bg-muted/50 text-center"
            >
              <span className="text-base font-bold text-foreground tabular-nums">
                {consejo[col.value]}
              </span>
              <span className="text-[0.625rem] font-medium text-muted-foreground leading-tight">
                {col.label}
              </span>
            </div>
          ))}
        </div>
        <footer className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {consejo.ultima_generacion
              ? `Última: ${formatFechaHora(consejo.ultima_generacion)}`
              : 'Sin actas generadas'}
            {consejo.con_borrador && ' · borrador abierto'}
          </span>
          <ChevronRight
            className="h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
        </footer>
      </article>
    </button>
  );
}

function DesktopSkeleton() {
  return (
    <div className="space-y-1" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-center py-2 px-3">
          <div className="col-span-3 space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          {Array.from({ length: 7 }, (_, j) => (
            <Skeleton key={j} className="h-4 w-8 mx-auto" />
          ))}
          <Skeleton className="col-span-2 h-3 w-28 ml-auto" />
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

const TOTALES_VACIOS: IActasResumen['totales'] = {
  consejos: 0,
  con_actas: 0,
  total: 0,
  generadas: 0,
  en_revision: 0,
  requeridas: 0,
  aceptadas: 0,
  anuladas: 0,
  descartadas: 0,
};

/**
 * Tablero de oficina central: todos los consejos del tipo aunque vayan en
 * ceros, con su número de actas y el desglose por estatus, búsqueda, filtros y
 * paginado. Al hacer clic en el número se abre la lista de actas del consejo.
 * Sin configuración vigente lo señala con acceso directo a la configuración.
 */
export function ActasAdminDashboard() {
  const { hasPermission } = useAuth();
  const { data: proceso, isLoading: isLoadingProceso } = useProceso();

  const puedeConfigurar = hasPermission(
    'documentacionymaterial.actacircunstanciada.configuracion',
  );

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

  const [estatusActivos, setEstatusActivos] = useState<TConteoConsejo[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [tamano, setTamano] = useState(30);

  const [consejoAbierto, setConsejoAbierto] =
    useState<IActasResumenConsejo | null>(null);
  const [configuracionAbierta, setConfiguracionAbierta] = useState(false);

  const { data, isLoading, isFetching, isError, refetch } = useActasResumen(
    tipoConsejo,
    !isLoadingProceso,
  );

  const consejos = useMemo(() => data?.consejos ?? [], [data]);
  const totales = data?.totales ?? TOTALES_VACIOS;

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
          c.consejo.toLowerCase().includes(q) ||
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
    setEstatusActivos([]);
    setBusqueda('');
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
      <div className="space-y-4" aria-busy="true" aria-label="Cargando actas">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-8.5 w-48 rounded-md" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return <EmptyStateErrorActas onReintentar={() => refetch()} />;
  }

  const hayFiltros = estatusActivos.length > 0 || busqueda.trim().length > 0;

  return (
    <div className="space-y-4">
      {!isLoading && data && !data.configuracion_lista && (
        <Alert variant="warning" icon="warning" appearance="light">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertTitle className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              No hay una configuración vigente del acta circunstanciada
              (plantilla Word y apartados de fotografías): los consejos no
              pueden generar actas.
            </span>
            {puedeConfigurar && proceso ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfiguracionAbierta(true)}
              >
                <Settings2 className="h-4 w-4" aria-hidden="true" />
                Configurar acta
              </Button>
            ) : (
              <span className="text-xs">
                Pide a un administrador que la registre desde Procesos.
              </span>
            )}
          </AlertTitle>
        </Alert>
      )}

      <ResumenEstado
        totales={totales}
        tipoLabel={tipoLabel}
        isLoading={isLoading}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3 lg:shrink-0">
          <TipoConsejoPills
            opciones={pillsDisponibles}
            value={tipoConsejo}
            onChange={cambiarTipo}
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
        {/* Encabezado: búsqueda, contador y configuración */}
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

          {puedeConfigurar && proceso && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfiguracionAbierta(true)}
            >
              <Settings2 className="h-4 w-4" aria-hidden="true" />
              Configuración del acta
            </Button>
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
                    onAbrir={setConsejoAbierto}
                  />
                ))
              )}
            </div>

            {/* Escritorio: tabla */}
            <div className="hidden md:block overflow-x-auto">
              <div className="min-w-[980px]">
                <div className="grid grid-cols-12 gap-2 items-center py-2 px-3 text-xs font-medium text-muted-foreground border-b border-border bg-muted/40">
                  <div className="col-span-3">Consejo</div>
                  <div className="text-center">Actas</div>
                  <div className="col-span-6 grid grid-cols-6 gap-2 rounded-md border border-border bg-background py-1">
                    {COLUMNAS.map((col) => (
                      <div key={col.value} className="text-center">
                        {col.label}
                      </div>
                    ))}
                  </div>
                  <div className="col-span-2 text-right">Última generación</div>
                </div>
                {isLoading ? (
                  <DesktopSkeleton />
                ) : (
                  paginados.map((c) => (
                    <ConsejoRow
                      key={`${c.tipo_consejo}-${c.id_consejo}`}
                      consejo={c}
                      onAbrir={setConsejoAbierto}
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

      <ActasConsejoDialog
        consejo={consejoAbierto}
        open={consejoAbierto != null}
        onOpenChange={(v) => {
          if (!v) setConsejoAbierto(null);
        }}
      />

      {puedeConfigurar && proceso && (
        <ProcesoConfiguracionesDialog
          proceso={proceso}
          open={configuracionAbierta}
          onOpenChange={setConfiguracionAbierta}
        />
      )}
    </div>
  );
}
