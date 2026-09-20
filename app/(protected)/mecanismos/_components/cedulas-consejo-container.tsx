'use client';

import { useMemo, useState } from 'react';
import {
  Ban,
  CheckCircle2,
  Download,
  FileCheck2,
  FilePlus2,
  LoaderCircleIcon,
  Lock,
  Replace,
  Search,
  X,
} from 'lucide-react';
import type { ICedulaConsejo, TCedulaEstatus } from '@/types/mecanismos';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BotonAccion } from '@/components/common/boton-accion';
import { ChipFiltro } from '@/components/common/chip-filtro';
import { ErrorState } from '@/components/common/error-state';
import { EstadoVacio } from '@/components/common/estado-vacio';
import { VisorPdfDialog } from '@/components/common/visor-pdf-dialog';
import {
  useCedulasConsejo,
  useUrlDocumentoCedula,
} from '../_hooks/use-cedulas';
import { useDescargarReporteCedulasConsejo } from '../_hooks/use-mecanismos-reportes';
import { claveMecanismo, ESTATUS_CEDULA } from '../_lib/estatus';
import { CedulaVentanas, type TVentanaCedula } from './cedula-ventanas';
import { CedulasTable } from './cedulas-table';

interface CedulasConsejoContainerProps {
  tipoConsejo: 'D' | 'M';
  idConsejo: number;
  nombreConsejo: string;
}

const ESTATUS: TCedulaEstatus[] = [
  'SIN_CEDULA',
  'PROPUESTA',
  'INFORMADA',
  'APROBADA',
  'CERRADA',
  'ANULADA',
];

/**
 * Cédulas del consejo: una fila por mecanismo vinculado, con la acción que
 * admite (informar o acusar). Oficina central la monta desde su tablero y
 * opera el ciclo: proponer, reemplazar, aprobar, cerrar y anular.
 */
export function CedulasConsejoContainer({
  tipoConsejo,
  idConsejo,
  nombreConsejo,
}: CedulasConsejoContainerProps) {
  const { user, hasPermission } = useAuth();
  const esConsejo = Number(user?.idConsejo) > 0;

  const puedeInformar =
    esConsejo && hasPermission('mecanismos.cedulas.informar');
  const puedeAcusar = esConsejo && hasPermission('mecanismos.cedulas.acusar');
  const puedeDescargar = hasPermission('mecanismos.cedulas.descargar');
  const puedeProponer =
    !esConsejo && hasPermission('mecanismos.cedulas.proponer');
  const puedeReemplazar =
    !esConsejo && hasPermission('mecanismos.cedulas.reemplazar-documento');
  const puedeAprobar =
    !esConsejo && hasPermission('mecanismos.cedulas.aprobar');
  const puedeAnular = !esConsejo && hasPermission('mecanismos.anular');
  const puedeExportar = hasPermission('mecanismos.exportar');

  const { data, isLoading, isFetching, isError, refetch } = useCedulasConsejo(
    tipoConsejo,
    idConsejo,
  );
  const urlDocumento = useUrlDocumentoCedula();
  // Documento abierto en el visor; la URL firmada llega por la mutación.
  const [visor, setVisor] = useState<{
    cedula: ICedulaConsejo;
    cual: 'propuesta' | 'aprobada';
  } | null>(null);
  const exportar = useDescargarReporteCedulasConsejo();

  const [busqueda, setBusqueda] = useState('');
  const [estatusActivos, setEstatusActivos] = useState<TCedulaEstatus[]>([]);
  const [ventana, setVentana] = useState<TVentanaCedula>(null);

  const cedulas = useMemo(() => data ?? [], [data]);

  const conteos = useMemo(() => {
    const c = Object.fromEntries(ESTATUS.map((e) => [e, 0])) as Record<
      TCedulaEstatus,
      number
    >;
    for (const x of cedulas) c[x.cedula_estatus] += 1;
    return c;
  }, [cedulas]);

  const dataFinal = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return cedulas.filter((c) => {
      if (
        estatusActivos.length > 0 &&
        !estatusActivos.includes(c.cedula_estatus)
      )
        return false;
      if (!q) return true;
      return (
        String(c.numero).includes(q) ||
        (c.secciones_propias ?? '').toLowerCase().includes(q) ||
        (c.casillas_propias_texto ?? '').toLowerCase().includes(q) ||
        c.tipo_desc.toLowerCase().includes(q)
      );
    });
  }, [cedulas, busqueda, estatusActivos]);

  const hayFiltros = busqueda.trim().length > 0 || estatusActivos.length > 0;

  function limpiarFiltros() {
    setBusqueda('');
    setEstatusActivos([]);
  }

  const accionesAdmin = esConsejo
    ? undefined
    : (c: ICedulaConsejo) => {
        const e = c.cedula_estatus;
        return (
          <>
            {puedeProponer && (e === 'SIN_CEDULA' || e === 'ANULADA') && (
              <BotonAccion
                etiqueta="Proponer cédula"
                onClick={() => setVentana({ tipo: 'proponer', cedula: c })}
              >
                <FilePlus2 className="h-4 w-4" aria-hidden="true" />
              </BotonAccion>
            )}
            {puedeReemplazar && (e === 'PROPUESTA' || e === 'INFORMADA') && (
              <BotonAccion
                etiqueta="Reemplazar propuesta"
                onClick={() => setVentana({ tipo: 'reemplazar', cedula: c })}
              >
                <Replace className="h-4 w-4" aria-hidden="true" />
              </BotonAccion>
            )}
            {puedeAprobar && e === 'INFORMADA' && (
              <BotonAccion
                etiqueta="Aprobar cédula"
                onClick={() => setVentana({ tipo: 'aprobar', cedula: c })}
              >
                <FileCheck2
                  className="h-4 w-4 text-success"
                  aria-hidden="true"
                />
              </BotonAccion>
            )}
            {puedeAprobar && e === 'APROBADA' && (
              <BotonAccion
                etiqueta="Cerrar cédula"
                onClick={() => setVentana({ tipo: 'cerrar', cedula: c })}
              >
                <Lock className="h-4 w-4" aria-hidden="true" />
              </BotonAccion>
            )}
            {puedeAnular && e !== 'SIN_CEDULA' && e !== 'ANULADA' && (
              <BotonAccion
                etiqueta="Anular cédula"
                onClick={() => setVentana({ tipo: 'anular', cedula: c })}
              >
                <Ban className="h-4 w-4 text-destructive" aria-hidden="true" />
              </BotonAccion>
            )}
          </>
        );
      };

  if (isError) {
    return (
      <ErrorState
        title="No se pudieron cargar las cédulas."
        onRetry={() => refetch()}
      />
    );
  }

  const headerContent = (
    <div className="flex flex-col gap-3 w-full lg:flex-row lg:items-center">
      <div className="relative w-full lg:w-72">
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por número, tipo, sección o casilla..."
          disabled={isLoading}
          className="pl-9 pr-9"
          aria-label="Buscar cédulas"
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
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label="Filtrar por estatus"
      >
        {ESTATUS.map((e) => (
          <ChipFiltro
            key={e}
            activo={estatusActivos.includes(e)}
            disabled={isLoading}
            onClick={() =>
              setEstatusActivos((prev) =>
                prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e],
              )
            }
          >
            {ESTATUS_CEDULA[e].label}
            <span className="tabular-nums font-semibold">{conteos[e]}</span>
          </ChipFiltro>
        ))}
      </div>
      {puedeExportar && (
        <div className="lg:ml-auto">
          <Button
            variant="outline"
            onClick={() => exportar.mutate({ tipoConsejo, idConsejo })}
            disabled={isLoading || exportar.isPending}
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
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div
        className={[
          'transition-opacity duration-150 motion-reduce:transition-none',
          isFetching && !isLoading ? 'opacity-60' : 'opacity-100',
        ].join(' ')}
      >
        <CedulasTable
          consejo={nombreConsejo}
          tipoConsejo={tipoConsejo}
          data={dataFinal}
          isLoading={isLoading}
          headerContent={headerContent}
          emptyContent={
            <EstadoVacio
              titulo={
                hayFiltros
                  ? 'Ninguna cédula coincide'
                  : 'Sin mecanismos vinculados'
              }
              descripcion={
                hayFiltros
                  ? 'Prueba con otro estatus o texto.'
                  : 'Cuando oficina central registre mecanismos para este consejo, aquí aparecerán sus cédulas.'
              }
              busqueda={hayFiltros}
              onLimpiar={limpiarFiltros}
              icono={hayFiltros ? undefined : <CheckCircle2 />}
            />
          }
          onVerDetalle={(c) => setVentana({ tipo: 'detalle', id: c.id })}
          onInformar={
            puedeInformar
              ? (c) => setVentana({ tipo: 'informar', cedula: c })
              : undefined
          }
          onAcusar={
            puedeAcusar
              ? (c) => setVentana({ tipo: 'acusar', cedula: c })
              : undefined
          }
          onVerDocumento={
            puedeDescargar
              ? (c, cual) => {
                  setVisor({ cedula: c, cual });
                  urlDocumento.mutate({ id: c.id, cual });
                }
              : undefined
          }
          documentoPendiente={
            urlDocumento.isPending ? (urlDocumento.variables ?? null) : null
          }
          accionesAdmin={accionesAdmin}
        />
      </div>

      <CedulaVentanas ventana={ventana} onChange={setVentana} />

      <VisorPdfDialog
        open={visor != null && !urlDocumento.isError}
        onOpenChange={(v) => !v && setVisor(null)}
        titulo={
          visor
            ? `Cédula ${visor.cual} · ${claveMecanismo(visor.cedula)}`
            : 'Cédula'
        }
        descripcion={nombreConsejo}
        url={urlDocumento.isSuccess ? urlDocumento.data : null}
        cargando={urlDocumento.isPending}
      />
    </div>
  );
}
