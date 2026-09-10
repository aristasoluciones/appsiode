'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  Check,
  EyeOff,
  ImageIcon,
  Loader2,
  Package,
  Undo2,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type {
  IComprobacionDocumento,
  TEstatusComprobacion,
} from '@/types/material-electoral';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
import { useCapturarComprobacion } from '../_hooks/use-comprobaciones';
import { enPaquetesCajas } from './comprobacion-cantidades';
import { ESTATUS_COMPROBACION } from './comprobacion-estatus';
import { FotoZoom } from './foto-zoom';

/** Llave en el navegador de la preferencia de mostrar la fotografía al capturar. */
const FOTO_PREF = 'siode.comprobaciones.captura.foto';

/**
 * La cantidad debe ser de cero o más y las observaciones son obligatorias
 * cuando no coincide con la entregada. Son las mismas reglas que aplica la API,
 * repetidas aquí solo para avisar antes de enviar.
 */
const capturaSchema = z
  .object({
    cantidad_fisica: z
      .string()
      .trim()
      .min(1, { message: 'Captura la cantidad física.' })
      .refine((v) => /^\d+$/.test(v), {
        message: 'La cantidad debe ser un número entero de cero o más.',
      })
      .refine((v) => Number(v) <= 9999999, {
        message: 'La cantidad capturada es demasiado grande.',
      }),
    observaciones: z.string().trim().max(1000, {
      message: 'Las observaciones no deben superar 1000 caracteres.',
    }),
    cantidad_entregada: z.number(),
  })
  .refine(
    (v) =>
      !/^\d+$/.test(v.cantidad_fisica) ||
      Number(v.cantidad_fisica) === v.cantidad_entregada ||
      v.observaciones.length > 0,
    {
      path: ['observaciones'],
      message:
        'Las observaciones son obligatorias cuando la cantidad física no coincide con la entregada.',
    },
  );

type TCapturaForm = z.infer<typeof capturaSchema>;

/** Estatus que resultará de la cantidad capturada, para anticiparlo al usuario. */
function estatusPrevisto(diferencia: number): TEstatusComprobacion {
  if (diferencia === 0) return 'SIN_INCONSISTENCIAS';
  return diferencia < 0 ? 'CON_FALTANTES' : 'CON_EXCEDENTES';
}

interface CapturaComprobacionDialogProps {
  /** Renglón a capturar; null cuando la ventana está inactiva. */
  documento: IComprobacionDocumento | null;
  idConsejo: number;
  tipoConsejo: 'D' | 'M';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CapturaComprobacionDialog({
  documento,
  idConsejo,
  tipoConsejo,
  open,
  onOpenChange,
}: CapturaComprobacionDialogProps) {
  const capturar = useCapturarComprobacion();
  // La captura se confirma antes de guardar: primero el formulario, después el
  // resumen de lo que se va a registrar.
  const [confirmando, setConfirmando] = useState(false);
  // La vista previa de la fotografía se puede ocultar; la preferencia se
  // recuerda en el navegador para no repetirla en cada renglón.
  const [fotoVisible, setFotoVisible] = useState(true);
  useEffect(() => {
    try {
      setFotoVisible(localStorage.getItem(FOTO_PREF) !== '0');
    } catch {
      /* sin almacenamiento disponible: se muestra por defecto */
    }
  }, []);
  function cambiarFoto(visible: boolean) {
    setFotoVisible(visible);
    try {
      localStorage.setItem(FOTO_PREF, visible ? '1' : '0');
    } catch {
      /* la preferencia no se guarda, pero el cambio aplica en pantalla */
    }
  }

  const entregada = documento?.cantidad ?? 0;

  const form = useForm<TCapturaForm>({
    resolver: zodResolver(capturaSchema),
    mode: 'onSubmit',
    defaultValues: {
      cantidad_fisica: '',
      observaciones: '',
      cantidad_entregada: entregada,
    },
  });

  // Precarga lo ya capturado cada vez que se abre para un renglón.
  useEffect(() => {
    if (!open || !documento) return;
    setConfirmando(false);
    form.reset({
      cantidad_fisica:
        documento.cantidad_fisica != null
          ? String(documento.cantidad_fisica)
          : '',
      observaciones: documento.observaciones ?? '',
      cantidad_entregada: documento.cantidad ?? 0,
    });
  }, [open, documento, form]);

  if (!documento) return null;

  const capturada = Number(form.watch('cantidad_fisica'));
  const hayCantidad = /^\d+$/.test(form.watch('cantidad_fisica'));
  const diferencia = hayCantidad ? capturada - entregada : 0;
  const previsto = ESTATUS_COMPROBACION[estatusPrevisto(diferencia)];

  function cerrar(valor: boolean) {
    if (capturar.isPending) return;
    onOpenChange(valor);
  }

  async function handleGuardar() {
    const valores = form.getValues();
    await capturar.mutateAsync({
      id: documento!.id,
      id_consejo: idConsejo,
      tipo_consejo: tipoConsejo,
      cantidad_fisica: Number(valores.cantidad_fisica),
      observaciones: valores.observaciones.trim(),
    });
    onOpenChange(false);
  }

  const tieneFoto = !!documento.imagen_url;
  const mostrarFoto = tieneFoto && fotoVisible;
  const paquetes = enPaquetesCajas(documento.numero_paquetes_cajas);

  return (
    <Dialog open={open} onOpenChange={cerrar}>
      <DialogContent
        className={
          mostrarFoto
            ? 'sm:max-w-5xl max-h-[95vh] overflow-y-auto'
            : 'sm:max-w-lg'
        }
      >
        <DialogHeader className="pr-8">
          <DialogTitle>
            {confirmando ? 'Confirmar la captura' : 'Capturar cantidad física'}
          </DialogTitle>
          <DialogDescription>
            {documento.desc_documento}
            {' · '}
            <span className="font-mono font-semibold text-foreground/80">
              {documento.codigo}
            </span>
            {documento.version ? ` · versión ${documento.version}` : ''}
          </DialogDescription>
        </DialogHeader>

        {/* Formulario a la izquierda y, si el artículo tiene fotografía, su
            vista previa con zoom a la derecha para contar sin salir de aquí. */}
        <div
          className={
            mostrarFoto
              ? 'grid gap-6 md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]'
              : ''
          }
        >
          <div className="min-w-0 space-y-4">
            {tieneFoto && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-pressed={fotoVisible}
                  onClick={() => cambiarFoto(!fotoVisible)}
                >
                  {fotoVisible ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <ImageIcon className="h-4 w-4" aria-hidden="true" />
                  )}
                  {fotoVisible ? 'Ocultar fotografía' : 'Ver fotografía'}
                </Button>
              </div>
            )}

            {documento.cantidad_fisica != null && !confirmando && (
              <Alert variant="info" icon="info" appearance="light">
                <AlertIcon>
                  <AlertCircle />
                </AlertIcon>
                <AlertTitle>
                  Este renglón ya tiene {documento.cantidad_fisica} piezas
                  capturadas. Al guardar se sustituye el valor y la corrección
                  queda registrada.
                </AlertTitle>
              </Alert>
            )}

            {confirmando ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs text-muted-foreground">Entregada</p>
                    <p className="text-xl font-bold text-foreground">
                      {entregada}
                    </p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs text-muted-foreground">Física</p>
                    <p className="text-xl font-bold text-foreground">
                      {capturada}
                    </p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs text-muted-foreground">Diferencia</p>
                    <p className="text-xl font-bold text-foreground">
                      {diferencia > 0 ? `+${diferencia}` : diferencia}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    El renglón quedará como
                  </span>
                  <Badge
                    variant={previsto.variant}
                    appearance="light"
                    size="sm"
                  >
                    {previsto.label}
                  </Badge>
                </div>

                {form.getValues('observaciones').trim() && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Observaciones
                    </p>
                    <p className="text-sm text-foreground mt-1 whitespace-pre-line">
                      {form.getValues('observaciones').trim()}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(() => setConfirmando(true))}
                  id="captura-comprobacion-form"
                  className="space-y-4"
                >
                  <div className="rounded-md border border-border px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Cantidad entregada
                      </span>
                      <span className="text-base font-semibold text-foreground">
                        {entregada}
                      </span>
                    </div>
                    {paquetes && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Package
                          className="h-3.5 w-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        Se recibe {paquetes}
                      </p>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="cantidad_fisica"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Cantidad física{' '}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder="0"
                            onChange={(e) =>
                              field.onChange(e.target.value.replace(/\D/g, ''))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Piezas contadas físicamente en el consejo.
                        </FormDescription>
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
                          Observaciones
                          {hayCantidad && diferencia !== 0 && (
                            <span className="text-destructive"> *</span>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={4} maxLength={1000} />
                        </FormControl>
                        <FormDescription>
                          {hayCantidad && diferencia !== 0
                            ? 'Explica el motivo de la diferencia entre lo entregado y lo contado.'
                            : 'Opcional cuando la cantidad coincide con la entregada.'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {mostrarFoto && (
                    <p className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                      <ImageIcon
                        className="mt-0.5 h-3.5 w-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span>
                        La fotografía es una referencia general del documento o
                        material que debes verificar; puede diferir en detalles
                        del que recibiste.
                      </span>
                    </p>
                  )}
                </form>
              </Form>
            )}
          </div>

          {mostrarFoto && (
            <aside className="min-w-0">
              <FotoZoom
                src={documento.imagen_url!}
                alt={`Fotografía del artículo ${documento.codigo}`}
                className="h-72 md:h-[66vh]"
              />
            </aside>
          )}
        </div>

        <DialogFooter>
          {confirmando ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmando(false)}
                disabled={capturar.isPending}
              >
                <Undo2 className="h-4 w-4" />
                Corregir
              </Button>
              <Button
                type="button"
                onClick={handleGuardar}
                disabled={capturar.isPending}
              >
                {capturar.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Guardar captura
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" form="captura-comprobacion-form">
                Continuar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
