// Endpoints del BFF (browser → Next.js API routes, solo auth)
export const BFF_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    PERFIL: '/api/auth/perfil',
    REFRESH: '/api/auth/refresh',
  },
} as const;

// Endpoints del API .NET — usados con apiClient (browser directo) y serverApi (server-side)
export const API_ENDPOINTS = {
  CATALOGOS: {
    PROCESO: (idProceso: string | number) => `/Catalogos/proceso/${idProceso}`,
    SESIONES: '/Catalogos',
    LIST: (catalogos: string) => `/Catalogos?catalogos=${catalogos}`,
  },
  AUTH: {
    LOGIN: '/Auth/login',
    REFRESH: '/Auth/refresh',
    PERFIL: '/Auth/perfil',
    // LOGOUT: '/Auth/logout',
  },
  USUARIOS: {
    LIST: '/Usuarios',
    CREATE: '/Usuarios',
    FORM: '/Usuarios/form',
    BY_ROL: (idRol: string | number) => `/Usuarios/rol/${idRol}`,
    UPDATE: (idUsuario: string | number) => `/Usuarios/${idUsuario}`,
    DELETE: (idUsuario: string | number) => `/Usuarios/${idUsuario}`,
  },
  ROLES: {
    LIST: '/Roles',
    CREATE: '/Roles',
    UPDATE: (idRol: string | number) => `/Roles/${idRol}`,
    DELETE: (idRol: string | number) => `/Roles/${idRol}`,
    ACCIONES: '/Roles/acciones',
    PERMISOS: (idRol: string | number) => `/Roles/${idRol}/permisos`,
    TOGGLE_PERMISO: (idRol: string | number, idAccion: string | number) =>
      `/Roles/${idRol}/permisos/${idAccion}`,
  },
  SESIONES: {
    // sesionId: "TODAS;TODAS" (todas) | "no_sesion;tipo;fecha_hora" (específica)
    INDICADORES: (tipoConsejo: string, sesionId?: string | null) =>
      `/Sesiones/indicadores?tipoConsejo=${tipoConsejo}&sesionSelect=${sesionId ?? 'TODAS;TODAS'}`,
    SESIONES_LIST: (tipoConsejo: string) => `/Sesiones/opciones?tipo=${tipoConsejo}`,
    DISTINCT: '/Sesiones/distinct',
    DETALLE: (tipoConsejo: string, id: string) => `/Sesiones/${tipoConsejo}/${id}`,
    SESION_DETALLE: (idSesion: string | number) => `/Sesiones/${idSesion}`,
    // tipoConsejo: 'D' | 'M' (carácter)
    CONSEJO_SESIONES: (tipoConsejo: string, idConsejo: string | number) =>
      `/Sesiones/consejo/${tipoConsejo}/${idConsejo}`,
    CREATE: '/Sesiones',
    SAVE_ASISTENCIA: (idSesion: string | number) => `/Sesiones/${idSesion}/asistencia`,
    INICIAR_SESION: (idSesion: string | number) => `/Sesiones/${idSesion}/iniciar`,
    TERMINAR_SESION: (idSesion: string | number) => `/Sesiones/${idSesion}/terminar`,
    INCIDENCIAS: (idSesion: string | number) => `/Sesiones/${idSesion}/incidencias`,
    INCIDENCIA_SEGUIMIENTO: (idSesion: string | number) => `/Sesiones/${idSesion}/incidencias/seguimiento`,
    ELIMINAR_INCIDENCIA: (idSesion: string | number, idIncidencia: string | number) => `/Sesiones/${idSesion}/incidencias/${idIncidencia}`,
    EXPEDIENTES: (idSesion: string | number) => `/Sesiones/${idSesion}/expedientes`,
    ELIMINAR_EXPEDIENTE: (idSesion: string | number, idExpediente: string | number) => `/Sesiones/${idSesion}/expedientes/${idExpediente}`,
    VER_EXPEDIENTE: (idSesion: string | number, idExpediente: string | number) => `/Sesiones/${idSesion}/expedientes/${idExpediente}/visualizar`,
    VOTAR: (idSesion: string | number) => `/Sesiones/${idSesion}/orden-dia/votar`,
    OBTENER_VOTOS: (idSesion: string | number) => `/Sesiones/${idSesion}/votaciones`,
    AGREGAR_ASUNTO_GENERAL: (idSesion: string | number) => `/Sesiones/${idSesion}/orden-dia/asuntos-generales`,
    UPDATE: (idSesion: string | number) => `/Sesiones/${idSesion}/datos-generales`,
    UPDATE_POD: (idSesion: string | number) => `/Sesiones/${idSesion}/orden-dia`,
    DELETE_POD: (idSesion: string | number) => `/Sesiones/${idSesion}/orden-dia`,
  },
} as const;
