// ─── Tipos centralizados del módulo Bodegas ──────────────────────────────────

export type TTipoBodega = 'Oficina central' | 'Consejo';

export type TStatusBodega =
  | 'En captura'
  | 'Capturada'
  | 'Observada'
  | 'Determinada'
  | 'Verificada'
  | 'Aceptada'
  | 'Rechazada';

export type TOrganoCompetente =
  | 'Órgano Central'
  | 'Órgano Competente (Municipal)'
  | 'Órgano Competente (Distrital)'
  | 'Otro';

// ─── Modelo principal de bodega ───────────────────────────────────────────────

export interface IBodega {
  id: number;
  id_proceso: number;
  tipo: TTipoBodega;
  tipo_consejo: 'M' | 'D' | null;
  id_consejo: number | null;
  nombre_consejo: string | null;
  organo_competente: TOrganoCompetente;
  otro_organo_competente: string;
  ubicada_en_inmueble: boolean | null;
  espacio_no_inmueble: string | null;
  num_paquetes_estimados: number | null;
  superficie_m2: number | null;
  espacio_materiales: boolean | null;
  medidas_no_espacio: string | null;
  observaciones: string | null;
  status: TStatusBodega;
  data_user: string;
  created_at: string;
  updated_at: string;
}

// ─── Formulario alta/edición ──────────────────────────────────────────────────

export interface IBodegaFormValues {
  tipo: TTipoBodega | '';
  tipo_consejo: 'M' | 'D' | '' | null;
  id_consejo: number | '' | null;
  organo_competente: TOrganoCompetente | '';
  otro_organo_competente: string;
  ubicada_en_inmueble: boolean | null;
  espacio_no_inmueble: string;
  num_paquetes_estimados: number | '';
  superficie_m2: number | '';
  espacio_materiales: boolean | null;
  medidas_no_espacio: string;
  observaciones: string;
}

export interface IBodegaCreatePayload {
  tipo: TTipoBodega;
  tipo_consejo: 'M' | 'D' | null;
  id_consejo: number | null;
  organo_competente: TOrganoCompetente;
  otro_organo_competente?: string;
  ubicada_en_inmueble?: boolean | null;
  espacio_no_inmueble?: string | null;
  num_paquetes_estimados?: number | null;
  superficie_m2?: number | null;
  espacio_materiales?: boolean | null;
  medidas_no_espacio?: string | null;
  observaciones?: string | null;
}

export interface IBodegaUpdatePayload extends IBodegaCreatePayload {
  id: number;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface IBodegaDashboardProgreso {
  total: number;
  captura: number;
  capturada: number;
  observada: number;
  determinada: number;
  verificada: number;
  aceptada: number;
  rechazada: number;
}

export interface IBodegaDashboardConsejo {
  tipo_consejo: 'M' | 'D' | null;
  id_consejo: number | null;
  nombre_consejo: string;
  total: number;
  captura: number;
  capturada: number;
  observada: number;
  determinada: number;
  verificada: number;
  aceptada: number;
  rechazada: number;
}

export interface IBodegaDashboard {
  progreso: IBodegaDashboardProgreso;
  consejos: IBodegaDashboardConsejo[];
}

export interface IBodegaResumen {
  id: number;
  tipo: TTipoBodega;
  id_consejo: number | null;
  tipo_consejo: 'M' | 'D' | null;
  nombre_consejo: string | null;
  organo_competente: string;
  superficie_m2: number | null;
  num_paquetes_estimados: number | null;
  status: TStatusBodega;
  updated_at: string;
}

// ─── Acuerdo ──────────────────────────────────────────────────────────────────

export interface IAcuerdo {
  id: number;
  id_bodega: number;
  ruta_archivo: string;
  url: string;
  nomenclatura: string;
  data_user: string;
  created_at: string;
}

// ─── Configuración de fotografías ─────────────────────────────────────────────

export interface IFotografiaConfig {
  id: number;
  categoria: 'Acondicionamiento' | 'Equipamiento';
  subcategoria: string | null;
  momento: 'Antes' | 'Durante' | 'Posterior';
  etapa: 'Registro' | 'Verificacion' | 'Comprobacion' | string;
  min_fotos: number;
  descripcion: string | null;
}

// ─── Fotografía ───────────────────────────────────────────────────────────────

export type TComponenteFoto = 'C1' | 'C2' | 'C3' | 'C4';

export interface IFotografia {
  id: number;
  id_bodega: number;
  id_config: number;
  ruta_archivo: string;
  url: string;
  componente: TComponenteFoto;
  etapa: string | null;
  tipo: string;
  observacion: string | null;
  observador_id: number | null;
  observador_nombre: string | null;
  status_foto: 'Pendiente' | 'Observada' | 'Validada';
  data_user: string;
  created_at: string;
}

// ─── Meta / Consejo Info ──────────────────────────────────────────────────────

export interface IConsejoMeta {
  id: number;
  consejo: string;
  tipo_consejo: 'M' | 'D';
  tipo_consejo_desc: string;
  clave_consejo: string;
}

export interface IBodegasListaMeta {
  consejo?: IConsejoMeta;
}

export interface IBodegasListaResult {
  bodegas: IBodega[];
  meta: IBodegasListaMeta | null;
}

export interface IBodegaDetalleResult {
  bodega: IBodega;
  meta: IBodegasListaMeta | null;
}

// ─── Observaciones a nivel bodega ─────────────────────────────────────────────

export type TSeccionObservacion = 'General' | 'Acuerdos' | 'Fotografias';
export type TStatusObservacion = 'Pendiente' | 'Atendida' | 'Validada';

export interface IObservacionBodega {
  id: number;
  id_bodega: number;
  seccion: TSeccionObservacion;
  id_referencia: number;
  observacion: string;
  status: TStatusObservacion;
  data_user: string;
  created_at: string;
}

export interface ICrearObservacionPayload {
  seccion: TSeccionObservacion;
  id_referencia: number | null;
  observacion: string;
}
