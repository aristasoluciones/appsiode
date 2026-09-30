'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { IMecanismoSeguimiento } from '@/types/mecanismos';
import { formatMoneda } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';

/** Ruta de la vista del consejo desde el tablero de oficina central. */
export function rutaConsejo(c: IMecanismoSeguimiento) {
  return `/mecanismos/consejos/${c.tipo_consejo === 'D' ? 'distritales' : 'municipales'}/${c.id_consejo}`;
}

export function Porcentaje({ valor }: { valor: number }) {
  const tono = valor >= 100 ? 'success' : valor > 0 ? 'warning' : 'secondary';
  return (
    <Badge variant={tono} appearance="light" size="sm" className="tabular-nums">
      {valor}%
    </Badge>
  );
}

/** Un consejo del seguimiento en móvil: cifras clave y enlace a su vista. */
export function SeguimientoCard({
  c,
  tipoTexto,
}: {
  c: IMecanismoSeguimiento;
  tipoTexto: string;
}) {
  const cifras: [string, number][] = [
    ['Mecanismos', c.mecanismos],
    ['Informados', c.informados],
    ['Con cédula', c.con_cedula],
    ['Con observ.', c.con_observaciones],
    ['Con CAE', c.con_cae],
    ['Sin cédula', c.sin_cedula],
  ];
  return (
    <Link href={rutaConsejo(c)} className="block">
      <article className="border border-border rounded-lg p-4 space-y-3 bg-card">
        <header className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              #{c.id_consejo} · {tipoTexto}
            </p>
            <h3 className="text-base font-semibold text-foreground mt-0.5 truncate">
              {c.consejo}
            </h3>
          </div>
          <Porcentaje valor={c.porcentaje_informados} />
        </header>
        <div className="grid grid-cols-3 gap-2 text-center">
          {cifras.map(([l, v]) => (
            <div key={l} className="rounded-md p-2 bg-muted/50">
              <span className="block text-base font-bold tabular-nums">
                {v}
              </span>
              <span className="text-[0.625rem] text-muted-foreground">{l}</span>
            </div>
          ))}
        </div>
        <footer className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
          <span>Costo estimado {formatMoneda(c.costo_estimado)}</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </footer>
      </article>
    </Link>
  );
}
