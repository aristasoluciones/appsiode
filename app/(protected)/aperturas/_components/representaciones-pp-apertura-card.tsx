'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { AlertTriangle, SearchX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { IRepresentanteApertura } from '@/types/aperturas-bodegas';

const RPP_API_BASE = process.env.NEXT_PUBLIC_RPP_API_BASE ?? '';

export interface RepresentacionesPPAperturaCardProps {
  /**
   * Representaciones del acta con su asistencia. Al crear se siembran desde el
   * servicio externo; al abrir una apertura existente son las guardadas, con
   * su logotipo, de modo que el acta se lee sin depender de ese servicio.
   */
  items: IRepresentanteApertura[];
  loading: boolean;
  error: boolean;
  readOnly: boolean;
  onToggle: (orden: number, value: boolean) => void;
  onToggleAll: (value: boolean) => void;
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
  items,
  loading,
  error,
  readOnly,
  onToggle,
  onToggleAll,
}: RepresentacionesPPAperturaCardProps) {
  const presentes = useMemo(
    () => items.reduce((s, r) => s + (r.asistencia ? 1 : 0), 0),
    [items],
  );

  const allSelected = items.length > 0 && presentes === items.length;
  const someSelected = presentes > 0 && !allSelected;

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
              onCheckedChange={() => onToggleAll(!allSelected)}
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
          {presentes} / {items.length}
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
        ) : items.length === 0 ? (
          <LocalEmptyState
            icon={<SearchX className="h-7 w-7 text-gray-400" />}
            title="Sin representantes"
            description="No hay representantes activos para este consejo."
          />
        ) : (
          <ScrollArea className="h-[calc(100dvh-440px)] min-h-[240px]">
            <ul className="divide-y divide-border">
              {items.map((rep) => {
                const presente = !!rep.asistencia;
                return (
                  <li
                    key={rep.orden}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <Checkbox
                      id={`ap-rep-${rep.orden}`}
                      checked={presente}
                      onCheckedChange={() => onToggle(rep.orden, !presente)}
                      disabled={readOnly}
                    />
                    {rep.imagen && RPP_API_BASE ? (
                      <div className="relative shrink-0 w-7 h-7 rounded overflow-hidden">
                        <Image
                          src={`${RPP_API_BASE}/${rep.imagen}`}
                          alt={`Partido ${rep.id_partido}`}
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
                      htmlFor={`ap-rep-${rep.orden}`}
                      className={`flex-1 min-w-0 ${
                        readOnly ? '' : 'cursor-pointer'
                      }`}
                    >
                      <p className="text-sm font-medium text-foreground leading-tight">
                        {rep.nombre}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {rep.cargo}
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
