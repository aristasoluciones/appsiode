'use client';

import type { TEstudioEstatus, TEstudioRevision } from '@/types/mecanismos';
import { Badge } from '@/components/ui/badge';
import { ESTATUS_ESTUDIO, REVISION_ESTUDIO } from '../_lib/estatus';

export type TCualDocumento = 'propuesta' | 'aprobada';

export function EstudioBadge({ estatus }: { estatus: TEstudioEstatus | null }) {
  const e = ESTATUS_ESTUDIO[estatus ?? 'SIN_ESTUDIO'];
  return (
    <Badge variant={e.variant} appearance="light" size="sm">
      {e.label}
    </Badge>
  );
}

/** Estatus de la revisión de un consejo sobre el estudio. */
export function RevisionBadge({
  estatus,
}: {
  estatus: TEstudioRevision | null;
}) {
  const r = REVISION_ESTUDIO[estatus ?? 'SIN_REVISAR'];
  return (
    <Badge variant={r.variant} appearance="light" size="sm">
      {r.label}
    </Badge>
  );
}
