'use client';

import { useEffect, useMemo } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import type { IMarcoGeografico } from '@/types/mecanismos';
import {
  FormControl,
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
import {
  consejoClave,
  consejosDeCasillas,
  type TMecanismoForm,
} from '../_lib/mecanismo-form';

interface IOpcionConsejo {
  clave: string;
  nombre: string;
}

const NINGUNO = '__ninguno__';

/** Selector de un consejo entre los vinculados, para «quién informa» y «quién cotiza». */
function SelectConsejo({
  value,
  onChange,
  opciones,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  opciones: IOpcionConsejo[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <Select
      indicatorVisibility={false}
      value={value || NINGUNO}
      onValueChange={(v) => onChange(v === NINGUNO ? '' : v)}
      disabled={disabled || opciones.length === 0}
    >
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        <SelectItem value={NINGUNO}>{placeholder}</SelectItem>
        {opciones.map((o) => (
          <SelectItem key={o.clave} value={o.clave}>
            {o.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface MecanismoFormConsejosProps {
  form: UseFormReturn<TMecanismoForm>;
  /** Municipios y distritos locales del distrito federal elegido. */
  territorios: IMarcoGeografico[];
  disabled?: boolean;
}

const dos = (n: number) => String(n).padStart(2, '0');

/**
 * Consejos vinculados al mecanismo, calculados de sus casillas (el municipal
 * y el distrital de cada una), y entre ellos quién informa y quién cotiza.
 */
export function MecanismoFormConsejos({
  form,
  territorios,
  disabled,
}: MecanismoFormConsejosProps) {
  // useWatch se suscribe también a cada campo de las casillas; la clave cambia al elegir un territorio.
  const casillas = useWatch({ control: form.control, name: 'casillas' });
  const territoriosElegidos = (casillas ?? [])
    .map((c) => c.territorio)
    .join('|');
  const revisor = form.watch('revisor');
  const cotizacion = form.watch('cotizacion');

  const vinculados = useMemo(() => {
    const nombres = new Map<string, { corto: string; largo: string }>();
    for (const t of territorios) {
      nombres.set(consejoClave('M', t.id_mun), {
        corto: `${dos(t.id_mun)}. ${t.municipio}`,
        largo: `CME.${dos(t.id_mun)} ${t.municipio}`,
      });
      nombres.set(consejoClave('D', t.id_dl), {
        corto: `${dos(t.id_dl)}. ${t.dl}`,
        largo: `CDE.${dos(t.id_dl)} ${t.dl}`,
      });
    }
    return consejosDeCasillas(
      territoriosElegidos.split('|').map((territorio) => ({ territorio })),
    ).map((clave) => ({
      clave,
      tipo: clave.startsWith('M') ? 'M' : 'D',
      corto: nombres.get(clave)?.corto ?? clave,
      nombre: nombres.get(clave)?.largo ?? clave,
    }));
  }, [territoriosElegidos, territorios]);

  // Si una casilla se quita, su consejo deja de estar vinculado y no puede informar ni cotizar.
  useEffect(() => {
    const claves = vinculados.map((c) => c.clave);
    if (revisor && !claves.includes(revisor)) form.setValue('revisor', '');
    if (cotizacion && !claves.includes(cotizacion))
      form.setValue('cotizacion', '');
  }, [vinculados, revisor, cotizacion, form]);

  return (
    <>
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
          Consejos vinculados
        </p>
        {vinculados.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Se calculan de las casillas: agrega las casillas del mecanismo.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ['Municipales', 'M'],
                ['Distritales', 'D'],
              ] as const
            ).map(([titulo, tipo]) => (
              <div
                key={tipo}
                className="rounded-md border border-border bg-muted/30 p-3 space-y-1"
              >
                <p className="text-xs font-medium text-muted-foreground">
                  {titulo}
                </p>
                {vinculados
                  .filter((c) => c.tipo === tipo)
                  .map((c) => (
                    <p key={c.clave} className="text-sm">
                      {c.corto}
                    </p>
                  ))}
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Son el consejo municipal y el distrital de cada casilla; cambian al
          editar las casillas.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="revisor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Consejo que revisa</FormLabel>
              <SelectConsejo
                value={field.value}
                onChange={field.onChange}
                opciones={vinculados}
                placeholder="El primer municipal vinculado"
                disabled={disabled}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cotizacion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Responsable de la cotización</FormLabel>
              <SelectConsejo
                value={field.value}
                onChange={field.onChange}
                opciones={vinculados}
                placeholder="Sin responsable"
                disabled={disabled}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
}
