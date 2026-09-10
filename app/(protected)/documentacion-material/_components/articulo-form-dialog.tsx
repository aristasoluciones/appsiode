'use client';

import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  Check,
  ImageOff,
  Loader2,
  Lock,
  Trash2,
  Upload,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  ARTICULOS_LIMITES,
  type IArticulo,
  type ITipoDocumentacion,
} from '@/types/material-electoral';
import { toastSuccess, toastWarning } from '@/lib/toast';
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
import { Textarea } from '@/components/ui/textarea';
import {
  useEditarArticulo,
  useEliminarFotografiaArticulo,
  useRegistrarArticulo,
  useSubirFotografiaArticulo,
} from '../_hooks/use-articulos';
import { ArticuloMiniatura } from './articulo-miniatura';

/**
 * Mismas reglas que aplica la API, repetidas aquí solo para avisar antes de
 * enviar: código sin espacios, descripción y tipo obligatorios.
 */
const articuloSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(1, { message: 'Captura el código del artículo.' })
    .max(ARTICULOS_LIMITES.codigo.max, {
      message: `El código no debe exceder ${ARTICULOS_LIMITES.codigo.max} caracteres.`,
    })
    .regex(ARTICULOS_LIMITES.codigo.patron, {
      message:
        'El código solo admite letras, números, punto, guion, guion bajo y diagonal, sin espacios.',
    }),
  descripcion: z
    .string()
    .trim()
    .min(1, { message: 'Captura la descripción del artículo.' })
    .max(ARTICULOS_LIMITES.descripcion.max, {
      message: `La descripción no debe exceder ${ARTICULOS_LIMITES.descripcion.max} caracteres.`,
    }),
  tipo: z.string().min(1, { message: 'Elige el tipo del artículo.' }),
});

type TArticuloForm = z.infer<typeof articuloSchema>;

const ACEPTA_FOTO = ARTICULOS_LIMITES.foto.tipos.join(',');

function pesoLegible(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ArticuloFormDialogProps {
  /** Artículo a editar; sin él la ventana da de alta uno nuevo. */
  articulo: IArticulo | null;
  tipos: ITipoDocumentacion[];
  /** Sin el permiso de fotografía la ventana solo captura los datos. */
  puedeFotografia: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Alta y edición de un artículo. La fotografía va aparte en el API: se sube o
 * se quita después de guardar los datos, en la misma acción, para que el
 * usuario lo viva como un solo formulario.
 */
export function ArticuloFormDialog({
  articulo,
  tipos,
  puedeFotografia,
  open,
  onOpenChange,
}: ArticuloFormDialogProps) {
  const editando = !!articulo;
  const registrar = useRegistrarArticulo();
  const editar = useEditarArticulo();
  const subirFoto = useSubirFotografiaArticulo();
  const eliminarFoto = useEliminarFotografiaArticulo();

  const inputRef = useRef<HTMLInputElement>(null);
  const [archivoFoto, setArchivoFoto] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [quitarFoto, setQuitarFoto] = useState(false);
  const [errorFoto, setErrorFoto] = useState<string | null>(null);

  const guardando =
    registrar.isPending ||
    editar.isPending ||
    subirFoto.isPending ||
    eliminarFoto.isPending;

  const form = useForm<TArticuloForm>({
    resolver: zodResolver(articuloSchema),
    mode: 'onSubmit',
    defaultValues: { codigo: '', descripcion: '', tipo: '' },
  });

  // Cada apertura arranca con los datos del artículo (o vacía) y sin foto pendiente.
  useEffect(() => {
    if (!open) return;
    form.reset({
      codigo: articulo?.codigo ?? '',
      descripcion: articulo?.descripcion ?? '',
      tipo: articulo?.tipo ?? '',
    });
    setArchivoFoto(null);
    setQuitarFoto(false);
    setErrorFoto(null);
    if (inputRef.current) inputRef.current.value = '';
  }, [open, articulo, form]);

  // La vista previa se arma desde el archivo elegido y se libera al cambiarlo.
  useEffect(() => {
    if (!archivoFoto) {
      setVistaPrevia(null);
      return;
    }
    const url = URL.createObjectURL(archivoFoto);
    setVistaPrevia(url);
    return () => URL.revokeObjectURL(url);
  }, [archivoFoto]);

  function seleccionarFoto(file: File | null | undefined) {
    if (inputRef.current) inputRef.current.value = '';
    if (!file) return;

    if (
      !(ARTICULOS_LIMITES.foto.tipos as readonly string[]).includes(file.type)
    ) {
      setErrorFoto('La fotografía debe ser JPG, PNG o WEBP.');
      return;
    }
    if (file.size > ARTICULOS_LIMITES.foto.bytes) {
      setErrorFoto(
        `La fotografía pesa ${pesoLegible(file.size)} y el máximo es ${pesoLegible(ARTICULOS_LIMITES.foto.bytes)}.`,
      );
      return;
    }
    setErrorFoto(null);
    setQuitarFoto(false);
    setArchivoFoto(file);
  }

  function cerrar(valor: boolean) {
    if (guardando) return;
    onOpenChange(valor);
  }

  async function guardar(valores: TArticuloForm) {
    const payload = {
      codigo: valores.codigo.trim(),
      descripcion: valores.descripcion.trim(),
      tipo: valores.tipo,
    };

    const guardado = editando
      ? await editar.mutateAsync({ id: articulo!.id, ...payload })
      : await registrar.mutateAsync(payload);

    // Los datos ya quedaron; si la fotografía falla, el toast global lo avisa y
    // la ventana se cierra igual para no repetir el alta.
    const id = guardado?.id ?? articulo?.id;
    let fotoOk = true;
    try {
      if (id && archivoFoto) {
        await subirFoto.mutateAsync({ id, archivo: archivoFoto });
      } else if (id && quitarFoto && articulo?.imagen) {
        await eliminarFoto.mutateAsync(id);
      }
    } catch {
      fotoOk = false;
    }

    if (!fotoOk) {
      toastWarning(
        editando
          ? 'Los datos del artículo se guardaron, pero la fotografía no.'
          : 'El artículo se registró, pero la fotografía no se pudo guardar.',
      );
    } else if (editando && articulo?.usado) {
      toastWarning(
        `Artículo actualizado. Aparece en ${articulo.renglones.toLocaleString('es-MX')} renglones ya cargados, que conservan la descripción y el tipo con que se cargaron: el cambio aplica solo a las cargas nuevas.`,
      );
    } else {
      toastSuccess(editando ? 'Artículo actualizado.' : 'Artículo registrado.');
    }

    onOpenChange(false);
  }

  const codigoBloqueado = editando && articulo!.usado;
  const fotoActual = editando && !!articulo!.imagen && !quitarFoto;

  return (
    <Dialog open={open} onOpenChange={cerrar}>
      <DialogContent
        className="sm:max-w-2xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {editando ? 'Editar artículo' : 'Nuevo artículo'}
          </DialogTitle>
          <DialogDescription>
            {editando
              ? 'Modifica la descripción, el tipo o la fotografía del artículo.'
              : 'Registra un artículo del catálogo de documentación y material.'}
          </DialogDescription>
        </DialogHeader>

        {codigoBloqueado && (
          <Alert variant="warning" appearance="light" close={false}>
            <AlertIcon>
              <AlertCircle />
            </AlertIcon>
            <AlertTitle>
              Este artículo ya se usó en{' '}
              {articulo!.renglones.toLocaleString('es-MX')} renglones cargados (
              {articulo!.cargas.toLocaleString('es-MX')}{' '}
              {articulo!.cargas === 1 ? 'carga' : 'cargas'}). El código no se
              puede cambiar y lo que edites aplica solo a las cargas nuevas.
            </AlertTitle>
          </Alert>
        )}

        <Form {...form}>
          <form
            id="articulo-form"
            onSubmit={form.handleSubmit(guardar)}
            className="grid gap-5 md:grid-cols-[1fr_11rem]"
          >
            <div className="space-y-4 min-w-0">
              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Código <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          autoComplete="off"
                          placeholder="Ej. DOC-01"
                          maxLength={ARTICULOS_LIMITES.codigo.max}
                          disabled={codigoBloqueado || guardando}
                          readOnly={codigoBloqueado}
                          className={codigoBloqueado ? 'pe-9' : undefined}
                          onChange={(e) =>
                            field.onChange(e.target.value.replace(/\s/g, ''))
                          }
                        />
                        {codigoBloqueado && (
                          <Lock
                            className="h-4 w-4 text-muted-foreground absolute end-3 top-1/2 -translate-y-1/2"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Es con el que se captura el artículo en el formato de la
                      carga: sin espacios, hasta {ARTICULOS_LIMITES.codigo.max}{' '}
                      caracteres.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Descripción <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        maxLength={ARTICULOS_LIMITES.descripcion.max}
                        disabled={guardando}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tipo <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      indicatorVisibility={false}
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={guardando}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona el tipo..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tipos.map((t) => (
                          <SelectItem key={t.clave} value={t.clave}>
                            {t.clave} · {t.descripcion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fotografía: la actual, la elegida o el hueco para subir una. */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Fotografía</p>

              {vistaPrevia ? (
                <div className="h-40 w-40 rounded-md border border-border bg-muted/40 overflow-hidden flex items-center justify-center">
                  <img
                    src={vistaPrevia}
                    alt="Fotografía elegida"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : fotoActual ? (
                <ArticuloMiniatura
                  articulo={articulo!}
                  tamano="lg"
                  ampliable={false}
                />
              ) : (
                <div className="h-40 w-40 rounded-md border border-dashed border-input bg-muted/40 flex flex-col items-center justify-center gap-1 text-muted-foreground">
                  <ImageOff className="h-8 w-8" />
                  <span className="text-xs">Sin fotografía</span>
                </div>
              )}

              {puedeFotografia && (
                <>
                  <input
                    ref={inputRef}
                    type="file"
                    accept={ACEPTA_FOTO}
                    className="hidden"
                    onChange={(e) => seleccionarFoto(e.target.files?.[0])}
                  />
                  <div className="flex flex-col gap-1.5 w-40">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => inputRef.current?.click()}
                      disabled={guardando}
                    >
                      <Upload />
                      {vistaPrevia || fotoActual ? 'Reemplazar' : 'Subir'}
                    </Button>
                    {(vistaPrevia || fotoActual) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (archivoFoto) setArchivoFoto(null);
                          else setQuitarFoto(true);
                          setErrorFoto(null);
                        }}
                        disabled={guardando}
                      >
                        <Trash2 />
                        {archivoFoto ? 'Descartar' : 'Quitar'}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground w-40">
                    JPG, PNG o WEBP de hasta{' '}
                    {pesoLegible(ARTICULOS_LIMITES.foto.bytes)}.
                  </p>
                  {errorFoto && (
                    <p className="text-xs text-destructive w-40">{errorFoto}</p>
                  )}
                  {quitarFoto && (
                    <p className="text-xs text-warning w-40">
                      La fotografía se quitará al guardar.
                    </p>
                  )}
                </>
              )}
            </div>
          </form>
        </Form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => cerrar(false)}
            disabled={guardando}
          >
            Cancelar
          </Button>
          <Button type="submit" form="articulo-form" disabled={guardando}>
            {guardando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {editando ? 'Guardar cambios' : 'Registrar artículo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
