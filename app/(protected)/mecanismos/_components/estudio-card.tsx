'use client';

import { CheckCheck, Eye, FileCheck2, FileText, Loader2 } from 'lucide-react';
import type { IEstudioConsejo, TEstudioEstatus } from '@/types/mecanismos';
import { formatFechaHora } from '@/lib/fechas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ESTATUS_ESTUDIO } from '../_lib/estatus';

export type TCualDocumento = 'propuesta' | 'aprobada';

export function EstudioBadge({ estatus }: { estatus: TEstudioEstatus | null }) {
  const e = ESTATUS_ESTUDIO[estatus ?? 'SIN_ESTUDIO'];
  return (
    <Badge variant={e.variant} appearance="light" size="sm">
      {e.label}
    </Badge>
  );
}

/** Botones de los PDF propuesto y aprobado; solo los que existen. */
export function EstudioDocumentos({
  tienePropuesta,
  tieneAprobada,
  onVer,
  pendiente,
  compacto = false,
}: {
  tienePropuesta: boolean;
  tieneAprobada: boolean;
  onVer?: (cual: TCualDocumento) => void;
  pendiente: TCualDocumento | null;
  compacto?: boolean;
}) {
  if (!onVer || (!tienePropuesta && !tieneAprobada)) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }
  const boton = (
    cual: TCualDocumento,
    etiqueta: string,
    Icono: typeof FileText,
  ) => (
    <Button
      variant="outline"
      size="sm"
      className={compacto ? 'h-7 px-2 text-xs' : ''}
      onClick={() => onVer(cual)}
      disabled={pendiente === cual}
      aria-label={`Ver PDF ${etiqueta.toLowerCase()}`}
    >
      {pendiente === cual ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <Icono className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {etiqueta}
    </Button>
  );
  return (
    <div className="flex flex-wrap gap-1">
      {tienePropuesta && boton('propuesta', 'Propuesto', FileText)}
      {tieneAprobada && boton('aprobada', 'Aprobado', FileCheck2)}
    </div>
  );
}

/** Un acuse del consejo: hecho (fecha y observaciones) o pendiente. */
function Acuse({
  titulo,
  fecha,
  observaciones,
  pendiente,
}: {
  titulo: string;
  fecha: string | null;
  observaciones: string | null;
  /** Etapa vigente sin acusar todavía. */
  pendiente: boolean;
}) {
  return (
    <div className="rounded-md border border-border p-3 space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-foreground">{titulo}</span>
        {fecha ? (
          <Badge variant="success" appearance="light" size="sm">
            Acusado
          </Badge>
        ) : pendiente ? (
          <Badge variant="warning" appearance="light" size="sm">
            Pendiente
          </Badge>
        ) : (
          <Badge variant="secondary" appearance="light" size="sm">
            Aún no aplica
          </Badge>
        )}
      </div>
      {fecha && (
        <p className="text-xs text-muted-foreground">
          {formatFechaHora(fecha)}
        </p>
      )}
      {observaciones && (
        <p className="text-sm text-foreground">{observaciones}</p>
      )}
    </div>
  );
}

interface EstudioCardProps {
  estudio: IEstudioConsejo;
  onAcusar?: (estudio: IEstudioConsejo, etapa: 1 | 2) => void;
  onVerDetalle: (estudio: IEstudioConsejo) => void;
  onVerDocumento?: (estudio: IEstudioConsejo, cual: TCualDocumento) => void;
  documentoPendiente: { id: number; cual: TCualDocumento } | null;
}

/** Estudio del distrito federal visto por el consejo: estatus, documentos, sus dos acuses y el botón de acusar. */
export function EstudioCard({
  estudio: e,
  onAcusar,
  onVerDetalle,
  onVerDocumento,
  documentoPendiente,
}: EstudioCardProps) {
  const etapa: 1 | 2 | null = e.puede_acusar_propuesta
    ? 1
    : e.puede_acusar_aprobacion
      ? 2
      : null;

  return (
    <article className="border border-border rounded-lg p-4 space-y-4 bg-card">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Distrito federal {e.id_df}
          </p>
          <h3 className="text-base font-semibold text-foreground mt-0.5">
            {e.df}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <EstudioBadge estatus={e.estatus} />
            {e.id && (
              <span className="text-xs text-muted-foreground">
                {e.acuses_etapa1} de {e.consejos} consejos acusaron la propuesta
                {e.estatus !== 'PROPUESTO' &&
                  ` · ${e.acuses_etapa2} la aprobación`}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {etapa && onAcusar && (
            <Button onClick={() => onAcusar(e, etapa)}>
              <CheckCheck className="h-4 w-4" aria-hidden="true" />
              Acusar {etapa === 1 ? 'propuesta' : 'aprobación'}
            </Button>
          )}
          {e.id && (
            <Button variant="outline" onClick={() => onVerDetalle(e)}>
              <Eye className="h-4 w-4" aria-hidden="true" />
              Detalle
            </Button>
          )}
        </div>
      </header>

      {!e.id ? (
        <p className="text-sm text-muted-foreground">
          Oficina central todavía no propone el estudio de este distrito.
        </p>
      ) : (
        <>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Documentos</p>
            <EstudioDocumentos
              tienePropuesta={e.tiene_propuesta}
              tieneAprobada={e.tiene_aprobada}
              onVer={
                onVerDocumento ? (cual) => onVerDocumento(e, cual) : undefined
              }
              pendiente={
                documentoPendiente?.id === e.id ? documentoPendiente.cual : null
              }
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Acuse
              titulo="Acuse de la propuesta"
              fecha={e.fecha_etapa1}
              observaciones={e.observaciones_etapa1}
              pendiente={e.puede_acusar_propuesta}
            />
            <Acuse
              titulo="Acuse de la aprobación"
              fecha={e.fecha_etapa2}
              observaciones={e.observaciones_etapa2}
              pendiente={e.puede_acusar_aprobacion}
            />
          </div>
          {e.motivo_anulacion && (
            <p className="text-sm text-destructive">
              Anulado {formatFechaHora(e.fecha_anulacion)}: {e.motivo_anulacion}
            </p>
          )}
        </>
      )}
    </article>
  );
}
