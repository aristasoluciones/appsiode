import { z } from 'zod';

export const getSigninSchema = () => {
  return z.object({
    username: z
      .string()
      .min(1, { message: 'El usuario es requerido.' }),
    password: z
      .string()
      .min(1, { message: 'La contraseña es requerida.' }),
    rememberMe: z.boolean().optional(),
  });
};

export type SigninSchemaType = z.infer<ReturnType<typeof getSigninSchema>>;
