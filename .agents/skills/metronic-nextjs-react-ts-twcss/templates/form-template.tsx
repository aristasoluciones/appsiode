// ============================================================
// TEMPLATE: app/(protected)/[module-name]/components/[module-name]-form.tsx
// Create / Edit form component
//
// Replace all [Bracketed] placeholders before use:
//   [ModuleName]  → e.g. Sesion (singular PascalCase)
//   [module-name] → e.g. sesion
// ============================================================
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
import { useCreate[ModuleName], useUpdate[ModuleName] } from './[module-name]-data';
import type { I[ModuleName], ICreate[ModuleName]Input } from './[module-name]-data';

// ── Validation Schema ─────────────────────────────────────────────────────────

const validationSchema = Yup.object({
  // TODO: define your validation rules
  // nombre: Yup.string()
  //   .required('El nombre es obligatorio')
  //   .min(3, 'Mínimo 3 caracteres'),
  // fecha: Yup.string().required('La fecha es obligatoria'),
});

// ── Types ─────────────────────────────────────────────────────────────────────

interface [ModuleName]FormValues {
  // TODO: match ICreate[ModuleName]Input shape
  // nombre: string;
  // fecha: string;
}

interface [ModuleName]FormProps {
  /** When provided, the form works in edit mode */
  initialData?: I[ModuleName];
  open: boolean;
  onOpenChange: (val: boolean) => void;
  onSuccess?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function [ModuleName]Form({
  initialData,
  open,
  onOpenChange,
  onSuccess,
}: [ModuleName]FormProps) {
  const isEditing = !!initialData;

  const createMutation = useCreate[ModuleName]();
  const updateMutation = useUpdate[ModuleName]();

  const isPending = createMutation.isPending || updateMutation.isPending;

  // ── Default values ────────────────────────────────────────
  const defaultValues: [ModuleName]FormValues = {
    // TODO: map initialData fields or set empty defaults
    // nombre: initialData?.nombre ?? '',
    // fecha:  initialData?.fecha  ?? '',
  };

  // ── Submit handler ────────────────────────────────────────
  async function handleSubmit(
    values: [ModuleName]FormValues,
    { resetForm }: { resetForm: () => void },
  ) {
    if (isEditing && initialData) {
      await updateMutation.mutateAsync({ id: initialData.id, data: values });
    } else {
      await createMutation.mutateAsync(values as ICreate[ModuleName]Input);
    }
    resetForm();
    onSuccess?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar [ModuleName]' : 'Nuevo [ModuleName]'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los datos y guarda los cambios.'
              : 'Completa los campos para crear un nuevo registro.'}
          </DialogDescription>
        </DialogHeader>

        <Formik
          initialValues={defaultValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ errors, touched, isSubmitting }) => (
            <Form className="space-y-5 py-2">

              {/* ── TODO: Add form fields ───────────────────── */}
              {/* Example — text field:
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Nombre *
                </label>
                <Field name="nombre" as={Input} placeholder="Ingresa el nombre" />
                {errors.nombre && touched.nombre && (
                  <p className="text-danger text-sm mt-1">{errors.nombre}</p>
                )}
              </div>
              */}

              {/* Example — select field:
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Estado *
                </label>
                <Field name="estado" as="select" className="form-select w-full">
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </Field>
                {errors.estado && touched.estado && (
                  <p className="text-danger text-sm mt-1">{errors.estado}</p>
                )}
              </div>
              */}

              {/* ── Form Actions ────────────────────────────── */}
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
                      {isEditing ? 'Guardar cambios' : 'Crear'}
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
