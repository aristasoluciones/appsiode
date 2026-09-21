'use client';

import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
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
import { LeyendaObligatorios } from '@/components/common/leyenda-obligatorios';
import {
  useCrearMecanismo,
  useEditarMecanismo,
  useMarcoGeografico,
  useMecanismo,
  useMecanismosTipos,
  useReemplazarCasillas,
} from '../_hooks/use-mecanismos';
import { MECANISMOS_LIMITES } from '../_lib/limites';
import {
  formularioAPayload,
  MECANISMO_FORM_VACIO,
  mecanismoAFormulario,
  mecanismoSchema,
  type TMecanismoForm,
} from '../_lib/mecanismo-form';
import { CasillasEditor } from './casillas-editor';
import { MecanismoFormConsejos } from './mecanismo-form-consejos';
import { MecanismoFormRuta } from './mecanismo-form-ruta';

interface MecanismoFormDialogProps {
  /** Mecanismo a editar; sin él la ventana da de alta uno nuevo. El detalle se pide aquí. */
  idMecanismo: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Alta y edición del mecanismo por oficina central: territorio, tipo y número
 * (identidad del INE), consejos vinculados, quién informa y quién cotiza, la
 * ruta y las casillas. En la edición las casillas van por su propio endpoint.
 */
export function MecanismoFormDialog({
  idMecanismo,
  open,
  onOpenChange,
}: MecanismoFormDialogProps) {
  const editando = idMecanismo != null;
  const { data: mecanismo, isLoading: cargandoMecanismo } = useMecanismo(
    open ? idMecanismo : null,
  );
  const crear = useCrearMecanismo();
  const editar = useEditarMecanismo();
  const reemplazarCasillas = useReemplazarCasillas();
  const { data: marco = [], isLoading: cargandoMarco } =
    useMarcoGeografico(open);
  const { data: tipos = [] } = useMecanismosTipos();

  const guardando =
    crear.isPending || editar.isPending || reemplazarCasillas.isPending;
  const bloqueado = guardando || (editando && cargandoMecanismo);

  const form = useForm<TMecanismoForm>({
    resolver: zodResolver(mecanismoSchema),
    mode: 'onSubmit',
    defaultValues: MECANISMO_FORM_VACIO,
  });

  // Cada apertura arranca limpia; al llegar el detalle en la edición se llena con él.
  useEffect(() => {
    if (!open) return;
    form.reset(
      mecanismo && editando
        ? mecanismoAFormulario(mecanismo)
        : MECANISMO_FORM_VACIO,
    );
  }, [open, mecanismo, editando, form]);

  const idDf = form.watch('id_df');

  const distritos = useMemo(() => {
    const vistos = new Map<number, string>();
    for (const r of marco) if (!vistos.has(r.id_df)) vistos.set(r.id_df, r.df);
    return Array.from(vistos, ([id, nombre]) => ({ id, nombre }));
  }, [marco]);

  const territorios = useMemo(
    () => marco.filter((r) => String(r.id_df) === idDf),
    [marco, idDf],
  );

  const tieneCedula =
    editando && !!mecanismo && mecanismo.cedula_estatus !== 'SIN_CEDULA';

  function cambiarDistrito(valor: string) {
    form.setValue('id_df', valor);
    // Los consejos y las casillas pertenecen al distrito: al cambiarlo dejan de valer.
    form.setValue('consejos', []);
    form.setValue('revisor', '');
    form.setValue('cotizacion', '');
    form.setValue('casillas', []);
  }

  async function guardar(valores: TMecanismoForm) {
    const payload = formularioAPayload(valores);
    if (!editando || !mecanismo) {
      await crear.mutateAsync(payload);
    } else {
      const { casillas, ...datos } = payload;
      await editar.mutateAsync({ id: mecanismo.id, payload: datos });
      const antes = JSON.stringify(mecanismoAFormulario(mecanismo).casillas);
      if (antes !== JSON.stringify(valores.casillas)) {
        await reemplazarCasillas.mutateAsync({
          id: mecanismo.id,
          payload: { casillas: casillas ?? [] },
        });
      }
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !guardando && onOpenChange(v)}>
      <DialogContent
        className="sm:max-w-3xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {editando ? 'Edición del mecanismo' : 'Nuevo mecanismo'}
          </DialogTitle>
          <DialogDescription>
            {editando
              ? 'Modifica los consejos vinculados, la ruta o las casillas del mecanismo.'
              : 'Registra un mecanismo de recolección con su territorio, sus consejos y sus casillas.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {tieneCedula && (
            <Alert
              variant="warning"
              appearance="light"
              close={false}
              className="mb-4"
            >
              <AlertIcon>
                <AlertCircle />
              </AlertIcon>
              <AlertTitle>
                El mecanismo ya tiene cédula: el distrito federal, el tipo y el
                número no se pueden cambiar.
              </AlertTitle>
            </Alert>
          )}

          <Form {...form}>
            <form
              id="mecanismo-form"
              onSubmit={form.handleSubmit(guardar)}
              className="space-y-5"
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="id_df"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Distrito federal{' '}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        indicatorVisibility={false}
                        value={field.value}
                        onValueChange={cambiarDistrito}
                        disabled={bloqueado || tieneCedula || cargandoMarco}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                cargandoMarco ? 'Cargando...' : 'Elige'
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {distritos.map((d) => (
                            <SelectItem key={d.id} value={String(d.id)}>
                              {d.nombre}
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
                        disabled={bloqueado || tieneCedula}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Elige" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tipos.map((t) => (
                            <SelectItem key={t.clave} value={t.clave}>
                              {t.descripcion}
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
                  name="numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Número <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          inputMode="numeric"
                          min={MECANISMOS_LIMITES.numero.min}
                          max={MECANISMOS_LIMITES.numero.max}
                          placeholder="1 a 999"
                          disabled={bloqueado || tieneCedula}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <MecanismoFormConsejos
                form={form}
                territorios={territorios}
                disabled={bloqueado}
              />

              <MecanismoFormRuta form={form} disabled={bloqueado} />

              <FormField
                control={form.control}
                name="casillas"
                render={() => (
                  <FormItem>
                    <FormLabel>Casillas</FormLabel>
                    <CasillasEditor
                      form={form}
                      territorios={territorios}
                      disabled={bloqueado || !idDf}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </DialogBody>

        <LeyendaObligatorios />
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
            form="mecanismo-form"
            disabled={bloqueado}
            aria-busy={guardando}
          >
            {guardando && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {editando ? 'Guardar cambios' : 'Registrar mecanismo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
