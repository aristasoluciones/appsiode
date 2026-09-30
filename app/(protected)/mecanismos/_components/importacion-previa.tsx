'use client';

import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import type { IMecanismosImportacionValidacion } from '@/types/mecanismos';
import { formatMoneda } from '@/lib/helpers';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TIPO_MECANISMO_CORTO } from '../_lib/estatus';
import { CargaResumen, EfectoBadge } from './carga-resumen';

/** Vista previa del formato de importación: cifras, avisos, renglones rechazados y una muestra de los mecanismos. */
export function ImportacionPrevia({
  validacion: v,
}: {
  validacion: IMecanismosImportacionValidacion;
}) {
  const tipoCorto = (t: string) =>
    TIPO_MECANISMO_CORTO[t as keyof typeof TIPO_MECANISMO_CORTO] ?? t;

  return (
    <div className="space-y-4">
      {v.rechazadas > 0 ? (
        <Alert variant="destructive" appearance="light" close={false}>
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertTitle>
            {v.rechazadas} de {v.total} renglones tienen observaciones. La
            importación es todo o nada: corrige el archivo y vuelve a revisarlo.
          </AlertTitle>
        </Alert>
      ) : (
        <Alert variant="success" appearance="light" close={false}>
          <AlertIcon>
            <CheckCircle2 />
          </AlertIcon>
          <AlertTitle>
            El archivo no tiene observaciones: {v.mecanismos_nuevos} mecanismos
            nuevos, {v.mecanismos_actualizados} con cambios y {v.sin_cambios}{' '}
            sin cambios.
          </AlertTitle>
        </Alert>
      )}

      <CargaResumen
        cifras={[
          { etiqueta: 'Renglones (casillas)', valor: v.total },
          { etiqueta: 'Mecanismos', valor: v.mecanismos },
          { etiqueta: 'Nuevos', valor: v.mecanismos_nuevos, tono: 'exito' },
          { etiqueta: 'Con cambios', valor: v.mecanismos_actualizados },
          { etiqueta: 'Sin cambios', valor: v.sin_cambios },
          { etiqueta: 'Rechazados', valor: v.rechazadas, tono: 'peligro' },
          {
            etiqueta: 'Casillas fuera del catálogo',
            valor: v.casillas_fuera_del_catalogo,
            tono: 'advertencia',
          },
          {
            etiqueta: 'Casillas del catálogo sin mecanismo',
            valor: v.casillas_del_catalogo_sin_mecanismo,
            tono: 'advertencia',
          },
        ]}
      />

      {(v.catalogo_casillas_vacio || v.columnas_opcionales.length > 0) && (
        <Alert appearance="light" close={false}>
          <AlertIcon>
            <Info className="text-primary" />
          </AlertIcon>
          <AlertTitle className="text-accent-foreground">
            {v.catalogo_casillas_vacio &&
              'El catálogo de casillas está vacío: las casillas del archivo no se contrastaron. '}
            {v.columnas_opcionales.length > 0 &&
              `Columnas opcionales que trae el archivo: ${v.columnas_opcionales.join(', ')}.`}
          </AlertTitle>
        </Alert>
      )}

      {v.filas_rechazadas.length > 0 && (
        <section className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">
            Renglones con observaciones
            {v.rechazadas_omitidas > 0 && (
              <span className="text-xs font-normal text-muted-foreground">
                {' '}
                (se muestran {v.filas_rechazadas.length};{' '}
                {v.rechazadas_omitidas} más no cupieron)
              </span>
            )}
          </h4>
          <div className="max-h-64 overflow-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Fila</TableHead>
                  <TableHead>Mecanismo</TableHead>
                  <TableHead>Casilla</TableHead>
                  <TableHead>Observaciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {v.filas_rechazadas.map((f) => (
                  <TableRow key={f.fila}>
                    <TableCell className="tabular-nums">{f.fila}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      DF{f.id_df ?? '?'} ·{' '}
                      {tipoCorto(f.tipo || f.tipo_capturado)} {f.numero ?? '?'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {f.municipio} · {f.seccion ?? '?'} {f.casilla_tipo}
                    </TableCell>
                    <TableCell className="text-destructive">
                      {f.errores.join(' ')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {v.muestra.length > 0 && (
        <section className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">
            Muestra de mecanismos ({v.muestra.length} de {v.mecanismos})
          </h4>
          <div className="max-h-64 overflow-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mecanismo</TableHead>
                  <TableHead>Informa</TableHead>
                  <TableHead className="text-center">Casillas</TableHead>
                  <TableHead className="text-right">Costo INE</TableHead>
                  <TableHead>Efecto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {v.muestra.map((m) => (
                  <TableRow key={`${m.id_df}-${m.tipo}-${m.numero}`}>
                    <TableCell className="whitespace-nowrap">
                      DF{String(m.id_df).padStart(2, '0')} · {tipoCorto(m.tipo)}{' '}
                      {m.numero}
                    </TableCell>
                    <TableCell>{m.revisor ?? '—'}</TableCell>
                    <TableCell className="text-center tabular-nums">
                      {m.casillas.length}
                      {m.casillas_fuera_del_catalogo > 0 && (
                        <span className="text-xs text-amber-700 dark:text-amber-400">
                          {' '}
                          ({m.casillas_fuera_del_catalogo} fuera del catálogo)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoneda(m.costo_ine)}
                    </TableCell>
                    <TableCell>
                      <EfectoBadge efecto={m.efecto} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}
    </div>
  );
}
