'use client';

import { Eye, FilePen, FileText, Pencil, Upload } from 'lucide-react';
import type { IMecanismoLista } from '@/types/mecanismos';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { claveMecanismo } from '../_lib/estatus';
import {
  CaeTexto,
  CasillasPorSeccion,
  CedulaBadge,
  CostoTexto,
  InformeBadge,
  ObservacionesTexto,
} from './mecanismo-celdas';

export interface MecanismoAcciones {
  onVerDetalle: (m: IMecanismoLista) => void;
  /** Consejo: abre el informe; ausente = sin permiso o solo lectura. */
  onInformar?: (m: IMecanismoLista) => void;
  /** Oficina central: abre la edición; ausente = sin permiso. */
  onEditar?: (m: IMecanismoLista) => void;
  /** Abre el panel con el PDF de la cédula; ausente = sin permiso de verla. */
  onVerCedula?: (m: IMecanismoLista) => void;
  /** Oficina central: carga o reemplaza el PDF; ausente = sin permiso. */
  onCargarCedula?: (m: IMecanismoLista) => void;
}

/**
 * Botón de la cédula según quién mira: con cédula abre el panel; sin cédula,
 * oficina central la carga y el consejo lo ve deshabilitado.
 */
export function BotonCedula({
  m,
  onVerCedula,
  onCargarCedula,
  className,
}: Pick<MecanismoAcciones, 'onVerCedula' | 'onCargarCedula'> & {
  m: IMecanismoLista;
  className?: string;
}) {
  if (!onVerCedula && !onCargarCedula) return null;
  if (!m.tiene_cedula && onCargarCedula) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={className}
        onClick={() => onCargarCedula(m)}
      >
        <Upload className="h-4 w-4" aria-hidden="true" />
        Cargar cédula
      </Button>
    );
  }
  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={() => onVerCedula?.(m)}
      disabled={!m.tiene_cedula || !onVerCedula}
      title={m.tiene_cedula ? undefined : 'Este mecanismo aún no tiene cédula'}
    >
      <FileText className="h-4 w-4" aria-hidden="true" />
      {m.tiene_cedula ? 'Cédula' : 'Sin cédula'}
    </Button>
  );
}

/** Tarjeta de un mecanismo en móvil, para el consejo y para oficina central. */
export function MecanismoCard({
  m,
  consejo,
  modo,
  onVerDetalle,
  onInformar,
  onEditar,
  onVerCedula,
  onCargarCedula,
}: {
  m: IMecanismoLista;
  consejo: string;
  modo: 'consejo' | 'admin';
} & MecanismoAcciones) {
  const boton = 'min-h-[40px] gap-1.5';
  return (
    <article
      className={[
        'border border-border rounded-lg p-4 space-y-3 bg-card',
        m.activo ? '' : 'opacity-70',
      ].join(' ')}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {claveMecanismo(m)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {consejo}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
          {onInformar && m.estatus !== 'INFORMADO' && (
            <Button
              variant="outline"
              size="sm"
              className={boton}
              onClick={() => onInformar(m)}
              disabled={!m.tiene_cedula}
              title={
                m.tiene_cedula
                  ? undefined
                  : 'Sin cédula: se informa cuando oficina central la cargue'
              }
            >
              <FilePen className="h-4 w-4" aria-hidden="true" />
              Informar
            </Button>
          )}
          {onEditar && (
            <Button
              variant="outline"
              size="sm"
              className={boton}
              onClick={() => onEditar(m)}
              disabled={!m.activo}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Editar
            </Button>
          )}
          <BotonCedula
            m={m}
            onVerCedula={onVerCedula}
            onCargarCedula={onCargarCedula}
            className={boton}
          />
          <Button
            variant="outline"
            size="sm"
            className={boton}
            onClick={() => onVerDetalle(m)}
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            Ver
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="col-span-2">
          <p className="text-xs text-muted-foreground mb-1">
            Secciones y casillas ({m.casillas_propias})
          </p>
          <CasillasPorSeccion
            texto={m.casillas_propias_texto}
            conteo={`${m.casillas_propias} casillas`}
          />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Costo</p>
          <CostoTexto m={m} modo={modo} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Observaciones</p>
          <ObservacionesTexto m={m} />
        </div>
        <div className="col-span-2">
          <p className="text-xs text-muted-foreground">CAE</p>
          <CaeTexto m={m} />
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
        <InformeBadge m={m} />
        <CedulaBadge m={m} />
        {!m.activo && (
          <Badge variant="destructive" appearance="light" size="sm">
            Inactivo
          </Badge>
        )}
      </footer>
    </article>
  );
}
