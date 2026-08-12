import type { Id } from './_shared';

export const SESIONES = {
  // sesionId: "TODAS;TODAS" (todas) | "no_sesion;tipo;fecha_hora" (específica).
  // Se interpola sin URLSearchParams para no escapar los ';' que el API espera literales.
  INDICADORES: (tipoConsejo: string, sesionId?: string | null) =>
    `/Sesiones/indicadores?tipoConsejo=${tipoConsejo}&sesionSelect=${sesionId ?? 'TODAS;TODAS'}`,
  SESIONES_LIST: (tipoConsejo: string) => `/Sesiones/opciones?tipo=${tipoConsejo}`,
  DISTINCT: '/Sesiones/distinct',
  DETALLE: (tipoConsejo: string, id: string) => `/Sesiones/${tipoConsejo}/${id}`,
  SESION_DETALLE: (idSesion: Id) => `/Sesiones/${idSesion}`,
  /** Reporte de la sesión en PDF (descarga como blob). */
  PDF: (idSesion: Id) => `/Sesiones/${idSesion}/pdf`,
  // tipoConsejo: 'D' | 'M' (carácter)
  CONSEJO_SESIONES: (tipoConsejo: string, idConsejo: Id) =>
    `/Sesiones/consejo/${tipoConsejo}/${idConsejo}`,
  CREATE: '/Sesiones',
  SAVE_ASISTENCIA: (idSesion: Id) => `/Sesiones/${idSesion}/asistencia`,
  SAVE_ASISTENCIA_PP: (idSesion: Id) => `/Sesiones/${idSesion}/asistencia-pp`,
  INICIAR_SESION: (idSesion: Id) => `/Sesiones/${idSesion}/iniciar`,
  TERMINAR_SESION: (idSesion: Id) => `/Sesiones/${idSesion}/terminar`,
  INCIDENCIAS: (idSesion: Id) => `/Sesiones/${idSesion}/incidencias`,
  INCIDENCIA_SEGUIMIENTO: (idSesion: Id) => `/Sesiones/${idSesion}/incidencias/seguimiento`,
  ELIMINAR_INCIDENCIA: (idSesion: Id, idIncidencia: Id) =>
    `/Sesiones/${idSesion}/incidencias/${idIncidencia}`,
  ELIMINAR_SEGUIMIENTO: (idSesion: Id, idIncidencia: Id, idSeguimiento: Id) =>
    `/Sesiones/${idSesion}/incidencias/${idIncidencia}/seguimiento/${idSeguimiento}`,
  EXPEDIENTES: (idSesion: Id) => `/Sesiones/${idSesion}/expedientes`,
  ELIMINAR_EXPEDIENTE: (idSesion: Id, idExpediente: Id) =>
    `/Sesiones/${idSesion}/expedientes/${idExpediente}`,
  VER_EXPEDIENTE: (idSesion: Id, idExpediente: Id) =>
    `/Sesiones/${idSesion}/expedientes/${idExpediente}/visualizar`,
  VOTAR: (idSesion: Id) => `/Sesiones/${idSesion}/orden-dia/votar`,
  OBTENER_VOTOS: (idSesion: Id) => `/Sesiones/${idSesion}/votaciones`,
  AGREGAR_ASUNTO_GENERAL: (idSesion: Id) => `/Sesiones/${idSesion}/orden-dia/asuntos-generales`,
  UPDATE: (idSesion: Id) => `/Sesiones/${idSesion}/datos-generales`,
  UPDATE_POD: (idSesion: Id) => `/Sesiones/${idSesion}/orden-dia`,
  DELETE_POD: (idSesion: Id) => `/Sesiones/${idSesion}/orden-dia`,
} as const;
