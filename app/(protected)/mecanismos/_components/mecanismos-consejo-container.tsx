'use client';

import { useMemo, useState } from 'react';
import { Info, Search, Users, X } from 'lucide-react';
import type { IMecanismoLista, TTipoMecanismo } from '@/types/mecanismos';
import { useAuth } from '@/providers/auth-provider';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChipFiltro } from '@/components/common/chip-filtro';
import { ErrorState } from '@/components/common/error-state';
import { EstadoVacio } from '@/components/common/estado-vacio';
import { useMecanismos } from '../_hooks/use-mecanismos';
import { TIPO_MECANISMO_CORTO } from '../_lib/estatus';
import { CaesDialog } from './caes-dialog';
import { InformarMecanismoDialog } from './informar-mecanismo-dialog';
import {
  MecanismoVentanas,
  type TVentanaMecanismo,
} from './mecanismo-ventanas';
import { MecanismosTable } from './mecanismos-table';

interface MecanismosConsejoContainerProps {
  tipoConsejo: 'D' | 'M';
  idConsejo: number;
  /** Nombre del consejo, para que cada renglón se lea desde él. */
  nombreConsejo: string;
}

type TFiltroInforme = 'informados' | 'sin_informar';

const TIPOS: TTipoMecanismo[] = ['DAT', 'CRYT_FIJO', 'CRYT_ITINERANTE'];

/**
 * Mecanismos que informa el consejo: lista con sus casillas, el informe (CAE,
 * costo estimado, observaciones según su configuración) y el estatus de la
 * cédula. Oficina central la monta desde su tablero para ver y administrar
 * los mecanismos de un consejo (editar, observaciones, estatus).
 */
export function MecanismosConsejoContainer({
  tipoConsejo,
  idConsejo,
  nombreConsejo,
}: MecanismosConsejoContainerProps) {
  const { user, hasPermission } = useAuth();

  // El API toma el consejo del token; los parámetros solo los usa oficina central.
  const esConsejo = Number(user?.idConsejo) > 0;
  const puedeInformar = esConsejo && hasPermission('mecanismos.informar');
  const puedeAdministrar =
    !esConsejo && hasPermission('mecanismos.administrar');

  const { data, isLoading, isFetching, isError, refetch } = useMecanismos(
    esConsejo ? {} : { tipoConsejo, idConsejo },
  );

  const [busqueda, setBusqueda] = useState('');
  const [tiposActivos, setTiposActivos] = useState<TTipoMecanismo[]>([]);
  const [filtroInforme, setFiltroInforme] = useState<TFiltroInforme | null>(
    null,
  );
  const [informarId, setInformarId] = useState<number | null>(null);
  const [ventana, setVentana] = useState<TVentanaMecanismo>(null);
  const [caesAbierto, setCaesAbierto] = useState(false);

  const mecanismos = useMemo(() => data ?? [], [data]);

  const conteos = useMemo(() => {
    const porTipo = { DAT: 0, CRYT_FIJO: 0, CRYT_ITINERANTE: 0 };
    let informados = 0;
    for (const m of mecanismos) {
      porTipo[m.tipo] += 1;
      if (m.informado) informados += 1;
    }
    return { porTipo, informados, sinInformar: mecanismos.length - informados };
  }, [mecanismos]);

  const dataFinal = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return mecanismos.filter((m) => {
      if (tiposActivos.length > 0 && !tiposActivos.includes(m.tipo)) {
        return false;
      }
      if (filtroInforme === 'informados' && !m.informado) return false;
      if (filtroInforme === 'sin_informar' && m.informado) return false;
      if (!q) return true;
      return (
        String(m.numero).includes(q) ||
        (m.secciones ?? '').toLowerCase().includes(q) ||
        (m.casillas_texto ?? '').toLowerCase().includes(q) ||
        (m.municipios ?? '').toLowerCase().includes(q) ||
        (m.cae_folio ?? '').toLowerCase().includes(q) ||
        (m.cae_nombre ?? '').toLowerCase().includes(q)
      );
    });
  }, [mecanismos, busqueda, tiposActivos, filtroInforme]);

  const hayFiltros =
    busqueda.trim().length > 0 || tiposActivos.length > 0 || !!filtroInforme;

  function limpiarFiltros() {
    setBusqueda('');
    setTiposActivos([]);
    setFiltroInforme(null);
  }

  // Las banderas efectivas del consejo vienen en cada renglón; alcanza con el primero.
  const capturaCosto = mecanismos[0]?.captura_costo ?? tipoConsejo === 'M';
  const asignaCae = mecanismos[0]?.asigna_cae ?? tipoConsejo === 'M';

  const mecanismoInformar = mecanismos.find((m) => m.id === informarId) ?? null;

  if (isError) {
    return (
      <ErrorState
        title="No se pudieron cargar los mecanismos."
        onRetry={() => refetch()}
      />
    );
  }

  const headerContent = (
    <div className="flex flex-col gap-3 w-full lg:flex-row lg:items-center">
      <div className="relative w-full lg:w-80">
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por número, sección, casilla, municipio o CAE..."
          disabled={isLoading}
          className="pl-9 pr-9"
          aria-label="Buscar mecanismos"
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
        aria-label="Filtrar por tipo e informe"
      >
        {TIPOS.map((t) => (
          <ChipFiltro
            key={t}
            activo={tiposActivos.includes(t)}
            disabled={isLoading}
            onClick={() =>
              setTiposActivos((prev) =>
                prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
              )
            }
          >
            {TIPO_MECANISMO_CORTO[t]}
            <span className="tabular-nums font-semibold">
              {conteos.porTipo[t]}
            </span>
          </ChipFiltro>
        ))}
        <span className="w-px bg-border mx-1" aria-hidden="true" />
        <ChipFiltro
          activo={filtroInforme === 'informados'}
          disabled={isLoading}
          onClick={() =>
            setFiltroInforme((f) => (f === 'informados' ? null : 'informados'))
          }
        >
          Informados
          <span className="tabular-nums font-semibold">
            {conteos.informados}
          </span>
        </ChipFiltro>
        <ChipFiltro
          activo={filtroInforme === 'sin_informar'}
          disabled={isLoading}
          onClick={() =>
            setFiltroInforme((f) =>
              f === 'sin_informar' ? null : 'sin_informar',
            )
          }
        >
          Sin informar
          <span className="tabular-nums font-semibold">
            {conteos.sinInformar}
          </span>
        </ChipFiltro>
      </div>

      {asignaCae && (
        <div className="lg:ml-auto">
          <Button
            variant="outline"
            onClick={() => setCaesAbierto(true)}
            disabled={isLoading}
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            Catálogo de CAE
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {!isLoading && esConsejo && conteos.sinInformar > 0 && (
        <Alert variant="info" icon="info" appearance="light">
          <AlertIcon>
            <Info />
          </AlertIcon>
          <AlertTitle>
            Tienes {conteos.sinInformar}{' '}
            {conteos.sinInformar === 1
              ? 'mecanismo sin informar'
              : 'mecanismos sin informar'}
            . Captura{asignaCae ? ' el CAE,' : ''}
            {capturaCosto ? ' el costo estimado y' : ''} las observaciones de
            cada uno con el botón «Informar».
          </AlertTitle>
        </Alert>
      )}

      <div
        className={[
          'transition-opacity duration-150 motion-reduce:transition-none',
          isFetching && !isLoading ? 'opacity-60' : 'opacity-100',
        ].join(' ')}
      >
        <MecanismosTable
          modo={esConsejo ? 'consejo' : 'admin'}
          consejo={nombreConsejo}
          tipoConsejo={tipoConsejo}
          data={dataFinal}
          isLoading={isLoading}
          headerContent={headerContent}
          emptyContent={
            <EstadoVacio
              titulo={
                hayFiltros
                  ? 'Ningún mecanismo coincide'
                  : 'Sin mecanismos asignados'
              }
              descripcion={
                hayFiltros
                  ? 'Prueba con otro tipo, sección o CAE.'
                  : 'Oficina central todavía no registra mecanismos que informe este consejo.'
              }
              busqueda={hayFiltros}
              onLimpiar={limpiarFiltros}
            />
          }
          onVerDetalle={(m) => setVentana({ tipo: 'detalle', id: m.id })}
          onInformar={puedeInformar ? (m) => setInformarId(m.id) : undefined}
          onEditar={
            puedeAdministrar
              ? (m) => setVentana({ tipo: 'editar', id: m.id })
              : undefined
          }
        />
      </div>

      <InformarMecanismoDialog
        mecanismo={mecanismoInformar as IMecanismoLista | null}
        capturaCosto={capturaCosto}
        asignaCae={asignaCae}
        open={informarId != null}
        onOpenChange={(v) => {
          if (!v) setInformarId(null);
        }}
      />

      <MecanismoVentanas
        ventana={ventana}
        onChange={setVentana}
        puedeAdministrar={puedeAdministrar}
      />

      <CaesDialog
        open={caesAbierto}
        onOpenChange={setCaesAbierto}
        tipoConsejo={tipoConsejo}
        idConsejo={idConsejo}
      />
    </div>
  );
}
