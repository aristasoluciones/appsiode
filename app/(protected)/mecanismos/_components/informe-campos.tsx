'use client';

import { useState } from 'react';
import { UserRoundSearch, X } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { ICae } from '@/types/mecanismos';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { TInformeForm } from '../_lib/informe-form';
import { MECANISMOS_LIMITES } from '../_lib/limites';
import { CaesDialog } from './caes-dialog';

interface CampoProps {
  form: UseFormReturn<TInformeForm>;
  disabled: boolean;
}

/**
 * CAE del informe en solo lectura: se elige de la lista de activos del consejo
 * con «Cambiar CAE» y nunca se captura a mano.
 */
export function InformeCaeCampo({ form, disabled }: CampoProps) {
  const { user } = useAuth();
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const caeFolio = form.watch('cae_folio');
  const caeNombre = form.watch('cae_nombre');

  function elegirCae(cae: ICae) {
    form.setValue('cae_folio', cae.folio, { shouldDirty: true });
    form.setValue('cae_nombre', cae.nombre_completo, { shouldDirty: true });
    setSelectorAbierto(false);
  }

  function quitarCae() {
    form.setValue('cae_folio', '', { shouldDirty: true });
    form.setValue('cae_nombre', '', { shouldDirty: true });
  }

  return (
    <>
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
                disabled={disabled}
              >
                <UserRoundSearch className="h-4 w-4" aria-hidden="true" />
                {caeFolio ? 'Cambiar CAE' : 'Elegir CAE'}
              </Button>
              {caeFolio && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Quitar el CAE"
                  disabled={disabled}
                  onClick={quitarCae}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <FormDescription>
              Se elige de la lista de CAE activos del consejo; no se captura a
              mano.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {user && (
        <CaesDialog
          open={selectorAbierto}
          onOpenChange={setSelectorAbierto}
          tipoConsejo={user.tipoConsejo as 'D' | 'M'}
          idConsejo={Number(user.idConsejo)}
          onSeleccionar={elegirCae}
          folioActual={caeFolio || null}
        />
      )}
    </>
  );
}

/** Costo estimado en pesos, obligatorio al informar cuando el consejo captura costo. */
export function InformeCostoCampo({ form, disabled }: CampoProps) {
  return (
    <FormField
      control={form.control}
      name="costo"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Costo estimado (MXN) <span className="text-destructive">*</span>
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
              disabled={disabled}
              className="max-w-56"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** Check «Informar»: se marca con cualquier tipo de observación y deja el mecanismo en Informado. */
export function InformarCheckCampo({ form, disabled }: CampoProps) {
  return (
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
                disabled={disabled}
                className="border-primary"
                aria-label="Informar el mecanismo"
              />
            </FormControl>
            <div className="space-y-1">
              <FormLabel className="cursor-pointer">
                Informar el mecanismo
              </FormLabel>
              <FormDescription>
                Habilítalo si deseas informar el mecanismo: se guarda esta
                observación y el mecanismo pasa a Informado. Después ya no
                admite cambios.
              </FormDescription>
            </div>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
