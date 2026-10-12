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
import type { TMecanismoForm } from '../_lib/mecanismo-form';

interface MecanismoFormRutaProps {
  form: UseFormReturn<TMecanismoForm>;
  disabled?: boolean;
}

/** Deja solo dígitos y pone los dos puntos tras las horas mientras se escribe: «0130» → «01:30». */
function formatearHHMM(valor: string) {
  const d = valor.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d;
}

/** Datos de la ruta: distancia, tiempo de recorrido (HH:MM) y costo INE. */
export function MecanismoFormRuta({ form, disabled }: MecanismoFormRutaProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
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
                onChange={(e) => field.onChange(formatearHHMM(e.target.value))}
                placeholder="01:30"
                inputMode="numeric"
                maxLength={5}
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
    </div>
  );
}
