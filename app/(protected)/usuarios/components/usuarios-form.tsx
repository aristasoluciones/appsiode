'use client';

import { useState, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Eye, EyeOff, RefreshCw, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateUsuario, useUpdateUsuario } from './usuarios-data';
import type { IUsuario, ICreateUsuarioInput, IConsejo, IRolOpcion } from './usuarios-data';
import { SelectContent, SelectTrigger, SelectValue,Select,SelectItem } from '@/components/ui/select';

// ── Password utilities ───────────────────────────────────────────────────────

const PASSWORD_CHARSET =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*?';

function generateSecurePassword(length = 14): string {
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  const chars = Array.from(array, (n) => PASSWORD_CHARSET[n % PASSWORD_CHARSET.length]);
  // Garantizar al menos uno de cada tipo
  const rand = (set: string) =>
    set[crypto.getRandomValues(new Uint32Array(1))[0] % set.length];
  chars[0] = rand('abcdefghijklmnopqrstuvwxyz');
  chars[1] = rand('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  chars[2] = rand('0123456789');
  chars[3] = rand('!@#$%&*?');
  // Mezclar
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

type TPasswordStrength = 'weak' | 'fair' | 'strong' | 'very-strong';

function getPasswordStrength(pwd: string): TPasswordStrength {
  if (!pwd || pwd.length < 6) return 'weak';
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 2) return 'weak';
  if (score === 3) return 'fair';
  if (score === 4 || score === 5) return 'strong';
  return 'very-strong';
}

const STRENGTH_CONFIG: Record<TPasswordStrength, { label: string; color: string; bars: number }> = {
  weak:        { label: 'Débil',          color: 'bg-red-500',    bars: 1 },
  fair:        { label: 'Regular',        color: 'bg-yellow-400', bars: 2 },
  strong:      { label: 'Fuerte',         color: 'bg-emerald-400',bars: 3 },
  'very-strong':{ label: 'Muy fuerte',    color: 'bg-emerald-600',bars: 4 },
};

// ── Validation ────────────────────────────────────────────────────────────────

const buildValidationSchema = (isEditing: boolean) => Yup.object({
  tipo: Yup.string()
    .oneOf(['oficina_central', 'consejo'], 'Tipo de usuario inválido')
    .required('El tipo de usuario es obligatorio'),
  consejo_tipo: Yup.string().when('tipo', {
    is: 'consejo',
    then: (schema) => schema
      .oneOf(['D', 'M'], 'Tipo de consejo inválido')
      .required('El tipo de consejo es obligatorio'),
    otherwise: (schema) => schema.notRequired(),
  }),
  consejo_clave: Yup.string().when('tipo', {
    is: 'consejo',
    then: (schema) => schema
      .required('El consejo es obligatorio')
      .min(1, 'El consejo es obligatorio'),
    otherwise: (schema) => schema.notRequired(),
  }),
  id_rol: Yup.number()
    .min(0, 'El rol es obligatorio')
    .required('El rol es obligatorio'),
  usuario: Yup.string()
    .required('El correo es obligatorio')
    .email('Ingresa un correo válido')
    .max(150, 'Máximo 150 caracteres'),
  celular: Yup.string().max(20, 'Máximo 20 caracteres').nullable(),
  paterno: Yup.string()
    .required('El apellido paterno es obligatorio')
    .max(80, 'Máximo 80 caracteres'),
  materno: Yup.string()
    .required('El apellido materno es obligatorio')
    .max(80, 'Máximo 80 caracteres'),
  nombre: Yup.string()
    .required('El nombre es obligatorio')
    .max(80, 'Máximo 80 caracteres'),
  password: Yup.string().when('tipo', {
    is: 'consejo',
    then: (schema) => {
      const base = schema
        .min(8, 'Mínimo 8 caracteres')
        .matches(/[A-Z]/, 'Debe contener al menos una mayúscula')
        .matches(/[a-z]/, 'Debe contener al menos una minúscula')
        .matches(/[0-9]/, 'Debe contener al menos un número')
        .matches(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial');
      return isEditing
        ? base // opcional al editar: solo valida si se ingresa algo
        : base.required('La contraseña es obligatoria');
    },
    otherwise: (schema) => schema.notRequired(),
  }),
});

// ── Props ─────────────────────────────────────────────────────────────────────

interface UsuarioFormProps {
  initialData?: IUsuario;
  roles: IRolOpcion[];
  consejos: IConsejo[];
  open: boolean;
  onOpenChange: (val: boolean) => void;
  onSuccess?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function UsuarioForm({
  initialData,
  roles,
  consejos,
  open,
  onOpenChange,
  onSuccess,
}: UsuarioFormProps) {
  const isEditing = !!initialData;
  const validationSchema = useMemo(() => buildValidationSchema(isEditing), [isEditing]);
  const createMutation = useCreateUsuario();
  const updateMutation = useUpdateUsuario();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const [showPassword, setShowPassword] = useState(false);

  const TIPOS_USUARIOS = [
    { id: 'oficina_central', nombre: 'Oficina Central' },
    { id: 'consejo', nombre: 'Consejo' },
  ];

  const ROLES_CONSEJO = ['CAPTURISTA','CAPTURISTA AVANZADO', 'CAPTURISTA ADMINISTRADOR'];


  const defaultValues: ICreateUsuarioInput = {
      tipo: initialData?.tipo ?? '',
    consejo_tipo: initialData?.consejo_tipo ?? '',
    consejo_clave: initialData?.consejo_clave != null ? String(initialData.consejo_clave) : '',
    id_rol: initialData?.id_rol ?? -1,
    usuario: initialData?.usuario ?? '',
    celular: initialData?.celular ?? '',
    paterno: initialData?.paterno ?? '',
    materno: initialData?.materno ?? '',
    nombre: initialData?.nombre ?? '',
    password: '',
  };

  async function handleSubmit(
    values: ICreateUsuarioInput,
    { resetForm }: { resetForm: () => void },
  ) {
    const payload: ICreateUsuarioInput = {
      ...values,
      consejo_tipo: values.tipo === 'consejo' ? values.consejo_tipo : undefined,
      consejo_clave: values.tipo === 'consejo' ? values.consejo_clave : undefined,
      password: values.tipo === 'consejo' && values.password ? values.password : undefined,
    };

    try {
      if (isEditing && initialData) {
        await updateMutation.mutateAsync({ idUsuario: initialData.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      resetForm();
      onSuccess?.();
    } catch {
      // El toast de error ya lo muestra onError de la mutación
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los datos del usuario y guarda los cambios.'
              : 'Completa los campos para registrar un nuevo usuario.'}
          </DialogDescription>
        </DialogHeader>

        <Formik
          initialValues={defaultValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ errors, touched, values, setFieldValue, isSubmitting }) => {
            const consejosFiltrados = consejos.filter(
              (c) => c.tipo_consejo === values.consejo_tipo,
            );
            const rolesDisponibles = values.tipo === 'consejo'
              ? roles.filter((r) => ROLES_CONSEJO.includes(r.rol.toUpperCase()))
              : roles;
            const pwdStrength = getPasswordStrength(values.password ?? '');
            const strengthCfg = STRENGTH_CONFIG[pwdStrength];

            return (
              <Form>
                <div className="max-h-[65vh] overflow-y-auto pr-3">
                <div className="space-y-3 py-2">

                  {/* Fila 1: Tipo de usuario + Rol */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Tipo de usuario <span className="text-red-600">*</span>
                      </label>
                      {isEditing ? (
                        <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                          {TIPOS_USUARIOS.find((t) => t.id === values.tipo)?.nombre ?? values.tipo}
                        </div>
                      ) : (
                        <Select
                          indicatorVisibility={false}
                          value={values.tipo}
                          onValueChange={(value) => {
                            setFieldValue('tipo', value);
                            setFieldValue('id_rol', -1);
                            if (value !== 'consejo') {
                              setFieldValue('consejo_tipo', '');
                              setFieldValue('consejo_clave', '');
                            }
                          }}
                          disabled={isSubmitting || isPending}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Tipo..." />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_USUARIOS.map((t) => (
                              <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {errors.tipo && touched.tipo && (
                        <p className="text-red-600 text-xs mt-1">{errors.tipo}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Rol <span className="text-xs text-gray-400">(accesos)</span> <span className="text-red-600">*</span>
                      </label>
                      <RolCombobox
                        roles={rolesDisponibles}
                        value={values.id_rol}
                        onChange={(id) => setFieldValue('id_rol', id)}
                        disabled={isSubmitting || isPending}
                      />
                      {errors.id_rol && touched.id_rol && (
                        <p className="text-red-600 text-xs mt-1">{errors.id_rol}</p>
                      )}
                    </div>
                  </div>

                  {/* Bloque consejo (solo tipo CONSEJO) */}
                  {values.tipo === 'consejo' && (
                    <>
                      {/* Fila 2: Tipo de consejo + Consejo */}
                      <div className="grid grid-cols-5 gap-3">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Tipo de consejo <span className="text-red-600">*</span>
                          </label>
                          <Select
                            indicatorVisibility={false}
                            value={values.consejo_tipo ?? ''}
                            onValueChange={(value) => {
                              setFieldValue('consejo_tipo', value);
                              setFieldValue('consejo_clave', '');
                            }}
                            disabled={isSubmitting || isPending}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="D / M..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="D">Distrital</SelectItem>
                              <SelectItem value="M">Municipal</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.consejo_tipo && touched.consejo_tipo && (
                            <p className="text-red-600 text-xs mt-1">{errors.consejo_tipo}</p>
                          )}
                        </div>

                        <div className="col-span-3">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Consejo <span className="text-red-600">*</span>
                          </label>
                          <Select
                            indicatorVisibility={false}
                            value={values.consejo_clave ?? ''}
                            onValueChange={(value) => setFieldValue('consejo_clave', value)}
                            disabled={isSubmitting || isPending || !values.consejo_tipo}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecciona..." />
                            </SelectTrigger>
                            <SelectContent>
                              {consejosFiltrados.map((c) => (
                                <SelectItem key={c.id_consejo} value={String(c.clave_consejo)}>{c.clave_consejo} - {c.consejo}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.consejo_clave && touched.consejo_clave && (
                            <p className="text-red-600 text-xs mt-1">{errors.consejo_clave}</p>
                          )}
                        </div>
                      </div>

                      {/* Fila 3: Contraseña */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Contraseña {!isEditing && <span className="text-red-600">*</span>}
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const pwd = generateSecurePassword();
                              setFieldValue('password', pwd);
                              setShowPassword(true);
                            }}
                            disabled={isSubmitting || isPending}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium disabled:opacity-50 transition-colors"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Generar
                          </button>
                        </div>
                        <div className="relative">
                          <Field name="password">
                            {({ field }: { field: { name: string; value: string; onChange: React.ChangeEventHandler; onBlur: React.FocusEventHandler } }) => (
                              <Input
                                {...field}
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Contraseña segura"
                                className="pr-20"
                                autoComplete="new-password"
                                disabled={isSubmitting || isPending}
                              />
                            )}
                          </Field>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-1 gap-0.5">
                            {values.password && (
                              <button
                                type="button"
                                title="Copiar contraseña"
                                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded"
                                onClick={() => navigator.clipboard.writeText(values.password ?? '')}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded"
                              onClick={() => setShowPassword((v) => !v)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        {values.password && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="flex gap-1 flex-1">
                              {[1, 2, 3, 4].map((bar) => (
                                <div
                                  key={bar}
                                  className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                                    bar <= strengthCfg.bars ? strengthCfg.color : 'bg-gray-200 dark:bg-gray-700'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">{strengthCfg.label}</span>
                          </div>
                        )}
                        {errors.password && touched.password && (
                          <p className="text-red-600 text-xs mt-1">{errors.password}</p>
                        )}
                      </div>
                    </>
                  )}

                  {/* Fila: Correo + Celular */}
                  <div className="grid grid-cols-5 gap-3">
                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Correo / Usuario <span className="text-red-600">*</span>
                      </label>
                      <Field name="usuario" as={Input} placeholder="correo@ejemplo.com" type="email" />
                      {errors.usuario && touched.usuario && (
                        <p className="text-red-600 text-xs mt-1">{errors.usuario}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Celular
                      </label>
                      <Field name="celular" as={Input} placeholder="5512345678" />
                      {errors.celular && touched.celular && (
                        <p className="text-danger text-xs mt-1">{errors.celular}</p>
                      )}
                    </div>
                  </div>

                  {/* Fila: Apellido Paterno + Apellido Materno */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Apellido Paterno <span className="text-red-600">*</span>
                      </label>
                      <Field name="paterno" as={Input} placeholder="Paterno" />
                      {errors.paterno && touched.paterno && (
                        <p className="text-red-600 text-xs mt-1">{errors.paterno}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Apellido Materno <span className="text-red-600">*</span>
                      </label>
                      <Field name="materno" as={Input} placeholder="Materno" />
                      {errors.materno && touched.materno && (
                        <p className="text-red-600 text-xs mt-1">{errors.materno}</p>
                      )}
                    </div>
                  </div>

                  {/* Fila: Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Nombre <span className="text-red-600">*</span>
                    </label>
                    <Field name="nombre" as={Input} placeholder="Nombre(s)" />
                    {errors.nombre && touched.nombre && (
                      <p className="text-red-600 text-xs mt-1">{errors.nombre}</p>
                    )}
                  </div>

                </div>
                </div>

                <DialogFooter className="pt-4 mt-2 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="dashed"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting || isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting || isPending}
                  >
                    {isSubmitting || isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        {isEditing ? 'Guardar cambios' : 'Crear usuario'}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </Form>
            );
          }}
        </Formik>
      </DialogContent>
    </Dialog>
  );
}

// ── Rol Combobox ──────────────────────────────────────────────────────────────

interface RolComboboxProps {
  roles: IRolOpcion[];
  value: number;
  onChange: (id: number) => void;
  disabled?: boolean;
}

function RolCombobox({ roles, value, onChange, disabled }: RolComboboxProps) {
  const [open, setOpen] = useState(false);

  const selected = roles.find((r) => r.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !selected && 'text-muted-foreground',
          )}
        >
          {selected ? selected.rol : 'Selecciona un rol...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar rol..." />
          <CommandList>
            <CommandEmpty>No se encontraron roles.</CommandEmpty>
            <CommandGroup>
              {roles.map((r) => (
                <CommandItem
                  key={r.id}
                  value={r.rol}
                  onSelect={() => {
                    onChange(r.id);
                    setOpen(false);
                  }}
                >
                  {r.rol}
                  {value === r.id && <CommandCheck className="ml-auto" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
