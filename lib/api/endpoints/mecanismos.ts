import { qs, type Id } from './_shared';

type TipoConsejo = 'D' | 'M';

/**
 * Mecanismos de recolección. Una sola API para consejo y oficina central: el
 * consejo de escritura sale del token y las consultas con `idConsejo`/`tipoConsejo`
 * las usa oficina central para ver lo que ve un consejo. Las cargas masivas
 * (formato de importación, CAE, zip de cédulas) son solo para roles administrador.
 */
export const MECANISMOS = {
  /* Mecanismos: lista, detalle y vía principal de oficina central. */

  /** Lista: consejo, los que informa; oficina central, todos con filtros o lo que ve un consejo. */
  LISTA: (
    filtros: {
      idConsejo?: Id;
      tipoConsejo?: TipoConsejo;
      idDf?: number;
      tipo?: string;
      incluirInactivos?: boolean;
    } = {},
  ) =>
    `/mecanismos${qs({
      idConsejo: filtros.idConsejo,
      tipoConsejo: filtros.tipoConsejo,
      idDf: filtros.idDf,
      tipo: filtros.tipo,
      incluirInactivos: filtros.incluirInactivos ? 'true' : undefined,
    })}`,
  /** Alta de un mecanismo (POST); exclusivo de oficina central. */
  CREAR: '/mecanismos',
  /** Detalle con consejos y casillas; también es la ruta de edición (PUT). */
  DETALLE: (id: Id) => `/mecanismos/${id}`,
  /** Reemplaza el detalle de casillas (PUT). */
  CASILLAS: (id: Id) => `/mecanismos/${id}/casillas`,
  /** Baja lógica o reactivación (PATCH `{ activo }`). */
  ESTATUS: (id: Id) => `/mecanismos/${id}/estatus`,
  /** Observaciones de oficina central sobre el mecanismo (PUT). */
  OBSERVACIONES: (id: Id) => `/mecanismos/${id}/observaciones`,
  /** Informe del consejo que revisa: CAE, costo estimado y observaciones (PUT). */
  INFORME: (id: Id) => `/mecanismos/${id}/informe`,
  /** Catálogo de tipos de mecanismo (DAT, CRYT fijo, CRYT itinerante). */
  TIPOS: (incluirInactivos?: boolean) =>
    `/mecanismos/tipos${qs({ incluirInactivos: incluirInactivos ? 'true' : undefined })}`,
  /** Marco geográfico: distrito federal, distrito local y municipio, para los combos. */
  MARCO_GEOGRAFICO: '/mecanismos/marco-geografico',
  /** Verifica que los catálogos necesarios estén cargados antes de importar o dar de alta. */
  CATALOGOS_VERIFICACION: '/mecanismos/catalogos/verificacion',
  /** Seguimiento de oficina central: todos los consejos del tipo, aunque en ceros. */
  SEGUIMIENTO: (tipoConsejo: TipoConsejo) =>
    `/mecanismos/seguimiento${qs({ tipoConsejo })}`,

  /* Importación del formato, armado desde las cédulas del INE (solo roles administrador). */

  /** Revisa el archivo y devuelve la vista previa, sin guardar nada (form `archivo`). */
  IMPORTAR_VALIDAR: '/mecanismos/importaciones/validar',
  /** Importa el archivo: todo o nada (form `archivo`). */
  IMPORTAR: '/mecanismos/importaciones',
  /** Historial de cargas; `tipo`: MECANISMOS, CEDULAS, CAES o CAES_ASIGNACION. */
  IMPORTACIONES: (tipo?: string) => `/mecanismos/importaciones${qs({ tipo })}`,
  /** Detalle paginado de una importación de mecanismos. */
  IMPORTACION: (id: Id, pagina?: number, porPagina?: number) =>
    `/mecanismos/importaciones/${id}${qs({ pagina, porPagina })}`,
  /** Revierte la importación de mecanismos más reciente (POST `{ motivo }`). */
  IMPORTACION_REVERTIR: (id: Id) => `/mecanismos/importaciones/${id}/revertir`,

  /* CAE: catálogo de consulta y cargas de oficina central. */

  /** Catálogo de CAE del consejo (o del proceso para oficina central), con su fuente. */
  CAES: (
    filtros: {
      idConsejo?: Id;
      tipoConsejo?: TipoConsejo;
      incluirInactivos?: boolean;
    } = {},
  ) =>
    `/mecanismos/caes${qs({
      idConsejo: filtros.idConsejo,
      tipoConsejo: filtros.tipoConsejo,
      incluirInactivos: filtros.incluirInactivos ? 'true' : undefined,
    })}`,
  /** Formato (xlsx) del listado de CAE con los que ya existen. */
  CAES_IMPORTAR_FORMATO: '/mecanismos/caes/importaciones/formato',
  /** Revisa el listado de CAE y devuelve la vista previa (form `archivo`). */
  CAES_IMPORTAR_VALIDAR: '/mecanismos/caes/importaciones/validar',
  /** Aplica el listado: alta por folio nuevo y actualización del existente (form `archivo`). */
  CAES_IMPORTAR: '/mecanismos/caes/importaciones',
  /** Formato (xlsx) de asignación masiva con los mecanismos del tipo; `idConsejo` acota a uno. */
  CAES_ASIGNACION_FORMATO: (tipoConsejo: TipoConsejo, idConsejo?: Id) =>
    `/mecanismos/caes/asignacion/formato${qs({ tipoConsejo, idConsejo })}`,
  /** Revisa el Excel de asignación y devuelve la vista previa (form `archivo` + `tipoConsejo`). */
  CAES_ASIGNACION_VALIDAR: '/mecanismos/caes/asignacion/validar',
  /** Aplica la asignación masiva de CAE (form `archivo` + `tipoConsejo`). */
  CAES_ASIGNACION: '/mecanismos/caes/asignacion',

  /* Configuración de captura por consejo (oficina central). */

  /** Banderas de todos los consejos activos del tipo. */
  CONFIGURACION: (tipoConsejo: TipoConsejo) =>
    `/mecanismos/configuracion${qs({ tipoConsejo })}`,
  /** Guarda las banderas de un consejo (PUT); nulas vuelven al valor por omisión. */
  CONFIGURACION_CONSEJO: (tipoConsejo: TipoConsejo, idConsejo: Id) =>
    `/mecanismos/configuracion/${tipoConsejo}/${idConsejo}`,

  /* Cédula: un PDF por mecanismo, sin estatus propio. */

  /** GET devuelve `{ url, nombre_descarga }` con la URL firmada del PDF; PUT lo carga o reemplaza (form `archivo`). */
  CEDULA: (id: Id) => `/mecanismos/${id}/cedula`,
  /** Revisa el zip de PDF y devuelve el emparejamiento por número de mecanismo, sin guardar (form `archivo`). */
  IMPORTAR_CEDULAS_VALIDAR: '/mecanismos/importaciones/cedulas/validar',
  /** Aplica el zip: carga o reemplaza la cédula de cada mecanismo emparejado (form `archivo`). */
  IMPORTAR_CEDULAS: '/mecanismos/importaciones/cedulas',
  /** Catálogo de tipos de observación del informe (`{ clave, descripcion }[]`). */
  OBSERVACIONES_TIPOS: '/mecanismos/observaciones/tipos',

  /* Estudios de factibilidad: uno por distrito federal, con acuses por consejo. */

  /** Estudios de los distritos federales del consejo, aunque aún no existan, con su acuse. */
  ESTUDIOS: (idConsejo: Id, tipoConsejo: TipoConsejo) =>
    `/mecanismos/estudios${qs({ idConsejo, tipoConsejo })}`,
  /** Propone el estudio de un distrito federal (form `id_df`, `archivo`). */
  ESTUDIO_PROPONER: '/mecanismos/estudios',
  /** Tablero de oficina central: totales y un renglón por cada distrito federal. */
  ESTUDIOS_AVANCE: '/mecanismos/estudios/avance',
  /** Detalle del estudio con acuses e historial. */
  ESTUDIO: (id: Id) => `/mecanismos/estudios/${id}`,
  /** GET devuelve la URL firmada del PDF propuesto; PUT lo reemplaza (form `archivo`). */
  ESTUDIO_PROPUESTA: (id: Id) => `/mecanismos/estudios/${id}/propuesta`,
  /** URL firmada del PDF aprobado. */
  ESTUDIO_APROBADA: (id: Id) => `/mecanismos/estudios/${id}/aprobada`,
  /** Oficina central aprueba con el PDF aprobado (form `archivo`). */
  ESTUDIO_APROBAR: (id: Id) => `/mecanismos/estudios/${id}/aprobar`,
  /** El consejo acusa la etapa vigente (POST `{ etapa, observaciones }`). */
  ESTUDIO_ACUSE: (id: Id) => `/mecanismos/estudios/${id}/acuse`,
  /** Anula el estudio con motivo (POST `{ motivo }`). */
  ESTUDIO_ANULAR: (id: Id) => `/mecanismos/estudios/${id}/anular`,

  /* Reportes en Excel. El consejo solo exporta lo suyo. */

  /** Mecanismos del tipo de consejo con estatus, costo, CAE, cédula y observaciones; exclusivo de oficina central. */
  REPORTE_MECANISMOS: (tipoConsejo: TipoConsejo) =>
    `/mecanismos/reportes/mecanismos${qs({ tipoConsejo })}`,
  /** Estudios de factibilidad: avance por distrito y acuses; exclusivo de oficina central. */
  REPORTE_ESTUDIOS: '/mecanismos/reportes/estudios',
} as const;
