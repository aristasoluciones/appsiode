'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage, type FieldProps } from 'formik';
import * as Yup from 'yup';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  FileText,
  Loader2,
  ShieldCheck,
  Upload,
  X,
  Users,
  MapPin,
  Package,
  Lightbulb,
  Wrench,
  Settings,
  ListChecks,
  Info,
  Eye,
  Trash2,
  PanelRightClose,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { Skeleton } from '@/components/ui/skeleton';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/providers/auth-provider';
import {
  useVerificacionDetalle,
  useCreateVerificacion,
  useUpdateVerificacion,
  useFinalizarVerificacion,
  useUltimaVerificacion,
} from '../_hooks/use-verificaciones';
import type {
  IVerificacion,
  ICreateVerificacionInput,
  IUpdateVerificacionInput,
  IFinalizarVerificacionInput,
  TVerificacionResultado,
} from '@/types/verificaciones';
import { FotografiasCard } from './fotografias-card';

// ─── Tipos locales ──────────────────────────────────────────────────────────────

interface WizardFormValues {
  // Paso 1
  nombreVerificador: string;
  cargoVerificador: string;
  fechaVerificacion: string;
  // Paso 2
  consejeroParticipa: boolean;
  secretarioParticipa: boolean;
  numConsejeros: number | '';
  nombresConsejeros: string;
  numOtrasPersonas: number | '';
  // Paso 3
  consejeroIneParticipa: boolean;
  secretarioIneParticipa: boolean;
  numConsejerosIne: number | '';
  nombresConsejerosIne: string;
  numOtrasPersonasIne: number | '';
  organoDesconcentrado: string;
  numJuntaDistrital: number | '';
  veParticipa: boolean;
  vsParticipa: boolean;
  voeParticipa: boolean;
  vrfeParticipa: boolean;
  vceyecParticipa: boolean;
  // Paso 4
  numPaquetes: number | '';
  superficieM2: number | '';
  ubicadaEnSede: string;
  motivoNoSede: string;
  espacioSuficiente: string;
  medidasEspacio: string;
  fechaMedidasEspacio: string;
  espacioMateriales: string;
  medidasMateriales: string;
  fechaEspacioMateriales: string;
  // Paso 5 - Ubicación (Si/No)
  alejadaIncendios: string;
  medidasIncendios: string;
  fechaMedidasIncendios: string;
  retiradaAgua: string;
  medidasAgua: string;
  fechaMedidasAgua: string;
  drenaje: string;
  medidasDrenaje: string;
  fechaMedidasDrenaje: string;
  pisosSuperiores: string;
  medidasSuperiores: string;
  fechaMedidasSuperiores: string;
  observacionesUbicacion: string;
  // Paso 6 - Acondicionamiento (Si/No)
  instalacionElectrica: string;
  medidasElectrica: string;
  fechaMedidasElectrica: string;
  techos: string;
  medidasTechos: string;
  fechaMedidasTechos: string;
  drenajePluvial: string;
  medidasDrenajePluvial: string;
  fechaMedidasDrenajePluvial: string;

  instalacionesSanitarias: string;
  medidasSanitarias: string;
  fechaMedidasSanitarias: string;
  ventanas: string;
  medidasVentanas: string;
  fechaMedidasVentanas: string;
  muros: string;
  medidasMuros: string;
  fechaMedidasMuros: string;
  cerraduras: string;
  medidasCerraduras: string;
  fechaMedidasCerraduras: string;
  pisos: string;
  medidasPisos: string;
  fechaMedidasPisos: string;
  observacionesAcondicionamiento: string;
  // Paso 7 - Equipamiento (Si/No)
  tarimas: string;
  medidasTarimas: string;
  fechaMedidasTarimas: string;
  lamparasEmergencia: string;
  medidasLamparasEmergencia: string;
  fechaMedidasLamparasEmergencia: string;
  senializacion: string;
  medidasSenializacion: string;
  fechaMedidasSenializacion: string;
  anaqueles: string;
  medidasAnaqueles: string;
  fechaMedidasAnaqueles: string;
  // Paso 8 - Finalización
  observacionesExcepcionales: string;
  cedula_archivo: File | null;
}

interface VerificacionWizardProps {
  idBodega: number;
  idVerificacion?: number; // undefined = nueva
  modo: 'nueva' | 'editar';
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Datos generales', icon: ClipboardCheck },
  { id: 2, label: 'Participantes OPL', icon: Users },
  { id: 3, label: 'Participantes INE', icon: Users },
  { id: 4, label: 'Características BE', icon: Package },
  { id: 5, label: 'Ubicación', icon: MapPin },
  { id: 6, label: 'Acondicionamiento', icon: Lightbulb },
  { id: 7, label: 'Equipamiento', icon: Wrench },
  { id: 8, label: 'Finalizar', icon: ListChecks },
];

const MEDIDAS_MATERIALES_OPTIONS = [
  'Se resguardará en el almacén del órgano competente del OPL',
  'Se acondicionará un espacio dentro del inmueble sede del órgano competente del OPL',
  'Se buscará un espacio alterno a la sede del órgano competente del OPL',
  'No aplica',
] as const;

const EMPTY_VALUES: WizardFormValues = {
  nombreVerificador: '',
  cargoVerificador: '',
  fechaVerificacion: '',
  consejeroParticipa: false,
  secretarioParticipa: false,
  numConsejeros: '',
  nombresConsejeros: '',
  numOtrasPersonas: '',
  consejeroIneParticipa: false,
  secretarioIneParticipa: false,
  numConsejerosIne: '',
  nombresConsejerosIne: '',
  numOtrasPersonasIne: '',
  organoDesconcentrado: '',
  numJuntaDistrital: '',
  veParticipa: false,
  vsParticipa: false,
  voeParticipa: false,
  vrfeParticipa: false,
  vceyecParticipa: false,
  numPaquetes: '',
  superficieM2: '',
  ubicadaEnSede: '',
  motivoNoSede: '',
  espacioSuficiente: '',
  medidasEspacio: '',
  fechaMedidasEspacio: '',
  espacioMateriales: '',
  medidasMateriales: '',
  fechaEspacioMateriales: '',
  alejadaIncendios: '',
  medidasIncendios: '',
  fechaMedidasIncendios: '',
  retiradaAgua: '',
  medidasAgua: '',
  fechaMedidasAgua: '',
  drenaje: '',
  medidasDrenaje: '',
  fechaMedidasDrenaje: '',
  pisosSuperiores: '',
  medidasSuperiores: '',
  fechaMedidasSuperiores: '',
  observacionesUbicacion: '',
  instalacionElectrica: '',
  medidasElectrica: '',
  fechaMedidasElectrica: '',
  techos: '',
  medidasTechos: '',
  fechaMedidasTechos: '',
  drenajePluvial: '',
  medidasDrenajePluvial: '',
  fechaMedidasDrenajePluvial: '',

  instalacionesSanitarias: '',
  medidasSanitarias: '',
  fechaMedidasSanitarias: '',
  ventanas: '',
  medidasVentanas: '',
  fechaMedidasVentanas: '',
  muros: '',
  medidasMuros: '',
  fechaMedidasMuros: '',
  cerraduras: '',
  medidasCerraduras: '',
  fechaMedidasCerraduras: '',
  pisos: '',
  medidasPisos: '',
  fechaMedidasPisos: '',
  observacionesAcondicionamiento: '',
  tarimas: '',
  medidasTarimas: '',
  fechaMedidasTarimas: '',
  lamparasEmergencia: '',
  medidasLamparasEmergencia: '',
  fechaMedidasLamparasEmergencia: '',
  senializacion: '',
  medidasSenializacion: '',
  fechaMedidasSenializacion: '',
  anaqueles: '',
  medidasAnaqueles: '',
  fechaMedidasAnaqueles: '',
  observacionesExcepcionales: '',
  cedula_archivo: null,
};

// ─── Esquemas de validación ──────────────────────────────────────────────────────

const validationSchema = Yup.object({
  nombreVerificador: Yup.string().required('El nombre del verificador es obligatorio'),
  cargoVerificador: Yup.string().required('El cargo del verificador es obligatorio'),
  fechaVerificacion: Yup.string().required('La fecha de verificación es obligatoria'),
  numConsejeros: Yup.mixed()
    .required('El número de consejeros es obligatorio')
    .test('min-zero', 'El valor mínimo es 0', (val) => val === '' || Number(val) >= 0),
  numOtrasPersonas: Yup.mixed()
    .required('El número de otras personas es obligatorio')
    .test('min-zero', 'El valor mínimo es 0', (val) => val === '' || Number(val) >= 0),
  nombresConsejeros: Yup.string().when('numConsejeros', {
    is: (val: unknown) => val !== '' && val !== undefined && Number(val) > 0,
    then: (s) => s
      .required('Debe ingresar los nombres de los consejeros')
      .test('match-count', 'La cantidad de nombres no coincide con el número de consejeros', function (value) {
        if (!value) return false;
        const count = value.split(',').map((s) => s.trim()).filter(Boolean).length;
        return count === Number(this.parent.numConsejeros);
      }),
    otherwise: (s) => s,
  }),
  numConsejerosIne: Yup.mixed()
    .required('El número de consejeros del INE es obligatorio')
    .test('min-zero', 'El valor mínimo es 0', (val) => val === '' || Number(val) >= 0),
  numOtrasPersonasIne: Yup.mixed()
    .required('El número de otras personas del INE es obligatorio')
    .test('min-zero', 'El valor mínimo es 0', (val) => val === '' || Number(val) >= 0),
  nombresConsejerosIne: Yup.string().when('numConsejerosIne', {
    is: (val: unknown) => val !== '' && val !== undefined && Number(val) > 0,
    then: (s) => s
      .required('Debe ingresar los nombres de los consejeros del INE')
      .test('match-count-ine', 'La cantidad de nombres no coincide con el número de consejeros del INE', function (value) {
        if (!value) return false;
        const count = value.split(',').map((s) => s.trim()).filter(Boolean).length;
        return count === Number(this.parent.numConsejerosIne);
      }),
    otherwise: (s) => s,
  }),
});

// ─── Helpers ────────────────────────────────────────────────────────────────────

function verificacionToFormValues(v: IVerificacion | undefined, meta?: any): WizardFormValues {
  if (!v) {
    // Sin verificación, pero podemos aplicar el fallback de meta.bodega para
    // los campos que dependen de la bodega (num_paquetes, superficie_m2).
    const base = { ...EMPTY_VALUES };
    if (meta?.bodega) {
      if (base.numPaquetes === '' && meta.bodega.numPaquetesEstimado != null) {
        base.numPaquetes = String(meta.bodega.numPaquetesEstimado);
      }
      if (base.superficieM2 === '' && meta.bodega.superficieM2 != null) {
        base.superficieM2 = String(meta.bodega.superficieM2);
      }
    }
    return base;
  }
  const opl = v.participantesOpl ?? {};
  const ine = v.participantesIne ?? {};
  const be = v.caracteristicasBe ?? {};
  const bodegaMeta = meta?.bodega ?? {};
  const ub = v.ubicacion ?? {};
  const ac = v.acondicionamiento ?? {};
  const eq = v.equipamiento ?? {};
  const gen = v.generales ?? {};
  return {
    nombreVerificador: v.nombreVerificador ?? '',
    cargoVerificador: v.cargoVerificador ?? '',
    fechaVerificacion: v.fechaVerificacion ? v.fechaVerificacion.slice(0, 10) : '',
    consejeroParticipa: opl.consejeroParticipa ?? false,
    secretarioParticipa: opl.secretarioParticipa ?? false,
    numConsejeros: opl.numConsejeros ?? '',
    nombresConsejeros: Array.isArray(opl.nombresConsejeros) ? opl.nombresConsejeros.join(', ') : '',
    numOtrasPersonas: opl.numOtrasPersonas ?? '',
    consejeroIneParticipa: ine.consejeroIneParticipa ?? false,
    secretarioIneParticipa: ine.secretarioIneParticipa ?? false,
    numConsejerosIne: ine.numConsejerosIne ?? '',
    nombresConsejerosIne: Array.isArray(ine.nombresConsejerosIne) ? ine.nombresConsejerosIne.join(', ') : '',
    numOtrasPersonasIne: ine.numOtrasPersonasIne ?? '',
    organoDesconcentrado: ine.organoDesconcentrado ?? '',
    numJuntaDistrital: ine.numJuntaDistrital ?? '',
    veParticipa: ine.veParticipa ?? false,
    vsParticipa: ine.vsParticipa ?? false,
    voeParticipa: ine.voeParticipa ?? false,
    vrfeParticipa: ine.vrfeParticipa ?? false,
    vceyecParticipa: ine.vceyecParticipa ?? false,
    numPaquetes: be.numPaquetes ?? bodegaMeta?.numPaquetesEstimados ?? '',
    superficieM2: be.superficieM2 ?? bodegaMeta?.superficieM2 ?? '',
    ubicadaEnSede: be.ubicadaEnSede === true ? 'true' : be.ubicadaEnSede === false ? 'false' : '',
    motivoNoSede: be.motivoNoSede ?? '',
    espacioSuficiente: be.espacioSuficiente === true ? 'true' : be.espacioSuficiente === false ? 'false' : '',
    medidasEspacio: be.medidasEspacio ?? '',
    fechaMedidasEspacio: be.fechaMedidasEspacio ? be.fechaMedidasEspacio.slice(0, 10) : '',
    espacioMateriales: be.espacioMateriales === true ? 'true' : be.espacioMateriales === false ? 'false' : '',
    medidasMateriales: be.medidasMateriales ?? '',
    fechaEspacioMateriales: be.fechaEspacioMateriales ? be.fechaEspacioMateriales.slice(0, 10) : '',
    alejadaIncendios: ub.alejadaIncendios === true ? 'true' : ub.alejadaIncendios === false ? 'false' : '',
    medidasIncendios: ub.medidasIncendios ?? '',
    fechaMedidasIncendios: ub.fechaMedidasIncendios ? ub.fechaMedidasIncendios.slice(0, 10) : '',
    retiradaAgua: ub.retiradaAgua === true ? 'true' : ub.retiradaAgua === false ? 'false' : '',
    medidasAgua: ub.medidasAgua ?? '',
    fechaMedidasAgua: ub.fechaMedidasAgua ? ub.fechaMedidasAgua.slice(0, 10) : '',
    drenaje: ub.drenaje === true ? 'true' : ub.drenaje === false ? 'false' : '',
    medidasDrenaje: ub.medidasDrenaje ?? '',
    fechaMedidasDrenaje: ub.fechaMedidasDrenaje ? ub.fechaMedidasDrenaje.slice(0, 10) : '',
    pisosSuperiores: ub.pisosSuperiores === true ? 'true' : ub.pisosSuperiores === false ? 'false' : '',
    medidasSuperiores: ub.medidasSuperiores ?? '',
    fechaMedidasSuperiores: ub.fechaMedidasSuperiores ? ub.fechaMedidasSuperiores.slice(0, 10) : '',
    observacionesUbicacion: ub.observacionesUbicacion ?? '',
    instalacionElectrica: ac.instalacionElectrica === true ? 'true' : ac.instalacionElectrica === false ? 'false' : '',
    medidasElectrica: ac.medidasElectrica ?? '',
    fechaMedidasElectrica: ac.fechaMedidasElectrica ? ac.fechaMedidasElectrica.slice(0, 10) : '',
    techos: ac.techos === true ? 'true' : ac.techos === false ? 'false' : '',
    medidasTechos: ac.medidasTechos ?? '',
    fechaMedidasTechos: ac.fechaMedidasTechos ? ac.fechaMedidasTechos.slice(0, 10) : '',
    drenajePluvial: ac.drenajePluvial === true ? 'true' : ac.drenajePluvial === false ? 'false' : '',
    medidasDrenajePluvial: ac.medidasDrenajePluvial ?? '',
    fechaMedidasDrenajePluvial: ac.fechaMedidasDrenajePluvial ? ac.fechaMedidasDrenajePluvial.slice(0, 10) : '',
    instalacionesSanitarias: ac.instalacionesSanitarias === true ? 'true' : ac.instalacionesSanitarias === false ? 'false' : '',
    medidasSanitarias: ac.medidasSanitarias ?? '',
    fechaMedidasSanitarias: ac.fechaMedidasSanitarias ? ac.fechaMedidasSanitarias.slice(0, 10) : '',
    ventanas: ac.ventanas === true ? 'true' : ac.ventanas === false ? 'false' : '',
    medidasVentanas: ac.medidasVentanas ?? '',
    fechaMedidasVentanas: ac.fechaMedidasVentanas ? ac.fechaMedidasVentanas.slice(0, 10) : '',
    muros: ac.muros === true ? 'true' : ac.muros === false ? 'false' : '',
    medidasMuros: ac.medidasMuros ?? '',
    fechaMedidasMuros: ac.fechaMedidasMuros ? ac.fechaMedidasMuros.slice(0, 10) : '',
    cerraduras: ac.cerraduras === true ? 'true' : ac.cerraduras === false ? 'false' : '',
    medidasCerraduras: ac.medidasCerraduras ?? '',
    fechaMedidasCerraduras: ac.fechaMedidasCerraduras ? ac.fechaMedidasCerraduras.slice(0, 10) : '',
    pisos: ac.pisos === true ? 'true' : ac.pisos === false ? 'false' : '',
    medidasPisos: ac.medidasPisos ?? '',
    fechaMedidasPisos: ac.fechaMedidasPisos ? ac.fechaMedidasPisos.slice(0, 10) : '',
    observacionesAcondicionamiento: ac.observacionesAcondicionamiento ?? '',
    tarimas: eq.tarimas === true ? 'true' : eq.tarimas === false ? 'false' : '',
    medidasTarimas: eq.medidasTarimas ?? '',
    fechaMedidasTarimas: eq.fechaMedidasTarimas ? eq.fechaMedidasTarimas.slice(0, 10) : '',
    lamparasEmergencia: eq.lamparasEmergencia === true ? 'true' : eq.lamparasEmergencia === false ? 'false' : '',
    medidasLamparasEmergencia: eq.medidasLamparasEmergencia ?? '',
    fechaMedidasLamparasEmergencia: eq.fechaMedidasLamparasEmergencia ? eq.fechaMedidasLamparasEmergencia.slice(0, 10) : '',
    senializacion: eq.senializacion === true ? 'true' : eq.senializacion === false ? 'false' : '',
    medidasSenializacion: eq.medidasSenializacion ?? '',
    fechaMedidasSenializacion: eq.fechaMedidasSenializacion ? eq.fechaMedidasSenializacion.slice(0, 10) : '',
    anaqueles: eq.anaqueles === true ? 'true' : eq.anaqueles === false ? 'false' : '',
    medidasAnaqueles: eq.medidasAnaqueles ?? '',
    fechaMedidasAnaqueles: eq.fechaMedidasAnaqueles ? eq.fechaMedidasAnaqueles.slice(0, 10) : '',
    observacionesExcepcionales: gen.observacionesExcepcionales ?? '',
    cedula_archivo: null,
  };
}

// Campos que pertenecen a cada paso del wizard. Usado para precargar
// únicamente los campos del paso actual desde la última verificación.
const CAMPOS_POR_PASO: Record<number, (keyof WizardFormValues)[]> = {
  1: ['nombreVerificador', 'cargoVerificador', 'fechaVerificacion'],
  2: ['consejeroParticipa', 'secretarioParticipa', 'numConsejeros', 'nombresConsejeros', 'numOtrasPersonas'],
  3: [
    'consejeroIneParticipa', 'secretarioIneParticipa', 'numConsejerosIne', 'nombresConsejerosIne',
    'numOtrasPersonasIne', 'organoDesconcentrado', 'numJuntaDistrital',
    'veParticipa', 'vsParticipa', 'voeParticipa', 'vrfeParticipa', 'vceyecParticipa',
  ],
  4: [
    'numPaquetes', 'superficieM2', 'ubicadaEnSede', 'motivoNoSede',
    'espacioSuficiente', 'medidasEspacio', 'fechaMedidasEspacio',
    'espacioMateriales', 'medidasMateriales', 'fechaEspacioMateriales',
  ],
  5: [
    'alejadaIncendios', 'medidasIncendios', 'fechaMedidasIncendios',
    'retiradaAgua', 'medidasAgua', 'fechaMedidasAgua',
    'drenaje', 'medidasDrenaje', 'fechaMedidasDrenaje',
    'pisosSuperiores', 'medidasSuperiores', 'fechaMedidasSuperiores',
    'observacionesUbicacion',
  ],
  6: [
    'instalacionElectrica', 'medidasElectrica', 'fechaMedidasElectrica',
    'techos', 'medidasTechos', 'fechaMedidasTechos',
    'drenajePluvial', 'medidasDrenajePluvial', 'fechaMedidasDrenajePluvial',
    'instalacionesSanitarias', 'medidasSanitarias', 'fechaMedidasSanitarias',
    'ventanas', 'medidasVentanas', 'fechaMedidasVentanas',
    'muros', 'medidasMuros', 'fechaMedidasMuros',
    'cerraduras', 'medidasCerraduras', 'fechaMedidasCerraduras',
    'pisos', 'medidasPisos', 'fechaMedidasPisos',
    'observacionesAcondicionamiento',
  ],
  7: [
    'tarimas', 'medidasTarimas', 'fechaMedidasTarimas',
    'lamparasEmergencia', 'medidasLamparasEmergencia', 'fechaMedidasLamparasEmergencia',
    'senializacion', 'medidasSenializacion', 'fechaMedidasSenializacion',
    'anaqueles', 'medidasAnaqueles', 'fechaMedidasAnaqueles',
  ],
  8: ['observacionesExcepcionales'],
};

function esVacio(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  return false;
}

function formValuesToUpdatePayload(id: number, values: WizardFormValues): IUpdateVerificacionInput {
  const payload: IUpdateVerificacionInput = {
    id,
    nombreVerificador: values.nombreVerificador,
    cargoVerificador: values.cargoVerificador,
    fechaVerificacion: values.fechaVerificacion ? values.fechaVerificacion.slice(0, 10) : '',
    esFinalizar: false,
  };

  // Solo incluir secciones que tienen datos reales
  const opl = {
    consejeroParticipa: values.consejeroParticipa,
    secretarioParticipa: values.secretarioParticipa,
    numConsejeros: values.numConsejeros === '' ? undefined : Number(values.numConsejeros),
    nombresConsejeros: values.nombresConsejeros
      ? values.nombresConsejeros.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined,
    numOtrasPersonas: values.numOtrasPersonas === '' ? undefined : Number(values.numOtrasPersonas),
  };
  const tieneOpl = values.consejeroParticipa || values.secretarioParticipa || values.numConsejeros !== '' || values.nombresConsejeros.trim() !== '' || values.numOtrasPersonas !== '';
  if (tieneOpl) payload.participantesOpl = opl;

  const ine = {
    consejeroIneParticipa: values.consejeroIneParticipa,
    secretarioIneParticipa: values.secretarioIneParticipa,
    numConsejerosIne: values.numConsejerosIne === '' ? undefined : Number(values.numConsejerosIne),
    nombresConsejerosIne: values.nombresConsejerosIne
      ? values.nombresConsejerosIne.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined,
    numOtrasPersonasIne: values.numOtrasPersonasIne === '' ? undefined : Number(values.numOtrasPersonasIne),
    organoDesconcentrado: values.organoDesconcentrado || undefined,
    numJuntaDistrital: values.numJuntaDistrital === '' ? undefined : Number(values.numJuntaDistrital),
    veParticipa: values.veParticipa,
    vsParticipa: values.vsParticipa,
    voeParticipa: values.voeParticipa,
    vrfeParticipa: values.vrfeParticipa,
    vceyecParticipa: values.vceyecParticipa
  };
  const tieneIne = values.consejeroIneParticipa || values.secretarioIneParticipa || values.numConsejerosIne !== '' || values.nombresConsejerosIne.trim() !== '' || values.numOtrasPersonasIne !== '' || values.organoDesconcentrado !== '' || values.numJuntaDistrital !== '' || values.veParticipa || values.vsParticipa || values.voeParticipa || values.vrfeParticipa || values.vceyecParticipa;
  if (tieneIne) payload.participantesIne = ine;

  const be = {
    numPaquetes: values.numPaquetes === '' ? undefined : Number(values.numPaquetes),
    superficieM2: values.superficieM2 === '' ? undefined : Number(values.superficieM2),
    ubicadaEnSede: values.ubicadaEnSede === 'true',
    motivoNoSede: values.ubicadaEnSede === 'true' ? null : (values.motivoNoSede || null),
    espacioSuficiente: values.espacioSuficiente === 'true',
    medidasEspacio: values.espacioSuficiente === 'false' ? (values.medidasEspacio || null) : undefined,
    fechaMedidasEspacio: values.espacioSuficiente === 'false' ? (values.fechaMedidasEspacio ? values.fechaMedidasEspacio.slice(0, 10) : null) : undefined,
    espacioMateriales: values.espacioMateriales === 'true',
    medidasMateriales: values.espacioMateriales === 'false' ? values.medidasMateriales : undefined,
    fechaEspacioMateriales: values.espacioMateriales === 'false' ? (values.fechaEspacioMateriales ? values.fechaEspacioMateriales.slice(0, 10) : null) : undefined,
  };
  const tieneBe = values.numPaquetes !== '' || values.superficieM2 !== '' || values.ubicadaEnSede !== '' || values.motivoNoSede.trim() !== '' || values.espacioSuficiente !== '' || values.medidasEspacio.trim() !== '' || values.fechaMedidasEspacio !== '' || values.espacioMateriales !== '' || values.medidasMateriales !== '' || values.fechaEspacioMateriales !== '';
  if (tieneBe) payload.caracteristicasBe = be;

  const ub = {
    alejadaIncendios: values.alejadaIncendios === 'true',
    medidasIncendios: values.alejadaIncendios === 'false' ? (values.medidasIncendios || null) : undefined,
    fechaMedidasIncendios: values.alejadaIncendios === 'false' ? (values.fechaMedidasIncendios ? values.fechaMedidasIncendios.slice(0, 10) : null) : undefined,
    retiradaAgua: values.retiradaAgua === 'true',
    medidasAgua: values.retiradaAgua === 'false' ? (values.medidasAgua || null) : undefined,
    fechaMedidasAgua: values.retiradaAgua === 'false' ? (values.fechaMedidasAgua ? values.fechaMedidasAgua.slice(0, 10) : null) : undefined,
    drenaje: values.drenaje === 'true',
    medidasDrenaje: values.drenaje === 'false' ? (values.medidasDrenaje || null) : undefined,
    fechaMedidasDrenaje: values.drenaje === 'false' ? (values.fechaMedidasDrenaje ? values.fechaMedidasDrenaje.slice(0, 10) : null) : undefined,
    pisosSuperiores: values.pisosSuperiores === 'true',
    medidasSuperiores: values.pisosSuperiores === 'false' ? (values.medidasSuperiores || null) : undefined,
    fechaMedidasSuperiores: values.pisosSuperiores === 'false' ? (values.fechaMedidasSuperiores ? values.fechaMedidasSuperiores.slice(0, 10) : null) : undefined,
    observacionesUbicacion: values.observacionesUbicacion || undefined,
  };
  const tieneUb = values.alejadaIncendios !== '' || values.medidasIncendios.trim() !== '' || values.retiradaAgua !== '' || values.medidasAgua.trim() !== '' || values.drenaje !== '' || values.medidasDrenaje.trim() !== '' || values.pisosSuperiores !== '' || values.medidasSuperiores.trim() !== '' || values.observacionesUbicacion.trim() !== '';
  if (tieneUb) payload.ubicacion = ub;

  const ac = {
    instalacionElectrica: values.instalacionElectrica === 'true',
    medidasElectrica: values.instalacionElectrica === 'false' ? (values.medidasElectrica || null) : undefined,
    fechaMedidasElectrica: values.instalacionElectrica === 'false' ? (values.fechaMedidasElectrica ? values.fechaMedidasElectrica.slice(0, 10) : null) : undefined,
    techos: values.techos === 'true',
    medidasTechos: values.techos === 'false' ? (values.medidasTechos || null) : undefined,
    fechaMedidasTechos: values.techos === 'false' ? (values.fechaMedidasTechos ? values.fechaMedidasTechos.slice(0, 10) : null) : undefined,
    drenajePluvial: values.drenajePluvial === 'true',
    medidasDrenajePluvial: values.drenajePluvial === 'false' ? (values.medidasDrenajePluvial || null) : undefined,
    fechaMedidasDrenajePluvial: values.drenajePluvial === 'false' ? (values.fechaMedidasDrenajePluvial ? values.fechaMedidasDrenajePluvial.slice(0, 10) : null) : undefined,

    instalacionesSanitarias: values.instalacionesSanitarias === 'true',
    medidasSanitarias: values.instalacionesSanitarias === 'false' ? (values.medidasSanitarias || null) : undefined,
    fechaMedidasSanitarias: values.instalacionesSanitarias === 'false' ? (values.fechaMedidasSanitarias ? values.fechaMedidasSanitarias.slice(0, 10) : null) : undefined,
    ventanas: values.ventanas === 'true',
    medidasVentanas: values.ventanas === 'false' ? (values.medidasVentanas || null) : undefined,
    fechaMedidasVentanas: values.ventanas === 'false' ? (values.fechaMedidasVentanas ? values.fechaMedidasVentanas.slice(0, 10) : null) : undefined,
    muros: values.muros === 'true',
    medidasMuros: values.muros === 'false' ? (values.medidasMuros || null) : undefined,
    fechaMedidasMuros: values.muros === 'false' ? (values.fechaMedidasMuros ? values.fechaMedidasMuros.slice(0, 10) : null) : undefined,
    cerraduras: values.cerraduras === 'true',
    medidasCerraduras: values.cerraduras === 'false' ? (values.medidasCerraduras || null) : undefined,
    fechaMedidasCerraduras: values.cerraduras === 'false' ? (values.fechaMedidasCerraduras ? values.fechaMedidasCerraduras.slice(0, 10) : null) : undefined,
    pisos: values.pisos === 'true',
    medidasPisos: values.pisos === 'false' ? (values.medidasPisos || null) : undefined,
    fechaMedidasPisos: values.pisos === 'false' ? (values.fechaMedidasPisos ? values.fechaMedidasPisos.slice(0, 10) : null) : undefined,
    observacionesAcondicionamiento: values.observacionesAcondicionamiento || undefined,
  };
  const tieneAc = values.instalacionElectrica !== '' || values.techos !== '' || values.drenajePluvial !== '' || values.instalacionesSanitarias !== '' || values.ventanas !== '' || values.muros !== '' || values.cerraduras !== '' || values.pisos !== '' || (values.medidasElectrica && values.medidasElectrica.trim() !== '') || (values.medidasTechos && values.medidasTechos.trim() !== '') || (values.medidasDrenajePluvial && values.medidasDrenajePluvial.trim() !== '') || (values.medidasSanitarias && values.medidasSanitarias.trim() !== '') || (values.medidasVentanas && values.medidasVentanas.trim() !== '') || (values.medidasMuros && values.medidasMuros.trim() !== '') || (values.medidasCerraduras && values.medidasCerraduras.trim() !== '') || (values.medidasPisos && values.medidasPisos.trim() !== '') || (values.observacionesAcondicionamiento && values.observacionesAcondicionamiento.trim() !== '');
  if (tieneAc) payload.acondicionamiento = ac;

  const eq = {
    tarimas: values.tarimas === 'true',
    medidasTarimas: values.tarimas === 'false' ? (values.medidasTarimas || null) : undefined,
    fechaMedidasTarimas: values.tarimas === 'false' ? (values.fechaMedidasTarimas ? values.fechaMedidasTarimas.slice(0, 10) : null) : undefined,
    lamparasEmergencia: values.lamparasEmergencia === 'true',
    medidasLamparasEmergencia: values.lamparasEmergencia === 'false' ? (values.medidasLamparasEmergencia || null) : undefined,
    fechaMedidasLamparasEmergencia: values.lamparasEmergencia === 'false' ? (values.fechaMedidasLamparasEmergencia ? values.fechaMedidasLamparasEmergencia.slice(0, 10) : null) : undefined,
    senializacion: values.senializacion === 'true',
    medidasSenializacion: values.senializacion === 'false' ? (values.medidasSenializacion || null) : undefined,
    fechaMedidasSenializacion: values.senializacion === 'false' ? (values.fechaMedidasSenializacion ? values.fechaMedidasSenializacion.slice(0, 10) : null) : undefined,
    anaqueles: values.anaqueles === 'true',
    medidasAnaqueles: values.anaqueles === 'false' ? (values.medidasAnaqueles || null) : undefined,
    fechaMedidasAnaqueles: values.anaqueles === 'false' ? (values.fechaMedidasAnaqueles ? values.fechaMedidasAnaqueles.slice(0, 10) : null) : undefined,
  };
  const tieneEq = values.tarimas !== '' || values.lamparasEmergencia !== '' || values.senializacion !== '' || values.anaqueles !== '' || (values.medidasTarimas && values.medidasTarimas.trim() !== '') || (values.medidasLamparasEmergencia && values.medidasLamparasEmergencia.trim() !== '') || (values.medidasSenializacion && values.medidasSenializacion.trim() !== '') || (values.medidasAnaqueles && values.medidasAnaqueles.trim() !== '');
  if (tieneEq) payload.equipamiento = eq;

  const gen = {
    observacionesExcepcionales: values.observacionesExcepcionales || undefined,
  };
  const tieneGen = values.observacionesExcepcionales.trim() !== '';
  if (tieneGen) payload.generales = gen;

  return payload;
}

// ─── Componentes de campo reutilizables ─────────────────────────────────────────

function FormField({
  label,
  name,
  type = 'text',
  readOnly,
  placeholder,
  className,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  required?: boolean;
}) {
  const isNumber = type === 'number';
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <Field name={name}>
        {({ field, form }: FieldProps) => (
          <Input
            {...field}
            type={type}
            min={isNumber ? 0 : undefined}
            placeholder={placeholder}
            readOnly={readOnly}
            disabled={readOnly}
            value={field.value ?? ''}
            onWheel={isNumber ? ((e: React.WheelEvent) => (e.target as HTMLElement).blur()) : undefined}
            onChange={(e) => {
              if (!isNumber) { field.onChange(e); return; }
              const raw = e.target.value;
              if (raw === '' || raw === '-') { form.setFieldValue(name, ''); return; }
              const num = Number(raw);
              if (!isNaN(num)) form.setFieldValue(name, num);
            }}
            className={readOnly ? 'bg-muted/80 cursor-not-allowed' : ''}
          />
        )}
      </Field>
      <ErrorMessage name={name} component="p" className="text-xs text-destructive mt-1" />
    </div>
  );
}

function FormCheckbox({
  label,
  name,
  readOnly,
}: {
  label: string;
  name: string;
  readOnly?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <Field name={name}>
        {({ field, form }: FieldProps) => (
          <input
            type="checkbox"
            id={name}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
            checked={!!field.value}
            disabled={readOnly}
            onChange={(e) => form.setFieldValue(name, e.target.checked)}
          />
        )}
      </Field>
      <label htmlFor={name} className="text-sm text-foreground leading-snug">
        {label}
      </label>
    </div>
  );
}

function FormTextArea({
  label,
  name,
  readOnly,
  placeholder,
  rows = 3,
}: {
  label: string;
  name: string;
  readOnly?: boolean;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <Field name={name}>
        {({ field }: FieldProps) => (
          <textarea
            {...field}
            rows={rows}
            placeholder={placeholder}
            readOnly={readOnly}
            disabled={readOnly}
            value={field.value ?? ''}
            className={`flex w-full bg-background border border-input shadow-xs shadow-black/5 transition-[color,box-shadow] text-foreground placeholder:text-muted-foreground/80 focus-visible:ring-ring/30 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 rounded-md px-3 py-2 text-sm ${
              readOnly ? 'bg-muted/80 cursor-not-allowed' : ''
            }`}
          />
        )}
      </Field>
      <ErrorMessage name={name} component="p" className="text-xs text-destructive mt-1" />
    </div>
  );
}

// ─── Pasos del wizard ───────────────────────────────────────────────────────────

function PasoDatosGenerales({ readOnly, values, setFieldValue }: { readOnly: boolean; values: WizardFormValues; setFieldValue: (field: string, value: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Nombre del verificador" name="nombreVerificador" readOnly={readOnly} required />
        <FormField label="Cargo del verificador" name="cargoVerificador" readOnly={readOnly} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Fecha de verificación<span className="text-destructive ml-0.5">*</span></label>
        <DateTimePicker dateOnly
          value={values.fechaVerificacion}
          onChange={(v) => setFieldValue('fechaVerificacion', v)}
          disabled={readOnly}
        />
        <ErrorMessage name="fechaVerificacion" component="p" className="text-xs text-destructive mt-1" />
      </div>
    </div>
  );
}

function PasoParticipantesOpl({ readOnly, requiredNombres }: { readOnly: boolean; requiredNombres?: boolean }) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Indique la cantidad de consejeros y otras personas que participaron. Si no asistieron, deje el valor en 0.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormCheckbox label="Consejero Presidente del órgano competente" name="consejeroParticipa" readOnly={readOnly} />
        <FormCheckbox label="Secretario del Consejo del órgano competente" name="secretarioParticipa" readOnly={readOnly} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Número de consejeros" name="numConsejeros" type="number" readOnly={readOnly} required />
        <FormField label="Número de otras personas" name="numOtrasPersonas" type="number" readOnly={readOnly} required />
      </div>
      <FormField label="Nombres de consejeros (separados por coma)" name="nombresConsejeros" type="text" readOnly={readOnly} placeholder="Ej. Juan Pérez, María López" required={requiredNombres} />
    </div>
  );
}

function PasoParticipantesIne({ readOnly, values, setFieldValue, requiredNombres }: { readOnly: boolean; values: WizardFormValues; setFieldValue: (field: string, value: any) => void; requiredNombres?: boolean }) {
  const esJuntaDistrital = values.organoDesconcentrado === 'Junta Distrital Ejecutiva';
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Indique la cantidad de consejeras, consejeros y otras personas del INE que participaron. Si no asistieron, deje el valor en 0.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormCheckbox label="Consejero Presidente del órgano competente del INE" name="consejeroIneParticipa" readOnly={readOnly} />
        <FormCheckbox label="Secretario del Consejo del órgano competente del INE" name="secretarioIneParticipa" readOnly={readOnly} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Número de consejeras y consejeros del INE" name="numConsejerosIne" type="number" readOnly={readOnly} required />
        <FormField label="Número de otras personas del INE" name="numOtrasPersonasIne" type="number" readOnly={readOnly} required />
      </div>
      <FormField label="Nombres de las consejeras y consejeros del INE (separados por coma)" name="nombresConsejerosIne" type="text" readOnly={readOnly} placeholder="Ej. Juan Pérez, María López" required={requiredNombres} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5 leading-snug">
            ¿Órgano desconcentrado del INE que realiza la verificación conjunta de la Bodega electoral?
          </label>
          <Field name="organoDesconcentrado">
            {({ field }: FieldProps) => (
              <select
                {...field}
                value={field.value ?? ''}
                disabled={readOnly}
                onChange={(e) => {
                  const val = e.target.value;
                  setFieldValue('organoDesconcentrado', val);
                  if (val !== 'Junta Distrital Ejecutiva') {
                    setFieldValue('numJuntaDistrital', '');
                  }
                }}
                className="flex w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm shadow-black/5 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Selecciona...</option>
                <option value="Junta Local Ejecutiva">Junta Local Ejecutiva</option>
                <option value="Junta Distrital Ejecutiva">Junta Distrital Ejecutiva</option>
              </select>
            )}
          </Field>
        </div>
        {esJuntaDistrital && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5 leading-snug">
              En caso de elegir Junta Distrital Ejecutiva, especifique el número de identificación de ésta
            </label>
            <Field name="numJuntaDistrital">
              {({ field }: FieldProps) => (
                <select
                  {...field}
                  value={field.value ?? ''}
                  disabled={readOnly}
                  className="flex w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm shadow-black/5 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecciona...</option>
                  {Array.from({ length: 14 }, (_, i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              )}
            </Field>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <FormCheckbox label="Vocalía Ejecutiva (VE) del INE" name="veParticipa" readOnly={readOnly} />
        <FormCheckbox label="Vocal Secretario (VS) del INE" name="vsParticipa" readOnly={readOnly} />
        <FormCheckbox label="Vocal de Organización Electoral (VOE) del INE" name="voeParticipa" readOnly={readOnly} />
        <FormCheckbox label="Vocal del Registro Federal de Electores (VRFE) del INE" name="vrfeParticipa" readOnly={readOnly} />
        <FormCheckbox label="Vocal de Capacitación Electoral y Educación Cívica (VCEYEC) del INE" name="vceyecParticipa" readOnly={readOnly} />
      </div>
    </div>
  );
}

function SiNoField({
  label,
  name,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  readOnly: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5 leading-snug">{label}</label>
      <div className="flex gap-3">
        <button
          type="button"
          disabled={readOnly}
          onClick={() => onChange(name, 'true')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
            value === 'true'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-foreground border-input hover:bg-accent'
          } ${readOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        >
          Sí
        </button>
        <button
          type="button"
          disabled={readOnly}
          onClick={() => onChange(name, 'false')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
            value === 'false'
              ? 'bg-destructive text-destructive-foreground border-destructive'
              : 'bg-background text-foreground border-input hover:bg-accent'
          } ${readOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        >
          No
        </button>
      </div>
    </div>
  );
}

function PasoCaracteristicasBe({ readOnly, values, setFieldValue }: { readOnly: boolean; values: WizardFormValues; setFieldValue: (field: string, value: any) => void }) {
  const sinEspacio = values.espacioSuficiente === 'false';
  const sinEspacioMateriales = values.espacioMateriales === 'false';
  const noSede = values.ubicadaEnSede === 'false';

  const handleSiNo = (name: string, value: string) => {
    setFieldValue(name, value);
    if (name === 'ubicadaEnSede' && value === 'true') {
      setFieldValue('motivoNoSede', '');
    }
    if (name === 'espacioSuficiente' && value === 'true') {
      setFieldValue('medidasEspacio', '');
      setFieldValue('fechaMedidasEspacio', '');
    }
    if (name === 'espacioMateriales' && value === 'true') {
      setFieldValue('medidasMateriales', '');
      setFieldValue('fechaEspacioMateriales', '');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Número de paquetes a resguardar" name="numPaquetes" type="number" readOnly={readOnly} />
        <FormField label="Superficie en m²" name="superficieM2" type="number" readOnly={readOnly} />
      </div>

      <SiNoField
        label="¿La Bodega Electoral se ubica dentro del inmueble sede del órgano competente y/o central del OPL?"
        name="ubicadaEnSede"
        value={values.ubicadaEnSede}
        onChange={handleSiNo}
        readOnly={readOnly}
      />

      {noSede && (
        <FormField
          label="En caso de que la Bodega Electoral no se ubique dentro del inmueble, explique el motivo"
          name="motivoNoSede"
          placeholder="Sin captura"
          readOnly={readOnly}
        />
      )}

      <SiNoField
        label="¿La Bodega Electoral tiene el espacio suficiente para el resguardo de la documentación, las boletas y los paquetes electorales?"
        name="espacioSuficiente"
        value={values.espacioSuficiente}
        onChange={handleSiNo}
        readOnly={readOnly}
      />

      {sinEspacio && (
        <div className="space-y-4 pl-0 sm:pl-4 border-l-0 sm:border-l-2 sm:border-muted sm:pl-4">
          <FormField
            label="En caso de no contar con el espacio suficiente, ¿Qué medidas se adoptarán para el resguardo de la documentación, las boletas y los paquetes electorales y en qué fecha se contará con el espacio?"
            name="medidasEspacio"
            placeholder="Sin captura"
            readOnly={readOnly}
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Fecha en que se contará con el espacio</label>
            <DateTimePicker dateOnly
              value={values.fechaMedidasEspacio}
              onChange={(v) => setFieldValue('fechaMedidasEspacio', v)}
              disabled={readOnly}
            />
          </div>
        </div>
      )}

      <SiNoField
        label="¿La Bodega Electoral tiene espacio para el resguardo de los Materiales Electorales?"
        name="espacioMateriales"
        value={values.espacioMateriales}
        onChange={handleSiNo}
        readOnly={readOnly}
      />

      {sinEspacioMateriales && (
        <div className="space-y-4 pl-0 sm:pl-4 border-l-0 sm:border-l-2 sm:border-muted sm:pl-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5 leading-snug">
              En caso de no tener espacio para los materiales electorales ¿Qué medidas se adoptarán para el resguardo de los Materiales Electorales?
            </label>
            <Field name="medidasMateriales">
              {({ field }: FieldProps) => (
                <select
                  {...field}
                  value={field.value ?? ''}
                  disabled={readOnly}
                  className="flex w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm shadow-black/5 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecciona...</option>
                  {MEDIDAS_MATERIALES_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
            </Field>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              ¿En qué fecha se contará con el espacio para el resguardo de los Materiales Electorales? <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <DateTimePicker dateOnly
              value={values.fechaEspacioMateriales}
              onChange={(v) => setFieldValue('fechaEspacioMateriales', v)}
              disabled={readOnly}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PasoUbicacion({ readOnly, values, setFieldValue }: { readOnly: boolean; values: WizardFormValues; setFieldValue: (field: string, value: any) => void }) {
  const handleSiNo = (name: string, value: string) => {
    setFieldValue(name, value);
    if (value === 'true') {
      const fieldName = name.replace(/([A-Z])/g, match => `_${match.toLowerCase()}`);
      const medidasName = name === 'alejadaIncendios' ? 'medidasIncendios' : 
                         name === 'retiradaAgua' ? 'medidasAgua' :
                         name === 'drenaje' ? 'medidasDrenaje' :
                         name === 'pisosSuperiores' ? 'medidasSuperiores' : '';
      const fechaName = medidasName.replace('medidas', 'fechaMedidas');
      if (medidasName) {
        setFieldValue(medidasName, '');
        setFieldValue(fechaName, '');
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Incendios */}
      <div className="space-y-2">
        <SiNoField
          label="¿Está alejada de fuentes potenciales que provoquen incendios?"
          name="alejadaIncendios"
          value={values.alejadaIncendios}
          onChange={(name, val) => handleSiNo(name, val)}
          readOnly={readOnly}
        />
        {values.alejadaIncendios === 'false' && (
          <div className="space-y-2 pl-4 border-l-2 border-muted">
            <FormField
              label="¿Qué medidas se tomarán y en qué fecha se solucionará?"
              name="medidasIncendios"
              placeholder="Sin captura"
              readOnly={readOnly}
            />
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Fecha</label>
              <DateTimePicker dateOnly
                value={values.fechaMedidasIncendios}
                onChange={(v) => setFieldValue('fechaMedidasIncendios', v)}
                disabled={readOnly}
              />
            </div>
          </div>
        )}
      </div>

      {/* Agua */}
      <div className="space-y-2">
        <SiNoField
          label="¿Está retirada de cuerpos de agua como ríos, presas, lagunas, etc.?"
          name="retiradaAgua"
          value={values.retiradaAgua}
          onChange={(name, val) => handleSiNo(name, val)}
          readOnly={readOnly}
        />
        {values.retiradaAgua === 'false' && (
          <div className="space-y-2 pl-4 border-l-2 border-muted">
            <FormField
              label="¿Qué medidas se tomarán y en qué fecha se solucionará?"
              name="medidasAgua"
              placeholder="Sin captura"
              readOnly={readOnly}
            />
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Fecha</label>
              <DateTimePicker dateOnly
                value={values.fechaMedidasAgua}
                onChange={(v) => setFieldValue('fechaMedidasAgua', v)}
                disabled={readOnly}
              />
            </div>
          </div>
        )}
      </div>

      {/* Drenaje */}
      <div className="space-y-2">
        <SiNoField
          label="¿Está provista de un buen sistema de drenaje?"
          name="drenaje"
          value={values.drenaje}
          onChange={(name, val) => handleSiNo(name, val)}
          readOnly={readOnly}
        />
        {values.drenaje === 'false' && (
          <div className="space-y-2 pl-4 border-l-2 border-muted">
            <FormField
              label="¿Qué medidas se tomarán y en qué fecha se solucionará?"
              name="medidasDrenaje"
              placeholder="Sin captura"
              readOnly={readOnly}
            />
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Fecha</label>
              <DateTimePicker dateOnly
                value={values.fechaMedidasDrenaje}
                onChange={(v) => setFieldValue('fechaMedidasDrenaje', v)}
                disabled={readOnly}
              />
            </div>
          </div>
        )}
      </div>

      {/* Pisos */}
      <div className="space-y-2">
        <SiNoField
          label="¿El nivel del piso interior de la Bodega Electoral se ubica por arriba del nivel del piso exterior?"
          name="pisosSuperiores"
          value={values.pisosSuperiores}
          onChange={(name, val) => handleSiNo(name, val)}
          readOnly={readOnly}
        />
        {values.pisosSuperiores === 'false' && (
          <div className="space-y-2 pl-4 border-l-2 border-muted">
            <FormField
              label="¿Qué medidas se tomarán y en qué fecha se solucionará?"
              name="medidasSuperiores"
              placeholder="Sin captura"
              readOnly={readOnly}
            />
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Fecha</label>
              <DateTimePicker dateOnly
                value={values.fechaMedidasSuperiores}
                onChange={(v) => setFieldValue('fechaMedidasSuperiores', v)}
                disabled={readOnly}
              />
            </div>
          </div>
        )}
      </div>

      {/* Observaciones */}
      <FormTextArea
        label="Observaciones y comentarios adicionales"
        name="observacionesUbicacion"
        readOnly={readOnly}
      />
    </div>
  );
}

function PasoAcondicionamiento({ readOnly, values, setFieldValue }: { readOnly: boolean; values: WizardFormValues; setFieldValue: (field: string, value: any) => void }) {
  const createSiNoHandler = (name: string) => (fieldName: string, val: string) => {
    setFieldValue(fieldName, val);
    if (val === 'true') {
      const map: { [key: string]: [string, string] } = {
        instalacionElectrica: ['medidasElectrica', 'fechaMedidasElectrica'],
        techos: ['medidasTechos', 'fechaMedidasTechos'],
        drenajePluvial: ['medidasDrenajePluvial', 'fechaMedidasDrenajePluvial'],

        instalacionesSanitarias: ['medidasSanitarias', 'fechaMedidasSanitarias'],
        ventanas: ['medidasVentanas', 'fechaMedidasVentanas'],
        muros: ['medidasMuros', 'fechaMedidasMuros'],
        cerraduras: ['medidasCerraduras', 'fechaMedidasCerraduras'],
        pisos: ['medidasPisos', 'fechaMedidasPisos'],
      };
      const [medidasName, fechaName] = map[fieldName] || ['', ''];
      if (medidasName) {
        setFieldValue(medidasName, '');
        setFieldValue(fechaName, '');
      }
    }
  };

  const renderConditionalFields = (
    booleanField: string,
    medidasField: string,
    fechaField: string
  ) => {
    if (booleanField === 'false') {
      return (
        <div className="space-y-2 pl-4 border-l-2 border-muted">
          <FormField
            label="¿Qué medidas se tomarán y en qué fecha se solucionará?"
            name={medidasField}
            placeholder="Sin captura"
            readOnly={readOnly}
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Fecha</label>
            <DateTimePicker dateOnly
              value={values[fechaField as keyof WizardFormValues] as string}
              onChange={(v) => setFieldValue(fechaField, v)}
              disabled={readOnly}
            />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Instalación Eléctrica */}
      <div className="space-y-2">
        <SiNoField
          label="¿Cuenta con instalaciones eléctricas adecuadas?"
          name="instalacionElectrica"
          value={values.instalacionElectrica}
          onChange={createSiNoHandler('instalacionElectrica')}
          readOnly={readOnly}
        />
        {renderConditionalFields(values.instalacionElectrica, 'medidasElectrica', 'fechaMedidasElectrica')}
      </div>

      {/* Techos */}
      <div className="space-y-2">
        <SiNoField
          label="¿Cuenta con techos en buen estado?"
          name="techos"
          value={values.techos}
          onChange={createSiNoHandler('techos')}
          readOnly={readOnly}
        />
        {renderConditionalFields(values.techos, 'medidasTechos', 'fechaMedidasTechos')}
      </div>

      {/* Drenaje Pluvial */}
      <div className="space-y-2">
        <SiNoField
          label="¿Cuenta con drenaje pluvial adecuado?"
          name="drenajePluvial"
          value={values.drenajePluvial}
          onChange={createSiNoHandler('drenajePluvial')}
          readOnly={readOnly}
        />
        {renderConditionalFields(values.drenajePluvial, 'medidasDrenajePluvial', 'fechaMedidasDrenajePluvial')}
      </div>

      {/* Instalaciones Sanitarias */}
      <div className="space-y-2">
        <SiNoField
          label="¿Se tienen instalaciones sanitarias adecuadas en el inmueble? (Desde una visión que pudiera afectar a la Bodega Electoral)"
          name="instalacionesSanitarias"
          value={values.instalacionesSanitarias}
          onChange={createSiNoHandler('instalacionesSanitarias')}
          readOnly={readOnly}
        />
        {renderConditionalFields(values.instalacionesSanitarias, 'medidasSanitarias', 'fechaMedidasSanitarias')}
      </div>

      {/* Ventanas */}
      <div className="space-y-2">
        <SiNoField
          label="¿Cuenta con ventanas adecuadas?"
          name="ventanas"
          value={values.ventanas}
          onChange={createSiNoHandler('ventanas')}
          readOnly={readOnly}
        />
        {renderConditionalFields(values.ventanas, 'medidasVentanas', 'fechaMedidasVentanas')}
      </div>

      {/* Muros y Paredes */}
      <div className="space-y-2">
        <SiNoField
          label="¿Cuenta con muros y paredes adecuados?"
          name="muros"
          value={values.muros}
          onChange={createSiNoHandler('muros')}
          readOnly={readOnly}
        />
        {renderConditionalFields(values.muros, 'medidasMuros', 'fechaMedidasMuros')}
      </div>

      {/* Cerraduras */}
      <div className="space-y-2">
        <SiNoField
          label="¿Cuenta con cerraduras adecuadas?"
          name="cerraduras"
          value={values.cerraduras}
          onChange={createSiNoHandler('cerraduras')}
          readOnly={readOnly}
        />
        {renderConditionalFields(values.cerraduras, 'medidasCerraduras', 'fechaMedidasCerraduras')}
      </div>

      {/* Pisos */}
      <div className="space-y-2">
        <SiNoField
          label="¿Cuenta con pisos en buen estado?"
          name="pisos"
          value={values.pisos}
          onChange={createSiNoHandler('pisos')}
          readOnly={readOnly}
        />
        {renderConditionalFields(values.pisos, 'medidasPisos', 'fechaMedidasPisos')}
      </div>

      {/* Observaciones */}
      <FormTextArea
        label="Observaciones y comentarios adicionales"
        name="observacionesAcondicionamiento"
        readOnly={readOnly}
      />
    </div>
  );
}

function PasoEquipamiento({ readOnly, values, setFieldValue }: { readOnly: boolean; values: WizardFormValues; setFieldValue: (field: string, value: any) => void }) {
  const createSiNoHandler = (name: string) => (fieldName: string, val: string) => {
    setFieldValue(fieldName, val);
    if (val === 'true') {
      const map: { [key: string]: [string, string] } = {
        tarimas: ['medidasTarimas', 'fechaMedidasTarimas'],
        lamparasEmergencia: ['medidasLamparasEmergencia', 'fechaMedidasLamparasEmergencia'],
        senializacion: ['medidasSenializacion', 'fechaMedidasSenializacion'],
        anaqueles: ['medidasAnaqueles', 'fechaMedidasAnaqueles'],
      };
      const [medidasName, fechaName] = map[fieldName] || ['', ''];
      if (medidasName) {
        setFieldValue(medidasName, '');
        setFieldValue(fechaName, '');
      }
    }
  };

  const renderConditionalFields = (
    booleanField: string,
    medidasField: string,
    fechaField: string
  ) => {
    if (booleanField === 'false') {
      return (
        <div className="space-y-2 pl-4 border-l-2 border-muted">
          <FormField
            label="¿Qué medidas se tomarán y en qué fecha se solucionará?"
            name={medidasField}
            placeholder="Sin captura"
            readOnly={readOnly}
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Fecha</label>
            <DateTimePicker dateOnly
              value={values[fechaField as keyof WizardFormValues] as string}
              onChange={(v) => setFieldValue(fechaField, v)}
              disabled={readOnly}
            />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Tarimas */}
      <div className="space-y-2">
        <SiNoField
          label="¿Cuenta con tarimas?"
          name="tarimas"
          value={values.tarimas}
          onChange={createSiNoHandler('tarimas')}
          readOnly={readOnly}
        />
        {renderConditionalFields(values.tarimas, 'medidasTarimas', 'fechaMedidasTarimas')}
      </div>

      {/* Lámparas de Emergencia */}
      <div className="space-y-2">
        <SiNoField
          label="¿Cuenta con lámparas de emergencia?"
          name="lamparasEmergencia"
          value={values.lamparasEmergencia}
          onChange={createSiNoHandler('lamparasEmergencia')}
          readOnly={readOnly}
        />
        {renderConditionalFields(values.lamparasEmergencia, 'medidasLamparasEmergencia', 'fechaMedidasLamparasEmergencia')}
      </div>

      {/* Señalización */}
      <div className="space-y-2">
        <SiNoField
          label="¿Cuenta con señalización?"
          name="senializacion"
          value={values.senializacion}
          onChange={createSiNoHandler('senializacion')}
          readOnly={readOnly}
        />
        {renderConditionalFields(values.senializacion, 'medidasSenializacion', 'fechaMedidasSenializacion')}
      </div>

      {/* Anaqueles */}
      <div className="space-y-2">
        <SiNoField
          label="¿Cuenta con anaqueles?"
          name="anaqueles"
          value={values.anaqueles}
          onChange={createSiNoHandler('anaqueles')}
          readOnly={readOnly}
        />
        {renderConditionalFields(values.anaqueles, 'medidasAnaqueles', 'fechaMedidasAnaqueles')}
      </div>
    </div>
  );
}

// ─── Panel de vista previa de cédula ───────────────────────────────────────────

interface CedulaPreviewPanelProps {
  pdfUrl: string;
  fileName: string;
  onClose: () => void;
}

function CedulaPreviewPanel({ pdfUrl, fileName, onClose }: CedulaPreviewPanelProps) {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <>
      <div className="flex-1 flex flex-col border-t border-border lg:border-t-0 lg:border-l min-h-[480px] lg:min-h-[600px]">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground truncate">
              {fileName}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              title="Ver en pantalla completa"
              className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Cerrar vista previa"
              className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <PanelRightClose className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* PDF */}
        <div className="flex-1 flex flex-col">
          <iframe
            src={`${pdfUrl}#view=Fit&zoom=60`}
            title={fileName}
            className="flex-1 w-full border-0"
            style={{ minHeight: '800px' }}
          />
        </div>
      </div>

      {/* Fullscreen dialog */}
      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="sm:max-w-5xl w-[95vw] max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="px-4 py-3 border-b border-border shrink-0">
            <DialogTitle className="text-sm font-semibold truncate">{fileName}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 p-0">
            <iframe
              src={`${pdfUrl}#view=Fit&zoom=60`}
              title={fileName}
              className="w-full h-full border-0"
              style={{ minHeight: '70vh' }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Paso 8: Finalizar (Cédula, Observaciones y Fotografías restantes) ────────

function PasoGenerales({ readOnly, values, setFieldValue, cedulaUrl, idBodega, bodegaStatus, canFotografias, canEliminarFotografia }: { readOnly: boolean; values: WizardFormValues; setFieldValue: (field: string, value: any) => void; cedulaUrl?: string | null; idBodega: number; bodegaStatus?: import('@/types/bodegas').TStatusBodega; canFotografias: boolean; canEliminarFotografia: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Solo se permiten archivos PDF.');
      return;
    }
    setFieldValue('cedula_archivo', file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Solo se permiten archivos PDF.');
      return;
    }
    setFieldValue('cedula_archivo', file);
    e.target.value = '';
  }

  // Generar URL para vista previa del PDF (nuevo archivo o existente)
  const hasExistingCedula = !!cedulaUrl && !values.cedula_archivo;
  const pdfPreviewUrl = values.cedula_archivo ? URL.createObjectURL(values.cedula_archivo) : (cedulaUrl ?? null);
  const hasPreview = previewOpen && !!(values.cedula_archivo || cedulaUrl);

  return (
    <div className="space-y-5">
      <div className={`flex flex-col ${hasPreview ? 'lg:flex-row' : ''} gap-0`}>
        {/* Columna izquierda: Formulario */}
        <div className={`${hasPreview ? 'lg:w-1/2 lg:pr-4' : 'w-full'}`}>
        <div className="space-y-4">
          <FormTextArea
            label="Observaciones excepcionales (opcional)"
            name="observacionesExcepcionales"
            readOnly={readOnly}
            placeholder="Ingrese cualquier observación excepcional"
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Cédula del verificación (Obligatorio)
              <span className="text-destructive ml-1">*</span>
            </label>

            {/* Sin archivo nuevo ni existente */}
            {!values.cedula_archivo && !hasExistingCedula && (
              <div
                role="button"
                tabIndex={0}
                aria-label="Zona de carga de cédula PDF. Arrastra un archivo o haz clic para seleccionar."
                onClick={() => !readOnly && inputRef.current?.click()}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !readOnly) {
                    inputRef.current?.click();
                  }
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={[
                  'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors w-full',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  readOnly
                    ? 'pointer-events-none opacity-60 border-border'
                    : isDragging
                    ? 'border-primary bg-primary/5 cursor-copy'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30 cursor-pointer',
                ].join(' ')}
              >
                <Upload
                  className={`h-6 w-6 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">Arrastra tu cédula PDF aquí</p>
                  <p className="text-xs text-muted-foreground mt-1">o haz clic para seleccionar</p>
                </div>
              </div>
            )}

            {/* Cédula existente (sin nuevo archivo subido) */}
            {hasExistingCedula && (
              <div className="space-y-2">
                <div className="flex items-center gap-3 py-2.5 border-b border-border">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className={`w-10 h-10 rounded-md overflow-hidden border-2 shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      hasPreview ? 'border-primary' : 'border-border hover:border-primary/60'
                    }`}
                    aria-label="Ver cédula"
                  >
                    <div className="w-full h-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-red-500 dark:text-red-400" aria-hidden="true" />
                    </div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">Cédula de verificación</p>
                    <p className="text-[11px] text-muted-foreground">Archivo existente</p>
                  </div>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => setPreviewOpen(true)}
                      title="Vista previa"
                      className={`inline-flex items-center justify-center h-7 w-7 rounded-md border transition-colors ${
                        hasPreview
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="w-full px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5 inline mr-1.5" aria-hidden="true" />
                    Reemplazar cédula
                  </button>
                )}
              </div>
            )}

            {/* Nuevo archivo subido (reemplaza al existente) */}
            {values.cedula_archivo && (
              /* Cuando hay archivo cargado */
              <div className="space-y-2">
                <div className="flex items-center gap-3 py-2.5 border-b border-border">
                  {/* Miniatura PDF */}
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className={`w-10 h-10 rounded-md overflow-hidden border-2 shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      hasPreview ? 'border-primary' : 'border-border hover:border-primary/60'
                    }`}
                    aria-label="Ver cédula"
                  >
                    <div className="w-full h-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-red-500 dark:text-red-400" aria-hidden="true" />
                    </div>
                  </button>

                  {/* Meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {values.cedula_archivo.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {(values.cedula_archivo.size / 1024).toFixed(2)} KB
                    </p>
                  </div>

                  {/* Botón ver */}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => setPreviewOpen(true)}
                      title="Vista previa"
                      className={`inline-flex items-center justify-center h-7 w-7 rounded-md border transition-colors ${
                        hasPreview
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Botón eliminar */}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => setFieldValue('cedula_archivo', null)}
                      title="Eliminar cédula"
                      className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-muted-foreground transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Opción para reemplazar */}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="w-full px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5 inline mr-1.5" aria-hidden="true" />
                    Reemplazar cédula
                  </button>
                )}
              </div>
            )}

            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="sr-only"
              aria-hidden="true"
              onChange={handleFileChange}
            />
          </div>
        </div>
      </div>

      {/* Panel vista previa lateral */}
      {hasPreview && pdfPreviewUrl && (
        <CedulaPreviewPanel
          pdfUrl={pdfPreviewUrl}
          fileName={values.cedula_archivo?.name || 'Cédula de verificación'}
          onClose={() => setPreviewOpen(false)}
        />
      )}
      </div>

      {/* Fotografías restantes (etapa Verificación) agrupadas por subcategoría */}
      <FotografiasCard
        idBodega={idBodega}
        mode="upload"
        agruparPorSubcategoria
        leyendaCaptura="Adjunte el mayor número de fotografías posibles en cada sección. Esto permitirá agilizar los tiempos de validación."
        filtro={{
          etapa: ['Verificacion'],
          categorias: ['Acondicionamiento', 'Equipamiento'],
          momentos: ['Antes', 'Durante', 'Posterior'],
        }}
        bodegaStatus={bodegaStatus ?? 'Capturada'}
        canFotografias={canFotografias}
        canEliminarFotografia={canEliminarFotografia}
        modoWizard
        canObservaciones={false}
      />
    </div>
  );
}

// ─── Modal de finalizar ─────────────────────────────────────────────────────────

function FinalizarModal({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  cedulaArchivo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  cedulaArchivo: File | null;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            Terminar y enviar verificación
          </AlertDialogTitle>
          <AlertDialogDescription>
            ¿Está seguro de que desea terminar y enviar la verificación? Una vez enviada, no podrá realizar cambios.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" aria-hidden="true" />}
            Enviar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Componente principal del wizard ──────────────────────────────────────────

export function VerificacionWizard({ idBodega, idVerificacion, modo }: VerificacionWizardProps) {
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const [step, setStep] = useState(1);
  const [showFinalizar, setShowFinalizar] = useState(false);
  const [createdId, setCreatedId] = useState<number | null>(idVerificacion ?? null);
  const [valoresFinales, setValoresFinales] = useState<WizardFormValues | null>(null);

  // Habilitamos la consulta de la verificación cuando ya existe un id
  // (ya sea porque estamos editando o porque acabamos de crearla en modo "nueva"
  // tras guardar el paso 1). Esto nos da meta.bodega con numPaquetesEstimados
  // y superficieM2 para el prefill de Características BE.
  const { data: detalle, isLoading: loadingDetalle } = useVerificacionDetalle(
    idBodega,
    createdId ?? 0,
    !!createdId
  );
  const verificacion = detalle?.data ?? null;
  const metaVerificacion = detalle?.meta ?? null;

  // Prefill: en modo "nueva" consultamos la última verificación para precargar
  // los pasos con sus datos. La precarga se hace perezosamente al entrar a cada paso.
  const { data: ultimaData } = useUltimaVerificacion(idBodega, modo === 'nueva');
  const ultimaVerificacion = ultimaData?.data ?? null;
  const ultimaMeta = ultimaData?.meta ?? null;

  const [prefillPasos, setPrefillPasos] = useState<Set<number>>(new Set());

  const { mutateAsync: crearAsync, isPending: creando } = useCreateVerificacion(idBodega);
  const { mutateAsync: actualizarAsync, isPending: actualizando } = useUpdateVerificacion(idBodega);
  const { mutate: finalizar, isPending: finalizando } = useFinalizarVerificacion(idBodega);

  const isCapturista = parseInt(user?.idConsejo ?? '0') > 0;
  const readOnly = verificacion?.status === 'Revisada' || (verificacion?.status === 'Capturada' && isCapturista);

  const canFotografias = hasPermission('bodegas.be.fotografias');
  const canEliminarFotografia = hasPermission('bodegas.be.eliminarfotografia');

  const initialValues = useMemo(() => {
    if (modo === 'editar' && verificacion) {
      return verificacionToFormValues(verificacion, metaVerificacion);
    }
    return EMPTY_VALUES;
  }, [modo, verificacion, metaVerificacion]);

  const handleGuardarAvance = useCallback(
    async (values: WizardFormValues): Promise<boolean> => {
      try {
        if (modo === 'nueva' && !createdId) {
          const payload: ICreateVerificacionInput = {
            nombreVerificador: values.nombreVerificador,
            cargoVerificador: values.cargoVerificador,
            fechaVerificacion: values.fechaVerificacion ? values.fechaVerificacion.slice(0, 10) : '',
            esFinalizar: false,
          };
          const v = await crearAsync(payload);
          setCreatedId(v.id);
          const updatePayload = formValuesToUpdatePayload(v.id, values);
          await actualizarAsync(updatePayload);
          window.history.replaceState(null, '', `/bodegas/${idBodega}/verificaciones/${v.id}`);
          return true;
        } else {
          const targetId = createdId ?? idVerificacion;
          if (!targetId) return false;
          const payload = formValuesToUpdatePayload(targetId, values);
          await actualizarAsync(payload);
          return true;
        }
      } catch {
        return false;
      }
    },
    [modo, createdId, idVerificacion, idBodega, crearAsync, actualizarAsync],
  );

  const handleFinalizar = useCallback(
    (values: WizardFormValues) => {
      const targetId = createdId ?? idVerificacion;
      if (!targetId) return;
      if (!values.cedula_archivo) {
        alert('Por favor, adjunte el archivo de cédula');
        return;
      }
      const payload: IFinalizarVerificacionInput = {
        id: targetId,
        cedula_archivo: values.cedula_archivo,
        generales: {
          observaciones_excepcionales: values.observacionesExcepcionales || '',
        },
      };
      finalizar(payload);
    },
    [createdId, idVerificacion, finalizar],
  );

  const isPending = creando || actualizando || finalizando || loadingDetalle;

  function stepHasData(s: number, v: WizardFormValues): boolean {
    switch (s) {
      case 1: return v.nombreVerificador !== '' || v.cargoVerificador !== '' || v.fechaVerificacion !== '';
      case 2: return v.consejeroParticipa || v.secretarioParticipa || v.numConsejeros !== '' || v.nombresConsejeros !== '' || v.numOtrasPersonas !== '';
      case 3: return v.consejeroIneParticipa || v.secretarioIneParticipa || v.numConsejerosIne !== '' || v.nombresConsejerosIne !== '' || v.numOtrasPersonasIne !== '' || v.organoDesconcentrado !== '' || v.numJuntaDistrital !== '' || v.veParticipa || v.vsParticipa || v.voeParticipa || v.vrfeParticipa || v.vceyecParticipa;
      case 4: return v.numPaquetes !== '' || v.superficieM2 !== '' || v.ubicadaEnSede !== '' || v.motivoNoSede !== '' || v.espacioSuficiente !== '' || v.medidasEspacio !== '' || v.fechaMedidasEspacio !== '' || v.espacioMateriales !== '' || v.medidasMateriales !== '' || v.fechaEspacioMateriales !== '';
      case 5: return v.alejadaIncendios || v.medidasIncendios !== '' || v.retiradaAgua || v.medidasAgua !== '' || v.drenaje || v.medidasDrenaje !== '' || v.pisosSuperiores || v.medidasSuperiores !== '' || v.observacionesUbicacion !== '';
      case 6: return v.instalacionElectrica || v.medidasElectrica !== '' || v.techos || v.medidasTechos !== '' || v.drenajePluvial || v.medidasDrenajePluvial !== '' || v.instalacionesSanitarias || v.medidasSanitarias !== '' || v.ventanas || v.medidasVentanas !== '' || v.muros || v.medidasMuros !== '' || v.cerraduras || v.medidasCerraduras !== '' || v.pisos || v.medidasPisos !== '' || v.observacionesAcondicionamiento !== '';
      case 7: return v.tarimas || v.lamparasEmergencia || v.senializacion || v.anaqueles || v.medidasTarimas !== '' || v.medidasLamparasEmergencia !== '' || v.medidasSenializacion !== '' || v.medidasAnaqueles !== '';
      case 8: return v.cedula_archivo !== null || !!verificacion?.urlCedula || !!verificacion?.cedulaRutaArchivo;
      default: return false;
    }
  }

  function stepFieldsFilled(s: number, v: WizardFormValues): boolean {
    switch (s) {
      case 1: return !!v.nombreVerificador && !!v.cargoVerificador && !!v.fechaVerificacion;
      case 2:
        if (v.numConsejeros === '' || v.numOtrasPersonas === '') return false;
        if (Number(v.numConsejeros) > 0 && !v.nombresConsejeros) return false;
        return true;
      case 3:
        if (v.numConsejerosIne === '' || v.numOtrasPersonasIne === '') return false;
        if (Number(v.numConsejerosIne) > 0 && !v.nombresConsejerosIne) return false;
        return true;
      case 4:
        return v.ubicadaEnSede !== '' && v.espacioSuficiente !== '' && v.espacioMateriales !== '';
      case 5:
        return v.alejadaIncendios !== '' && v.retiradaAgua !== '' && v.drenaje !== '' && v.pisosSuperiores !== '';
      case 6:
        return v.instalacionElectrica !== '' && v.techos !== '' && v.drenajePluvial !== '' &&
          v.instalacionesSanitarias !== '' && v.ventanas !== '' && v.muros !== '' &&
          v.cerraduras !== '' && v.pisos !== '';
      case 7:
        return v.tarimas !== '' && v.lamparasEmergencia !== '' && v.senializacion !== '' && v.anaqueles !== '';
      default: return true;
    }
  }

  function stepFieldsToTouch(s: number): string[] {
    switch (s) {
      case 1: return ['nombreVerificador', 'cargoVerificador', 'fechaVerificacion'];
      case 2: return ['numConsejeros', 'numOtrasPersonas', 'nombresConsejeros'];
      case 3: return ['numConsejerosIne', 'numOtrasPersonasIne', 'nombresConsejerosIne'];
      default: return [];
    }
  }

  // Stepper UI
  function renderStepper(vals: WizardFormValues) {
    return (
      <div className="w-full overflow-x-auto pb-2">
        <div className="flex items-center gap-1 min-w-max">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isCompleted = step > s.id;
            const isFuture = step < s.id;
            const hasData = stepHasData(s.id, vals);
            const canNavigate = !readOnly && hasData;
            const blocked = readOnly || (isFuture && !hasData);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => { if (canNavigate) setStep(s.id); }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : hasData
                    ? 'bg-primary/10 text-primary dark:bg-primary/20'
                    : 'bg-muted text-muted-foreground'
                } ${blocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                disabled={blocked}
                aria-current={isActive ? 'step' : undefined}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{idx + 1}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Loading skeleton
  if (loadingDetalle && modo === 'editar') {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-full" />
        <Card>
          <CardContent className="p-5 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full animate-pulse motion-reduce:animate-none" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Formik
        initialValues={initialValues}
        enableReinitialize
        validateOnBlur
        validateOnChange
        validationSchema={validationSchema}
        onSubmit={(values) => {
          handleGuardarAvance(values);
        }}
      >
        {({ values, setFieldValue, validateForm, setErrors, setTouched }) => {
          // Prefill perezosa: al entrar a un paso, si no se ha precargado antes,
          // copiar los campos no vacíos desde la última verificación. Como meta
          // de la verificación siempre pasamos metaVerificacion (la fuente
          // autoritativa del estado actual de la bodega), de modo que campos
          // como num_paquetes y superficie_m2 de Características BE caigan al
          // fallback de meta.bodega.numPaquetesEstimados / superficie_m2 cuando
          // la última verificación no los tenga capturados.
          useEffect(() => {
            if (modo !== 'nueva') return;
            if (prefillPasos.has(step)) return;
            if (!ultimaVerificacion && !metaVerificacion) return;
            const formValues = ultimaVerificacion
              ? verificacionToFormValues(ultimaVerificacion, metaVerificacion ?? undefined)
              : verificacionToFormValues(undefined, metaVerificacion ?? undefined);
            const campos = CAMPOS_POR_PASO[step] ?? [];
            let changed = false;
            for (const campo of campos) {
              const nuevo = formValues[campo];
              const actual = values[campo];
              if (!esVacio(nuevo) && esVacio(actual)) {
                setFieldValue(campo as string, nuevo);
                changed = true;
              }
            }
            if (changed || campos.length > 0) {
              setPrefillPasos((prev) => {
                const next = new Set(prev);
                next.add(step);
                return next;
              });
            }
          }, [step, ultimaVerificacion, metaVerificacion, values, setFieldValue, prefillPasos, modo]);

          return (
          <>
            {renderStepper(values)}
            <Form>
            <Card>
              <CardHeader className="pb-2 px-3 md:px-5 pt-3 md:pt-4">
                <div className="flex items-center gap-2">
                  {(() => {
                    const StepIcon = STEPS[step - 1].icon;
                    return <StepIcon className="h-4 w-4 text-primary" aria-hidden="true" />;
                  })()}
                  <h2 className="text-sm font-semibold text-foreground">{STEPS[step - 1].label}</h2>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-3 md:px-5 py-3 md:py-4">
                {step === 1 && <PasoDatosGenerales readOnly={readOnly} values={values} setFieldValue={setFieldValue} />}
                {step === 2 && <PasoParticipantesOpl readOnly={readOnly} requiredNombres={Number(values.numConsejeros) > 0} />}
                {step === 3 && <PasoParticipantesIne readOnly={readOnly} values={values} setFieldValue={setFieldValue} requiredNombres={Number(values.numConsejerosIne) > 0} />}
                {step === 4 && <PasoCaracteristicasBe readOnly={readOnly} values={values} setFieldValue={setFieldValue} />}
                {step === 5 && <PasoUbicacion readOnly={readOnly} values={values} setFieldValue={setFieldValue} />}
                {step === 6 && <PasoAcondicionamiento readOnly={readOnly} values={values} setFieldValue={setFieldValue} />}
                {step === 7 && <PasoEquipamiento readOnly={readOnly} values={values} setFieldValue={setFieldValue} />}
                {step === 8 && <PasoGenerales readOnly={readOnly} values={values} setFieldValue={setFieldValue} cedulaUrl={verificacion?.urlCedula} idBodega={idBodega} bodegaStatus={verificacion?.status} canFotografias={canFotografias} canEliminarFotografia={canEliminarFotografia} />}

                {/* Navegación */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-4 border-t border-border gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 w-full sm:w-auto"
                    disabled={step === 1 || isPending}
                    onClick={() => setStep((s) => s - 1)}
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Anterior
                  </Button>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {step < 8 ? (
                      <Button
                        type="button"
                        size="sm"
                        className="gap-1.5 w-full sm:w-auto"
                        disabled={isPending || (!readOnly && !stepFieldsFilled(step, values))}
                        onClick={async () => {
                          if (!readOnly) {
                            const touchFields = stepFieldsToTouch(step);
                            if (touchFields.length > 0) {
                              const errs = await validateForm();
                              const stepErrs = touchFields.filter(k => k in errs);
                              if (stepErrs.length > 0) {
                                const touched: Record<string, boolean> = {};
                                touchFields.forEach(k => { touched[k] = true; });
                                setErrors(errs);
                                setTouched(touched);
                                return;
                              }
                            }
                            const ok = await handleGuardarAvance(values);
                            if (!ok) return;
                          }
                          setStep((s) => s + 1);
                        }}
                      >
                        Siguiente
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    ) : !readOnly ? (
                      <Button
                        type="button"
                        size="sm"
                        className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
                        disabled={isPending || !values.cedula_archivo}
                        onClick={() => {
                          setValoresFinales(values);
                          setShowFinalizar(true);
                        }}
                      >
                        {finalizando ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                        )}
                        Terminar y enviar
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Form>
          {/* Modal de confirmación */}
          <FinalizarModal
            open={showFinalizar}
            onOpenChange={(open) => {
              setShowFinalizar(open);
              if (!open) setValoresFinales(null);
            }}
            onConfirm={() => {
              const targetId = createdId ?? idVerificacion;
              if (!targetId || !valoresFinales || !valoresFinales.cedula_archivo) return;
              const payload: IFinalizarVerificacionInput = {
                id: targetId,
                cedula_archivo: valoresFinales.cedula_archivo,
                generales: {
                  observaciones_excepcionales: valoresFinales.observacionesExcepcionales || '',
                },
                finalizar_proceso: true,
              };
              finalizar(payload);
            }}
            isPending={finalizando}
            cedulaArchivo={valoresFinales?.cedula_archivo ?? null}
          />
        </>
          );
        }}
    </Formik>
    </div>
  );
}
