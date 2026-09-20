'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { ICedulaConsejo } from '@/types/mecanismos';
import { formatMoneda } from '@/lib/helpers';
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
import { Textarea } from '@/components/ui/textarea';
import { useInformarCedula } from '../_hooks/use-cedulas';
import { claveMecanismo } from '../_lib/estatus';
import { MECANISMOS_LIMITES } from '../_lib/limites';

/** Mismos límites que la API, repetidos solo para avisar antes de enviar. */
const informeSchema = z.object({
  costo_cotizado: z
    .string()
    .trim()
    .refine(
      (v) =>
        v === '' ||
        (!Number.isNaN(Number(v)) &&
          Number(v) >= MECANISMOS_LIMITES.costo.min &&
          Number(v) <= MECANISMOS_LIMITES.costo.max),
      { message: 'El costo debe estar entre 0 y 9,999,999.99.' },
    ),
  observaciones: z
    .string()
    .trim()
    .min(1, { message: 'Captura las observaciones del consejo.' })
    .max(MECANISMOS_LIMITES.observaciones.max, {
      message: `Las observaciones no deben exceder ${MECANISMOS_LIMITES.observaciones.max} caracteres.`,
    }),
});

type TInformeForm = z.infer<typeof informeSchema>;

interface InformarCedulaDialogProps {
  cedula: ICedulaConsejo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** El consejo informa la cédula propuesta: costo cotizado (si su configuración lo pide) y observaciones. */
export function InformarCedulaDialog({
  cedula,
  open,
  onOpenChange,
}: InformarCedulaDialogProps) {
  const informar = useInformarCedula();

  const form = useForm<TInformeForm>({
    resolver: zodResolver(informeSchema),
    mode: 'onSubmit',
    defaultValues: { costo_cotizado: '', observaciones: '' },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      costo_cotizado:
        cedula?.costo_cotizado != null ? String(cedula.costo_cotizado) : '',
      observaciones: cedula?.observaciones_cedula ?? '',
    });
  }, [open, cedula, form]);

  if (!cedula) return null;

  const guardando = informar.isPending;

  function guardar(valores: TInformeForm) {
    informar.mutate(
      {
        id: cedula!.id,
        payload: {
          costo_cotizado:
            cedula!.captura_costo && valores.costo_cotizado !== ''
              ? Number(valores.costo_cotizado)
              : null,
          observaciones: valores.observaciones,
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !guardando && onOpenChange(v)}>
      <DialogContent
        className="sm:max-w-lg"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Informar cédula · {claveMecanismo(cedula)}</DialogTitle>
          <DialogDescription>
            Costo INE propuesto: {formatMoneda(cedula.costo_ine)}.{' '}
            {cedula.estatus === 'INFORMADA'
              ? 'Ya informaste esta cédula; puedes corregir lo capturado.'
              : 'Revisa el PDF propuesto y captura lo que el consejo informa.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id="informe-cedula-form"
            onSubmit={form.handleSubmit(guardar)}
            className="space-y-4"
          >
            {cedula.captura_costo && (
              <FormField
                control={form.control}
                name="costo_cotizado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo cotizado (MXN)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        inputMode="decimal"
                        min={MECANISMOS_LIMITES.costo.min}
                        max={MECANISMOS_LIMITES.costo.max}
                        step="0.01"
                        placeholder="0.00"
                        disabled={guardando}
                        className="max-w-56"
                      />
                    </FormControl>
                    <FormDescription>
                      Lo que cotizó el consejo; la diferencia contra el costo
                      INE se calcula sola.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Observaciones <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      maxLength={MECANISMOS_LIMITES.observaciones.max}
                      placeholder="Cotización, proveedor, condiciones del traslado..."
                      disabled={guardando}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={guardando}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="informe-cedula-form"
            disabled={guardando}
            aria-busy={guardando}
          >
            {guardando && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            Guardar informe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
