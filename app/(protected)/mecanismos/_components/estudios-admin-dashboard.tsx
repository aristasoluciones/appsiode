'use client';

import { useMemo, useState } from 'react';
import { Download, FilePlus2, Search, X } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AccessDenied } from '@/components/common/access-denied';
import { ErrorState } from '@/components/common/error-state';
import { useEstudiosAvance } from '../_hooks/use-estudios';
import {
  etapaDe,
  ETAPAS_FLUJO,
  type TEtapaEstudio,
} from '../_lib/etapas-estudio';
import { EstudioPanel } from './estudio-panel';
import { EstudioVentanas, type TVentanaEstudio } from './estudio-ventanas';
import { EstudiosAvanceTable } from './estudios-avance-table';
import { EstudiosEtapas } from './estudios-etapas';
import { ExportarEstudiosDialog } from './exportar-estudios-dialog';

/** Fija la lista y el panel bajo el encabezado de la página en pantallas anchas. */
const STICKY =
  'xl:sticky xl:top-[calc(var(--header-height,70px)+1rem)] xl:self-start';

const ETAPAS: TEtapaEstudio[] = [...ETAPAS_FLUJO, 'ANULADO'];

/**
 * Apartado de avance de los estudios de factibilidad para oficina central:
 * etapas del flujo (conteo y filtro a la vez), buscador y la tabla en el orden
 * de los distritos federales (01 a 13); todo en pantalla.
 */
export function EstudiosAdminDashboard() {
  const { hasPermission } = useAuth();
  const puedeBandeja = hasPermission('mecanismos.factibilidad.bandeja');
  const permisos = {
    proponer: hasPermission('mecanismos.factibilidad.proponer'),
    aprobar: hasPermission('mecanismos.factibilidad.aprobar'),
    anular: hasPermission('mecanismos.factibilidad.anular'),
  };
  const puedeExportar = hasPermission('mecanismos.factibilidad.exportar');
  const puedeRevocar = hasPermission('mecanismos.factibilidad.revocar');

  const { data, isLoading, isFetching, isError, refetch } =
    useEstudiosAvance(puedeBandeja);
  const [exportarAbierto, setExportarAbierto] = useState(false);

  const [busqueda, setBusqueda] = useState('');
  const [etapasActivas, setEtapasActivas] = useState<TEtapaEstudio[]>([]);
  const [ventana, setVentana] = useState<TVentanaEstudio>(null);
  // Estudio con el detalle abierto a la derecha de la lista.
  const [panelId, setPanelId] = useState<number | null>(null);

  const distritos = useMemo(() => data?.distritos ?? [], [data]);

  const conteos = useMemo(() => {
    const c = Object.fromEntries(ETAPAS.map((k) => [k, 0])) as Record<
      TEtapaEstudio,
      number
    >;
    for (const d of distritos) c[etapaDe(d)] += 1;
    return c;
  }, [distritos]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    // El hook ya los entrega en el orden del distrito federal; el filtro lo conserva.
    return distritos.filter((d) => {
      if (etapasActivas.length > 0 && !etapasActivas.includes(etapaDe(d)))
        return false;
      return (
        !q || String(d.id_df).includes(q) || d.df.toLowerCase().includes(q)
      );
    });
  }, [distritos, busqueda, etapasActivas]);

  const hayFiltros = busqueda.trim().length > 0 || etapasActivas.length > 0;

  function limpiarFiltros() {
    setBusqueda('');
    setEtapasActivas([]);
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
          onClick={() => setExportarAbierto(true)}
          disabled={isLoading}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
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

  // Búsqueda a la izquierda del encabezado de la tabla.
  const buscador = (
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
  );

  return (
    <div className="space-y-4">
      <EstudiosEtapas
        conteos={conteos}
        activas={etapasActivas}
        isLoading={isLoading}
        onAlternar={(etapa) =>
          setEtapasActivas((prev) =>
            prev.includes(etapa)
              ? prev.filter((x) => x !== etapa)
              : [...prev, etapa],
          )
        }
      />

      {/* Con un estudio abierto, la lista queda a la izquierda y su detalle a la derecha. */}
      <div
        className={
          panelId
            ? 'grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(420px,48%)] items-start'
            : ''
        }
      >
        {panelId && (
          <div className={`xl:order-2 ${STICKY}`}>
            <EstudioPanel
              idEstudio={panelId}
              onCerrar={() => setPanelId(null)}
              onHistorial={(id) => setVentana({ tipo: 'historial', id })}
              onRevocar={
                puedeRevocar
                  ? (e, consejo) =>
                      setVentana({
                        tipo: 'revocar',
                        id: e.id,
                        consejo,
                      })
                  : undefined
              }
            />
          </div>
        )}
        <div
          className={[
            'min-w-0 transition-opacity duration-150 motion-reduce:transition-none',
            isFetching && !isLoading ? 'opacity-60' : 'opacity-100',
            panelId
              ? `${STICKY} xl:max-h-[calc(100vh-var(--header-height,70px)-2rem)] xl:overflow-y-auto`
              : '',
          ].join(' ')}
        >
          <EstudiosAvanceTable
            compacto={!!panelId}
            seleccionadoId={panelId}
            onSeleccionar={(d) => d.id && setPanelId(d.id)}
            distritos={filtrados}
            isLoading={isLoading}
            hayFiltros={hayFiltros}
            onLimpiarFiltros={limpiarFiltros}
            permisos={permisos}
            onProponer={(d) => setVentana({ tipo: 'proponer', distrito: d })}
            onAprobar={(d) => setVentana({ tipo: 'aprobar', distrito: d })}
            onAnular={(d) => setVentana({ tipo: 'anular', distrito: d })}
            onVerDetalle={(d) => d.id && setPanelId(d.id)}
            onVerDocumentos={(d) =>
              setVentana({ tipo: 'documentos', distrito: d })
            }
            acciones={acciones}
            buscador={buscador}
          />
        </div>
      </div>

      {puedeExportar && (
        <ExportarEstudiosDialog
          open={exportarAbierto}
          onOpenChange={setExportarAbierto}
          distritos={distritos}
          visibles={filtrados}
        />
      )}

      <EstudioVentanas
        ventana={ventana}
        onChange={setVentana}
        distritos={distritos}
        puedeRevocar={puedeRevocar}
        puedeReemplazar={permisos.proponer}
      />
    </div>
  );
}
