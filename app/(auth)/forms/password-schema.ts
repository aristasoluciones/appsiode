import { z } from 'zod';

export const getPasswordSchema = (minLength = 8) => {
  return z
    .string()
    .min(minLength, {
      message: `El password debe tener al menos ${minLength} caracteres.`,
    })
    .regex(/[A-Z]/, {
      message: 'El password debe contener al menos una letra mayúscula.',
    })
    .regex(/[a-z]/, {
      message: 'El password debe contener al menos una letra minúscula.',
    })
    .regex(/\d/, {
      message: 'El password debe contener al menos un número.',
    })
    .regex(/[!@#$%^&*(),.?":{}|<>]/, {
      message: 'El password debe contener al menos un carácter especial.',
    });
};
