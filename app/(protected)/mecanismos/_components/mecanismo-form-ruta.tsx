'use client';

import type { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MECANISMOS_LIMITES } from '../_lib/limites';
import type { TMecanismoForm } from '../_lib/mecanismo-form';

interface MecanismoFormRutaProps {
  form: UseFormReturn<TMecanismoForm>;
  disabled?: boolean;
}

/** Datos de la ruta: distancia, tiempo de recorrido (HH:MM), costo INE y elección atendida. */
export function MecanismoFormRuta({ form, disabled }: MecanismoFormRutaProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-4">
      <FormField
        control={form.control}
        name="distancia_km"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Distancia (km)</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="tiempo_recorrido"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tiempo (HH:MM)</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="01:30"
                inputMode="numeric"
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="costo_ine"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Costo INE (MXN)</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="eleccion_atendida"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Elección atendida</FormLabel>
            <FormControl>
              <Input
                {...field}
                maxLength={MECANISMOS_LIMITES.eleccionAtendida.max}
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
