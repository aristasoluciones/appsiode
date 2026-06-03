'use client';

import { useMemo, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, ChevronsUpDown, Loader2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { useAuth } from '@/providers/auth-provider';
import { useCrearBodega, useActualizarBodega } from '../../components/bodegas-data';
import type {
  IBodega,
  IBodegaFormValues,
  TOrganoCompetente,
  TTipoBodega,
} from '@/types/bodegas';
import type { ICatalogosData, ICatalogoConsejo } from '@/types/sesiones';

// ─── Constantes ───────────────────────────────────────────────────────────────

const ORGANOS_COMPETENTES: TOrganoCompetente[] = [
  'Órgano Central',
  'Órgano Competente (Municipal)',
  'Órgano Competente (Distrital)',
  'Otro',
];

const TIPO_BODEGA_OPTIONS: { value: TTipoBodega; label: string }[] = [
  { value: 'Oficina central', label: 'Oficina central' },
  { value: 'Consejo', label: 'Consejo' },
];

const TIPO_CONSEJO_OPTIONS = [
  { value: 'D', label: 'Distrital' },
  { value: 'M', label: 'Municipal' },
] as const;

// ─── Esquema de validación ────────────────────────────────────────────────────

const validationSchema = Yup.object({
  tipo: Yup.string()
    .oneOf(['Oficina central', 'Consejo'] as TTipoBodega[], 'Selecciona un tipo de bodega')
    .required('El tipo de bodega es obligatorio'),
  tipo_consejo: Yup.string().when('tipo', {
    is: 'Consejo',
    then: (s) =>
      s
        .oneOf(['M', 'D'], 'Selecciona un tipo de consejo')
        .required('El tipo de consejo es obligatorio'),
    otherwise: (s) => s.optional().nullable(),
  }),
  id_consejo: Yup.number().when('tipo', {
    is: 'Consejo',
    then: (s) =>
      s
        .typeError('Selecciona un consejo')
        .min(1, 'Selecciona un consejo')
        .required('El consejo es obligatorio'),
    otherwise: (s) => s.optional().nullable(),
  }),
  organo_competente: Yup.string()
    .oneOf(ORGANOS_COMPETENTES, 'Selecciona un órgano competente')
    .required('El órgano competente es obligatorio'),
  otro_organo_competente: Yup.string().when('organo_competente', {
    is: 'Otro',
    then: (s) =>
      s
        .min(2, 'Mínimo 2 caracteres')
        .required('Especifica el órgano competente'),
    otherwise: (s) => s.optional(),
  }),
  num_paquetes_estimados: Yup.number()
    .typeError('Debe ser un número')
    .integer('Debe ser entero')
    .min(0, 'No puede ser negativo')
    .nullable()
    .optional(),
  superficie_m2: Yup.number()
    .typeError('Debe ser un número')
    .integer('Debe ser entero')
    .min(1, 'Mínimo 1 m²')
    .nullable()
    .optional(),
  espacio_no_inmueble: Yup.string().when('ubicada_en_inmueble', {
    is: false,
    then: (s) => s.optional(),
    otherwise: (s) => s.optional(),
  }),
});

// ─── Valores iniciales ────────────────────────────────────────────────────────

const EMPTY_FORM: IBodegaFormValues = {
  tipo: '',
  tipo_consejo: '',
  id_consejo: '',
  organo_competente: '',
  otro_organo_competente: '',
  ubicada_en_inmueble: null,
  espacio_no_inmueble: '',
  num_paquetes_estimados: '',
  superficie_m2: '',
  espacio_materiales: null,
  medidas_no_espacio: '',
  observaciones: '',
};

function bodegaToFormValues(b: IBodega): IBodegaFormValues {
  return {
    tipo: b.tipo,
    tipo_consejo: b.tipo_consejo ?? '',
    id_consejo: b.id_consejo ?? '',
    organo_competente: b.organo_competente,
    otro_organo_competente: b.otro_organo_competente ?? '',
    ubicada_en_inmueble: b.ubicada_en_inmueble ?? null,
    espacio_no_inmueble: b.espacio_no_inmueble ?? '',
    num_paquetes_estimados: b.num_paquetes_estimados ?? '',
    superficie_m2: b.superficie_m2 ?? '',
    espacio_materiales: b.espacio_materiales ?? null,
    medidas_no_espacio: b.medidas_no_espacio ?? '',
    observaciones: b.observaciones ?? '',
  };
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function FieldError({ name }: { name: string }) {
  return (
    <ErrorMessage name={name}>
      {(msg) => (
        <p role="alert" className="text-xs text-destructive mt-1">
          {msg}
        </p>
      )}
    </ErrorMessage>
  );
}

function SiNoToggle({
  value,
  onChange,
  labelSi = 'Sí',
  labelNo = 'No',
  id,
}: {
  value: boolean | null;
  onChange: (v: boolean | null) => void;
  labelSi?: string;
  labelNo?: string;
  id: string;
}) {
  return (
    <div role="group" aria-label="Seleccionar opción" className="flex gap-2">
      {[
        { label: labelSi, val: true },
        { label: labelNo, val: false },
      ].map(({ label, val }) => (
        <button
          key={String(val)}
          type="button"
          id={val ? id : undefined}
          aria-pressed={value === val}
          onClick={() => onChange(value === val ? null : val)}
          className={[
            'inline-flex items-center justify-center px-4 h-9 rounded-md text-sm font-medium border',
            'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            value === val
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-foreground border-input hover:bg-accent',
          ].join(' ')}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Hook para catálogos ──────────────────────────────────────────────────────

function useCatalogosConsejos() {
  return useQuery<ICatalogosData>({
    queryKey: ['catalogos', 'sesiones'],
    queryFn: async () => {
      const { data } = await apiClient.get<ICatalogosData>(API_ENDPOINTS.CATALOGOS.SESIONES);
      return data;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface FormularioBodegaProps {
  modo: 'crear' | 'editar';
  bodega?: IBodega;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function FormularioBodega({ modo, bodega }: FormularioBodegaProps) {
  const router = useRouter();
  const { user } = useAuth();
  const crearMutation = useCrearBodega();
  const actualizarMutation = useActualizarBodega();

  const { data: catalogos, isLoading: isLoadingCatalogos } = useCatalogosConsejos();

  const isAdminGlobal = !user?.idConsejo || user.idConsejo === '0';
  const userTipoConsejo = (user?.tipoConsejo as 'M' | 'D' | '' | undefined) ?? '';
  const userIdConsejo = user?.idConsejo ? Number(user.idConsejo) : 0;

  const initialValues: IBodegaFormValues = useMemo(() => {
    if (modo === 'editar' && bodega) return bodegaToFormValues(bodega);
    return {
      ...EMPTY_FORM,
      tipo: isAdminGlobal ? '' : 'Consejo',
      tipo_consejo: isAdminGlobal ? '' : (userTipoConsejo as 'M' | 'D' | ''),
      id_consejo: isAdminGlobal ? '' : userIdConsejo || '',
    };
  }, [modo, bodega, isAdminGlobal, userTipoConsejo, userIdConsejo]);

  const isPending = crearMutation.isPending || actualizarMutation.isPending;

  async function handleSubmit(values: IBodegaFormValues) {
    const organoCompetente = values.organo_competente as TOrganoCompetente;
    const esConsejo = values.tipo === 'Consejo';
    const payload = {
      tipo: values.tipo as TTipoBodega,
      tipo_consejo: esConsejo ? (values.tipo_consejo as 'M' | 'D') : null,
      id_consejo: esConsejo && values.id_consejo !== '' ? Number(values.id_consejo) : null,
      organo_competente: organoCompetente,
      otro_organo_competente:
        organoCompetente === 'Otro' ? values.otro_organo_competente || 'Sin captura' : undefined,
      ubicada_en_inmueble: values.ubicada_en_inmueble,
      espacio_no_inmueble: values.espacio_no_inmueble || null,
      num_paquetes_estimados:
        values.num_paquetes_estimados !== '' ? Number(values.num_paquetes_estimados) : null,
      superficie_m2: values.superficie_m2 !== '' ? Number(values.superficie_m2) : null,
      espacio_materiales: values.espacio_materiales,
      medidas_no_espacio: values.medidas_no_espacio || null,
      observaciones: values.observaciones || null,
    };
    if (modo === 'crear') {
      await crearMutation.mutateAsync(payload);
    } else if (bodega) {
      await actualizarMutation.mutateAsync({ id: bodega.id, ...payload });
    }
  }

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {({ values, setFieldValue, isSubmitting }) => {
        // Consejo popover state lives inside render to keep Formik values in scope
        return (
          <FormularioInner
            values={values}
            setFieldValue={setFieldValue}
            isSubmitting={isSubmitting}
            isPending={isPending}
            isAdminGlobal={isAdminGlobal}
            userTipoConsejo={userTipoConsejo}
            userIdConsejo={userIdConsejo}
            catalogos={catalogos}
            isLoadingCatalogos={isLoadingCatalogos}
            modo={modo}
            onCancel={() => router.push('/bodegas')}
            user={user}
          />
        );
      }}
    </Formik>
  );
}

// ─── FormularioInner ──────────────────────────────────────────────────────────

interface FormularioInnerProps {
  values: IBodegaFormValues;
  setFieldValue: (field: string, value: unknown) => void;
  isSubmitting: boolean;
  isPending: boolean;
  isAdminGlobal: boolean;
  userTipoConsejo: string;
  userIdConsejo: number;
  catalogos: ICatalogosData | undefined;
  isLoadingCatalogos: boolean;
  modo: 'crear' | 'editar';
  onCancel: () => void;
  user: ReturnType<typeof useAuth>['user'];
}

function FormularioInner({
  values,
  setFieldValue,
  isSubmitting,
  isPending,
  isAdminGlobal,
  userTipoConsejo,
  catalogos,
  isLoadingCatalogos,
  modo,
  onCancel,
  user,
}: FormularioInnerProps) {
  const [openConsejo, setOpenConsejo] = useState(false);

  // Consejos filtrados por tipo
  const consejosFiltrados = (catalogos?.consejos ?? []).filter(
    (c: ICatalogoConsejo) => !values.tipo_consejo || c.tipo_consejo === values.tipo_consejo,
  );

  const consejoLabel = values.id_consejo
    ? (catalogos?.consejos ?? []).find(
        (c: ICatalogoConsejo) => c.id_consejo === Number(values.id_consejo),
      )?.consejo ?? `Consejo #${values.id_consejo}`
    : null;

  return (
    <Form noValidate aria-label="Formulario de bodega electoral">
      <div className="space-y-4 max-w-3xl">

        {/* ── 1. Identificación ──────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <h2 className="text-sm font-semibold text-foreground">Identificación</h2>
            <p className="text-xs text-muted-foreground">
              Información del consejo y órgano competente.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Tipo de bodega */}
            <div>
              <label
                htmlFor="tipo"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Tipo de Bodega <span aria-hidden="true" className="text-destructive">*</span>
              </label>
              <Select
                value={values.tipo}
                onValueChange={(v) => {
                  setFieldValue('tipo', v);
                  if (v === 'Oficina central') {
                    setFieldValue('tipo_consejo', null);
                    setFieldValue('id_consejo', null);
                    setOpenConsejo(false);
                  }
                }}
                disabled={isPending || modo === 'editar'}
              >
                <SelectTrigger id="tipo" className="w-full sm:max-w-xs">
                  <SelectValue placeholder="Selecciona tipo de bodega…" />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_BODEGA_OPTIONS.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError name="tipo" />
            </div>

            {/* Grid: Tipo + Consejo en misma fila (solo cuando tipo = Consejo) */}
            {values.tipo === 'Consejo' && (
              isAdminGlobal ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tipo de consejo */}
                <div>
                  <label
                    htmlFor="tipo_consejo"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Tipo de Consejo <span aria-hidden="true" className="text-destructive">*</span>
                  </label>
                  <Select
                    value={values.tipo_consejo ?? ''}
                    onValueChange={(v) => {
                      setFieldValue('tipo_consejo', v);
                      setFieldValue('id_consejo', '');
                      setOpenConsejo(false);
                    }}
                    indicatorVisibility={false}
                    disabled={isPending}
                  >
                    <SelectTrigger id="tipo_consejo" className="w-full">
                      <SelectValue placeholder="Selecciona tipo…" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPO_CONSEJO_OPTIONS.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError name="tipo_consejo" />
                </div>

                {/* Consejo — Popover combobox */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Consejo <span aria-hidden="true" className="text-destructive">*</span>
                  </label>
                  <Popover open={openConsejo} onOpenChange={setOpenConsejo}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        disabled={isPending || !values.tipo_consejo || isLoadingCatalogos}
                        className="w-full justify-between font-normal"
                      >
                        {isLoadingCatalogos ? (
                          <span className="text-muted-foreground">Cargando…</span>
                        ) : consejoLabel ? (
                          <span className="truncate">{consejoLabel}</span>
                        ) : (
                          <span className="text-muted-foreground">Selecciona consejo…</span>
                        )}
                        <span className="flex items-center gap-0.5 shrink-0 ml-2">
                          {values.id_consejo && (
                            <span
                              role="button"
                              aria-label="Limpiar consejo"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFieldValue('id_consejo', '');
                              }}
                              className="rounded p-0.5 hover:bg-muted transition-colors"
                            >
                              <X className="h-3.5 w-3.5 opacity-50 hover:opacity-100" />
                            </span>
                          )}
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] p-0"
                      align="start"
                    >
                      <Command>
                        <CommandInput placeholder="Buscar consejo…" />
                        <CommandList>
                          <CommandEmpty>Sin resultados</CommandEmpty>
                          <CommandGroup>
                            {consejosFiltrados.map((c: ICatalogoConsejo) => (
                              <CommandItem
                                key={c.id_consejo}
                                value={`${c.id_consejo} ${c.consejo}`}
                                onSelect={() => {
                                  setFieldValue('id_consejo', c.id_consejo);
                                  setOpenConsejo(false);
                                }}
                              >
                                <span className="text-xs text-muted-foreground w-5 shrink-0 mr-1">
                                  {c.clave_consejo}
                                </span>
                                <span className="text-wrap">{c.consejo}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FieldError name="id_consejo" />
                </div>
              </div>
              ) : (
              /* Usuario con consejo asignado: campos de solo lectura */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Tipo de Consejo
                  </label>
                  <div className="flex h-9 items-center px-3 rounded-md border border-input bg-muted/50 text-sm text-foreground">
                    {userTipoConsejo === 'D' ? 'Distrital' : 'Municipal'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Consejo
                  </label>
                  <div className="flex h-9 items-center px-3 rounded-md border border-input bg-muted/50 text-sm text-foreground truncate">
                    {user?.consejo ?? `Consejo #${user?.idConsejo}`}
                  </div>
                </div>
              </div>
              )
            )}

            {/* Entidad (fijo Chiapas) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Entidad Federativa
              </label>
              <div className="flex h-9 items-center px-3 rounded-md border border-input bg-muted/50 text-sm text-foreground">
                Chiapas
              </div>
            </div>

            {/* Órgano competente */}
            <div>
              <label
                htmlFor="organo_competente"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Órgano Competente <span aria-hidden="true" className="text-destructive">*</span>
              </label>
              <Select
                value={values.organo_competente}
                onValueChange={(v) => {
                  setFieldValue('organo_competente', v);
                  if (v !== 'Otro') setFieldValue('otro_organo_competente', '');
                }}
                disabled={isPending}
              >
                <SelectTrigger id="organo_competente" className="w-full">
                  <SelectValue placeholder="Selecciona órgano competente" />
                </SelectTrigger>
                <SelectContent>
                  {ORGANOS_COMPETENTES.map((op) => (
                    <SelectItem key={op} value={op}>{op}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError name="organo_competente" />
            </div>

            {/* Otro órgano competente */}
            {values.organo_competente === 'Otro' && (
              <div>
                <label
                  htmlFor="otro_organo_competente"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Especifica el órgano{' '}
                  <span aria-hidden="true" className="text-destructive">*</span>
                </label>
                <Field
                  as={Input}
                  id="otro_organo_competente"
                  name="otro_organo_competente"
                  placeholder="Nombre del órgano competente"
                  disabled={isPending}
                  aria-required="true"
                />
                <FieldError name="otro_organo_competente" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── 2. Características ────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <h2 className="text-sm font-semibold text-foreground">Características de la Bodega</h2>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Grid: paquetes + superficie */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="num_paquetes_estimados"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Paquetes estimados
                </label>
                <Field
                  as={Input}
                  id="num_paquetes_estimados"
                  name="num_paquetes_estimados"
                  type="number"
                  min={0}
                  placeholder="Ej: 500"
                  disabled={isPending}
                  inputMode="numeric"
                />
                <FieldError name="num_paquetes_estimados" />
              </div>
              <div>
                <label
                  htmlFor="superficie_m2"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Superficie (m²)
                </label>
                <div className="relative">
                  <Field
                    as={Input}
                    id="superficie_m2"
                    name="superficie_m2"
                    type="number"
                    min={1}
                    placeholder="Ej: 200"
                    disabled={isPending}
                    className="pr-10"
                    inputMode="numeric"
                    aria-describedby="superficie-unit"
                  />
                  <span
                    id="superficie-unit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none"
                  >
                    m²
                  </span>
                </div>
                <FieldError name="superficie_m2" />
              </div>
            </div>

            {/* Ubicada en inmueble */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                ¿Ubicada en un inmueble?
              </p>
              <SiNoToggle
                id="ubicada_en_inmueble"
                value={values.ubicada_en_inmueble}
                onChange={(v) => setFieldValue('ubicada_en_inmueble', v)}
              />
            </div>

            {values.ubicada_en_inmueble === false && (
              <div>
                <label
                  htmlFor="espacio_no_inmueble"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Descripción del espacio (no inmueble)
                </label>
                <Field
                  as={Input}
                  id="espacio_no_inmueble"
                  name="espacio_no_inmueble"
                  placeholder="Describe el tipo de espacio"
                  disabled={isPending}
                />
                <FieldError name="espacio_no_inmueble" />
              </div>
            )}

            {/* Espacio materiales */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                ¿Cuenta con espacio para materiales?
              </p>
              <SiNoToggle
                id="espacio_materiales"
                value={values.espacio_materiales}
                onChange={(v) => setFieldValue('espacio_materiales', v)}
              />
            </div>

            {values.espacio_materiales === false && (
              <div>
                <label
                  htmlFor="medidas_no_espacio"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Medidas ante falta de espacio
                </label>
                <Field
                  as={Input}
                  id="medidas_no_espacio"
                  name="medidas_no_espacio"
                  placeholder="Describe las medidas a implementar"
                  disabled={isPending}
                />
                <FieldError name="medidas_no_espacio" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── 3. Observaciones ──────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <h2 className="text-sm font-semibold text-foreground">Observaciones</h2>
          </CardHeader>
          <CardContent>
            <label
              htmlFor="observaciones"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Observaciones generales
            </label>
            <textarea
              id="observaciones"
              name="observaciones"
              value={values.observaciones}
              onChange={(e) => setFieldValue('observaciones', e.target.value)}
              disabled={isPending}
              rows={4}
              placeholder="Agrega observaciones relevantes sobre la bodega…"
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground resize-y focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-sm disabled:opacity-50"
              aria-label="Observaciones de la bodega"
            />
            <FieldError name="observaciones" />
          </CardContent>
        </Card>

        {/* ── Acciones ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 pb-4">
          <Button
            type="button"
            variant="secondary"
            className="gap-1.5"
            onClick={onCancel}
            disabled={isPending}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Cancelar
          </Button>
          <Button
            type="submit"
            className="gap-1.5"
            disabled={isPending || isSubmitting}
            aria-busy={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            {modo === 'crear' ? 'Registrar Bodega' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </Form>
  );
}