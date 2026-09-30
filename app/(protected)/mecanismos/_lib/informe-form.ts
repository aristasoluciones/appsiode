import { z } from 'zod';
import type {
  IMecanismoInformarPayload,
  IMecanismoLista,
  TObservacionTipo,
} from '@/types/mecanismos';
import { TIPO_SIN_OBSERVACIONES } from './estatus';
import { MECANISMOS_LIMITES } from './limites';

/**
 * Esquema del informe con los mismos límites que la API, solo para avisar
 * antes de enviar. Las observaciones son obligatorias salvo con «Sin
 * observaciones»; «Informar» se marca con cualquier tipo, y el costo y el CAE
 * solo cuentan al marcarlo y según las banderas del consejo.
 */
export function crearInformeSchema(capturaCosto: boolean, asignaCae: boolean) {
  return z
    .object({
      tipo_observacion: z
        .string()
        .min(1, { message: 'Elige el tipo de observación.' }),
      observaciones: z
        .string()
        .trim()
        .max(MECANISMOS_LIMITES.observaciones.max, {
          message: `Las observaciones no deben exceder ${MECANISMOS_LIMITES.observaciones.max} caracteres.`,
        }),
      informar: z.boolean(),
      cae_folio: z.string().max(MECANISMOS_LIMITES.caeFolio.max),
      cae_nombre: z.string(),
      costo: z.string().trim(),
    })
    .superRefine((v, ctx) => {
      if (
        v.tipo_observacion !== TIPO_SIN_OBSERVACIONES &&
        v.observaciones === ''
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['observaciones'],
          message: 'Captura la observación de este tipo.',
        });
      }
      if (!v.informar) return;
      if (asignaCae && v.cae_folio === '') {
        ctx.addIssue({
          code: 'custom',
          path: ['cae_folio'],
          message: 'Elige el CAE que atiende el mecanismo.',
        });
      }
      if (capturaCosto) {
        const n = Number(v.costo);
        if (v.costo === '') {
          ctx.addIssue({
            code: 'custom',
            path: ['costo'],
            message: 'Captura el costo estimado.',
          });
        } else if (
          Number.isNaN(n) ||
          n < MECANISMOS_LIMITES.costo.min ||
          n > MECANISMOS_LIMITES.costo.max
        ) {
          ctx.addIssue({
            code: 'custom',
            path: ['costo'],
            message: `El costo debe estar entre 0 y ${MECANISMOS_LIMITES.costo.max.toLocaleString('es-MX')}.`,
          });
        }
      }
    });
}

export type TInformeForm = z.infer<ReturnType<typeof crearInformeSchema>>;

/** Valores iniciales: sin tipo elegido y con el CAE y el costo que ya tiene el mecanismo. */
export function informeInicial(m: IMecanismoLista | null): TInformeForm {
  return {
    tipo_observacion: '',
    observaciones: '',
    informar: false,
    cae_folio: m?.cae_folio ?? '',
    cae_nombre: m?.cae_nombre ?? '',
    costo: m?.costo_estimado != null ? String(m.costo_estimado) : '',
  };
}

/** Del formulario al contrato: costo y CAE solo viajan al informar y según las banderas. */
export function informeAPayload(
  v: TInformeForm,
  capturaCosto: boolean,
  asignaCae: boolean,
): IMecanismoInformarPayload {
  return {
    tipo_observacion: v.tipo_observacion as TObservacionTipo,
    observaciones: v.observaciones === '' ? null : v.observaciones,
    informar: v.informar,
    cae_folio: v.informar && asignaCae && v.cae_folio ? v.cae_folio : null,
    costo:
      v.informar && capturaCosto && v.costo !== '' ? Number(v.costo) : null,
  };
}
