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
} as const;
