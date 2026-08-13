export type TTipoConsejo = 'distrital' | 'municipal';

/** Tipos y modos aceptados por el API para un proceso electoral. */
export type TTipoProceso = 'ORDINARIO' | 'EXTRAORDINARIO';
export type TModoProceso = 'PROD' | 'SIMULACRO';

export interface IEleccion {
  consejo_tipo: 'D' | 'M';
  consejo_tipo_text: string;
}

/**
 * Enlaces a los sistemas externos que consulta el front (columna jsonb
 * `cat.procesos.configuracion`). Viajan dentro del proceso activo, de modo que
 * cambiarlos no requiere volver a publicar el front.
 */
export interface IProcesoConfiguracion {
  /** Base del sistema de representaciones de partidos políticos (RPP). */
  rpp_api_base: string;
  /** Base del sistema de consejerías electorales (SICE). */
  sice_api_base: string;
}

export interface IProceso {
  id: number;
  tipo: string;
  anio: number;
  fecha: string;
  status: string;
  fecha_registro: string;
  consejo_distrital: boolean;
  consejo_municipal: boolean;
  modo: string;
  configuracion?: IProcesoConfiguracion | null;
  elecciones: IEleccion[];
}

/** Renglón del catálogo de procesos (pantalla de administración). */
export interface IProcesoCatalogo {
  id: number;
  tipo: string;
  anio: number;
  fecha: string;
  status: string;
  modo: string;
  consejo_distrital: boolean;
  consejo_municipal: boolean;
  configuracion: IProcesoConfiguracion | null;
  fecha_registro: string;
}

/**
 * Cuerpo de alta y edición de un proceso. La fecha no se captura ni se envía:
 * la resuelve el API.
 */
export interface IProcesoPayload {
  tipo: TTipoProceso;
  anio: number;
  modo: TModoProceso;
  consejo_distrital: boolean;
  consejo_municipal: boolean;
  configuracion: IProcesoConfiguracion;
}
