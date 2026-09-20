import { z } from 'zod';
import type {
  IMecanismo,
  IMecanismoPayload,
  TTipoConsejoChar,
} from '@/types/mecanismos';
import { MECANISMOS_LIMITES } from './limites';

/** Un consejo vinculado viaja como «D-12» / «M-45» en los selectores. */
export function consejoClave(tipo: TTipoConsejoChar, id: number) {
  return `${tipo}-${id}`;
}

export function consejoIds(clave: string) {
  const [tipo, id] = clave.split('-');
  return { tipo_consejo: tipo as TTipoConsejoChar, id_consejo: Number(id) };
}

const numeroOpcional = (min: number, max: number, mensaje: string) =>
  z
    .string()
    .trim()
    .refine(
      (v) =>
        v === '' ||
        (!Number.isNaN(Number(v)) && Number(v) >= min && Number(v) <= max),
      { message: mensaje },
    );

/**
 * Mismas reglas que el API (`ModelMecanismo`), repetidas solo para avisar
 * antes de enviar; la validación autoritativa es del API.
 */
export const mecanismoSchema = z.object({
  id_df: z.string().min(1, { message: 'Elige el distrito federal.' }),
  tipo: z.string().min(1, { message: 'Elige el tipo de mecanismo.' }),
  numero: z
    .string()
    .trim()
    .refine(
      (v) =>
        /^\d+$/.test(v) &&
        Number(v) >= MECANISMOS_LIMITES.numero.min &&
        Number(v) <= MECANISMOS_LIMITES.numero.max,
      { message: 'El número debe estar entre 1 y 999.' },
    ),
  consejos: z
    .array(z.string())
    .min(MECANISMOS_LIMITES.consejos.min, {
      message: 'Vincula al menos un consejo.',
    })
    .max(MECANISMOS_LIMITES.consejos.max, {
      message: `Un mecanismo no puede vincular más de ${MECANISMOS_LIMITES.consejos.max} consejos.`,
    }),
  revisor: z.string(),
  cotizacion: z.string(),
  distancia_km: numeroOpcional(
    MECANISMOS_LIMITES.distanciaKm.min,
    MECANISMOS_LIMITES.distanciaKm.max,
    'La distancia debe estar entre 0 y 99,999.99 km.',
  ),
  tiempo_recorrido: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\d{1,2}:[0-5]\d$/.test(v), {
      message: 'Captura el tiempo como HH:MM (hasta 99:59).',
    }),
  costo_ine: numeroOpcional(
    MECANISMOS_LIMITES.costo.min,
    MECANISMOS_LIMITES.costo.max,
    'El costo INE debe estar entre 0 y 9,999,999.99.',
  ),
  eleccion_atendida: z
    .string()
    .trim()
    .max(MECANISMOS_LIMITES.eleccionAtendida.max, {
      message: `La elección atendida no debe exceder ${MECANISMOS_LIMITES.eleccionAtendida.max} caracteres.`,
    }),
  casillas: z
    .array(
      z.object({
        seccion: z
          .string()
          .trim()
          .refine(
            (v) => /^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 99999,
            {
              message: 'Sección inválida.',
            },
          ),
        casilla_tipo: z.string().trim().regex(MECANISMOS_LIMITES.casillaTipo, {
          message: 'Usa la nomenclatura del INE: B1, C1, E1, E1 C1, S1.',
        }),
        territorio: z.string().min(1, { message: 'Elige el municipio.' }),
      }),
    )
    .max(MECANISMOS_LIMITES.casillas.max, {
      message: `Un mecanismo no puede atender más de ${MECANISMOS_LIMITES.casillas.max} casillas.`,
    }),
});

export type TMecanismoForm = z.infer<typeof mecanismoSchema>;
export type TCasillaForm = TMecanismoForm['casillas'][number];

export const MECANISMO_FORM_VACIO: TMecanismoForm = {
  id_df: '',
  tipo: '',
  numero: '',
  consejos: [],
  revisor: '',
  cotizacion: '',
  distancia_km: '',
  tiempo_recorrido: '',
  costo_ine: '',
  eleccion_atendida: '',
  casillas: [],
};

/** Valores del formulario a partir de un mecanismo existente. */
export function mecanismoAFormulario(m: IMecanismo): TMecanismoForm {
  const revisor = m.consejos.find((c) => c.revisa_mecanismo);
  return {
    id_df: String(m.id_df),
    tipo: m.tipo,
    numero: String(m.numero),
    consejos: m.consejos.map((c) => consejoClave(c.tipo_consejo, c.id_consejo)),
    revisor: revisor
      ? consejoClave(revisor.tipo_consejo, revisor.id_consejo)
      : '',
    cotizacion:
      m.cotizacion_tipo_consejo && m.cotizacion_id_consejo
        ? consejoClave(m.cotizacion_tipo_consejo, m.cotizacion_id_consejo)
        : '',
    distancia_km: m.distancia_km != null ? String(m.distancia_km) : '',
    tiempo_recorrido: m.tiempo_recorrido ?? '',
    costo_ine: m.costo_ine != null ? String(m.costo_ine) : '',
    eleccion_atendida: m.eleccion_atendida ?? '',
    casillas: m.casillas.map((c) => ({
      seccion: String(c.seccion),
      casilla_tipo: c.casilla_tipo,
      territorio: `${c.id_mun}-${c.id_dl}`,
    })),
  };
}

/** Valores del formulario al cuerpo que espera el API. */
export function formularioAPayload(v: TMecanismoForm): IMecanismoPayload {
  const revisor = v.revisor ? consejoIds(v.revisor) : null;
  const cotizacion = v.cotizacion ? consejoIds(v.cotizacion) : null;
  const [horas, minutos] = v.tiempo_recorrido
    ? v.tiempo_recorrido.split(':').map(Number)
    : [];
  return {
    id_df: Number(v.id_df),
    tipo: v.tipo as IMecanismoPayload['tipo'],
    numero: Number(v.numero),
    consejos: v.consejos.map(consejoIds),
    revisor_tipo_consejo: revisor?.tipo_consejo ?? null,
    revisor_id_consejo: revisor?.id_consejo ?? null,
    cotizacion_tipo_consejo: cotizacion?.tipo_consejo ?? null,
    cotizacion_id_consejo: cotizacion?.id_consejo ?? null,
    distancia_km: v.distancia_km === '' ? null : Number(v.distancia_km),
    tiempo_recorrido_minutos:
      v.tiempo_recorrido === '' ? null : horas * 60 + minutos,
    costo_ine: v.costo_ine === '' ? null : Number(v.costo_ine),
    eleccion_atendida: v.eleccion_atendida || null,
    casillas: v.casillas.map((c) => {
      const [id_mun, id_dl] = c.territorio.split('-').map(Number);
      return {
        seccion: Number(c.seccion),
        casilla_tipo: c.casilla_tipo,
        id_mun,
        id_dl,
      };
    }),
  };
}
