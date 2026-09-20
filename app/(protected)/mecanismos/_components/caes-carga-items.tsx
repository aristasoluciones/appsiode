'use client';

import type {
  ICaeAsignacionItem,
  ICaeImportacionItem,
} from '@/types/mecanismos';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EfectoBadge } from './carga-resumen';

interface CaesCargaItemsProps {
  modo: 'listado' | 'asignacion';
  items: (ICaeImportacionItem | ICaeAsignacionItem)[];
}

/** Renglón por renglón de la vista previa o del resultado de una carga de CAE. */
export function CaesCargaItems({ modo, items }: CaesCargaItemsProps) {
  return (
    <div className="max-h-72 overflow-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            {modo === 'listado' ? (
              <>
                <TableHead>Folio</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Consejo</TableHead>
              </>
            ) : (
              <>
                <TableHead>Mecanismo</TableHead>
                <TableHead>Consejo</TableHead>
                <TableHead>CAE actual</TableHead>
                <TableHead>CAE nuevo</TableHead>
              </>
            )}
            <TableHead>Efecto</TableHead>
            <TableHead>Observaciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((it, i) => (
            <TableRow key={i}>
              {'id_mecanismo' in it ? (
                <>
                  <TableCell className="whitespace-nowrap">
                    DF{it.id_df ?? '?'} · {it.tipo ?? '?'} {it.numero ?? '?'}
                  </TableCell>
                  <TableCell>{it.consejo ?? '—'}</TableCell>
                  <TableCell>
                    {it.cae_actual
                      ? `${it.cae_actual} · ${it.cae_nombre_actual}`
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {it.folio ? `${it.folio} · ${it.cae_nombre ?? ''}` : '—'}
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell className="tabular-nums">{it.folio}</TableCell>
                  <TableCell>{it.nombre_completo}</TableCell>
                  <TableCell>{it.categoria}</TableCell>
                  <TableCell>{it.consejo}</TableCell>
                </>
              )}
              <TableCell>
                <EfectoBadge efecto={it.efecto} />
              </TableCell>
              <TableCell className="text-destructive">
                {it.error ?? ''}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
