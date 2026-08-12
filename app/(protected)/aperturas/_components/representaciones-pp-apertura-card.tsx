'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { AlertTriangle, SearchX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import type {
  IRepresentanteApertura,
} from '@/types/aperturas-bodegas';
import type { IRepresentanteNorm } from '../_hooks/use-external';

const RPP_API_BASE = process.env.NEXT_PUBLIC_RPP_API_BASE ?? '';

export interface RepresentacionesPPAperturaCardProps {
  representantes: IRepresentanteNorm[];
  loading: boolean;
  error: boolean;
  detalle: IRepresentanteApertura[];
  readOnly: boolean;
  onAsistenciaChange: (uid: number, value: boolean) => void;
}

function LocalEmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center px-5">
      <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {title}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}

export function RepresentacionesPPAperturaCard({
  representantes,
  loading,
  error,
  detalle,
  readOnly,
  onAsistenciaChange,
}: RepresentacionesPPAperturaCardProps) {
  const initialAsistencia = useMemo(() => {
    const map: Record<number, boolean> = {};
    detalle.forEach((r) => {
      if (r.id_representante != null) map[r.id_representante] = !!r.asistencia;
    });
    return map;
  }, [detalle]);

  const [asistencia, setAsistencia] =
    useState<Record<number, boolean>>(initialAsistencia);

  const presentes = useMemo(
    () =>
      representantes.reduce(
        (s, r) => s + (asistencia[r.id_representante] ? 1 : 0),
        0,
      ),
    [representantes, asistencia],
  );

  function toggle(uid: number) {
    if (readOnly) return;
    setAsistencia((prev) => {
      const next = { ...prev, [uid]: !prev[uid] };
      onAsistenciaChange(uid, next[uid]);
      return next;
    });
  }

  function toggleAll() {
    if (readOnly) return;
    const allSelected = representantes.every(
      (r) => asistencia[r.id_representante],
    );
    const nextValue = !allSelected;
    const next: Record<number, boolean> = {};
    representantes.forEach((r) => {
      next[r.id_representante] = nextValue;
      onAsistenciaChange(r.id_representante, nextValue);
    });
    setAsistencia(next);
  }

  const allSelected =
    representantes.length > 0 &&
    representantes.every((r) => asistencia[r.id_representante]);
  const someSelected =
    representantes.some((r) => asistencia[r.id_representante]) && !allSelected;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {!readOnly && (
            <Checkbox
              id="select-all-rep-apertura"
              checked={
                allSelected ? true : someSelected ? 'indeterminate' : false
              }
              onCheckedChange={toggleAll}
            />
          )}
          <label
            htmlFor={readOnly ? undefined : 'select-all-rep-apertura'}
            className={readOnly ? undefined : 'cursor-pointer'}
          >
            <CardTitle>Representaciones de Partidos</CardTitle>
          </label>
        </div>
        <Badge variant="secondary" appearance="light" size="sm">
          {presentes} / {representantes.length}
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <LocalEmptyState
            icon={<AlertTriangle className="h-7 w-7 text-destructive" />}
            title="Sin conexión con representantes"
            description="No se pudo establecer contacto con el servicio de representantes."
          />
        ) : representantes.length === 0 ? (
          <LocalEmptyState
            icon={<SearchX className="h-7 w-7 text-gray-400" />}
            title="Sin representantes"
            description="No hay representantes activos para este consejo."
          />
        ) : (
          <ScrollArea className="h-[calc(100dvh-440px)] min-h-[240px]">
            <ul className="divide-y divide-border">
              {representantes.map((rep) => {
                const presente = !!asistencia[rep.id_representante];
                return (
                  <li
                    key={rep.id_representante}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <Checkbox
                      id={`ap-rep-${rep.id_representante}`}
                      checked={presente}
                      onCheckedChange={() => toggle(rep.id_representante)}
                      disabled={readOnly}
                    />
                    {rep.partyImagePath && RPP_API_BASE ? (
                      <div className="relative shrink-0 w-7 h-7 rounded overflow-hidden">
                        <Image
                          src={`${RPP_API_BASE}/${rep.partyImagePath}`}
                          alt={rep.partyName}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="shrink-0 w-7 h-7 rounded bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                        {rep.id_partido}
                      </div>
                    )}
                    <label
                      htmlFor={`ap-rep-${rep.id_representante}`}
                      className={`flex-1 min-w-0 ${
                        readOnly ? '' : 'cursor-pointer'
                      }`}
                    >
                      <p className="text-sm font-medium text-foreground leading-tight">
                        {rep.nombre} {rep.apellidos}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {rep.cargo} · {rep.partyName}
                      </p>
                    </label>
                    <Badge
                      variant={presente ? 'success' : 'destructive'}
                      appearance="light"
                      size="sm"
                    >
                      {presente ? 'Presente' : 'Ausente'}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}