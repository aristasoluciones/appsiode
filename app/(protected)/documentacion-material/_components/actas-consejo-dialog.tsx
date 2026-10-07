'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type {
  IActaResumen,
  IActasResumenConsejo,
} from '@/types/material-electoral';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  useActasConsejo,
  useDescargarDocumentoActa,
} from '../_hooks/use-actas';
import { ActaDetalleDialog, type TActaAccion } from './acta-detalle-dialog';
import { useVisorActaFirmada } from './acta-firmada-visor';
import { ActaRevisionDialog, type TRevisionActa } from './acta-revision-dialog';
import { EmptyStateErrorActas, EmptyStateSinActas } from './actas-empty-state';
import { ActasTable } from './actas-table';

interface ActasConsejoDialogProps {
  consejo: Pick<
    IActasResumenConsejo,
    'tipo_consejo' | 'id_consejo' | 'consejo'
  > | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Oficina central: actas de un consejo ordenadas por fecha de creación, con
 * quién las generó, su estatus y el documento; desde aquí el detalle con el PDF
 * firmado para enviar observaciones, aceptar o anular.
 */
export function ActasConsejoDialog({
  consejo,
  open,
  onOpenChange,
}: ActasConsejoDialogProps) {
  const { hasPermission } = useAuth();

  const puedeImprimir = hasPermission(
    'documentacionymaterial.actacircunstanciada.imprimir',
  );
  const puedeRevisar = hasPermission(
    'documentacionymaterial.actacircunstanciada.validar',
  );
  const puedeAnular = hasPermission(
    'documentacionymaterial.actacircunstanciada.anular',
  );

  const { data, isLoading, isFetching, isError, refetch } = useActasConsejo(
    open ? (consejo?.tipo_consejo ?? null) : null,
    open ? (consejo?.id_consejo ?? null) : null,
  );

  const verDocumento = useDescargarDocumentoActa();
  const visorFirmada = useVisorActaFirmada();

  const [busqueda, setBusqueda] = useState('');
  const [detalleId, setDetalleId] = useState<number | null>(null);
  const [revision, setRevision] = useState<{
    acta: TActaAccion;
    accion: TRevisionActa;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    setBusqueda('');
    setDetalleId(null);
    setRevision(null);
  }, [open]);

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

  function handleVerDocumento(acta: IActaResumen) {
    if (acta.archivo_generado) verDocumento.mutate(acta.id);
  }

  const tipoTexto = consejo?.tipo_consejo === 'D' ? 'Distrital' : 'Municipal';

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
          aria-label="Buscar actas del consejo"
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
      {!!data?.borradores?.length && (
        <span className="text-xs text-muted-foreground">
          El consejo tiene {data.borradores.length}{' '}
          {data.borradores.length === 1
            ? 'borrador abierto'
            : 'borradores abiertos'}
          .
        </span>
      )}
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="pr-8">
            <DialogTitle>
              Actas del Consejo {tipoTexto}{' '}
              {consejo ? `${consejo.id_consejo}. ${consejo.consejo}` : ''}
            </DialogTitle>
            <DialogDescription>
              De la más reciente a la más antigua. Consulta el acta firmada
              desde su acción y abre el detalle para enviar observaciones,
              aceptar o anular.
            </DialogDescription>
          </DialogHeader>

          {isError ? (
            <EmptyStateErrorActas onReintentar={() => refetch()} />
          ) : (
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
                onVerFirmada={puedeImprimir ? visorFirmada.abrir : undefined}
                documentoPendiente={
                  verDocumento.isPending
                    ? (verDocumento.variables ?? null)
                    : null
                }
                onVerSustituida={(id) => setDetalleId(id)}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Oficina central no registra: sin editar, descartar ni subir el PDF. */}
      <ActaDetalleDialog
        idActa={detalleId}
        open={detalleId != null}
        onOpenChange={(v) => {
          if (!v) setDetalleId(null);
        }}
        puedeRegistrar={false}
        puedeImprimir={puedeImprimir}
        onEditar={() => undefined}
        onDescartar={() => undefined}
        puedeRevisar={puedeRevisar}
        puedeAnular={puedeAnular}
        onRevisar={(acta, accion) => setRevision({ acta, accion })}
        onVerSustituida={(id) => setDetalleId(id)}
      />

      {visorFirmada.visor}

      <ActaRevisionDialog
        acta={revision?.acta ?? null}
        accion={revision?.accion ?? null}
        onOpenChange={(v) => {
          if (!v) setRevision(null);
        }}
      />
    </>
  );
}
