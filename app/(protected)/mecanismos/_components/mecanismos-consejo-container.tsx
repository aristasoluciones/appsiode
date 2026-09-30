'use client';

import { useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import type { IMecanismoLista } from '@/types/mecanismos';
import { useAuth } from '@/providers/auth-provider';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { ErrorState } from '@/components/common/error-state';
import { EstadoVacio } from '@/components/common/estado-vacio';
import { useMecanismos } from '../_hooks/use-mecanismos';
import { CaesDialog } from './caes-dialog';
import { CargarCedulaDialog } from './cargar-cedula-dialog';
import { CedulaPanel } from './cedula-panel';
import { InformarMecanismoDialog } from './informar-mecanismo-dialog';
import {
  MecanismoVentanas,
  type TVentanaMecanismo,
} from './mecanismo-ventanas';
import {
  FILTROS_VACIOS,
  MecanismosFiltros,
  type IMecanismosConteos,
  type IMecanismosFiltrosEstado,
} from './mecanismos-filtros';
import { MecanismosTable } from './mecanismos-table';

interface MecanismosConsejoContainerProps {
  tipoConsejo: 'D' | 'M';
  idConsejo: number;
  /** Nombre del consejo, para que cada renglón se lea desde él. */
  nombreConsejo: string;
}

function contar(mecanismos: IMecanismoLista[]): IMecanismosConteos {
  const c: IMecanismosConteos = {
    porTipo: { DAT: 0, CRYT_FIJO: 0, CRYT_ITINERANTE: 0 },
    informados: 0,
    sinInformar: 0,
    conCedula: 0,
    sinCedula: 0,
  };
  for (const m of mecanismos) {
    c.porTipo[m.tipo] += 1;
    if (m.estatus === 'INFORMADO') c.informados += 1;
    else c.sinInformar += 1;
    if (m.tiene_cedula) c.conCedula += 1;
    else c.sinCedula += 1;
  }
  return c;
}

function coincide(m: IMecanismoLista, f: IMecanismosFiltrosEstado) {
  if (f.tipos.length > 0 && !f.tipos.includes(m.tipo)) return false;
  if (f.estatus && m.estatus !== f.estatus) return false;
  if (f.cedula === 'con_cedula' && !m.tiene_cedula) return false;
  if (f.cedula === 'sin_cedula' && m.tiene_cedula) return false;
  const q = f.busqueda.trim().toLowerCase();
  if (!q) return true;
  return (
    String(m.numero).includes(q) ||
    (m.secciones ?? '').toLowerCase().includes(q) ||
    (m.casillas_texto ?? '').toLowerCase().includes(q) ||
    (m.municipios ?? '').toLowerCase().includes(q) ||
    (m.cae_folio ?? '').toLowerCase().includes(q) ||
    (m.cae_nombre ?? '').toLowerCase().includes(q)
  );
}

/**
 * Mecanismos que informa el consejo: lista con sus casillas, el informe con
 * sus observaciones, el estatus y la cédula (PDF en panel lateral). Oficina
 * central la monta desde su tablero para ver y administrar los mecanismos de
 * un consejo (editar, observaciones, estatus, cargar cédula).
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
  const puedeVerCedula = hasPermission('mecanismos.cedula.ver');
  const puedeCargarCedula =
    !esConsejo && hasPermission('mecanismos.cedula.cargar');

  const { data, isLoading, isFetching, isError, refetch } = useMecanismos(
    esConsejo ? {} : { tipoConsejo, idConsejo },
  );

  const [filtros, setFiltros] =
    useState<IMecanismosFiltrosEstado>(FILTROS_VACIOS);
  const [informarId, setInformarId] = useState<number | null>(null);
  const [ventana, setVentana] = useState<TVentanaMecanismo>(null);
  // Mecanismo con la cédula a la vista en el panel derecho y el que se está cargando; son independientes.
  const [panelId, setPanelId] = useState<number | null>(null);
  const [cargarId, setCargarId] = useState<number | null>(null);
  const [caesAbierto, setCaesAbierto] = useState(false);

  const mecanismos = useMemo(() => data ?? [], [data]);
  const conteos = useMemo(() => contar(mecanismos), [mecanismos]);
  const dataFinal = useMemo(
    () => mecanismos.filter((m) => coincide(m, filtros)),
    [mecanismos, filtros],
  );

  const hayFiltros =
    filtros.busqueda.trim().length > 0 ||
    filtros.tipos.length > 0 ||
    !!filtros.estatus ||
    !!filtros.cedula;

  // Las banderas efectivas del consejo vienen en cada renglón; alcanza con el primero.
  const capturaCosto = mecanismos[0]?.captura_costo ?? tipoConsejo === 'M';
  const asignaCae = mecanismos[0]?.asigna_cae ?? tipoConsejo === 'M';

  const mecanismoInformar = mecanismos.find((m) => m.id === informarId) ?? null;
  const mecanismoPanel = mecanismos.find((m) => m.id === panelId) ?? null;
  const mecanismoCargar = mecanismos.find((m) => m.id === cargarId) ?? null;

  if (isError) {
    return (
      <ErrorState
        title="No se pudieron cargar los mecanismos."
        onRetry={() => refetch()}
      />
    );
  }

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
            . Con el botón «Informar» registra las observaciones de cada uno y,
            cuando lo consideres, márcalo como informado
            {asignaCae ? ' con su CAE' : ''}
            {capturaCosto ? ' y su costo estimado' : ''}.
          </AlertTitle>
        </Alert>
      )}

      {/* Con una cédula abierta, la lista queda a la izquierda y el PDF a la derecha. */}
      <div
        className={
          mecanismoPanel
            ? 'grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(380px,40%)] items-start'
            : ''
        }
      >
        {mecanismoPanel && (
          <div className="xl:order-2">
            <CedulaPanel
              mecanismo={mecanismoPanel}
              onCerrar={() => setPanelId(null)}
              onCargar={
                puedeCargarCedula ? (m) => setCargarId(m.id) : undefined
              }
            />
          </div>
        )}
        <div
          className={[
            'min-w-0 transition-opacity duration-150 motion-reduce:transition-none',
            isFetching && !isLoading ? 'opacity-60' : 'opacity-100',
          ].join(' ')}
        >
          <MecanismosTable
            compacto={!!mecanismoPanel}
            seleccionadoId={panelId}
            onSeleccionar={(m) => setPanelId(m.id)}
            modo={esConsejo ? 'consejo' : 'admin'}
            consejo={nombreConsejo}
            tipoConsejo={tipoConsejo}
            data={dataFinal}
            isLoading={isLoading}
            headerContent={
              <MecanismosFiltros
                filtros={filtros}
                onChange={setFiltros}
                conteos={conteos}
                disabled={isLoading}
                onCatalogoCae={
                  asignaCae ? () => setCaesAbierto(true) : undefined
                }
              />
            }
            emptyContent={
              <EstadoVacio
                titulo={
                  hayFiltros
                    ? 'Ningún mecanismo coincide'
                    : 'Sin mecanismos asignados'
                }
                descripcion={
                  hayFiltros
                    ? 'Prueba con otro tipo, estatus, sección o CAE.'
                    : 'Oficina central todavía no registra mecanismos que informe este consejo.'
                }
                busqueda={hayFiltros}
                onLimpiar={() => setFiltros(FILTROS_VACIOS)}
              />
            }
            onVerDetalle={(m) => setVentana({ tipo: 'detalle', id: m.id })}
            onInformar={puedeInformar ? (m) => setInformarId(m.id) : undefined}
            onEditar={
              puedeAdministrar
                ? (m) => setVentana({ tipo: 'editar', id: m.id })
                : undefined
            }
            onVerCedula={puedeVerCedula ? (m) => setPanelId(m.id) : undefined}
            onCargarCedula={
              puedeCargarCedula ? (m) => setCargarId(m.id) : undefined
            }
          />
        </div>
      </div>

      <InformarMecanismoDialog
        mecanismo={mecanismoInformar}
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

      {puedeCargarCedula && (
        <CargarCedulaDialog
          mecanismo={mecanismoCargar}
          open={cargarId != null}
          onOpenChange={(v) => !v && setCargarId(null)}
        />
      )}

      <CaesDialog
        open={caesAbierto}
        onOpenChange={setCaesAbierto}
        tipoConsejo={tipoConsejo}
        idConsejo={idConsejo}
      />
    </div>
  );
}
