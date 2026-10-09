'use client';

import { useFormContext } from 'react-hook-form';
import { ACTA_LIMITES } from '@/types/material-electoral';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ContadorCaracteres } from '@/components/common/contador-caracteres';

/** Campos del formulario del generador que usa la reposición. */
export interface IReposicionForm {
  reposicion: boolean;
  motivo_reposicion: string;
}

/** Interruptor «De reposición» para el encabezado de la sección. */
export function ReposicionInterruptor({
  readOnly,
  onActivar,
}: {
  readOnly: boolean;
  onActivar?: () => void;
}) {
  const { control } = useFormContext<IReposicionForm>();
  return (
    <FormField
      control={control}
      name="reposicion"
      render={({ field }) => (
        <FormItem className="flex shrink-0 items-center gap-2 space-y-0">
          <FormLabel
            htmlFor="acta-reposicion"
            className="cursor-pointer text-xs font-medium text-muted-foreground"
          >
            De reposición
          </FormLabel>
          <FormControl>
            <Switch
              id="acta-reposicion"
              checked={field.value}
              onCheckedChange={(v) => {
                field.onChange(v);
                if (v) onActivar?.();
              }}
              disabled={readOnly}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

/** Motivo de la reposición: solo se pide, y es obligatorio, cuando el acta es de reposición. */
export function ReposicionMotivo({ readOnly }: { readOnly: boolean }) {
  const { control, watch } = useFormContext<IReposicionForm>();
  const reposicion = watch('reposicion');

  if (!reposicion) {
    return (
      <p className="text-sm text-muted-foreground">
        El acta no es de reposición. Activa el interruptor si lo es, para
        capturar el motivo.
      </p>
    );
  }

  return (
    <FormField
      control={control}
      name="motivo_reposicion"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Motivo de la reposición <span className="text-destructive">*</span>
          </FormLabel>
          <FormControl>
            <Textarea
              {...field}
              rows={4}
              maxLength={ACTA_LIMITES.motivoReposicion.max}
              disabled={readOnly}
            />
          </FormControl>
          <ContadorCaracteres
            valor={field.value ?? ''}
            max={ACTA_LIMITES.motivoReposicion.max}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
