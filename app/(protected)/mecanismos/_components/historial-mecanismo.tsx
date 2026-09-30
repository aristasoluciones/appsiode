'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  Coins,
  FileText,
  History,
  MessageSquareText,
  Power,
  TableProperties,
  UserRound,
} from 'lucide-react';
import type { IMecanismoHistorial } from '@/types/mecanismos';
import { formatFechaHora } from '@/lib/fechas';
import { formatMoneda } from '@/lib/helpers';
import { useAuth } from '@/providers/auth-provider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { TextoExpandible } from '@/components/common/texto-expandible';
import {
  Timeline,
  TimelineItem,
  type TTimelineTono,
} from '@/components/common/timeline';
import { nombreConsejo } from '../_lib/estatus';

/** Cómo se presenta cada campo que registra el historial del módulo. */
const CAMPOS: Record<
  string,
  {
    titulo: string;
    icono: React.ReactNode;
    tono: TTimelineTono;
    moneda?: boolean;
  }
> = {
  CAE: { titulo: 'CAE', icono: <UserRound />, tono: 'primario' },
  COSTO: {
    titulo: 'Costo estimado',
    icono: <Coins />,
    tono: 'info',
    moneda: true,
  },
  OBSERVACIONES: {
    titulo: 'Observaciones',
    icono: <MessageSquareText />,
    tono: 'neutro',
  },
  OBSERVACIONES_ADMIN: {
    titulo: 'Observaciones de oficina central',
    icono: <MessageSquareText />,
    tono: 'neutro',
  },
  CASILLAS: {
    titulo: 'Casillas',
    icono: <TableProperties />,
    tono: 'advertencia',
  },
  ACTIVO: { titulo: 'Estatus', icono: <Power />, tono: 'peligro' },
  ESTATUS: {
    titulo: 'Estatus',
    icono: <History />,
    tono: 'primario',
  },
  DOCUMENTO: { titulo: 'Documento', icono: <FileText />, tono: 'info' },
  CEDULA: { titulo: 'Cédula', icono: <FileText />, tono: 'info' },
  ACUSE: { titulo: 'Acuse', icono: <CheckCircle2 />, tono: 'exito' },
};

function valor(h: IMecanismoHistorial, v: string | null): string {
  if (v == null || v === '') return 'sin valor';
  if (CAMPOS[h.campo]?.moneda) return formatMoneda(Number(v));
  if (h.campo === 'ACTIVO') return v === 'true' ? 'activo' : 'inactivo';
  return v;
}

interface HistorialMecanismoProps {
  /** Indefinido mientras carga; vacío cuando no hay cambios. */
  historial: IMecanismoHistorial[] | undefined;
  titulo?: string;
  vacio?: string;
}

/** Cambios del mecanismo y de los informes, del más reciente al más antiguo. */
export function HistorialMecanismo({
  historial,
  titulo = 'Historial',
  vacio = 'Sin cambios registrados.',
}: HistorialMecanismoProps) {
  // Solo oficina central distingue de qué consejo es cada cambio; el consejo ve únicamente los suyos.
  const { user } = useAuth();
  const mostrarConsejo = !(Number(user?.idConsejo) > 0);
  // Cerrado por omisión: el historial es consulta, no lo primero que se necesita.
  const [abierto, setAbierto] = useState(false);

  return (
    <Collapsible open={abierto} onOpenChange={setAbierto}>
      <section className="space-y-3">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-2 text-sm font-semibold text-foreground hover:text-primary"
          >
            <History
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            {titulo}
            {historial && (
              <span className="text-xs font-normal text-muted-foreground tabular-nums">
                ({historial.length})
              </span>
            )}
            <ChevronDown
              className={[
                'h-4 w-4 ml-auto text-muted-foreground transition-transform',
                abierto ? 'rotate-180' : '',
              ].join(' ')}
              aria-hidden="true"
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {!historial ? (
            <div className="space-y-2" aria-busy="true">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : historial.length === 0 ? (
            <p className="text-sm text-muted-foreground">{vacio}</p>
          ) : (
            <ScrollArea viewportClassName="max-h-80 pr-3">
              <Timeline>
                {[...historial].reverse().map((h) => {
                  const campo = CAMPOS[h.campo] ?? {
                    titulo: h.campo,
                    icono: <History />,
                    tono: 'neutro' as const,
                  };
                  return (
                    <TimelineItem
                      key={h.id}
                      icono={campo.icono}
                      tono={campo.tono}
                      titulo={campo.titulo}
                      fecha={formatFechaHora(h.fecha)}
                    >
                      <p className="text-sm text-foreground text-justify">
                        <TextoExpandible
                          texto={valor(h, h.valor_anterior)}
                          className="text-muted-foreground line-through decoration-muted-foreground/60"
                        />
                        {' → '}
                        <TextoExpandible texto={valor(h, h.valor_nuevo)} />
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {h.usuario || 'Sistema'}
                        {mostrarConsejo &&
                          h.entidad === 'INFORME' &&
                          h.tipo_consejo && (
                            <>
                              {' '}
                              · {nombreConsejo(h.tipo_consejo, h.id_consejo)}
                            </>
                          )}
                        {h.texto && <> · {h.texto}</>}
                      </p>
                    </TimelineItem>
                  );
                })}
              </Timeline>
            </ScrollArea>
          )}
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}
