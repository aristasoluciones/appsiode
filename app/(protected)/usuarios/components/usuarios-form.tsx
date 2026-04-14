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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateUsuario, useUpdateUsuario } from './usuarios-data';
import type { IUsuario, ICreateUsuarioInput, IRolOpcion } from './usuarios-data';

// ── Validation ────────────────────────────────────────────────────────────────

const validationSchema = Yup.object({
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
});

// ── Props ─────────────────────────────────────────────────────────────────────

interface UsuarioFormProps {
  initialData?: IUsuario;
  roles: IRolOpcion[];
  open: boolean;
  onOpenChange: (val: boolean) => void;
  onSuccess?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function UsuarioForm({
  initialData,
  roles,
  open,
  onOpenChange,
  onSuccess,
}: UsuarioFormProps) {
  const isEditing = !!initialData;
  const createMutation = useCreateUsuario();
  const updateMutation = useUpdateUsuario();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const defaultValues: ICreateUsuarioInput = {
    id_rol: initialData?.id_rol ?? -1,
    usuario: initialData?.usuario ?? '',
    celular: initialData?.celular ?? '',
    paterno: initialData?.paterno ?? '',
    materno: initialData?.materno ?? '',
    nombre: initialData?.nombre ?? '',
  };

  async function handleSubmit(
    values: ICreateUsuarioInput,
    { resetForm }: { resetForm: () => void },
  ) {
    if (isEditing && initialData) {
      await updateMutation.mutateAsync({ idUsuario: initialData.id, data: values });
    } else {
      await createMutation.mutateAsync(values);
    }
    resetForm();
    onSuccess?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
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
          {({ errors, touched, values, setFieldValue, isSubmitting }) => (
            <Form className="space-y-4 py-2">
              {/* Rol */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Rol <span className="text-danger">*</span>
                </label>
                <RolCombobox
                  roles={roles}
                  value={values.id_rol}
                  onChange={(id) => setFieldValue('id_rol', id)}
                  disabled={isSubmitting || isPending}
                />
                {errors.id_rol && touched.id_rol && (
                  <p className="text-danger text-sm mt-1">{errors.id_rol}</p>
                )}
              </div>

              {/* Correo Electrónico / Usuario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Correo Electrónico / Usuario <span className="text-danger">*</span>
                </label>
                <Field
                  name="usuario"
                  as={Input}
                  placeholder="correo@ejemplo.com"
                  type="email"
                />
                {errors.usuario && touched.usuario && (
                  <p className="text-danger text-sm mt-1">{errors.usuario}</p>
                )}
              </div>

              {/* Celular */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Celular
                </label>
                <Field name="celular" as={Input} placeholder="Ej. 5512345678" />
                {errors.celular && touched.celular && (
                  <p className="text-danger text-sm mt-1">{errors.celular}</p>
                )}
              </div>

              {/* Apellidos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Apellido Paterno <span className="text-danger">*</span>
                  </label>
                  <Field name="paterno" as={Input} placeholder="Apellido paterno" />
                  {errors.paterno && touched.paterno && (
                    <p className="text-danger text-sm mt-1">{errors.paterno}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Apellido Materno <span className="text-danger">*</span>
                  </label>
                  <Field name="materno" as={Input} placeholder="Apellido materno" />
                  {errors.materno && touched.materno && (
                    <p className="text-danger text-sm mt-1">{errors.materno}</p>
                  )}
                </div>
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Nombre <span className="text-danger">*</span>
                </label>
                <Field name="nombre" as={Input} placeholder="Nombre(s)" />
                {errors.nombre && touched.nombre && (
                  <p className="text-danger text-sm mt-1">{errors.nombre}</p>
                )}
              </div>

              <DialogFooter className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="light"
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
          )}
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
