'use client';

import { useMemo } from 'react';
import type { IActaTipoArticulo } from '@/types/material-electoral';
import { useAuth } from '@/providers/auth-provider';
import { useActasConsejo } from './use-actas';
import { useComprobaciones } from './use-comprobaciones';

export interface IActaTipoOpcion {
  clave: string;
  descripcion: string;
}

interface Opciones {
  /** Solo se piden los datos cuando la ventana que los usa está abierta. */
  habilitado: boolean;
  /** Acta a la que pertenece la selección: sus propios tipos no cuentan como ocupados. */
  actaId?: number | null;
  /** Tipos que el acta ya tenía elegidos, aunque hoy no haya renglones de ese tipo. */
  propios?: IActaTipoArticulo[] | null;
}

/**
 * Tipos de artículo que el consejo puede elegir para un acta y cuáles ya están
 * en otra acta en curso (clave → número del acta que lo tiene). Los tipos salen
 * de la documentación y el material cargados al consejo, porque el catálogo
 * completo solo lo consulta quien carga el layout.
 */
export function useTiposActa({ habilitado, actaId = null, propios }: Opciones) {
  const { user } = useAuth();
  const tipoConsejo =
    user?.tipoConsejo === 'D' || user?.tipoConsejo === 'M'
      ? user.tipoConsejo
      : null;
  const idConsejo = user?.idConsejo ? Number(user.idConsejo) : null;

  const comprobaciones = useComprobaciones(
    habilitado ? tipoConsejo : null,
    habilitado ? idConsejo : null,
  );
  const actas = useActasConsejo(
    habilitado ? tipoConsejo : null,
    habilitado ? idConsejo : null,
  );

  const ocupados = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const o of actas.data?.tipos_ocupados ?? []) {
      if (o.id_acta !== actaId) mapa[o.clave] = o.id_acta;
    }
    return mapa;
  }, [actas.data, actaId]);

  const opciones = useMemo<IActaTipoOpcion[]>(() => {
    const mapa = new Map<string, IActaTipoOpcion>();
    for (const d of comprobaciones.data?.documentos ?? []) {
      if (!mapa.has(d.tipo_doc)) {
        mapa.set(d.tipo_doc, {
          clave: d.tipo_doc,
          descripcion: d.desc_tipo || d.tipo_doc,
        });
      }
    }
    for (const t of [
      ...(propios ?? []),
      ...(actas.data?.tipos_ocupados ?? []),
    ]) {
      if (!mapa.has(t.clave)) {
        mapa.set(t.clave, {
          clave: t.clave,
          descripcion: t.descripcion || t.clave,
        });
      }
    }
    return Array.from(mapa.values()).sort((a, b) =>
      a.descripcion.localeCompare(b.descripcion, 'es'),
    );
  }, [comprobaciones.data, actas.data, propios]);

  return {
    opciones,
    ocupados,
    cargando: comprobaciones.isLoading || actas.isLoading,
  };
}
