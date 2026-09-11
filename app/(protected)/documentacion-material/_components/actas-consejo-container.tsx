'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, FilePlus2, Info, Loader2, Search, X } from 'lucide-react';
import type { IActaResumen } from '@/types/material-electoral';
import { useAuth } from '@/providers/auth-provider';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useAbrirBorrador,
  useActasConsejo,
  useDescargarDocumentoActa,
  useDescargarFirmadaActa,
} from '../_hooks/use-actas';
import { ActaDescartarDialog } from './acta-descartar-dialog';
import { ActaDetalleDialog, type TActaAccion } from './acta-detalle-dialog';
import { ActaFirmadaDialog } from './acta-firmada-dialog';
import { ActaGeneradorDialog } from './acta-generador-dialog';
import { EmptyStateErrorActas, EmptyStateSinActas } from './actas-empty-state';
import { ActasTable } from './actas-table';

/**
 * Actas del consejo: lista ordenada por fecha de creación con quién la generó,
 * su estatus y el documento (el PDF firmado cuando ya lo subió, si no el Word
 * generado); el generador en ventana, el detalle y las acciones sobre el acta.
 */
export function ActasConsejoContainer() {
  const { user, hasPermission } = useAuth();

  const tipoConsejo = (
    user?.tipoConsejo === 'D' || user?.tipoConsejo === 'M'
      ? user.tipoConsejo
      : null
  ) as 'D' | 'M' | null;
  const idConsejo = user?.idConsejo ? Number(user.idConsejo) : null;

  const puedeRegistrar = hasPermission(
    'documentacionymaterial.actacircunstanciada.registrar',
  );
  const puedeImprimir = hasPermission(
    'documentacionymaterial.actacircunstanciada.imprimir',
  );

  const { data, isLoading, isFetching, isError, refetch } = useActasConsejo(
    tipoConsejo,
    idConsejo,
  );

  const abrirBorrador = useAbrirBorrador();
  const verDocumento = useDescargarDocumentoActa();
  const verFirmada = useDescargarFirmadaActa();

  // ── Ventanas ──────────────────────────────────────────────────────────────
  /** Acta abierta en el generador: el borrador recién creado o una Generada/Requerido a editar. */
  const [generadorId, setGeneradorId] = useState<number | null>(null);
  const [detalleId, setDetalleId] = useState<number | null>(null);
  const [firmadaActa, setFirmadaActa] = useState<TActaAccion | null>(null);
  const [descartarActa, setDescartarActa] = useState<TActaAccion | null>(null);

  const [busqueda, setBusqueda] = useState('');

  const actas = useMemo(() => data?.actas ?? [], [data]);

  const dataFinal = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return actas;
    return actas.filter(
      (a) =>
        a.estatus_desc?.toLowerCase().includes(q) ||
        a.usuario_genero?.toLowerCase().includes(q) ||
        a.ciudad?.toLowerCase().includes(q) ||
        a.lugar?.toLowerCase().includes(q) ||
        String(a.id).includes(q),
    );
  }, [actas, busqueda]);

  // El motivo de bloqueo lo decide la API: sin configuración vigente o con un
  // acta abierta (Generada, En revisión o Requerido) no se genera otra.
  const motivoBloqueo = !puedeRegistrar
    ? 'Tu cuenta no tiene permiso para generar actas.'
    : (data?.bloqueo ?? null);
  const hayBorrador = !!data?.borrador;

  function handleGenerar() {
    abrirBorrador.mutate(undefined, {
      onSuccess: (acta) => setGeneradorId(acta.id),
    });
  }

  function handleVerDocumento(acta: IActaResumen) {
    if (acta.archivo_firmado) verFirmada.mutate(acta.id);
    else if (acta.archivo_generado) verDocumento.mutate(acta.id);
  }

  if (isError) {
    return <EmptyStateErrorActas onReintentar={() => refetch()} />;
  }

  const botonGenerar = (
    <Button
      onClick={handleGenerar}
      disabled={isLoading || !!motivoBloqueo || abrirBorrador.isPending}
      aria-busy={abrirBorrador.isPending}
      className="min-h-[40px]"
    >
      {abrirBorrador.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <FilePlus2 className="h-4 w-4" aria-hidden="true" />
      )}
      {hayBorrador ? 'Retomar borrador' : 'Generar acta'}
    </Button>
  );

  const headerContent = (
    <div className="flex flex-wrap items-center gap-2 w-full">
      <div className="relative w-full sm:w-80">
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por estatus, quien generó, ciudad o lugar..."
          disabled={isLoading}
          className="pl-9 pr-9"
          aria-label="Buscar actas"
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
      <div className="ml-auto">
        {motivoBloqueo ? (
          <Tooltip>
            {/* El botón deshabilitado no recibe eventos: el envoltorio sí. */}
            <TooltipTrigger asChild>
              <span tabIndex={0} className="inline-flex">
                {botonGenerar}
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              {motivoBloqueo}
            </TooltipContent>
          </Tooltip>
        ) : (
          botonGenerar
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {!isLoading && data && !data.configuracion_lista && (
        <Alert variant="warning" icon="warning" appearance="light">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertTitle>
            No hay una configuración vigente del acta circunstanciada (plantilla
            Word y apartados de fotografías). Solicita a oficina central que la
            registre para poder generar actas.
          </AlertTitle>
        </Alert>
      )}

      {!isLoading && data && data.configuracion_lista && data.bloqueo && (
        <Alert variant="info" icon="info" appearance="light">
          <AlertIcon>
            <Info />
          </AlertIcon>
          <AlertTitle>{data.bloqueo}</AlertTitle>
        </Alert>
      )}

      {!isLoading && data && !data.bloqueo && data.pendientes > 0 && (
        <Alert variant="info" icon="info" appearance="light">
          <AlertIcon>
            <Info />
          </AlertIcon>
          <AlertTitle>
            Hay {data.pendientes}{' '}
            {data.pendientes === 1
              ? 'renglón comprobado que ningún acta aceptada ampara'
              : 'renglones comprobados que ningún acta aceptada ampara'}
            . Conviene generar un acta cuando termines la comprobación.
          </AlertTitle>
        </Alert>
      )}

      <div
        className={[
          'transition-opacity duration-150 motion-reduce:transition-none',
          isFetching && !isLoading ? 'opacity-60' : 'opacity-100',
        ].join(' ')}
      >
        <ActasTable
          data={dataFinal}
          isLoading={isLoading}
          emptyContent={
            actas.length === 0 && !isLoading ? (
              <EmptyStateSinActas />
            ) : (
              <EmptyStateSinActas busqueda />
            )
          }
          headerContent={headerContent}
          onVerDetalle={(a) => setDetalleId(a.id)}
          onVerDocumento={puedeImprimir ? handleVerDocumento : undefined}
          documentoPendiente={
            verDocumento.isPending || verFirmada.isPending
              ? (verDocumento.variables ?? verFirmada.variables ?? null)
              : null
          }
        />
      </div>

      <ActaGeneradorDialog
        idActa={generadorId}
        open={generadorId != null}
        onOpenChange={(v) => {
          if (!v) setGeneradorId(null);
        }}
      />

      <ActaDetalleDialog
        idActa={detalleId}
        open={detalleId != null}
        onOpenChange={(v) => {
          if (!v) setDetalleId(null);
        }}
        puedeRegistrar={puedeRegistrar}
        puedeImprimir={puedeImprimir}
        onEditar={(id) => {
          setDetalleId(null);
          setGeneradorId(id);
        }}
        onSubirFirmada={(acta) => setFirmadaActa(acta)}
        onDescartar={(acta) => setDescartarActa(acta)}
      />

      <ActaFirmadaDialog
        acta={firmadaActa}
        open={firmadaActa != null}
        onOpenChange={(v) => {
          if (!v) setFirmadaActa(null);
        }}
      />

      <ActaDescartarDialog
        acta={descartarActa}
        open={descartarActa != null}
        onOpenChange={(v) => {
          if (!v) setDescartarActa(null);
        }}
        onDescartada={() => setDetalleId(null)}
      />
    </div>
  );
}
