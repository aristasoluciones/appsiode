'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  MODOS_PROCESO,
  TIPOS_PROCESO,
  useCreateProceso,
  useUpdateProceso,
} from './procesos-data';
import type { IProcesoCatalogo, IProcesoPayload } from './procesos-data';
import type { TModoProceso, TTipoProceso } from '@/types/proceso';

// ── Validación ────────────────────────────────────────────────────────────────

function esUrlValida(valor: string): boolean {
  try {
    const url = new URL(valor.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

const procesoSchema = z.object({
  tipo: z
    .string()
    .refine((v) => v === 'ORDINARIO' || v === 'EXTRAORDINARIO', {
      message: 'Selecciona el tipo de proceso.',
    }),
  anio: z
    .string()
    .trim()
    .min(1, { message: 'El año del proceso es obligatorio.' })
    .refine((v) => /^\d{4}$/.test(v), { message: 'Captura un año de cuatro dígitos.' })
    .refine((v) => Number(v) >= 2000 && Number(v) <= 2100, {
      message: 'El año debe estar entre 2000 y 2100.',
    }),
  modo: z.string().refine((v) => v === 'PROD' || v === 'SIMULACRO', {
    message: 'Selecciona el modo de operación.',
  }),
  rpp_api_base: z
    .string()
    .trim()
    .min(1, { message: 'El enlace al sistema RPP es obligatorio.' })
    .refine(esUrlValida, {
      message: 'Captura una dirección web válida que inicie con http o https.',
    }),
  sice_api_base: z
    .string()
    .trim()
    .min(1, { message: 'El enlace al sistema SICE es obligatorio.' })
    .refine(esUrlValida, {
      message: 'Captura una dirección web válida que inicie con http o https.',
    }),
  consejo_distrital: z.boolean(),
  consejo_municipal: z.boolean(),
});

type ProcesoFormValues = z.infer<typeof procesoSchema>;

/**
 * Los interruptores de consejos nacen apagados y solo cambian cuando el usuario
 * los toca: nunca se suponen a partir de otro dato. Al editar se muestran tal
 * como quedaron guardados.
 */
function valoresIniciales(proceso?: IProcesoCatalogo): ProcesoFormValues {
  return {
    tipo: proceso?.tipo ?? '',
    anio: proceso?.anio != null ? String(proceso.anio) : '',
    modo: proceso?.modo ?? '',
    rpp_api_base: proceso?.configuracion?.rpp_api_base ?? '',
    sice_api_base: proceso?.configuracion?.sice_api_base ?? '',
    consejo_distrital: proceso?.consejo_distrital ?? false,
    consejo_municipal: proceso?.consejo_municipal ?? false,
  };
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ProcesoFormProps {
  initialData?: IProcesoCatalogo;
  open: boolean;
  onOpenChange: (val: boolean) => void;
  onSuccess?: () => void;
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function ProcesoForm({
  initialData,
  open,
  onOpenChange,
  onSuccess,
}: ProcesoFormProps) {
  const isEditing = !!initialData;
  const createMutation = useCreateProceso();
  const updateMutation = useUpdateProceso();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<ProcesoFormValues>({
    resolver: zodResolver(procesoSchema),
    defaultValues: valoresIniciales(initialData),
  });

  // Al abrir el diálogo, cargar los datos del proceso elegido (o limpiar en alta).
  useEffect(() => {
    if (open) form.reset(valoresIniciales(initialData));
  }, [open, initialData, form]);

  const hayErrores = Object.keys(form.formState.errors).length > 0;

  async function onSubmit(values: ProcesoFormValues) {
    const payload: IProcesoPayload = {
      tipo: values.tipo as TTipoProceso,
      anio: Number(values.anio),
      modo: values.modo as TModoProceso,
      consejo_distrital: values.consejo_distrital,
      consejo_municipal: values.consejo_municipal,
      configuracion: {
        rpp_api_base: values.rpp_api_base.trim(),
        sice_api_base: values.sice_api_base.trim(),
      },
    };

    try {
      if (isEditing && initialData) {
        await updateMutation.mutateAsync({ idProceso: initialData.id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onSuccess?.();
    } catch {
      // El mensaje del API ya se muestra en un toast; el formulario conserva lo capturado.
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
          <DialogTitle>
            {isEditing ? 'Editar proceso electoral' : 'Nuevo proceso electoral'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los datos del proceso y sus enlaces a los sistemas externos.'
              : 'Captura los datos del proceso y sus enlaces a los sistemas externos.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="max-h-[65vh] overflow-y-auto pr-3">
              <div className="space-y-4 py-2">
                {hayErrores && (
                  <Alert variant="destructive" appearance="light">
                    <AlertIcon>
                      <AlertCircle />
                    </AlertIcon>
                    <AlertTitle>
                      Revisa los campos marcados: falta información o quedó mal
                      capturada.
                    </AlertTitle>
                  </Alert>
                )}

                {/* Tipo + Modo de operación */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Tipo de proceso <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select
                          indicatorVisibility={false}
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isPending}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecciona..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TIPOS_PROCESO.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="modo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Modo de operación <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select
                          indicatorVisibility={false}
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isPending}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecciona..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MODOS_PROCESO.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Año */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="anio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Año <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            inputMode="numeric"
                            placeholder="2027"
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>

                {/* Enlaces a sistemas externos */}
                <FormField
                  control={form.control}
                  name="rpp_api_base"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Enlace al sistema RPP{' '}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://representantes.ejemplo.org.mx"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormDescription>
                        De aquí se consultan las representaciones de partidos políticos.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sice_api_base"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Enlace al sistema SICE{' '}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://sice.ejemplo.org.mx"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormDescription>
                        De aquí se consulta la integración de las consejerías electorales.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Consejos que incluye el proceso */}
                <div className="rounded-lg border border-border p-4 space-y-3">
                  <p className="text-sm font-medium">Consejos que incluye el proceso</p>
                  <p className="text-xs text-muted-foreground">
                    De estos indicadores depende qué consejos existen en todo el sistema.
                    Actívalos solo si el proceso realmente los contempla.
                  </p>

                  <FormField
                    control={form.control}
                    name="consejo_distrital"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between gap-4 space-y-0">
                        <FormLabel className="font-normal">
                          Consejos distritales
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isPending}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="consejo_municipal"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between gap-4 space-y-0">
                        <FormLabel className="font-normal">
                          Consejos municipales
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isPending}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 mt-2 border-t border-border">
              <Button
                type="button"
                variant="dashed"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={isPending}>
                {isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    {isEditing ? 'Guardar cambios' : 'Registrar proceso'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
