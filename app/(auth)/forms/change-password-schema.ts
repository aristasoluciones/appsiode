import { z } from 'zod';
import { getPasswordSchema } from './password-schema';

export const getChangePasswordSchema = () => {
  return z
    .object({
      newPassword: getPasswordSchema(),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'Las contraseñas no coinciden.',
      path: ['confirmPassword'],
    });
};

export type ChangePasswordSchemaType = z.infer<
  ReturnType<typeof getChangePasswordSchema>
>;

export const getChangePasswordApiSchema = () => {
  return z.object({
    token: z.string().nonempty({
      message: 'Se requiere un token válido para cambiar la contraseña.',
    }),
    newPassword: getPasswordSchema(),
  });
};

export type ChangePasswordApiSchemaType = z.infer<
  ReturnType<typeof getChangePasswordApiSchema>
>;
