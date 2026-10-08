import { z } from 'zod';
import type { IActaCustodia, IActaVehiculo } from '@/types/material-electoral';

/**
 * Vehículo de traslado y custodia del acta. Las reglas son las que aplica la
 * API, repetidas aquí solo para avisar antes de enviar. Los números se capturan
 * como texto y se convierten al armar el payload.
 */

const obligatorio = (mensaje: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, { message: mensaje })
    .max(max, { message: `No debe superar ${max} caracteres.` });

export const vehiculoSchema = z.object({
  tipo: obligatorio('Captura el tipo de vehículo.', 60),
  marca: obligatorio('Captura la marca.', 60),
  modelo: obligatorio('Captura el modelo.', 60),
  placas: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9-]{1,15}$/, {
      message:
        'Captura las placas (letras, números o guiones, hasta 15 caracteres).',
    }),
  numero_economico: z.string().trim().max(40, {
    message: 'No debe superar 40 caracteres.',
  }),
  numero_tarjeta_circulacion: obligatorio(
    'Captura el número de tarjeta de circulación.',
    40,
  ),
  conductor: obligatorio('Captura el nombre del conductor.', 150),
  clave_credencial: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{18}$/, {
      message: 'La clave debe tener 18 caracteres alfanuméricos.',
    }),
});

export const custodiaSchema = z.object({
  custodiado: z.boolean(),
  corporacion: z.string().trim().max(100, {
    message: 'No debe superar 100 caracteres.',
  }),
  numero_patrulla: z.string().trim(),
  numero_elementos: z.string().trim(),
  conductor_nombre: z.string().trim().max(150, {
    message: 'No debe superar 150 caracteres.',
  }),
  conductor_identificacion: z.string().trim().max(40, {
    message: 'No debe superar 40 caracteres.',
  }),
});

export type TVehiculoForm = z.infer<typeof vehiculoSchema>;
export type TCustodiaForm = z.infer<typeof custodiaSchema>;

export interface ITrasladoForm {
  vehiculo: TVehiculoForm;
  custodia: TCustodiaForm;
}

export const VEHICULO_VACIO: TVehiculoForm = {
  tipo: '',
  marca: '',
  modelo: '',
  placas: '',
  numero_economico: '',
  numero_tarjeta_circulacion: '',
  conductor: '',
  clave_credencial: '',
};

export const CUSTODIA_VACIA: TCustodiaForm = {
  custodiado: false,
  corporacion: '',
  numero_patrulla: '',
  numero_elementos: '',
  conductor_nombre: '',
  conductor_identificacion: '',
};

/** Con custodia, todos los datos de la patrulla son obligatorios; sin ella no se piden. */
export function validarCustodia(
  custodia: TCustodiaForm,
  agregar: (campo: keyof TCustodiaForm, mensaje: string) => void,
) {
  if (!custodia.custodiado) return;
  if (!custodia.corporacion) agregar('corporacion', 'Captura la corporación.');
  if (!/^[A-Za-z0-9-]{1,20}$/.test(custodia.numero_patrulla)) {
    agregar(
      'numero_patrulla',
      'Captura el número de patrulla (alfanumérico, hasta 20 caracteres).',
    );
  }
  if (
    !/^\d{1,2}$/.test(custodia.numero_elementos) ||
    Number(custodia.numero_elementos) < 1
  ) {
    agregar('numero_elementos', 'Captura los elementos (de 1 a 99).');
  }
  if (!custodia.conductor_nombre) {
    agregar('conductor_nombre', 'Captura el nombre del conductor.');
  }
  if (!custodia.conductor_identificacion) {
    agregar('conductor_identificacion', 'Captura la identificación.');
  }
}

/** Lo guardado en el acta, convertido a los textos del formulario. */
export function trasladoDesdeActa(
  vehiculo: IActaVehiculo | null | undefined,
  custodia: IActaCustodia | null | undefined,
): ITrasladoForm {
  return {
    vehiculo: vehiculo
      ? {
          tipo: vehiculo.tipo ?? '',
          marca: vehiculo.marca ?? '',
          modelo: vehiculo.modelo ?? '',
          placas: vehiculo.placas ?? '',
          numero_economico: vehiculo.numero_economico ?? '',
          numero_tarjeta_circulacion: vehiculo.numero_tarjeta_circulacion ?? '',
          conductor: vehiculo.conductor ?? '',
          clave_credencial: vehiculo.clave_credencial ?? '',
        }
      : VEHICULO_VACIO,
    custodia: custodia?.custodiado
      ? {
          custodiado: true,
          corporacion: custodia.corporacion ?? '',
          numero_patrulla: custodia.numero_patrulla ?? '',
          numero_elementos:
            custodia.numero_elementos != null
              ? String(custodia.numero_elementos)
              : '',
          conductor_nombre: custodia.conductor_nombre ?? '',
          conductor_identificacion: custodia.conductor_identificacion ?? '',
        }
      : CUSTODIA_VACIA,
  };
}

/** Los textos del formulario, como los espera la API. */
export function trasladoParaApi(traslado: ITrasladoForm): {
  vehiculo: IActaVehiculo;
  custodia: IActaCustodia;
} {
  const v = traslado.vehiculo;
  const c = traslado.custodia;
  return {
    vehiculo: {
      tipo: v.tipo.trim(),
      marca: v.marca.trim(),
      modelo: v.modelo.trim(),
      placas: v.placas.trim().toUpperCase(),
      ...(v.numero_economico.trim()
        ? { numero_economico: v.numero_economico.trim() }
        : {}),
      numero_tarjeta_circulacion: v.numero_tarjeta_circulacion.trim(),
      conductor: v.conductor.trim(),
      clave_credencial: v.clave_credencial.trim().toUpperCase(),
    },
    custodia: c.custodiado
      ? {
          custodiado: true,
          corporacion: c.corporacion.trim(),
          numero_patrulla: c.numero_patrulla.trim().toUpperCase(),
          numero_elementos: Number(c.numero_elementos),
          conductor_nombre: c.conductor_nombre.trim(),
          conductor_identificacion: c.conductor_identificacion.trim(),
        }
      : { custodiado: false },
  };
}
