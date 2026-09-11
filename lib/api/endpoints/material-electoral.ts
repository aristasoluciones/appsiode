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

  /* Actas circunstanciadas: el consejo genera y firma la suya; oficina central la revisa. */

  /** Actas del consejo (sin el borrador), más borrador, bloqueo, configuración y pendientes. */
  ACTAS: (idConsejo: Id, tipoConsejo: 'D' | 'M') =>
    `/material-electoral/actas${qs({ idConsejo, tipoConsejo })}`,
  /** Resumen por consejo del tipo; exclusivo de oficina central. */
  ACTAS_RESUMEN: (tipoConsejo: 'D' | 'M') =>
    `/material-electoral/actas/resumen${qs({ tipoConsejo })}`,
  /** Detalle del acta; también es la ruta de regenerar (PUT). */
  ACTA: (id: Id) => `/material-electoral/actas/${id}`,
  /** Crea o retoma el borrador del consejo (POST). */
  ACTA_BORRADOR: '/material-electoral/actas/borrador',
  /** Elimina el borrador con sus fotografías (DELETE). */
  ACTA_BORRADOR_ELIMINAR: (id: Id) =>
    `/material-electoral/actas/${id}/borrador`,
  /** Word con los datos capturados y el corte al momento; no guarda nada (POST). */
  ACTA_VISTA_PREVIA: '/material-electoral/actas/vista-previa',
  /** Genera el acta desde el borrador (POST). */
  ACTA_GENERAR: '/material-electoral/actas',
  /** URL firmada del Word generado. */
  ACTA_DOCUMENTO: (id: Id) => `/material-electoral/actas/${id}/documento`,
  /** GET devuelve la URL firmada del PDF; PUT lo sube (form `archivo`). */
  ACTA_FIRMADA: (id: Id) => `/material-electoral/actas/${id}/firmada`,
  /** Sube una fotografía a un apartado (form `archivo` + `apartado`). */
  ACTA_FOTOGRAFIAS: (id: Id) => `/material-electoral/actas/${id}/fotografias`,
  /** Quita una fotografía del acta (DELETE). */
  ACTA_FOTOGRAFIA: (id: Id, idFotografia: Id) =>
    `/material-electoral/actas/${id}/fotografias/${idFotografia}`,
  /** Orden nuevo de las fotografías de un apartado (PUT). */
  ACTA_FOTOGRAFIAS_ORDEN: (id: Id) =>
    `/material-electoral/actas/${id}/fotografias/orden`,
  /** Oficina central: observaciones obligatorias; el acta pasa a Requerido. */
  ACTA_OBSERVACIONES: (id: Id) =>
    `/material-electoral/actas/${id}/observaciones`,
  /** Oficina central: acepta el acta; exige el PDF firmado. */
  ACTA_ACEPTAR: (id: Id) => `/material-electoral/actas/${id}/aceptar`,
  /** Oficina central: anula un acta aceptada con motivo. */
  ACTA_ANULAR: (id: Id) => `/material-electoral/actas/${id}/anular`,
  /** Consejo: descarta su acta con motivo mientras no esté aceptada. */
  ACTA_DESCARTAR: (id: Id) => `/material-electoral/actas/${id}/descartar`,
} as const;
