'use client';

import { useMemo } from 'react';
import { SearchX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { IConsejeroApertura } from '@/types/aperturas-bodegas';

export interface ConsejerosAsistenciaAperturaCardProps {
  /**
   * Padrón del acta con su asistencia. Al crear se siembra desde el catálogo
   * externo; al abrir una apertura existente son los renglones guardados. En
   * ambos casos el acta es la fuente y `orden` identifica cada renglón.
   */
  items: IConsejeroApertura[];
  loading: boolean;
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

export function ConsejerosAsistenciaAperturaCard({
  items,
  loading,
  readOnly,
  onToggle,
  onToggleAll,
}: ConsejerosAsistenciaAperturaCardProps) {
  const presentes = useMemo(
    () => items.reduce((s, c) => s + (c.asistencia ? 1 : 0), 0),
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
              id="select-all-consejeros-apertura"
              checked={
                allSelected ? true : someSelected ? 'indeterminate' : false
              }
              onCheckedChange={() => onToggleAll(!allSelected)}
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
          {presentes} / {items.length}
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
        ) : items.length === 0 ? (
          <LocalEmptyState
            icon={<SearchX className="h-7 w-7 text-gray-400" />}
            title="Sin consejerías"
            description="No hay consejerías electorales registradas para este consejo."
          />
        ) : (
          <ScrollArea className="h-[calc(100dvh-440px)] min-h-[240px]">
            <ul className="divide-y divide-border">
              {items.map((c) => {
                const presente = !!c.asistencia;
                return (
                  <li
                    key={c.orden}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <Checkbox
                      id={`ap-consejero-${c.orden}`}
                      checked={presente}
                      onCheckedChange={() => onToggle(c.orden, !presente)}
                      disabled={readOnly}
                    />
                    <label
                      htmlFor={`ap-consejero-${c.orden}`}
                      className={`flex-1 min-w-0 ${
                        readOnly ? '' : 'cursor-pointer'
                      }`}
                    >
                      <p className="text-sm font-medium text-foreground leading-tight">
                        {c.nombre}
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
