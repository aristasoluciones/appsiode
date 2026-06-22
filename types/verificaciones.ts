// ─── Tipos del módulo Verificaciones de Bodegas ───────────────────────────────

export type TVerificacionStatus = 'En captura' | 'Capturada' | 'Revisada';
export type TVerificacionResultado = 'Aceptada' | 'Rechazada';

// ─── Sección 1: Participantes OPL ─────────────────────────────────────────────

export interface IParticipantesOpl {
  consejeroParticipa?: boolean;
  secretarioParticipa?: boolean;
  numConsejeros?: number;
  nombresConsejeros?: string[];
  numOtrasPersonas?: number;
}

// ─── Sección 2: Participantes INE ────────────────────────────────────────────

export interface IParticipantesIne {
  consejeroIneParticipa?: boolean;
  secretarioIneParticipa?: boolean;
  numConsejerosIne?: number;
  nombresConsejerosIne?: string[];
  numOtrasPersonasIne?: number;
  organoDesconcentrado?: string | null;
  numJuntaDistrital?: number;
  veParticipa?: boolean;
  vsParticipa?: boolean;
  voeParticipa?: boolean;
  vrfeParticipa?: boolean;
  vceyecParticipa?: boolean;
  numConsejerosElectoralesIne?: number;
}

// ─── Sección 3: Características BE ────────────────────────────────────────────

export interface ICaracteristicasBe {
  numPaquetes?: number;
  superficieM2?: number;
  ubicadaEnSede?: boolean;
  motivoNoSede?: string | null;
  espacioSuficiente?: boolean;
  medidasEspacio?: string | null;
  fechaMedidasEspacio?: string | null;
  espacioMateriales?: boolean;
  medidasMateriales?: string;
  fechaEspacioMateriales?: string | null;
}

// ─── Sección 4: Ubicación ───────────────────────────────────────────────────────

export interface IUbicacion {
  alejadaIncendios?: boolean;
  medidasIncendios?: string | null;
  fechaMedidasIncendios?: string | null;
  retiradaAgua?: boolean;
  medidasAgua?: string | null;
  fechaMedidasAgua?: string | null;
  drenaje?: boolean;
  medidasDrenaje?: string | null;
  fechaMedidasDrenaje?: string | null;
  pisosSuperiores?: boolean;
  medidasSuperiores?: string | null;
  fechaMedidasSuperiores?: string | null;
  observacionesUbicacion?: string;
}

// ─── Sección 5: Acondicionamiento ─────────────────────────────────────────────

export interface IAcondicionamiento {
  instalacionElectrica?: boolean;
  medidasElectrica?: string | null;
  fechaMedidasElectrica?: string | null;
  techos?: boolean;
  medidasTechos?: string | null;
  fechaMedidasTechos?: string | null;
  drenajePluvial?: boolean;
  medidasDrenajePluvial?: string | null;
  fechaMedidasDrenajePluvial?: string | null;
  instalacionesSanitarias?: boolean;
  medidasSanitarias?: string | null;
  fechaMedidasSanitarias?: string | null;
  ventanas?: boolean;
  medidasVentanas?: string | null;
  fechaMedidasVentanas?: string | null;
  muros?: boolean;
  medidasMuros?: string | null;
  fechaMedidasMuros?: string | null;
  cerraduras?: boolean;
  medidasCerraduras?: string | null;
  fechaMedidasCerraduras?: string | null;
  pisos?: boolean;
  medidasPisos?: string | null;
  fechaMedidasPisos?: string | null;
  observacionesAcondicionamiento?: string;
}

// ─── Sección 6: Equipamiento ──────────────────────────────────────────────────

export interface IEquipamiento {
  tarimas?: boolean;
  medidasTarimas?: string | null;
  fechaMedidasTarimas?: string | null;
  lamparasEmergencia?: boolean;
  medidasLamparasEmergencia?: string | null;
  fechaMedidasLamparasEmergencia?: string | null;
  senializacion?: boolean;
  medidasSenializacion?: string | null;
  fechaMedidasSenializacion?: string | null;
  anaqueles?: boolean;
  medidasAnaqueles?: string | null;
  fechaMedidasAnaqueles?: string | null;
}

// ─── Sección 7: Generales ───────────────────────────────────────────────────────

export interface IGenerales {
  observacionesExcepcionales?: string;
}

// ─── Modelo completo de verificación ─────────────────────────────────────────────

export interface IVerificacion {
  id: number;
  idBodega: number;
  nombreVerificador: string;
  cargoVerificador: string;
  fechaVerificacion: string;
  status: TVerificacionStatus;
  resultado: TVerificacionResultado | null;
  cedulaRutaArchivo: string | null;
  urlCedula?: string;
  participantesOpl?: IParticipantesOpl;
  participantesIne?: IParticipantesIne;
  caracteristicasBe?: ICaracteristicasBe;
  ubicacion?: IUbicacion;
  acondicionamiento?: IAcondicionamiento;
  equipamiento?: IEquipamiento;
  generales?: IGenerales;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Resumen para listas (sin secciones) ──────────────────────────────────────

export interface IVerificacionResumen {
  id: number;
  idBodega: number;
  nombreVerificador: string;
  cargoVerificador: string;
  fechaVerificacion: string;
  status: TVerificacionStatus;
  resultado: TVerificacionResultado | null;
  cedulaRutaArchivo: string | null;
  urlCedula?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Inputs de creación/edición ─────────────────────────────────────────────────

export interface ICreateVerificacionInput {
  nombreVerificador: string;
  cargoVerificador: string;
  fechaVerificacion: string;
  esFinalizar?: boolean;
}

export interface IUpdateVerificacionInput {
  id: number;
  nombreVerificador?: string;
  cargoVerificador?: string;
  fechaVerificacion?: string;
  participantesOpl?: IParticipantesOpl;
  participantesIne?: IParticipantesIne;
  caracteristicasBe?: ICaracteristicasBe;
  ubicacion?: IUbicacion;
  acondicionamiento?: IAcondicionamiento;
  equipamiento?: IEquipamiento;
  generales?: IGenerales;
  esFinalizar?: boolean;
}

export interface IFinalizarVerificacionInput {
  id: number;
  cedula_archivo: File;
  generales?: { observaciones_excepcionales?: string };
  finalizar_proceso?: boolean;
}

export interface IRevisarVerificacionInput {
  id: number;
  resultado: TVerificacionResultado;
  finalizar_proceso?: boolean;
}
