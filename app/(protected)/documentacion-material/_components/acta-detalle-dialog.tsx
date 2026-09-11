'use client';

import { useMemo, type ReactNode } from 'react';
import {
  Ban,
  CheckCircle2,
  FileCheck2,
  FileText,
  FileUp,
  History,
  Loader2,
  MessageSquareWarning,
  Pencil,
  Trash2,
  Undo2,
} from 'lucide-react';
import type {
  IActa,
  IActaObservacion,
  IActaRenglon,
} from '@/types/material-electoral';
import { formatFechaHora } from '@/lib/fechas';
import { formatDateOnly, formatTimeOnly } from '@/lib/helpers';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Timeline,
  TimelineItem,
  type TTimelineTono,
} from '@/components/common/timeline';
import {
  useActa,
  useDescargarDocumentoActa,
  useDescargarFirmadaActa,
} from '../_hooks/use-actas';
import { actaCerrada, ESTATUS_ACTA } from './acta-estatus';
import { ActaFotografiasApartado } from './acta-fotografias-apartado';
import { piezasConPaquetes } from './comprobacion-cantidades';

/** Acta con lo mínimo que necesitan las acciones de firmar y descartar. */
export type TActaAccion = Pick<IActa, 'id' | 'estatus' | 'archivo_firmado'>;

interface ActaDetalleDialogProps {
  idActa: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  puedeRegistrar: boolean;
  puedeImprimir: boolean;
  onEditar: (id: number) => void;
  onSubirFirmada: (acta: TActaAccion) => void;
  onDescartar: (acta: TActaAccion) => void;
}

/** Marcador de cada movimiento del historial según el estatus al que llevó. */
const MARCADORES: Record<string, { icono: ReactNode; tono: TTimelineTono }> = {
  GENERADA: { icono: <FileCheck2 />, tono: 'primario' },
  EN_REVISION: { icono: <FileUp />, tono: 'info' },
  REQUERIDO: { icono: <MessageSquareWarning />, tono: 'advertencia' },
  ACEPTADA: { icono: <CheckCircle2 />, tono: 'exito' },
  ANULADA: { icono: <Ban />, tono: 'peligro' },
  DESCARTADA: { icono: <Trash2 />, tono: 'neutro' },
};

function Dato({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{children}</p>
    </div>
  );
}

/**
 * Detalle del acta: datos, participantes, renglones del corte, historial de
 * observaciones por ciclo y estatus; con las acciones que el estatus permite
 * al consejo: editar, descartar, subir el PDF firmado o volver a subirlo.
 */
export function ActaDetalleDialog({
  idActa,
  open,
  onOpenChange,
  puedeRegistrar,
  puedeImprimir,
  onEditar,
  onSubirFirmada,
  onDescartar,
}: ActaDetalleDialogProps) {
  const { data: acta, isLoading } = useActa(open ? idActa : null);
  const verDocumento = useDescargarDocumentoActa();
  const verFirmada = useDescargarFirmadaActa();

  const estatus = acta ? ESTATUS_ACTA[acta.estatus] : null;

  const presidencia = acta?.participantes.find((p) => p.tipo === 'PRESIDENCIA');
  const secretaria = acta?.participantes.find((p) => p.tipo === 'SECRETARIA');
  const consejerias =
    acta?.participantes.filter((p) => p.tipo === 'CONSEJERIA') ?? [];
  const representaciones =
    acta?.participantes.filter((p) => p.tipo === 'REPRESENTACION') ?? [];

  // Los renglones se agrupan como en el documento: documentación y material.
  const { documentacion, material } = useMemo(() => {
    const documentacion: IActaRenglon[] = [];
    const material: IActaRenglon[] = [];
    for (const r of acta?.renglones ?? []) {
      (r.tipo_doc === 'MATERIAL' ? material : documentacion).push(r);
    }
    return { documentacion, material };
  }, [acta]);

  const apartados = useMemo(
    () =>
      (acta?.configuracion.apartados ?? [])
        .filter((a) => a.activo)
        .sort((a, b) => a.orden - b.orden),
    [acta],
  );
  const fotosPorApartado = useMemo(() => {
    const mapa = new Map<string, IActa['fotografias']>();
    for (const f of acta?.fotografias ?? []) {
      const lista = mapa.get(f.apartado) ?? [];
      lista.push(f);
      mapa.set(f.apartado, lista);
    }
    return mapa;
  }, [acta]);

  const puedeEditar =
    puedeRegistrar &&
    !!acta &&
    (acta.estatus === 'GENERADA' || acta.estatus === 'REQUERIDO');
  const puedeFirmar = puedeRegistrar && !!acta?.puede_firmar;
  const puedeDescartar =
    puedeRegistrar && !!acta?.puede_descartar && acta.estatus !== 'BORRADOR';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pr-8">
          <DialogTitle className="flex flex-wrap items-center gap-2">
            Acta circunstanciada{acta ? ` #${acta.id}` : ''}
            {estatus && (
              <Badge variant={estatus.variant} appearance="light" size="sm">
                {estatus.label}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {estatus?.descripcion ??
              'Datos, participantes, renglones del corte y revisión.'}
          </DialogDescription>
        </DialogHeader>

        {isLoading || !acta ? (
          <div className="space-y-4" aria-busy="true">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        ) : (
          <div className="space-y-6">
            {actaCerrada(acta.estatus) && (
              <Alert
                variant="destructive"
                icon="destructive"
                appearance="light"
              >
                <AlertIcon>
                  <Ban />
                </AlertIcon>
                <AlertTitle>
                  {estatus?.label} por {acta.usuario_cierre || 'sin registro'}{' '}
                  el {formatFechaHora(acta.fecha_cierre)}
                  {acta.motivo_cierre ? `: ${acta.motivo_cierre}` : ''}
                </AlertTitle>
              </Alert>
            )}

            {acta.estatus === 'REQUERIDO' &&
              acta.observaciones[0]?.observaciones && (
                <Alert variant="warning" icon="warning" appearance="light">
                  <AlertIcon>
                    <MessageSquareWarning />
                  </AlertIcon>
                  <AlertTitle>
                    Oficina central requiere:{' '}
                    {acta.observaciones[0].observaciones}
                  </AlertTitle>
                </Alert>
              )}

            {acta.id_acta_sustituida && (
              <p className="text-xs text-muted-foreground">
                Sustituye al acta #{acta.id_acta_sustituida}, que fue anulada.
              </p>
            )}

            {/* ── Datos ───────────────────────────────────────────────── */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Dato label="Fecha y hora del acta">
                {acta.fecha_acta
                  ? `${formatDateOnly(acta.fecha_acta)} ${formatTimeOnly(acta.hora_acta)}`
                  : '—'}
              </Dato>
              <Dato label="Ciudad">{acta.ciudad || '—'}</Dato>
              <Dato label="Lugar">{acta.lugar || '—'}</Dato>
              <Dato label="Corte de comprobaciones">
                {formatFechaHora(acta.fecha_corte)}
              </Dato>
              <Dato label="Generó">
                {acta.usuario_genero || '—'}
                {acta.fecha_generacion && (
                  <span className="block text-xs text-muted-foreground">
                    {formatFechaHora(acta.fecha_generacion)}
                  </span>
                )}
              </Dato>
              <Dato label="Documento generado">
                {acta.archivo_generado ? 'Word disponible' : 'Sin generar'}
              </Dato>
              <Dato label="PDF firmado">
                {acta.archivo_firmado
                  ? `Recibido ${formatFechaHora(acta.fecha_firmado)}`
                  : 'Pendiente'}
              </Dato>
              <Dato label="Plantilla">
                Versión {acta.configuracion.version}
              </Dato>
            </section>

            {/* ── Participantes ───────────────────────────────────────── */}
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                Participantes
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Dato label="Presidencia">{presidencia?.nombre || '—'}</Dato>
                <Dato label="Secretaría técnica">
                  {secretaria?.nombre || '—'}
                </Dato>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <ListaPersonas
                  titulo="Consejerías electorales"
                  items={consejerias.map((c) => ({
                    llave: c.id ?? c.orden ?? c.nombre,
                    nombre: c.nombre,
                    sub: c.cargo ?? '',
                    asistencia: !!c.asistencia,
                  }))}
                />
                <ListaPersonas
                  titulo="Representaciones de partido"
                  items={representaciones.map((c) => ({
                    llave: c.id ?? c.orden ?? c.nombre,
                    nombre: c.nombre,
                    sub: c.partido ?? '',
                    asistencia: !!c.asistencia,
                  }))}
                />
              </div>
            </section>

            {/* ── Renglones del corte ─────────────────────────────────── */}
            <section className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Renglones del corte
                </h3>
                <Badge variant="secondary" appearance="light" size="sm">
                  {acta.renglones.length}
                </Badge>
              </div>
              {acta.renglones.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  El acta se generó sin comprobaciones nuevas al corte.
                </p>
              ) : (
                <div className="space-y-3">
                  <TablaRenglones
                    titulo="Documentación electoral"
                    renglones={documentacion}
                  />
                  <TablaRenglones
                    titulo="Material electoral y útiles"
                    renglones={material}
                  />
                </div>
              )}
            </section>

            {/* ── Fotografías ─────────────────────────────────────────── */}
            {apartados.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Fotografías
                </h3>
                {apartados.map((a) => (
                  <ActaFotografiasApartado
                    key={a.clave}
                    idActa={acta.id}
                    apartado={a}
                    fotografias={fotosPorApartado.get(a.clave) ?? []}
                    readOnly
                  />
                ))}
              </section>
            )}

            {/* ── Historial ───────────────────────────────────────────── */}
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                Historial y observaciones
              </h3>
              {acta.observaciones.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sin movimientos.
                </p>
              ) : (
                <Timeline>
                  {acta.observaciones.map((o) => (
                    <HitoObservacion key={o.id} o={o} />
                  ))}
                </Timeline>
              )}
            </section>
          </div>
        )}

        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {acta && puedeImprimir && acta.archivo_generado && (
              <Button
                type="button"
                variant="outline"
                onClick={() => verDocumento.mutate(acta.id)}
                disabled={verDocumento.isPending}
              >
                {verDocumento.isPending ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <FileText className="h-4 w-4" aria-hidden="true" />
                )}
                Word generado
              </Button>
            )}
            {acta && puedeImprimir && acta.archivo_firmado && (
              <Button
                type="button"
                variant="outline"
                onClick={() => verFirmada.mutate(acta.id)}
                disabled={verFirmada.isPending}
              >
                {verFirmada.isPending ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <FileCheck2 className="h-4 w-4" aria-hidden="true" />
                )}
                PDF firmado
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {acta && puedeDescartar && (
              <Button
                type="button"
                variant="outline"
                className="text-destructive"
                onClick={() => onDescartar(acta)}
              >
                <Undo2 className="h-4 w-4" aria-hidden="true" />
                Descartar
              </Button>
            )}
            {acta && puedeEditar && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onEditar(acta.id)}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Editar
              </Button>
            )}
            {acta && puedeFirmar && (
              <Button type="button" onClick={() => onSubirFirmada(acta)}>
                <FileUp className="h-4 w-4" aria-hidden="true" />
                {acta.archivo_firmado
                  ? 'Volver a subir PDF firmado'
                  : 'Subir PDF firmado'}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Piezas ───────────────────────────────────────────────────────────────────

function ListaPersonas({
  titulo,
  items,
}: {
  titulo: string;
  items: {
    llave: string | number;
    nombre: string;
    sub: string;
    asistencia: boolean;
  }[];
}) {
  const presentes = items.filter((i) => i.asistencia).length;
  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <p className="text-sm font-semibold text-foreground">{titulo}</p>
        <Badge variant="secondary" appearance="light" size="sm">
          {presentes} / {items.length}
        </Badge>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted-foreground">Ninguna.</p>
      ) : (
        <ul className="divide-y divide-border max-h-56 overflow-y-auto">
          {items.map((i) => (
            <li key={i.llave} className="flex items-center gap-3 px-4 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-tight">
                  {i.nombre}
                </p>
                {i.sub && (
                  <p className="text-xs text-muted-foreground">{i.sub}</p>
                )}
              </div>
              <Badge
                variant={i.asistencia ? 'success' : 'secondary'}
                appearance="light"
                size="sm"
              >
                {i.asistencia ? 'Presente' : 'Ausente'}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TablaRenglones({
  titulo,
  renglones,
}: {
  titulo: string;
  renglones: IActaRenglon[];
}) {
  if (renglones.length === 0) return null;
  return (
    <div className="rounded-lg border border-border overflow-x-auto">
      <p className="px-4 py-2.5 text-sm font-semibold text-foreground border-b border-border">
        {titulo}{' '}
        <span className="text-xs font-normal text-muted-foreground">
          ({renglones.length})
        </span>
      </p>
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Elección</th>
            <th className="px-3 py-2 text-left font-medium">Tipo</th>
            <th className="px-3 py-2 text-left font-medium">Descripción</th>
            <th className="px-3 py-2 text-right font-medium">Entregada</th>
            <th className="px-3 py-2 text-right font-medium">Física</th>
            <th className="px-3 py-2 text-right font-medium">Dif.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {renglones.map((r) => (
            <tr key={r.id}>
              <td className="px-3 py-2 whitespace-nowrap">
                {r.desc_eleccion ?? r.id_eleccion}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {r.desc_tipo ?? r.tipo_doc}
              </td>
              <td className="px-3 py-2">
                <p className="text-foreground">{r.desc_documento}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {r.codigo}
                  {r.version ? ` · v${r.version}` : ''}
                </p>
              </td>
              <td className="px-3 py-2 text-right whitespace-nowrap">
                {piezasConPaquetes(r.cantidad, r.numero_paquetes_cajas)}
              </td>
              <td className="px-3 py-2 text-right font-semibold">
                {r.cantidad_fisica ?? '—'}
              </td>
              <td
                className={[
                  'px-3 py-2 text-right font-semibold',
                  (r.diferencia ?? 0) === 0
                    ? 'text-muted-foreground'
                    : (r.diferencia ?? 0) < 0
                      ? 'text-destructive'
                      : 'text-warning',
                ].join(' ')}
              >
                {r.diferencia == null
                  ? '—'
                  : r.diferencia > 0
                    ? `+${r.diferencia}`
                    : r.diferencia}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HitoObservacion({ o }: { o: IActaObservacion }) {
  const m = MARCADORES[o.estatus_nuevo] ?? {
    icono: <History />,
    tono: 'neutro' as TTimelineTono,
  };
  const anterior = o.estatus_anterior
    ? ESTATUS_ACTA[o.estatus_anterior]?.label
    : null;
  return (
    <TimelineItem
      icono={m.icono}
      tono={m.tono}
      titulo={
        <span>
          {o.estatus_nuevo_desc}
          {anterior && anterior !== o.estatus_nuevo_desc && (
            <span className="text-xs text-muted-foreground">
              {' '}
              (antes {anterior})
            </span>
          )}
        </span>
      }
      fecha={formatFechaHora(o.fecha_registro)}
    >
      {o.observaciones && (
        <p className="text-sm text-foreground whitespace-pre-line">
          {o.observaciones}
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-0.5">
        {o.usuario || 'Sistema'}
      </p>
    </TimelineItem>
  );
}
