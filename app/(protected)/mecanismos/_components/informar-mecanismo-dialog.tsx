'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2, UserRoundSearch, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { ICae, IMecanismoLista } from '@/types/mecanismos';
import { formatFechaHora } from '@/lib/fechas';
import { useAuth } from '@/providers/auth-provider';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
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
import { ContadorCaracteres } from '@/components/common/contador-caracteres';
import { LeyendaObligatorios } from '@/components/common/leyenda-obligatorios';
import { useInformarMecanismo, useMecanismo } from '../_hooks/use-mecanismos';
import { claveMecanismo } from '../_lib/estatus';
import { MECANISMOS_LIMITES } from '../_lib/limites';
import { CaesDialog } from './caes-dialog';
import { HistorialMecanismo } from './historial-mecanismo';

/**
 * Mismos límites que la API, repetidos solo para avisar antes de enviar. El CAE
 * y el costo son obligatorios según las banderas del consejo, por eso el
 * esquema se arma con ellas.
 */
function crearInformeSchema(capturaCosto: boolean, asignaCae: boolean) {
  return z.object({
    cae_folio: z
      .string()
      .max(MECANISMOS_LIMITES.caeFolio.max)
      .refine((v) => !asignaCae || v !== '', {
        message: 'Elige el CAE que atiende el mecanismo.',
      }),
    cae_nombre: z.string(),
    costo: z
      .string()
      .trim()
      .refine((v) => !capturaCosto || v !== '', {
        message: 'Captura el costo estimado.',
      })
      .refine(
        (v) =>
          v === '' ||
          (!Number.isNaN(Number(v)) &&
            Number(v) >= MECANISMOS_LIMITES.costo.min &&
            Number(v) <= MECANISMOS_LIMITES.costo.max),
        {
          message: `El costo debe estar entre 0 y ${MECANISMOS_LIMITES.costo.max.toLocaleString('es-MX')}.`,
        },
      ),
    observaciones: z
      .string()
      .trim()
      .min(1, { message: 'Captura las observaciones del informe.' })
      .max(MECANISMOS_LIMITES.observaciones.max, {
        message: `Las observaciones no deben exceder ${MECANISMOS_LIMITES.observaciones.max} caracteres.`,
      }),
  });
}

type TInformeForm = z.infer<ReturnType<typeof crearInformeSchema>>;

interface InformarMecanismoDialogProps {
  mecanismo: IMecanismoLista | null;
  /** Banderas efectivas del consejo: deciden qué campos se piden. */
  capturaCosto: boolean;
  asignaCae: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Informe del consejo sobre el mecanismo que revisa. El CAE no se escribe:
 * se elige de la lista de activos y queda en solo lectura, con el historial
 * de cambios a la vista.
 */
export function InformarMecanismoDialog({
  mecanismo,
  capturaCosto,
  asignaCae,
  open,
  onOpenChange,
}: InformarMecanismoDialogProps) {
  const { user } = useAuth();
  const informar = useInformarMecanismo();
  const [selectorAbierto, setSelectorAbierto] = useState(false);

  // El detalle trae el historial del informe; solo se pide con la ventana abierta.
  const { data: detalle } = useMecanismo(open ? (mecanismo?.id ?? null) : null);

  const form = useForm<TInformeForm>({
    resolver: zodResolver(crearInformeSchema(capturaCosto, asignaCae)),
    mode: 'onSubmit',
    defaultValues: {
      cae_folio: '',
      cae_nombre: '',
      costo: '',
      observaciones: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      cae_folio: mecanismo?.cae_folio ?? '',
      cae_nombre: mecanismo?.cae_nombre ?? '',
      costo:
        mecanismo?.costo_estimado != null
          ? String(mecanismo.costo_estimado)
          : '',
      observaciones: mecanismo?.observaciones_informe ?? '',
    });
  }, [open, mecanismo, form]);

  if (!mecanismo) return null;

  const guardando = informar.isPending;
  const caeFolio = form.watch('cae_folio');
  const caeNombre = form.watch('cae_nombre');

  function elegirCae(cae: ICae) {
    form.setValue('cae_folio', cae.folio, { shouldDirty: true });
    form.setValue('cae_nombre', cae.nombre_completo, { shouldDirty: true });
    setSelectorAbierto(false);
  }

  function guardar(valores: TInformeForm) {
    informar.mutate(
      {
        id: mecanismo!.id,
        payload: {
          cae_folio: asignaCae && valores.cae_folio ? valores.cae_folio : null,
          costo:
            capturaCosto && valores.costo !== '' ? Number(valores.costo) : null,
          observaciones: valores.observaciones,
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !guardando && onOpenChange(v)}>
      <DialogContent
        className="sm:max-w-2xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Informe del mecanismo</DialogTitle>
          <DialogDescription>
            {claveMecanismo(mecanismo)}.{' '}
            {mecanismo.informado
              ? `Informado el ${formatFechaHora(mecanismo.fecha_informe)}. Cada cambio queda en el historial.`
              : 'Captura lo que el consejo informa sobre este mecanismo.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-5">
          {mecanismo.cae_activo === false && (
            <Alert variant="warning" appearance="light" close={false}>
              <AlertIcon>
                <AlertCircle />
              </AlertIcon>
              <AlertTitle>
                El CAE asignado ({mecanismo.cae_folio}) ya no está activo en el
                catálogo. Puedes conservarlo o cambiarlo por uno activo.
              </AlertTitle>
            </Alert>
          )}

          <Form {...form}>
            <form
              id="informe-form"
              onSubmit={form.handleSubmit(guardar)}
              className="space-y-4"
            >
              {asignaCae && (
                <FormField
                  control={form.control}
                  name="cae_folio"
                  render={() => (
                    <FormItem>
                      <FormLabel>
                        CAE que atiende el mecanismo{' '}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <div className="flex flex-wrap items-center gap-2">
                        <FormControl>
                          <Input
                            readOnly
                            value={caeFolio ? `${caeFolio} · ${caeNombre}` : ''}
                            placeholder="Sin CAE asignado"
                            className="flex-1 min-w-56 bg-muted/40"
                            aria-label="CAE asignado"
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setSelectorAbierto(true)}
                          disabled={guardando}
                        >
                          <UserRoundSearch
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                          {caeFolio ? 'Cambiar' : 'Elegir CAE'}
                        </Button>
                        {caeFolio && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Quitar el CAE"
                            disabled={guardando}
                            onClick={() => {
                              form.setValue('cae_folio', '', {
                                shouldDirty: true,
                              });
                              form.setValue('cae_nombre', '', {
                                shouldDirty: true,
                              });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <FormDescription>
                        Se elige de la lista de CAE activos del consejo; no se
                        captura a mano.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {capturaCosto && (
                <FormField
                  control={form.control}
                  name="costo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Costo estimado (MXN){' '}
                        <span className="text-destructive">*</span>
                      </FormLabel>
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
                        placeholder="Ruta, condiciones del traslado, acuerdos con el CAE..."
                        disabled={guardando}
                      />
                    </FormControl>
                    <ContadorCaracteres
                      valor={field.value}
                      max={MECANISMOS_LIMITES.observaciones.max}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <LeyendaObligatorios />
            </form>
          </Form>

          <HistorialMecanismo
            historial={detalle?.historial?.filter(
              (h) => h.entidad !== 'MECANISMO',
            )}
            titulo="Historial del informe"
            vacio="Todavía no hay cambios registrados en el informe."
          />
        </DialogBody>

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
            form="informe-form"
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

      {asignaCae && user && (
        <CaesDialog
          open={selectorAbierto}
          onOpenChange={setSelectorAbierto}
          tipoConsejo={user.tipoConsejo as 'D' | 'M'}
          idConsejo={Number(user.idConsejo)}
          onSeleccionar={elegirCae}
          folioActual={caeFolio || null}
        />
      )}
    </Dialog>
  );
}
