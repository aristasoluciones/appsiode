'use client';

import { useMemo, useState } from 'react';
import { CircleAlert, CircleCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { IMasivoValidacion } from '@/types/usuarios-masivo';

/**
 * Vista previa del archivo: qué cuentas se crearán, cuáles no y por qué.
 * Es de solo lectura; la creación se confirma desde el pie de la ventana.
 */
export function UsuariosMasivoPrevia({
  validacion,
}: {
  validacion: IMasivoValidacion;
}) {
  const [soloConError, setSoloConError] = useState(false);

  const filas = useMemo(
    () =>
      soloConError
        ? validacion.filas.filter((f) => !f.valida)
        : validacion.filas,
    [validacion.filas, soloConError],
  );

  return (
    <div className="flex flex-col gap-4 min-h-0">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" appearance="light">
          {validacion.total} filas en el archivo
        </Badge>
        <Badge variant="success" appearance="light">
          <CircleCheck />
          {validacion.validas} se crearán
        </Badge>
        {validacion.rechazadas > 0 && (
          <Badge variant="destructive" appearance="light">
            <CircleAlert />
            {validacion.rechazadas} con error
          </Badge>
        )}

        {validacion.rechazadas > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="ms-auto"
            onClick={() => setSoloConError((v) => !v)}
          >
            {soloConError ? 'Ver todas las filas' : 'Ver solo las filas con error'}
          </Button>
        )}
      </div>

      <div className="border border-border rounded-lg min-h-0">
        <ScrollArea className="max-h-[45vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">Fila</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Tipo de usuario</TableHead>
                <TableHead>Consejo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Observaciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((f) => (
                <TableRow
                  key={f.fila}
                  className={cn(!f.valida && 'bg-destructive/5')}
                >
                  <TableCell className="text-muted-foreground">{f.fila}</TableCell>
                  <TableCell className="font-medium">
                    {`${f.paterno} ${f.materno} ${f.nombre}`.replace(/\s+/g, ' ').trim() ||
                      '—'}
                  </TableCell>
                  <TableCell>{f.correo || '—'}</TableCell>
                  <TableCell>{f.tipo || '—'}</TableCell>
                  <TableCell>
                    {f.consejo
                      ? `${f.tipo_consejo ? `${f.tipo_consejo} · ` : ''}${f.consejo}`
                      : '—'}
                  </TableCell>
                  <TableCell>{f.rol || '—'}</TableCell>
                  <TableCell>
                    {f.valida ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CircleCheck className="h-3.5 w-3.5 text-green-600" />
                        Sin observaciones
                      </span>
                    ) : (
                      <ul className="list-disc ps-4 text-xs text-destructive space-y-0.5">
                        {f.errores.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
