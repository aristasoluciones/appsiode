'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { TObservacionTipo } from '@/types/mecanismos';
import { formatFechaHora } from '@/lib/fechas';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Textarea } from '@/components/ui/textarea';
import { ContadorCaracteres } from '@/components/common/contador-caracteres';
import { LeyendaObligatorios } from '@/components/common/leyenda-obligatorios';
import { useEstudio, useRevisarEstudio } from '../_hooks/use-estudios';
import { useObservacionesTipos } from '../_hooks/use-mecanismos';
import {
  AYUDA_TIPO_OBSERVACION,
  TIPO_OTRO,
  TIPO_SIN_OBSERVACIONES,
} from '../_lib/estatus';
import {
  crearInformeSchema,
  informeInicial,
  type TInformeForm,
} from '../_lib/informe-form';
import { MECANISMOS_LIMITES } from '../_lib/limites';
import { HistorialMecanismo } from './historial-mecanismo';
import { ObservacionesLista } from './observaciones-lista';

// La revisión del estudio no pide costo ni CAE: el esquema del informe sin esas banderas.
const esquema = crearInformeSchema(false, false);

interface RevisionEstudioPanelProps {
  /** Estudio a revisar. */
  objetivo: { id: number; idDf: number; df: string };
  onCerrar: () => void;
}

/**
 * Revisión del consejo en línea, bajo la tabla y junto al PDF (sin ventana que
 * lo tape): cada guardado agrega una observación tipificada y el formulario
 * sigue abierto; «Marcar como revisado» lo cierra y deja al consejo Revisado.
 * Debajo, sus observaciones y el historial del estudio.
 */
export function RevisionEstudioPanel({
  objetivo,
  onCerrar,
}: RevisionEstudioPanelProps) {
  const revisar = useRevisarEstudio();
  const { data: tipos, isLoading: cargandoTipos } = useObservacionesTipos(true);
  // El consejo ve solo su renglón en el detalle: ahí vienen sus observaciones.
  const { data: detalle } = useEstudio(objetivo.id);

  const form = useForm<TInformeForm>({
    resolver: zodResolver(esquema),
    mode: 'onSubmit',
    defaultValues: informeInicial(null),
  });

  const guardando = revisar.isPending;
  const tipo = form.watch('tipo_observacion');
  const marcaRevisado = form.watch('informar');
  const sinObservaciones = tipo === TIPO_SIN_OBSERVACIONES;
  const ayuda = AYUDA_TIPO_OBSERVACION[tipo as TObservacionTipo];
  const propio = detalle?.consejos[0];
  const observaciones = propio?.observaciones;
  // Ya revisado no admite más observaciones: en lugar del formulario, el aviso.
  const revisado = propio?.estatus_revision === 'REVISADO';

  function cambiarTipo(valor: string) {
    form.setValue('tipo_observacion', valor, { shouldDirty: true });
    if (valor !== TIPO_OTRO) form.setValue('tipo_otro', '');
    if (valor === TIPO_SIN_OBSERVACIONES) form.setValue('observaciones', '');
    form.clearErrors(['observaciones', 'tipo_otro']);
  }

  function guardar(v: TInformeForm) {
    revisar.mutate(
      {
        id: objetivo.id,
        payload: {
          tipo_observacion: v.tipo_observacion as TObservacionTipo,
          tipo_otro:
            v.tipo_observacion === TIPO_OTRO && v.tipo_otro !== ''
              ? v.tipo_otro
              : null,
          observaciones: v.observaciones === '' ? null : v.observaciones,
          revisar: v.informar,
        },
      },
      {
        // El panel no se cierra al guardar: solo el usuario lo cierra. Marcar revisado cambia el formulario por el aviso.
        onSuccess: () => form.reset(informeInicial(null)),
      },
    );
  }

  return (
    <section
      className="flex flex-col rounded-lg border border-primary/40 bg-card overflow-hidden xl:max-h-[calc(100vh-var(--header-height,70px)-2rem)]"
      aria-label={`Revisión del estudio · ${objetivo.df}`}
    >
      <header className="flex items-start justify-between gap-2 px-4 py-3 border-b border-border bg-primary/5 shrink-0">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Distrito federal {objetivo.idDf} · Revisión del estudio
          </p>
          <h3 className="text-sm font-semibold text-foreground mt-0.5">
            {objetivo.df}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Registra tantas observaciones como consideres, una por guardado.
            Cuando termines, habilita «Marcar como revisado».
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCerrar}
          disabled={guardando}
          aria-label="Volver a la tabla"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5">
        {revisado ? (
          <Alert variant="success" appearance="light" close={false}>
            <AlertIcon>
              <CheckCircle2 />
            </AlertIcon>
            <AlertTitle>
              Tu consejo ya marcó este estudio como revisado
              {propio?.fecha_revision
                ? ` el ${formatFechaHora(propio.fecha_revision)}`
                : ''}
              . Para corregirlo, oficina central debe revocar la revisión.
            </AlertTitle>
          </Alert>
        ) : (
          <>
            <Form {...form}>
              <form
                id="revision-estudio-form"
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

                {tipo === TIPO_OTRO && (
                  <FormField
                    control={form.control}
                    name="tipo_otro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Especifica el tipo{' '}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            maxLength={MECANISMOS_LIMITES.tipoOtro.max}
                            placeholder="Por ejemplo: Horario de traslado"
                            disabled={guardando}
                          />
                        </FormControl>
                        <ContadorCaracteres
                          valor={field.value}
                          max={MECANISMOS_LIMITES.tipoOtro.max}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* «Sin observaciones» no lleva texto: la caja se oculta. */}
                {!sinObservaciones && (
                  <FormField
                    control={form.control}
                    name="observaciones"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Observaciones{' '}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={4}
                            maxLength={MECANISMOS_LIMITES.observaciones.max}
                            placeholder="Describe la observación de este tipo."
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
                )}

                <FormField
                  control={form.control}
                  name="informar"
                  render={({ field }) => (
                    <FormItem className="rounded-md border border-primary/40 bg-primary/5 p-3">
                      <div className="flex items-start gap-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(v) => field.onChange(v === true)}
                            disabled={guardando}
                            className="border-primary"
                            aria-label="Marcar como revisado"
                          />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="cursor-pointer">
                            Marcar como revisado
                          </FormLabel>
                          <FormDescription>
                            Habilítalo si deseas dar por revisado el estudio: se
                            guarda esta observación y tu consejo pasa a
                            Revisado. Después queda cerrado: para corregirlo,
                            oficina central debe revocar la revisión.
                          </FormDescription>
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
                <LeyendaObligatorios />
              </form>
            </Form>

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCerrar}
                disabled={guardando}
              >
                Cerrar
              </Button>
              <Button
                type="submit"
                form="revision-estudio-form"
                disabled={guardando}
                aria-busy={guardando}
              >
                {guardando && (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                {marcaRevisado ? 'Marcar como revisado' : 'Guardar observación'}
              </Button>
            </div>
          </>
        )}

        <ObservacionesLista
          observaciones={observaciones}
          colapsable
          sinScroll
        />
        <HistorialMecanismo
          historial={detalle?.historial}
          titulo="Historial del estudio"
          sinScroll
        />
      </div>
    </section>
  );
}
