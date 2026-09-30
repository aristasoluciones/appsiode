'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { IMecanismoLista, TObservacionTipo } from '@/types/mecanismos';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ContadorCaracteres } from '@/components/common/contador-caracteres';
import { LeyendaObligatorios } from '@/components/common/leyenda-obligatorios';
import {
  useInformarMecanismo,
  useMecanismo,
  useObservacionesTipos,
} from '../_hooks/use-mecanismos';
import {
  AYUDA_TIPO_OBSERVACION,
  claveMecanismo,
  TIPO_SIN_OBSERVACIONES,
} from '../_lib/estatus';
import {
  crearInformeSchema,
  informeAPayload,
  informeInicial,
  type TInformeForm,
} from '../_lib/informe-form';
import { MECANISMOS_LIMITES } from '../_lib/limites';
import {
  InformarCheckCampo,
  InformeCaeCampo,
  InformeCostoCampo,
} from './informe-campos';
import { ObservacionesLista } from './observaciones-lista';

interface InformarMecanismoDialogProps {
  mecanismo: IMecanismoLista | null;
  /** Banderas efectivas del consejo: deciden qué se pide al informar. */
  capturaCosto: boolean;
  asignaCae: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Informe del consejo sobre el mecanismo que revisa. Cada guardado agrega una
 * observación tipificada, tantas como el consejo considere; con cualquier tipo
 * puede marcar «Informar», que pide costo y CAE según la configuración del
 * consejo y deja el mecanismo en Informado. No se abre sin cédula ni con el
 * mecanismo ya informado: lo registrado se consulta en el detalle.
 */
export function InformarMecanismoDialog({
  mecanismo,
  capturaCosto,
  asignaCae,
  open,
  onOpenChange,
}: InformarMecanismoDialogProps) {
  const informar = useInformarMecanismo();
  const { data: tipos, isLoading: cargandoTipos } = useObservacionesTipos(open);
  // El detalle trae las observaciones previas; solo se pide con la ventana abierta.
  const { data: detalle } = useMecanismo(open ? (mecanismo?.id ?? null) : null);

  const form = useForm<TInformeForm>({
    resolver: zodResolver(crearInformeSchema(capturaCosto, asignaCae)),
    mode: 'onSubmit',
    defaultValues: informeInicial(null),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(informeInicial(mecanismo));
  }, [open, mecanismo, form]);

  if (!mecanismo) return null;

  const guardando = informar.isPending;
  const tipo = form.watch('tipo_observacion');
  const marcaInformar = form.watch('informar');
  const sinObservaciones = tipo === TIPO_SIN_OBSERVACIONES;
  const ayuda = AYUDA_TIPO_OBSERVACION[tipo as TObservacionTipo];
  const observaciones = detalle?.consejos.find(
    (c) => c.revisa_mecanismo,
  )?.observaciones;

  function cambiarTipo(valor: string) {
    form.setValue('tipo_observacion', valor, { shouldDirty: true });
    form.clearErrors('observaciones');
  }

  function guardar(valores: TInformeForm) {
    informar.mutate(
      {
        id: mecanismo!.id,
        payload: informeAPayload(valores, capturaCosto, asignaCae),
      },
      {
        // Una observación deja la ventana abierta y limpia para la siguiente; informar la cierra.
        onSuccess: () =>
          valores.informar
            ? onOpenChange(false)
            : form.reset(informeInicial(mecanismo)),
      },
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
            {claveMecanismo(mecanismo)}. Registra tantas observaciones como
            consideres, una por guardado. Si deseas informar el mecanismo,
            habilita el check «Informar el mecanismo».
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
              <FormField
                control={form.control}
                name="tipo_observacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tipo de observación{' '}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      indicatorVisibility={false}
                      value={field.value}
                      onValueChange={cambiarTipo}
                      disabled={guardando || cargandoTipos}
                    >
                      <FormControl>
                        <SelectTrigger aria-label="Tipo de observación">
                          <SelectValue
                            placeholder={
                              cargandoTipos ? 'Cargando...' : 'Elige el tipo'
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(tipos ?? []).map((t) => (
                          <SelectItem key={t.clave} value={t.clave}>
                            {t.descripcion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {ayuda && <FormDescription>{ayuda}</FormDescription>}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Observaciones{' '}
                      {!sinObservaciones && (
                        <span className="text-destructive">*</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={4}
                        maxLength={MECANISMOS_LIMITES.observaciones.max}
                        placeholder={
                          sinObservaciones
                            ? 'Opcional: algún comentario para el registro.'
                            : 'Describe la observación de este tipo.'
                        }
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

              <InformarCheckCampo form={form} disabled={guardando} />

              {marcaInformar && asignaCae && (
                <InformeCaeCampo form={form} disabled={guardando} />
              )}
              {marcaInformar && capturaCosto && (
                <InformeCostoCampo form={form} disabled={guardando} />
              )}
              <LeyendaObligatorios />
            </form>
          </Form>

          <ObservacionesLista observaciones={observaciones} />
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
            {marcaInformar ? 'Informar mecanismo' : 'Guardar observación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
