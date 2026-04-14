'use client';

import { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
  CommandCheck,
} from '@/components/ui/command';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Loader2, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCatalogosSesiones, useCrearSesion } from './nueva-sesion-data';
import type { ICrearSesionInput, ICatalogoConsejo } from '@/types/sesiones';
import type { TTipoConsejo } from '@/hooks/use-proceso';

// ─── Constantes ───────────────────────────────────────────────────────────────

const TIPO_CONSEJO_OPTIONS: { value: 'D' | 'M'; label: string }[] = [
  { value: 'D', label: 'Distrital' },
  { value: 'M', label: 'Municipal' },
];

// ─── Validación ───────────────────────────────────────────────────────────────

const validationSchema = Yup.object({
  tipo_consejo: Yup.string()
    .oneOf(['D', 'M'], 'Selecciona un tipo de consejo')
    .required('El tipo de consejo es obligatorio'),
  id_consejo: Yup.number()
    .min(1, 'Selecciona un consejo')
    .required('El consejo es obligatorio'),
  tipo: Yup.string().required('El tipo de sesión es obligatorio'),
  no_sesion: Yup.number()
    .typeError('Debe ser un número')
    .integer('Debe ser un número entero')
    .min(1, 'Mínimo 1')
    .required('El número de sesión es obligatorio'),
  anio: Yup.number()
    .typeError('Debe ser un número')
    .integer('Debe ser un número entero')
    .min(2000, 'Año inválido')
    .max(2100, 'Año inválido')
    .required('El año es obligatorio'),
  fecha_hora: Yup.string().required('La fecha y hora son obligatorias'),
});

// ─── Props ────────────────────────────────────────────────────────────────────

interface NuevaSesionFormProps {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  /** Tipo de consejo preseleccionado desde el filtro activo */
  tipoConsejoDefault?: TTipoConsejo;
  onSuccess?: () => void;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function NuevaSesionForm({
  open,
  onOpenChange,
  tipoConsejoDefault = 'distrital',
  onSuccess,
}: NuevaSesionFormProps) {
  const { data: catalogos, isLoading: isLoadingCatalogos } = useCatalogosSesiones();
  const crearMutation = useCrearSesion();

  const tipoDefault: 'D' | 'M' = tipoConsejoDefault === 'distrital' ? 'D' : 'M';
  const anioActual = catalogos?.anio_actual ?? new Date().getFullYear();
  const numSiguiente = catalogos?.num_sesiones != null ? catalogos.num_sesiones + 1 : 1;

  const defaultValues: ICrearSesionInput = {
    tipo_consejo: tipoDefault,
    id_consejo: 0,
    tipo: '',
    no_sesion: numSiguiente,
    anio: anioActual,
    fecha_hora: '',
  };

  async function handleSubmit(
    values: ICrearSesionInput,
    { resetForm }: { resetForm: () => void },
  ) {
    await crearMutation.mutateAsync(values);
    resetForm();
    onOpenChange(false);
    onSuccess?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Nueva Sesión
          </DialogTitle>
          <DialogDescription>
            Completa los campos para programar una nueva sesión de consejo.
          </DialogDescription>
        </DialogHeader>

        {isLoadingCatalogos ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Cargando catálogos...</span>
          </div>
        ) : (
          <Formik
            initialValues={defaultValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ errors, touched, values, setFieldValue, isSubmitting }) => {
              const isPending = isSubmitting || crearMutation.isPending;

              // Consejos filtrados según tipo seleccionado
              const consejosFiltered = (catalogos?.consejos ?? []).filter(
                (c) => c.tipo_consejo === values.tipo_consejo,
              );

              return (
                <Form className="space-y-4 py-2">
                  {/* ── Tipo de Consejo ──────────────────────────────────── */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Tipo de Consejo <span className="text-danger">*</span>
                    </label>
                    <div className="flex gap-2">
                      {TIPO_CONSEJO_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setFieldValue('tipo_consejo', opt.value);
                            setFieldValue('id_consejo', 0); // resetear consejo al cambiar tipo
                          }}
                          disabled={isPending}
                          className={cn(
                            'flex-1 inline-flex items-center justify-center h-9 px-4 rounded-md border text-sm font-medium transition-colors duration-150',
                            'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:border-ring',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            values.tipo_consejo === opt.value
                              ? 'bg-primary/10 border-primary text-primary'
                              : 'bg-background border-input text-foreground hover:bg-accent',
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {errors.tipo_consejo && touched.tipo_consejo && (
                      <p className="text-danger text-sm mt-1">{errors.tipo_consejo}</p>
                    )}
                  </div>

                  {/* ── Consejo ──────────────────────────────────────────── */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Consejo <span className="text-danger">*</span>
                    </label>
                    <ConsejoCombobox
                      consejos={consejosFiltered}
                      value={values.id_consejo}
                      onChange={(id) => setFieldValue('id_consejo', id)}
                      disabled={isPending}
                    />
                    {errors.id_consejo && touched.id_consejo && (
                      <p className="text-danger text-sm mt-1">{errors.id_consejo}</p>
                    )}
                  </div>

                  {/* ── Tipo de Sesión ───────────────────────────────────── */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Tipo de Sesión <span className="text-danger">*</span>
                    </label>
                    <Select
                      value={values.tipo}
                      onValueChange={(v) => setFieldValue('tipo', v)}
                      disabled={isPending}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona el tipo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(catalogos?.tipos_sesiones ?? []).map((ts) => (
                          <SelectItem key={ts.tipo} value={ts.tipo}>
                            {ts.tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.tipo && touched.tipo && (
                      <p className="text-danger text-sm mt-1">{errors.tipo}</p>
                    )}
                  </div>

                  {/* ── No. de Sesión + Año en grid ──────────────────────── */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        No. de Sesión <span className="text-danger">*</span>
                      </label>
                      <Field
                        name="no_sesion"
                        as={Input}
                        type="number"
                        min={1}
                        placeholder="Ej. 1"
                        disabled={isPending}
                      />
                      {errors.no_sesion && touched.no_sesion && (
                        <p className="text-danger text-sm mt-1">{errors.no_sesion}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Año <span className="text-danger">*</span>
                      </label>
                      <Field
                        name="anio"
                        as={Input}
                        type="number"
                        min={2000}
                        max={2100}
                        placeholder="Ej. 2024"
                        disabled={isPending}
                      />
                      {errors.anio && touched.anio && (
                        <p className="text-danger text-sm mt-1">{errors.anio}</p>
                      )}
                    </div>
                  </div>

                  {/* ── Fecha y Hora Programada ──────────────────────────── */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Fecha y Hora Programada <span className="text-danger">*</span>
                    </label>
                    <Field
                      name="fecha_hora"
                      as={Input}
                      type="datetime-local"
                      disabled={isPending}
                    />
                    {errors.fecha_hora && touched.fecha_hora && (
                      <p className="text-danger text-sm mt-1">{errors.fecha_hora}</p>
                    )}
                  </div>

                  {/* ── Acciones ─────────────────────────────────────────── */}
                  <DialogFooter className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={isPending}>
                      Cancelar
                    </Button>
                    <Button type="submit" variant="primary" disabled={isPending}>
                      {isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Crear Sesión
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </Form>
              );
            }}
          </Formik>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Consejo Combobox ─────────────────────────────────────────────────────────

interface ConsejoComboboxProps {
  consejos: ICatalogoConsejo[];
  value: number;
  onChange: (id: number) => void;
  disabled?: boolean;
}

function ConsejoCombobox({ consejos, value, onChange, disabled }: ConsejoComboboxProps) {
  const [open, setOpen] = useState(false);

  const selected = consejos.find((c) => c.id_consejo === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'flex w-full items-center justify-between rounded-md border border-input bg-background px-3 h-8.5',
            'text-[0.8125rem] text-left shadow-xs transition-shadow',
            'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:border-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            !selected && 'text-muted-foreground',
          )}
        >
          <span className="truncate">
            {selected
              ? `${selected.clave_consejo} — ${selected.consejo}`
              : 'Selecciona un consejo...'}
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar consejo..." />
          <CommandList>
            <CommandEmpty>No se encontraron consejos.</CommandEmpty>
            <CommandGroup>
              {consejos.map((c) => (
                  <CommandItem
                  key={c.id_consejo}
                  value={`${c.clave_consejo} ${c.consejo}`}
                  onSelect={() => {
                    onChange(c.id_consejo);
                    setOpen(false);
                  }}
                >
                  {value === c.id_consejo && <CommandCheck className="ml-0 mr-1" />}
                  <span className="font-medium text-xs text-muted-foreground w-6 shrink-0">
                    {c.clave_consejo}
                  </span>
                  <span className="truncate">{c.consejo}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
