'use client';

import { CircleAlert, CircleCheck, Download, TriangleAlert } from 'lucide-react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
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
import type { IMasivoResultado } from '@/types/usuarios-masivo';

/**
 * Resultado del alta: qué cuentas se crearon, cuáles no y por qué.
 * Las contraseñas iniciales no se muestran en pantalla: solo viajan en el acuse.
 */
export function UsuariosMasivoResultado({
  resultado,
  onDescargarAcuse,
}: {
  resultado: IMasivoResultado;
  onDescargarAcuse: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 min-h-0">
      <Alert variant="warning" appearance="light" close={false}>
        <AlertIcon>
          <TriangleAlert />
        </AlertIcon>
        <AlertTitle>
          El acuse con las contraseñas iniciales ya se descargó. Guárdalo antes
          de cerrar esta ventana: al cerrarla ya no será posible recuperar las
          contraseñas.
        </AlertTitle>
      </Alert>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="success" appearance="light">
          <CircleCheck />
          {resultado.creadas.length} cuentas creadas
        </Badge>
        {resultado.rechazadas.length > 0 && (
          <Badge variant="destructive" appearance="light">
            <CircleAlert />
            {resultado.rechazadas.length} filas no se dieron de alta
          </Badge>
        )}
        <Button
          variant="outline"
          size="sm"
          className="ms-auto"
          onClick={onDescargarAcuse}
        >
          <Download />
          Descargar el acuse otra vez
        </Button>
      </div>

      <ScrollArea className="max-h-[45vh] min-h-0">
        <div className="flex flex-col gap-5 pe-2">
          {resultado.creadas.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold">Cuentas creadas</h4>
              <div className="border border-border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">Fila</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Correo</TableHead>
                      <TableHead>Tipo de usuario</TableHead>
                      <TableHead>Consejo</TableHead>
                      <TableHead>Rol</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultado.creadas.map((c) => (
                      <TableRow key={c.fila}>
                        <TableCell className="text-muted-foreground">
                          {c.fila}
                        </TableCell>
                        <TableCell className="font-medium">{c.nombre}</TableCell>
                        <TableCell>{c.correo}</TableCell>
                        <TableCell>{c.tipo || '—'}</TableCell>
                        <TableCell>{c.consejo || '—'}</TableCell>
                        <TableCell>{c.rol || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {resultado.rechazadas.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold">Filas no dadas de alta</h4>
              <div className="border border-border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">Fila</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Correo</TableHead>
                      <TableHead>Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultado.rechazadas.map((r) => (
                      <TableRow key={r.fila} className="bg-destructive/5">
                        <TableCell className="text-muted-foreground">
                          {r.fila}
                        </TableCell>
                        <TableCell className="font-medium">
                          {r.nombre || '—'}
                        </TableCell>
                        <TableCell>{r.correo || '—'}</TableCell>
                        <TableCell className="text-destructive text-xs">
                          {r.motivo}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
