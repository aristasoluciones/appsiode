'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Formik, Form, Field, FieldArray } from 'formik';
import * as Yup from 'yup';
import {
  ArrowLeft,
  Check,
  Loader2,
  Plus,
  Trash2,
  CalendarClock,
  X,
  ChevronsUpDown,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
} from '@/components/common/toolbar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';
import { useCatalogosSesiones, useCrearSesion } from '@/app/(protected)/sesiones/components/nueva-sesion-data';
import type { ICatalogoConsejo, IPuntoOrdenDia } from '@/types/sesiones';
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

// ─── Tipos del formulario ─────────────────────────────────────────────────────

interface IConsejoSeleccionado {
  tipo_consejo: string;
  id_consejo: number;
}

interface NuevaSesionValues {
  no_sesion: string;
  tipo: string;
  fecha_hora: string;
  url: string;
  consejos: IConsejoSeleccionado[];
  pod: IPuntoOrdenDia[];
}

// ─── Validación ───────────────────────────────────────────────────────────────

const validationSchema = Yup.object({
  no_sesion: Yup.string().required('Obligatorio'),
  tipo: Yup.string().required('Selecciona el tipo de sesión'),
  fecha_hora: Yup.string().required('La fecha y hora son obligatorias'),
  url: Yup.string().url('Ingresa una URL válida').nullable(),
  consejos: Yup.array()
    .of(Yup.object({ tipo_consejo: Yup.string(), id_consejo: Yup.number() }))
    .min(1, 'Selecciona al menos un órgano'),
  pod: Yup.array()
    .of(
      Yup.object({
        id_punto: Yup.number().required('El número es obligatorio'),
        tipo: Yup.string().required('El tipo es obligatorio'),
        descripcion: Yup.string().required('La descripción es obligatoria'),
        id_subpunto: Yup.number().default(0),
      })
    )
    .min(1, 'Agrega al menos un punto del orden del día')
    .required('El orden del día es obligatorio'),
});

// ─── Componente principal ─────────────────────────────────────────────────────

export function NuevaSesionView() {
  const router = useRouter();
  const [openNuevoPunto, setOpenNuevoPunto] = useState(false);
  const [openNoSesion, setOpenNoSesion] = useState(false);
  const { data: catalogos, isLoading: isLoadingCatalogos } = useCatalogosSesiones();
  const crearMutation = useCrearSesion();

  const anioActual = catalogos?.anio_actual ?? new Date().getFullYear();

  const defaultValues: NuevaSesionValues = {
    no_sesion: '',
    tipo: '',
    fecha_hora: '',
    url: '',
    consejos: [],
    pod: [],
  };

  async function handleSubmit(values: NuevaSesionValues) {
    await crearMutation.mutateAsync({
      no_sesion: values.no_sesion,
      tipo: values.tipo,
      anio: anioActual,
      fecha_hora: values.fecha_hora,
      url: values.url || undefined,
      consejos: values.consejos,
      pod: values.pod.length > 0 ? values.pod : undefined,
    });
    router.push('/sesiones');
  }

  if (isLoadingCatalogos) {
    return (
      <>
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <Skeleton className="h-4 w-48" />
            </ToolbarHeading>
            <ToolbarActions>
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-24" />
            </ToolbarActions>
          </Toolbar>
        </Container>
        <Container>
          <div className="space-y-4">
            <Skeleton className="h-36 w-full rounded-lg" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Skeleton className="h-80 rounded-lg" />
              <Skeleton className="h-80 rounded-lg" />
            </div>
          </div>
        </Container>
      </>
    );
  }

  return (
    <Formik
      initialValues={defaultValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      enableReinitialize
      validateOnMount
    >
      {({ values, errors, touched, setFieldValue, submitForm, isSubmitting, isValid }) => {
        const isPending = isSubmitting || crearMutation.isPending;

        const distritales = (catalogos?.consejos ?? []).filter(
          (c) => c.tipo_consejo === 'D',
        );
        const municipales = (catalogos?.consejos ?? []).filter(
          (c) => c.tipo_consejo === 'M',
        );

        return (
          <>
            {isPending && (
              <div className="h-1 w-full bg-primary/20 overflow-hidden">
                <div className="h-full bg-primary animate-[progress_1.4s_ease-in-out_infinite]" />
              </div>
            )}
            {/* ── Toolbar ──────────────────────────────────────────────────── */}
            <Container>
              <Toolbar>
                <ToolbarHeading>
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <Link href="/sesiones">Sesiones</Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>Nueva Sesión</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </ToolbarHeading>
                <ToolbarActions>
                  <Button
                    type="button"
                    onClick={submitForm}
                    disabled={isPending || !isValid}
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Crear Sesión
                  </Button>
                  <Button variant="secondary" asChild disabled={isPending}>
                    <Link href="/sesiones">
                      <ArrowLeft className="h-4 w-4" />
                      Regresar
                    </Link>
                  </Button>
                </ToolbarActions>
              </Toolbar>
            </Container>

            {/* ── Form body ────────────────────────────────────────────────── */}
            <Container>
              <Form className="space-y-4 pb-8">
                {/* ── Sección 1: Datos Generales ───────────────────────── */}
                <SectionCard number={1} title="Datos Generales" requiredText="Campos requeridos">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* No. de Sesión — Combobox con búsqueda */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        No. de Sesión <span className="text-destructive">*</span>
                      </label>
                      <Popover open={openNoSesion} onOpenChange={setOpenNoSesion}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            disabled={isPending}
                            className="w-full justify-between font-normal"
                          >
                            {values.no_sesion
                              ? values.no_sesion
                              : <span className="text-muted-foreground">Selecciona...</span>}
                            <span className="flex items-center gap-0.5 shrink-0">
                              {values.no_sesion && (
                                <span
                                  role="button"
                                  aria-label="Limpiar selección"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFieldValue('no_sesion', '');
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
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Buscar número..." />
                            <CommandList>
                              <CommandEmpty>Sin resultados</CommandEmpty>
                              <CommandGroup>
                                {[...(catalogos?.num_sesiones ?? [])]
                                  .sort((a, b) => a.orden - b.orden)
                                  .map((n) => (
                                    <CommandItem
                                      key={n.num}
                                      value={String(n.num)}
                                      onSelect={(v) => {
                                        setFieldValue('no_sesion', v);
                                        setOpenNoSesion(false);
                                      }}
                                    >
                                      {n.num}
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {errors.no_sesion && touched.no_sesion && (
                        <p className="text-danger text-xs mt-1">{errors.no_sesion}</p>
                      )}
                    </div>

                    {/* Tipo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Tipo <span className="text-destructive">*</span>
                      </label>
                      <Select
                        value={values.tipo}
                        onValueChange={(v) => setFieldValue('tipo', v)}
                        disabled={isPending}
                        indicatorVisibility={false}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona..." />
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
                        <p className="text-danger text-xs mt-1">{errors.tipo}</p>
                      )}
                    </div>

                    {/* Fecha y Hora */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Fecha y Hora <span className="text-destructive">*</span>
                      </label>
                      <DateTimePicker
                        value={values.fecha_hora}
                        onChange={(v) => setFieldValue('fecha_hora', v)}
                        disabled={isPending}
                      />
                      {errors.fecha_hora && touched.fecha_hora && (
                        <p className="text-danger text-xs mt-1">{errors.fecha_hora}</p>
                      )}
                    </div>

                    {/* Link Documentos */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Link Documentos
                      </label>
                      <Field
                        name="url"
                        as={Input}
                        type="url"
                        placeholder="https://..."
                        disabled={isPending}
                      />
                      {errors.url && touched.url && (
                        <p className="text-danger text-xs mt-1">{errors.url}</p>
                      )}
                    </div>
                  </div>
                </SectionCard>

                {/* ── Secciones 2+3 ────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* ── Sección 2: Órganos Desconcentrados ─────────────── */}
                  <SectionCard number={2} title="Órganos Desconcentrados" requiredText="Selecciona al menos un órgano">
                    {errors.consejos && touched.consejos && typeof errors.consejos === 'string' && (
                      <p className="text-danger text-xs -mt-1 mb-2">{errors.consejos}</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Municipales */}
                      <ConsejoColumn
                        titulo="Municipios"
                        consejos={municipales}
                        selected={values.consejos}
                        onChange={(v) => setFieldValue('consejos', v)}
                        disabled={isPending}
                      />
                      {/* Distritales */}
                      <ConsejoColumn
                        titulo="Distritos"
                        consejos={distritales}
                        selected={values.consejos}
                        onChange={(v) => setFieldValue('consejos', v)}
                        disabled={isPending}
                      />
                    </div>
                  </SectionCard>

                  {/* ── Sección 3: Orden del Día ────────────────────────── */}
                  <SectionCard
                    number={3}
                    title="Orden del día"
                    requiredText="Agrega al menos un punto"
                    actions={
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={isPending}
                        onClick={() => setOpenNuevoPunto(true)}
                      >
                        <CalendarClock className="h-4 w-4" />
                        Nuevo Punto
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    }
                  >
                    <FieldArray name="pod">
                      {({ push, remove, replace }) => (
                        <>
                          <OrdenDiaPanel
                            items={values.pod}
                            onAdd={(item) => push(item)}
                            onRemove={(idx) => remove(idx)}
                            onUpdate={(idx, item) => replace(idx, item)}
                            disabled={isPending}
                            open={openNuevoPunto}
                            onOpenChange={setOpenNuevoPunto}
                          />
                          {errors.pod && touched.pod && typeof errors.pod === 'string' && (
                            <p className="text-danger text-xs mt-1">{errors.pod}</p>
                          )}
                        </>
                      )}
                    </FieldArray>
                  </SectionCard>
                </div>
              </Form>
            </Container>
          </>
        );
      }}
    </Formik>
  );
}

// ─── SectionCard ─────────────────────────────────────────────────────────────

function SectionCard({
  number,
  title,
  actions,
  children,
  requiredText,
}: {
  number: number;
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  requiredText?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
            {number}
          </span>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          {requiredText && (
            <span className="text-xs text-muted-foreground">
              <span className="text-destructive font-semibold">*</span> {requiredText}
            </span>
          )}
          {actions && <div>{actions}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── ConsejoColumn ────────────────────────────────────────────────────────────

function ConsejoColumn({
  titulo,
  consejos,
  selected,
  onChange,
  disabled,
}: {
  titulo: string;
  consejos: ICatalogoConsejo[];
  selected: IConsejoSeleccionado[];
  onChange: (v: IConsejoSeleccionado[]) => void;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState('');

  const isSelected = (c: ICatalogoConsejo) =>
    selected.some((s) => s.tipo_consejo === c.tipo_consejo && s.id_consejo === c.id_consejo);

  const allSelected = consejos.length > 0 && consejos.every(isSelected);

  const filtered = search.trim()
    ? consejos.filter((c) => c.consejo.toLowerCase().includes(search.toLowerCase()))
    : consejos;

  function toggleAll() {
    if (allSelected) {
      onChange(selected.filter((s) => !consejos.some((c) => c.tipo_consejo === s.tipo_consejo && c.id_consejo === s.id_consejo)));
    } else {
      const toAdd = consejos
        .filter((c) => !isSelected(c))
        .map((c) => ({ tipo_consejo: c.tipo_consejo, id_consejo: c.id_consejo }));
      onChange([...selected, ...toAdd]);
    }
  }

  function toggle(c: ICatalogoConsejo) {
    if (isSelected(c)) {
      onChange(selected.filter((s) => !(s.tipo_consejo === c.tipo_consejo && s.id_consejo === c.id_consejo)));
    } else {
      onChange([...selected, { tipo_consejo: c.tipo_consejo, id_consejo: c.id_consejo }]);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Select all */}
      <label
        className={cn(
          'flex items-center gap-2 cursor-pointer select-none',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          disabled={disabled}
          className="h-4 w-4 rounded border-border accent-primary"
        />
        <span className="text-sm font-medium text-foreground">
          Selecciona Todos los {titulo}
        </span>
      </label>

      {/* Search */}
      <Input
        placeholder={`Buscar ${titulo.toLowerCase()}...`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8 text-xs"
        disabled={disabled}
      />

      {/* List */}
      <div className="flex flex-col gap-0.5 h-[calc(100dvh-440px)] min-h-[200px] overflow-y-auto pr-1">
        {filtered.map((c) => (
          <label
            key={`${c.tipo_consejo}-${c.id_consejo}`}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer select-none',
              'hover:bg-accent transition-colors duration-100',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            <input
              type="checkbox"
              checked={isSelected(c)}
              onChange={() => toggle(c)}
              disabled={disabled}
              className="h-4 w-4 rounded border-border accent-primary shrink-0"
            />
            <span className="text-xs text-muted-foreground font-medium w-5 shrink-0">
              {c.clave_consejo}
            </span>
            <span className="text-xs text-foreground truncate">{c.consejo}</span>
          </label>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground px-2 py-4 text-center">
            Sin resultados
          </p>
        )}
      </div>
    </div>
  );
}

// ─── OrdenDiaPanel ────────────────────────────────────────────────────────────

const TIPOS_PUNTO = ['INFORME', 'CUENTA', 'APROBACION'] as const;

function OrdenDiaPanel({
  items,
  onAdd,
  onRemove,
  onUpdate,
  disabled,
  open,
  onOpenChange,
}: {
  items: IPuntoOrdenDia[];
  onAdd: (item: IPuntoOrdenDia) => void;
  onRemove: (idx: number) => void;
  onUpdate: (idx: number, item: IPuntoOrdenDia) => void;
  disabled?: boolean;
  open: boolean;
  onOpenChange: (val: boolean) => void;
}) {
  const [nuevoPunto, setNuevoPunto] = useState({ id_punto: '', descripcion: '', tipo: '' });
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [idPuntoError, setIdPuntoError] = useState<string | null>(null);
  const isEditing = editIdx !== null;
  const dialogOpen = open || isEditing;

  const isValid = nuevoPunto.id_punto !== '' && nuevoPunto.descripcion.trim() !== '' && nuevoPunto.tipo !== '';

  function handleEdit(idx: number) {
    const item = items[idx];
    setNuevoPunto({ id_punto: String(item.id_punto), descripcion: item.descripcion, tipo: item.tipo });
    setEditIdx(idx);
  }

  function handleAdd() {
    if (!isValid) return;

    const num = Number(nuevoPunto.id_punto);
    const duplicate = items.some(
      (item, idx) => item.id_punto === num && idx !== editIdx,
    );
    if (duplicate) {
      setIdPuntoError(`Ya existe un punto con el número ${num}.`);
      return;
    }
    setIdPuntoError(null);
    const item: IPuntoOrdenDia = {
      id_punto: Number(nuevoPunto.id_punto),
      descripcion: nuevoPunto.descripcion.trim(),
      tipo: nuevoPunto.tipo,
      id_subpunto: 0,
    };
    if (isEditing) {
      onUpdate(editIdx!, item);
    } else {
      onAdd(item);
    }
    setNuevoPunto({ id_punto: '', descripcion: '', tipo: '' });
    setEditIdx(null);
    onOpenChange(false);
  }

  function handleOpenChange(val: boolean) {
    if (!val) {
      setNuevoPunto({ id_punto: '', descripcion: '', tipo: '' });
      setEditIdx(null);
      setIdPuntoError(null);
      onOpenChange(false);
    } else {
      onOpenChange(val);
    }
  }

  return (
    <div className="flex flex-col">
      {/* Table header */}
      <div className="grid grid-cols-[auto_1fr_auto_auto] text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border pb-1.5 mb-1 px-1 gap-2">
        <span className="w-8">#</span>
        <span>Punto</span>
        <span className="pr-6">Tipo</span>
        <span />
      </div>

      {/* Rows */}
      {items.length === 0 ? (
        <div className="h-[calc(100dvh-440px)] min-h-[200px] flex items-center justify-center text-sm text-muted-foreground">
          No{' '}
          <span className="text-primary font-medium mx-1">tiene</span> puntos del
          orden del día
        </div>
      ) : (
        <div className="h-[calc(100dvh-440px)] min-h-[200px] overflow-y-auto divide-y divide-border">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[auto_1fr_auto_auto] items-start gap-2 py-2 px-1"
            >
              <span className="w-8 text-xs font-semibold text-muted-foreground mt-0.5">{item.id_punto}</span>
              <span className="text-sm text-foreground break-words text-justify">{item.descripcion}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap pr-2">
                {item.tipo || '—'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleEdit(idx)}
                  disabled={disabled}
                  className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                  aria-label="Editar punto"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  disabled={disabled}
                  className="text-muted-foreground hover:text-danger transition-colors disabled:opacity-50"
                  aria-label="Eliminar punto"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              {isEditing ? 'Editar Punto del Orden del Día' : 'Nuevo Punto del Orden del Día'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Número */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Número <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min={1}
                value={nuevoPunto.id_punto}
                onChange={(e) => {
                  setNuevoPunto((p) => ({ ...p, id_punto: e.target.value }));
                  setIdPuntoError(null);
                }}
                placeholder="Ej. 1"
              />
              {idPuntoError && (
                <p className="text-xs text-destructive mt-1">{idPuntoError}</p>
              )}
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Tipo <span className="text-destructive">*</span>
              </label>
              <Select
                value={nuevoPunto.tipo}
                onValueChange={(v) => setNuevoPunto((p) => ({ ...p, tipo: v }))}
                indicatorVisibility={false}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona el tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_PUNTO.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Descripción <span className="text-destructive">*</span>
              </label>
              <textarea
                rows={3}
                value={nuevoPunto.descripcion}
                onChange={(e) => setNuevoPunto((p) => ({ ...p, descripcion: e.target.value }))}
                placeholder="Descripción del punto..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled={!isValid} onClick={handleAdd}>
              <Check className="h-4 w-4" />
              {isEditing ? 'Actualizar Punto' : 'Agregar Punto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
