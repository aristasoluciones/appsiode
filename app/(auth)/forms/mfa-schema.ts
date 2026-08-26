import { z } from 'zod';

/**
 * Código del segundo paso. El de la app o del correo son 6 dígitos; el de
 * respaldo tiene el formato XXXXX-XXXXX (el API los distingue solo).
 */
export const getMfaSchema = (usarRespaldo: boolean) => {
  if (usarRespaldo) {
    return z.object({
      codigo: z
        .string()
        .trim()
        .regex(/^[A-Za-z0-9]{5}-?[A-Za-z0-9]{5}$/, {
          message: 'Capture el código de respaldo completo (XXXXX-XXXXX).',
        }),
    });
  }
  return z.object({
    codigo: z
      .string()
      .regex(/^\d{6}$/, { message: 'Capture el código de 6 dígitos.' }),
  });
};

export type MfaSchemaType = z.infer<ReturnType<typeof getMfaSchema>>;
