'use client';

import { CircleCheck } from 'lucide-react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import type { ILayoutResultado } from '@/types/material-electoral';

function Dato({
  etiqueta,
  valor,
  ayuda,
}: {
  etiqueta: string;
  valor: number;
  ayuda?: string;
}) {
  return (
    <div className="border border-border rounded-lg p-4">
      <p className="text-2xl font-semibold">{valor.toLocaleString('es-MX')}</p>
      <p className="text-sm font-medium">{etiqueta}</p>
      {ayuda && <p className="text-xs text-muted-foreground mt-1">{ayuda}</p>}
    </div>
  );
}

/** Qué dejó la carga: renglones nuevos, actualizados y los que se conservaron. */
export function CargaLayoutResultado({
  resultado,
}: {
  resultado: ILayoutResultado;
}) {
  const conservados =
    resultado.omitidos_comprobados + resultado.omitidos_duplicados;

  return (
    <div className="flex flex-col gap-4">
      <Alert variant="success" appearance="light" close={false}>
        <AlertIcon>
          <CircleCheck />
        </AlertIcon>
        <AlertTitle>
          El layout se cargó: {resultado.insertados.toLocaleString('es-MX')}{' '}
          renglones nuevos y {resultado.actualizados.toLocaleString('es-MX')}{' '}
          actualizados de {resultado.total.toLocaleString('es-MX')} que traía el
          archivo.
        </AlertTitle>
      </Alert>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Dato etiqueta="Renglones del archivo" valor={resultado.total} />
        <Dato etiqueta="Nuevos" valor={resultado.insertados} />
        <Dato etiqueta="Actualizados" valor={resultado.actualizados} />
        <Dato
          etiqueta="Conservados"
          valor={conservados}
          ayuda="No se tocaron para no borrar comprobaciones ya capturadas."
        />
      </div>

      {conservados > 0 && (
        <ul className="list-disc ps-5 text-sm text-muted-foreground space-y-1">
          {resultado.omitidos_comprobados > 0 && (
            <li>
              {resultado.omitidos_comprobados.toLocaleString('es-MX')} renglones
              se conservaron porque el consejo ya capturó su cantidad física.
            </li>
          )}
          {resultado.omitidos_duplicados > 0 && (
            <li>
              {resultado.omitidos_duplicados.toLocaleString('es-MX')} renglones
              ya existían más de una vez y se dejaron como estaban; revísalos con
              el área responsable.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
