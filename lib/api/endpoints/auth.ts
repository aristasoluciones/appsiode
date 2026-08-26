import { qs } from './_shared';

export const AUTH = {
  LOGIN: '/Auth/login',
  REFRESH: '/Auth/refresh',
  PERFIL: '/Auth/perfil',
  LOGOUT: '/Auth/logout',
  VERIFY_EMAIL: '/Auth/verify-email',
  RECUPERAR_CONTRASENIA: '/Auth/recuperar-contrasenia',
  RESET_PASSWORD_VERIFY: '/Auth/reset-password-verify',
  RESET_PASSWORD: '/Auth/reset-password',
  /** Canjea el reto del login por la sesión, presentando el código del segundo paso. */
  MFA_VERIFICAR: '/Auth/mfa/verificar',
  MFA_ESTADO: '/Auth/mfa/estado',
  MFA_ENROLAR: '/Auth/mfa/enrolar',
  MFA_CONFIRMAR: '/Auth/mfa/confirmar',
  MFA_DESACTIVAR: '/Auth/mfa/desactivar',

  /** Sesiones abiertas de la propia cuenta (sección de seguridad del perfil). */
  SESIONES: '/auth/sesiones',
  /** Cierra una sesión concreta de la propia cuenta. */
  SESION: (idSesion: string) => `/auth/sesiones/${idSesion}`,

  /** Equipos de confianza del segundo paso de la propia cuenta. */
  MFA_DISPOSITIVOS: '/auth/mfa/dispositivos',
  /** Retira la confianza a un equipo recordado. */
  MFA_DISPOSITIVO: (idDispositivo: string) =>
    `/auth/mfa/dispositivos/${idDispositivo}`,

  /** Historial de la propia cuenta, paginado y con filtro por tipo o categoría. */
  HISTORIAL: (
    pagina?: number,
    tamanio?: number,
    tipo?: string | null,
  ) => `/auth/historial${qs({ pagina, tamanio, tipo })}`,
} as const;
