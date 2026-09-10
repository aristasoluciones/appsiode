import { qs, type Id } from './_shared';

/**
 * Documentación y material electoral. Los endpoints de `layouts` son exclusivos
 * de oficina central y exigen el permiso de cargar el layout.
 */
export const MATERIAL_ELECTORAL = {
  /** Catálogo de tipos de documentación y material vigente. */
  LAYOUT_TIPOS: (incluirInactivos?: boolean) =>
    `/material-electoral/layouts/tipos${qs({ incluirInactivos: incluirInactivos ? 'true' : undefined })}`,
  /** Formato de captura (xlsx) del tipo de consejo, con sus listas desplegables. */
  LAYOUT_FORMATO: (tipoConsejo: 'D' | 'M') =>
    `/material-electoral/layouts/formato${qs({ tipoConsejo })}`,
  /** Revisa el archivo y devuelve la vista previa, sin guardar nada. */
  LAYOUT_VALIDAR: '/material-electoral/layouts/validar',
  /** Carga los renglones del layout; si una fila tiene observaciones no se carga ninguna. */
  LAYOUT_CARGAR: '/material-electoral/layouts',
  /** Historial de cargas del proceso y tipo de consejo, de la más reciente a la más antigua. */
  LAYOUT_IMPORTACIONES: (tipoConsejo: 'D' | 'M') =>
    `/material-electoral/layouts/importaciones${qs({ tipoConsejo })}`,
  /** Detalle de una importación: encabezado y los renglones que tocó, por páginas. */
  LAYOUT_IMPORTACION: (id: Id, pagina?: number, porPagina?: number) =>
    `/material-electoral/layouts/importaciones/${id}${qs({ pagina, porPagina })}`,
  /** Revierte la importación aplicada más reciente; exige el permiso de revertir. */
  LAYOUT_IMPORTACION_REVERTIR: (id: Id) =>
    `/material-electoral/layouts/importaciones/${id}/revertir`,

  /** Lista de comprobación del consejo; sin `idEleccion` vienen todas las elecciones. */
  COMPROBACIONES: (
    idConsejo: Id,
    tipoConsejo: 'D' | 'M',
    idEleccion?: string,
  ) =>
    `/material-electoral/comprobaciones${qs({ idConsejo, tipoConsejo, idEleccion })}`,
  /** Historial de capturas de un renglón, con el autor de cada corrección. */
  COMPROBACION_HISTORIAL: (id: Id, idConsejo: Id, tipoConsejo: 'D' | 'M') =>
    `/material-electoral/comprobaciones/${id}/historial${qs({ idConsejo, tipoConsejo })}`,
  /** Captura de la cantidad física de un renglón. */
  COMPROBACION_CAPTURA: '/material-electoral/comprobaciones',

  /** Avance de todos los consejos del tipo; exclusivo de oficina central. */
  AVANCE_COMPROBACIONES: (tipoConsejo: 'D' | 'M', idEleccion?: string) =>
    `/material-electoral/avance/comprobaciones${qs({ tipoConsejo, idEleccion })}`,

  /** Reporte en Excel de la comprobación de un consejo, renglón por renglón. */
  REPORTE_CONSEJO: (
    idConsejo: Id,
    tipoConsejo: 'D' | 'M',
    idEleccion?: string,
  ) =>
    `/material-electoral/reportes/consejo${qs({ idConsejo, tipoConsejo, idEleccion })}`,
  /** Reporte en Excel del avance de todos los consejos del tipo. */
  REPORTE_GENERAL: (tipoConsejo: 'D' | 'M', idEleccion?: string) =>
    `/material-electoral/reportes/general${qs({ tipoConsejo, idEleccion })}`,
  /** Reporte en Excel documento por documento de todos los consejos del tipo. */
  REPORTE_GENERAL_DETALLADO: (tipoConsejo: 'D' | 'M', idEleccion?: string) =>
    `/material-electoral/reportes/general-detallado${qs({ tipoConsejo, idEleccion })}`,

  /* Catálogo de artículos: lo administra oficina central; cada escritura exige su permiso propio. */

  /** Catálogo de artículos; con `incluirInactivos` vienen también los inactivos. */
  ARTICULOS: (incluirInactivos?: boolean) =>
    `/material-electoral/articulos${qs({ incluirInactivos: incluirInactivos ? 'true' : undefined })}`,
  /** Alta de un artículo (POST). */
  ARTICULOS_CREAR: '/material-electoral/articulos',
  /** Un artículo; también es la ruta de edición (PUT). */
  ARTICULO: (id: Id) => `/material-electoral/articulos/${id}`,
  /** Activa o inactiva el artículo (PATCH); el catálogo no elimina. */
  ARTICULO_ESTATUS: (id: Id) => `/material-electoral/articulos/${id}/estatus`,
  /** Fotografía: GET devuelve las URL firmadas, PUT la sube o reemplaza, DELETE la quita. */
  ARTICULO_IMAGEN: (id: Id) => `/material-electoral/articulos/${id}/imagen`,
  /** Formato de importación (xlsx) con los artículos que ya existen. */
  ARTICULOS_FORMATO: '/material-electoral/articulos/formato',
  /** Revisa el archivo de artículos y devuelve la vista previa, sin guardar nada. */
  ARTICULOS_IMPORTAR_VALIDAR:
    '/material-electoral/articulos/importaciones/validar',
  /** Importa el catálogo: crea los códigos nuevos y actualiza los existentes. */
  ARTICULOS_IMPORTAR: '/material-electoral/articulos/importaciones',
  /** Revisa el zip de fotografías y devuelve la vista previa, sin guardar nada. */
  ARTICULOS_FOTOGRAFIAS_VALIDAR:
    '/material-electoral/articulos/fotografias/validar',
  /** Aplica las fotografías del zip a los artículos que coinciden por código. */
  ARTICULOS_FOTOGRAFIAS_IMPORTAR: '/material-electoral/articulos/fotografias',
} as const;
