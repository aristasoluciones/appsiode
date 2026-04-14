'use client';

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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useCreateRol, useUpdateRol } from './roles-data';
import type { IRol, ICreateRolInput } from './roles-data';

// ── Validation ────────────────────────────────────────────────────────────────

const validationSchema = Yup.object({
  rol: Yup.string()
    .required('El nombre es obligatorio')
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres'),
});

// ── Props ─────────────────────────────────────────────────────────────────────

interface RolFormProps {
  initialData?: IRol;
  open: boolean;
  onOpenChange: (val: boolean) => void;
  onSuccess?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RolForm({ initialData, open, onOpenChange, onSuccess }: RolFormProps) {
  const isEditing = !!initialData;
  const createMutation = useCreateRol();
  const updateMutation = useUpdateRol();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const defaultValues: ICreateRolInput = {
    rol: initialData?.rol ?? ''
  };

  async function handleSubmit(
    values: ICreateRolInput,
    { resetForm }: { resetForm: () => void },
  ) {
    if (isEditing && initialData) {
      await updateMutation.mutateAsync({ idRol: initialData.id, data: values });
    } else {
      await createMutation.mutateAsync(values);
    }
    resetForm();
    onSuccess?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Rol' : 'Nuevo Rol'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los datos del rol y guarda los cambios.'
              : 'Completa los campos para crear un nuevo rol.'}
          </DialogDescription>
        </DialogHeader>

        <Formik
          initialValues={defaultValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ errors, touched, isSubmitting }) => (
            <Form className="space-y-4 py-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Nombre <span className="text-danger">*</span>
                </label>
                <Field name="rol" as={Input} placeholder="Ej. Administrador" />
                {errors.rol && touched.rol && (
                  <p className="text-danger text-sm mt-1">{errors.rol}</p>
                )}
              </div>

              <DialogFooter className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting || isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting || isPending}>
                  {isSubmitting || isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {isEditing ? 'Guardar cambios' : 'Crear rol'}
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
