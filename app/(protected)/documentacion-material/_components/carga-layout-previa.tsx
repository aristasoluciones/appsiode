'use client';

import { Building2, CircleAlert, CircleCheck, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type {
  ILayoutFila,
  ILayoutValidacion,
} from '@/types/material-electoral';

/** Tabla de renglones del archivo; con los motivos cuando vienen rechazados. */
function TablaFilas({
  filas,
  conMotivos,
}: {
  filas: ILayoutFila[];
  conMotivos: boolean;
}) {
  return (
    <div className="border border-border rounded-lg">
      <ScrollArea className="max-h-[50vh]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Fila</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Elección</TableHead>
              <TableHead>Consejo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Versión</TableHead>
              <TableHead className="text-end">Cantidad</TableHead>
              {conMotivos && <TableHead>Observaciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((f) => (
              <TableRow
                key={f.fila}
                className={conMotivos ? 'bg-destructive/5' : undefined}
              >
                <TableCell className="text-muted-foreground">{f.fila}</TableCell>
                <TableCell className="font-medium">
                  {f.id_documento || '—'}
                </TableCell>
                <TableCell>{f.eleccion || '—'}</TableCell>
                <TableCell>{f.consejo || '—'}</TableCell>
                <TableCell>{f.tipo || '—'}</TableCell>
                <TableCell
                  className="max-w-[22rem] truncate"
                  title={f.descripcion}
                >
                  {f.descripcion || '—'}
                </TableCell>
                <TableCell>{f.version || '—'}</TableCell>
                <TableCell className="text-end">{f.cantidad || '—'}</TableCell>
                {conMotivos && (
                  <TableCell>
                    <ul className="list-disc ps-4 text-xs text-destructive space-y-0.5">
                      {f.errores.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

/**
 * Vista previa del layout: qué trae el archivo, qué renglones tienen
 * observaciones y cómo se reparte la carga entre consejos y elecciones.
 * Es de solo lectura; la carga se confirma desde el pie de la pantalla.
 */
export function CargaLayoutPrevia({
  validacion,
}: {
  validacion: ILayoutValidacion;
}) {
  const conObservaciones = validacion.rechazadas > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" appearance="light">
          {validacion.total} renglones en el archivo
        </Badge>
        <Badge variant="success" appearance="light">
          <CircleCheck />
          {validacion.validas} sin observaciones
        </Badge>
        {conObservaciones && (
          <Badge variant="destructive" appearance="light">
            <CircleAlert />
            {validacion.rechazadas} con observaciones
          </Badge>
        )}
        <Badge variant="info" appearance="light">
          <Building2 />
          {validacion.consejos}{' '}
          {validacion.consejos === 1 ? 'consejo' : 'consejos'}
        </Badge>
      </div>

      <Tabs defaultValue={conObservaciones ? 'observaciones' : 'resumen'}>
        <TabsList>
          {conObservaciones && (
            <TabsTrigger value="observaciones">
              Observaciones ({validacion.rechazadas})
            </TabsTrigger>
          )}
          <TabsTrigger value="resumen">Resumen por consejo</TabsTrigger>
          <TabsTrigger value="muestra">Muestra del archivo</TabsTrigger>
        </TabsList>

        {conObservaciones && (
          <TabsContent value="observaciones" className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              El layout se carga completo o no se carga: corrige estos renglones
              en el archivo y vuelve a subirlo.
            </p>
            <TablaFilas filas={validacion.filas_rechazadas} conMotivos />
            {validacion.rechazadas_omitidas > 0 && (
              <p className="text-xs text-muted-foreground">
                Se muestran los primeros {validacion.filas_rechazadas.length}{' '}
                renglones; hay {validacion.rechazadas_omitidas} más con
                observaciones.
              </p>
            )}
          </TabsContent>
        )}

        <TabsContent value="resumen">
          <div className="border border-border rounded-lg">
            <ScrollArea className="max-h-[50vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Consejo</TableHead>
                    <TableHead>Elección</TableHead>
                    <TableHead className="text-end">Renglones</TableHead>
                    <TableHead className="text-end">Piezas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validacion.resumen.map((r) => (
                    <TableRow key={`${r.consejo}|${r.eleccion}`}>
                      <TableCell className="font-medium">{r.consejo}</TableCell>
                      <TableCell>{r.eleccion}</TableCell>
                      <TableCell className="text-end">{r.renglones}</TableCell>
                      <TableCell className="text-end">
                        {r.cantidad_total.toLocaleString('es-MX')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="muestra" className="flex flex-col gap-2">
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Layers className="h-4 w-4" />
            Primeros renglones sin observaciones, para confirmar que el archivo
            se leyó como esperabas.
          </p>
          <TablaFilas filas={validacion.muestra} conMotivos={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
