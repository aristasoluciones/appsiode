'use client';

import { useMemo, useState } from 'react';
import { SearchX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { IConsejeroExterno } from '@/types/sesiones';
import type { IConsejeroApertura } from '@/types/aperturas-bodegas';

export interface ConsejerosAsistenciaAperturaCardProps {
  consejeros: IConsejeroExterno[];
  loading: boolean;
  detalle: IConsejeroApertura[];
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

export function ConsejerosAsistenciaAperturaCard({
  consejeros,
  loading,
  detalle,
  readOnly,
  onAsistenciaChange,
}: ConsejerosAsistenciaAperturaCardProps) {
  const initialAsistencia = useMemo(() => {
    const map: Record<number, boolean> = {};
    detalle.forEach((c) => {
      if (c.id_consejero != null) map[c.id_consejero] = !!c.asistencia;
    });
    return map;
  }, [detalle]);

  const [asistencia, setAsistencia] =
    useState<Record<number, boolean>>(initialAsistencia);

  const presentes = useMemo(
    () =>
      consejeros.reduce(
        (s, c) => s + (asistencia[c.id] ? 1 : 0),
        0,
      ),
    [consejeros, asistencia],
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
    const allSelected = consejeros.every((c) => asistencia[c.id]);
    const nextValue = !allSelected;
    const next: Record<number, boolean> = {};
    consejeros.forEach((c) => {
      next[c.id] = nextValue;
      onAsistenciaChange(c.id, nextValue);
    });
    setAsistencia(next);
  }

  const allSelected =
    consejeros.length > 0 && consejeros.every((c) => asistencia[c.id]);
  const someSelected =
    consejeros.some((c) => asistencia[c.id]) && !allSelected;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {!readOnly && (
            <Checkbox
              id="select-all-consejeros-apertura"
              checked={
                allSelected ? true : someSelected ? 'indeterminate' : false
              }
              onCheckedChange={toggleAll}
            />
          )}
          <label
            htmlFor={
              readOnly ? undefined : 'select-all-consejeros-apertura'
            }
            className={readOnly ? undefined : 'cursor-pointer'}
          >
            <CardTitle>Consejerías Electorales</CardTitle>
          </label>
        </div>
        <Badge variant="secondary" appearance="light" size="sm">
          {presentes} / {consejeros.length}
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex flex-col gap-2 p-5" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-10 w-full animate-pulse motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : consejeros.length === 0 ? (
          <LocalEmptyState
            icon={<SearchX className="h-7 w-7 text-gray-400" />}
            title="Sin consejerías"
            description="No hay consejerías electorales registradas para este consejo."
          />
        ) : (
          <ScrollArea className="h-[calc(100dvh-440px)] min-h-[240px]">
            <ul className="divide-y divide-border">
              {consejeros.map((c) => {
                const presente = !!asistencia[c.id];
                return (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <Checkbox
                      id={`ap-consejero-${c.id}`}
                      checked={presente}
                      onCheckedChange={() => toggle(c.id)}
                      disabled={readOnly}
                    />
                    <label
                      htmlFor={`ap-consejero-${c.id}`}
                      className={`flex-1 min-w-0 ${
                        readOnly ? '' : 'cursor-pointer'
                      }`}
                    >
                      <p className="text-sm font-medium text-foreground leading-tight">
                        {c.nombre} {c.apellidos}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.cargo}
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