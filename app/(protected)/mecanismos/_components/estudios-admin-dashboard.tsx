'use client';

import { useMemo, useState } from 'react';
import { Download, FilePlus2, LoaderCircleIcon, Search, X } from 'lucide-react';
import type {
  IEstudioAvanceDistrito,
  TEstudioEstatus,
} from '@/types/mecanismos';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AccessDenied } from '@/components/common/access-denied';
import { ChipFiltro } from '@/components/common/chip-filtro';
import { ErrorState } from '@/components/common/error-state';
import { useEstudiosAvance } from '../_hooks/use-estudios';
import { useDescargarReporteEstudios } from '../_hooks/use-mecanismos-reportes';
import { ESTATUS_ESTUDIO } from '../_lib/estatus';
import {
  EstudioVentanas,
  useVisorEstudio,
  type TVentanaEstudio,
} from './estudio-ventanas';
import { EstudiosAvanceResumen } from './estudios-avance-resumen';
import { EstudiosAvanceTable } from './estudios-avance-table';

type TChip = TEstudioEstatus | 'SIN_ESTUDIO';
const CHIPS: TChip[] = [
  'SIN_ESTUDIO',
  'PROPUESTO',
  'APROBADO',
  'CERRADO',
  'ANULADO',
];

function chipDe(d: IEstudioAvanceDistrito): TChip {
  return d.estatus ?? 'SIN_ESTUDIO';
}

function conAcusesPendientes(d: IEstudioAvanceDistrito) {
  return (
    (d.estatus === 'PROPUESTO' && d.acuses_etapa1 < d.consejos) ||
    (d.estatus === 'APROBADO' && d.acuses_etapa2 < d.consejos)
  );
}

/**
 * Apartado de avance de los estudios de factibilidad para oficina central:
 * barras e indicadores sobre los 13 distritos, chips de estatus, buscador e
 * interruptor de acuses pendientes; todo el filtrado ocurre en pantalla y
 * los indicadores se recalculan sobre lo filtrado.
 */
export function EstudiosAdminDashboard() {
  const { hasPermission } = useAuth();
  const puedeBandeja = hasPermission('mecanismos.factibilidad.bandeja');
  const permisos = {
    proponer: hasPermission('mecanismos.factibilidad.proponer'),
    aprobar: hasPermission('mecanismos.factibilidad.aprobar'),
    anular: hasPermission('mecanismos.anular'),
  };
  const puedeExportar = hasPermission('mecanismos.exportar');

  const { data, isLoading, isFetching, isError, refetch } =
    useEstudiosAvance(puedeBandeja);
  const exportar = useDescargarReporteEstudios();
  const visorEstudio = useVisorEstudio();

  const [busqueda, setBusqueda] = useState('');
  const [chipsActivos, setChipsActivos] = useState<TChip[]>([]);
  const [soloPendientes, setSoloPendientes] = useState(false);
  const [ventana, setVentana] = useState<TVentanaEstudio>(null);

  const distritos = useMemo(() => data?.distritos ?? [], [data]);

  const conteos = useMemo(() => {
    const c = Object.fromEntries(CHIPS.map((k) => [k, 0])) as Record<
      TChip,
      number
    >;
    for (const d of distritos) c[chipDe(d)] += 1;
    return c;
  }, [distritos]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return distritos.filter((d) => {
      if (chipsActivos.length > 0 && !chipsActivos.includes(chipDe(d)))
        return false;
      if (soloPendientes && !conAcusesPendientes(d)) return false;
      return (
        !q || String(d.id_df).includes(q) || d.df.toLowerCase().includes(q)
      );
    });
  }, [distritos, busqueda, chipsActivos, soloPendientes]);

  const hayFiltros =
    busqueda.trim().length > 0 || chipsActivos.length > 0 || soloPendientes;

  function limpiarFiltros() {
    setBusqueda('');
    setChipsActivos([]);
    setSoloPendientes(false);
  }

  if (!puedeBandeja) {
    return (
      <AccessDenied description="Tu cuenta no tiene el permiso del resumen de estudios por distrito; pide a un administrador que lo asigne." />
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="No se pudo cargar el avance de los estudios."
        onRetry={() => refetch()}
      />
    );
  }

  const acciones = (
    <>
      {puedeExportar && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportar.mutate()}
          disabled={exportar.isPending}
        >
          {exportar.isPending ? (
            <LoaderCircleIcon
              className="h-4 w-4 animate-spin"
              aria-hidden="true"
            />
          ) : (
            <Download className="h-4 w-4" aria-hidden="true" />
          )}
          Exportar
        </Button>
      )}
      {permisos.proponer && (
        <Button
          size="sm"
          onClick={() => setVentana({ tipo: 'proponer', distrito: null })}
        >
          <FilePlus2 className="h-4 w-4" aria-hidden="true" />
          Proponer estudio
        </Button>
      )}
    </>
  );

  return (
    <div className="space-y-4">
      <EstudiosAvanceResumen
        distritos={filtrados}
        total={distritos.length}
        isLoading={isLoading}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar distrito..."
              disabled={isLoading}
              className="pl-9 pr-9"
              aria-label="Buscar distrito federal por número o nombre"
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
          <Label className="flex items-center gap-2 text-sm whitespace-nowrap">
            <Switch
              checked={soloPendientes}
              onCheckedChange={setSoloPendientes}
              disabled={isLoading}
            />
            Solo con acuses pendientes
          </Label>
        </div>
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Filtrar por estatus"
        >
          {CHIPS.map((k) => (
            <ChipFiltro
              key={k}
              activo={chipsActivos.includes(k)}
              disabled={isLoading}
              onClick={() =>
                setChipsActivos((prev) =>
                  prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
                )
              }
            >
              {ESTATUS_ESTUDIO[k].label}
              <span className="tabular-nums font-semibold">{conteos[k]}</span>
            </ChipFiltro>
          ))}
        </div>
      </div>

      <div
        className={[
          'transition-opacity duration-150 motion-reduce:transition-none',
          isFetching && !isLoading ? 'opacity-60' : 'opacity-100',
        ].join(' ')}
      >
        <EstudiosAvanceTable
          distritos={filtrados}
          isLoading={isLoading}
          hayFiltros={hayFiltros}
          onLimpiarFiltros={limpiarFiltros}
          permisos={permisos}
          onProponer={(d) => setVentana({ tipo: 'proponer', distrito: d })}
          onReemplazar={(d) => setVentana({ tipo: 'reemplazar', distrito: d })}
          onAprobar={(d) => setVentana({ tipo: 'aprobar', distrito: d })}
          onAnular={(d) => setVentana({ tipo: 'anular', distrito: d })}
          onVerDetalle={(d) =>
            d.id && setVentana({ tipo: 'detalle', id: d.id })
          }
          onVerDocumento={(d, cual) =>
            d.id && visorEstudio.abrir(d.id, d.df, cual)
          }
          documentoPendiente={visorEstudio.pendiente}
          acciones={acciones}
        />
      </div>

      <EstudioVentanas
        ventana={ventana}
        onChange={setVentana}
        distritos={distritos}
      />
      {visorEstudio.visor}
    </div>
  );
}
