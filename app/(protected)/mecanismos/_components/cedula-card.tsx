'use client';

import {
  CheckCheck,
  Eye,
  FileCheck2,
  FilePen,
  FileText,
  Loader2,
} from 'lucide-react';
import type { ICedulaConsejo } from '@/types/mecanismos';
import { formatMoneda } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { claveMecanismo } from '../_lib/estatus';
import { CasillasPorSeccion, CedulaBadge } from './mecanismo-card';

/** Qué documento se está resolviendo, para el indicador de carga del botón. */
export interface IDocumentoPendiente {
  id: number;
  cual: 'propuesta' | 'aprobada';
}

export interface CedulaAcciones {
  onVerDetalle: (c: ICedulaConsejo) => void;
  /** Consejo: informa costo cotizado y observaciones; ausente = sin permiso. */
  onInformar?: (c: ICedulaConsejo) => void;
  /** Consejo: acusa la cédula aprobada; ausente = sin permiso. */
  onAcusar?: (c: ICedulaConsejo) => void;
  /** Abre el PDF propuesto o aprobado; ausente = sin permiso. */
  onVerDocumento?: (c: ICedulaConsejo, cual: 'propuesta' | 'aprobada') => void;
  documentoPendiente: IDocumentoPendiente | null;
}

/** Color del semáforo de la diferencia (cotizado menos INE): ahorro verde, sobrecosto rojo. */
export function tonoDiferencia(d: number | null): string {
  if (d == null || d === 0) return 'text-muted-foreground';
  return d > 0 ? 'text-destructive' : 'text-green-700 dark:text-green-400';
}

function importe(valor: number | null) {
  return valor == null ? (
    <span className="text-muted-foreground italic">Sin capturar</span>
  ) : (
    formatMoneda(valor)
  );
}

/** Costos de la cédula: INE, cotizado por el consejo, diferencia con semáforo y autorizado. */
export function CedulaCostos({
  c,
}: {
  c: Pick<
    ICedulaConsejo,
    | 'costo_ine'
    | 'costo_cotizado'
    | 'diferencia'
    | 'costo_autorizado'
    | 'captura_costo'
  >;
}) {
  return (
    <div className="tabular-nums text-xs leading-tight space-y-0.5">
      <p className="text-muted-foreground">
        INE <span className="text-foreground">{importe(c.costo_ine)}</span>
      </p>
      {c.captura_costo && (
        <>
          <p className="text-muted-foreground">
            Consejo{' '}
            <span className="text-foreground">{importe(c.costo_cotizado)}</span>
          </p>
          {c.diferencia != null && (
            <p className={tonoDiferencia(c.diferencia)}>
              Dif. {c.diferencia > 0 ? '+' : ''}
              {formatMoneda(c.diferencia)}
            </p>
          )}
        </>
      )}
      {c.costo_autorizado != null && (
        <p className="text-muted-foreground">
          Autorizado{' '}
          <span className="text-foreground font-medium">
            {formatMoneda(c.costo_autorizado)}
          </span>
        </p>
      )}
    </div>
  );
}

/** Botones de los PDF propuesto y aprobado; solo los que existen. */
export function CedulaDocumentos({
  c,
  onVerDocumento,
  documentoPendiente,
  compacto = false,
}: {
  c: ICedulaConsejo;
  onVerDocumento?: CedulaAcciones['onVerDocumento'];
  documentoPendiente: IDocumentoPendiente | null;
  compacto?: boolean;
}) {
  if (!onVerDocumento || (!c.tiene_propuesta && !c.tiene_aprobada)) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }
  const boton = (
    cual: 'propuesta' | 'aprobada',
    etiqueta: string,
    Icono: typeof FileText,
  ) => {
    const cargando =
      documentoPendiente?.id === c.id && documentoPendiente.cual === cual;
    return (
      <Button
        variant="outline"
        size="sm"
        className={compacto ? 'h-7 px-2 text-xs' : ''}
        onClick={() => onVerDocumento(c, cual)}
        disabled={cargando}
        aria-label={`Ver PDF ${etiqueta.toLowerCase()}`}
      >
        {cargando ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Icono className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {etiqueta}
      </Button>
    );
  };
  return (
    <div className="flex flex-wrap gap-1">
      {c.tiene_propuesta && boton('propuesta', 'Propuesta', FileText)}
      {c.tiene_aprobada && boton('aprobada', 'Aprobada', FileCheck2)}
    </div>
  );
}

/** Acción del consejo según el estatus: informar mientras esté propuesta o informada, acusar cuando esté aprobada. */
export function CedulaAccionConsejo({
  c,
  onInformar,
  onAcusar,
  size = 'sm',
}: {
  c: ICedulaConsejo;
  onInformar?: CedulaAcciones['onInformar'];
  onAcusar?: CedulaAcciones['onAcusar'];
  size?: 'sm' | 'icon';
}) {
  if (c.puede_informar && onInformar) {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={() => onInformar(c)}
        aria-label="Informar cédula"
      >
        <FilePen className="h-4 w-4" aria-hidden="true" />
        {size === 'sm' && (c.estatus === 'INFORMADA' ? 'Corregir' : 'Informar')}
      </Button>
    );
  }
  if (c.puede_acusar && onAcusar && c.estatus !== 'ACUSADA') {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={() => onAcusar(c)}
        aria-label="Acusar cédula"
      >
        <CheckCheck className="h-4 w-4" aria-hidden="true" />
        {size === 'sm' && 'Acusar'}
      </Button>
    );
  }
  if (c.estatus === 'ACUSADA') {
    return (
      <Badge variant="success" appearance="light" size="sm">
        Acusada
      </Badge>
    );
  }
  return null;
}

/** Tarjeta de una cédula en móvil. */
export function CedulaCard({
  c,
  consejo,
  onVerDetalle,
  onInformar,
  onAcusar,
  onVerDocumento,
  documentoPendiente,
  extra,
}: {
  c: ICedulaConsejo;
  consejo: string;
  extra?: React.ReactNode;
} & CedulaAcciones) {
  return (
    <article className="border border-border rounded-lg p-4 space-y-3 bg-card">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {claveMecanismo(c)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {consejo}
          </p>
        </div>
        <CedulaBadge m={c} />
      </header>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="col-span-2">
          <p className="text-xs text-muted-foreground mb-1">
            Secciones y casillas ({c.casillas_propias})
          </p>
          <CasillasPorSeccion
            texto={c.casillas_propias_texto}
            conteo={`${c.casillas_propias} casillas`}
          />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Costos</p>
          <CedulaCostos c={c} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Documentos</p>
          <CedulaDocumentos
            c={c}
            onVerDocumento={onVerDocumento}
            documentoPendiente={documentoPendiente}
            compacto
          />
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
        <CedulaAccionConsejo
          c={c}
          onInformar={onInformar}
          onAcusar={onAcusar}
        />
        {extra}
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={() => onVerDetalle(c)}
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
          Ver
        </Button>
      </footer>
    </article>
  );
}
