'use client';

import { useFormContext, type Path } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { LeyendaObligatorios } from '@/components/common/leyenda-obligatorios';
import type { ITrasladoForm } from './acta-traslado';

type TTransformacion = (valor: string) => string;

const SOLO_DIGITOS: TTransformacion = (v) => v.replace(/\D/g, '').slice(0, 2);
const MAYUSCULAS_ALFANUMERICO =
  (max: number): TTransformacion =>
  (v) =>
    v
      .replace(/[^A-Za-z0-9-]/g, '')
      .toUpperCase()
      .slice(0, max);

interface CampoProps {
  name: Path<ITrasladoForm>;
  etiqueta: string;
  /** Sin asterisco: solo el número económico es opcional. */
  opcional?: boolean;
  max: number;
  placeholder?: string;
  className?: string;
  inputMode?: 'numeric' | 'text';
  transformar?: TTransformacion;
  disabled: boolean;
}

function Campo({
  name,
  etiqueta,
  opcional = false,
  max,
  placeholder,
  className,
  inputMode,
  transformar,
  disabled,
}: CampoProps) {
  const { control } = useFormContext<ITrasladoForm>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            {etiqueta}
            {!opcional && <span className="text-destructive"> *</span>}
          </FormLabel>
          <FormControl>
            <Input
              {...field}
              value={String(field.value ?? '')}
              maxLength={max}
              inputMode={inputMode}
              autoComplete="off"
              placeholder={placeholder}
              disabled={disabled}
              onChange={(e) =>
                field.onChange(
                  transformar ? transformar(e.target.value) : e.target.value,
                )
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface ActaTrasladoSeccionesProps {
  readOnly: boolean;
}

/**
 * Datos del vehículo de traslado y custodia del acta. Todo es obligatorio
 * salvo el número económico; los datos de la patrulla se piden solo cuando el
 * traslado fue custodiado.
 */
export function ActaTrasladoSecciones({
  readOnly,
}: ActaTrasladoSeccionesProps) {
  const { control, watch } = useFormContext<ITrasladoForm>();
  const custodiado = watch('custodia.custodiado');

  return (
    <>
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Datos del vehículo de traslado
        </h3>
        <div className="grid gap-4 sm:grid-cols-4">
          <Campo
            name="vehiculo.tipo"
            etiqueta="Tipo"
            max={60}
            placeholder="Camioneta, camión…"
            disabled={readOnly}
          />
          <Campo
            name="vehiculo.marca"
            etiqueta="Marca"
            max={60}
            disabled={readOnly}
          />
          <Campo
            name="vehiculo.modelo"
            etiqueta="Modelo"
            max={60}
            disabled={readOnly}
          />
          <Campo
            name="vehiculo.placas"
            etiqueta="Placas"
            max={15}
            placeholder="ABC-123-D"
            transformar={MAYUSCULAS_ALFANUMERICO(15)}
            disabled={readOnly}
          />
          <Campo
            name="vehiculo.numero_economico"
            etiqueta="Número económico"
            opcional
            max={40}
            disabled={readOnly}
          />
          <Campo
            name="vehiculo.numero_tarjeta_circulacion"
            etiqueta="Tarjeta de circulación"
            max={40}
            disabled={readOnly}
          />
          <Campo
            name="vehiculo.conductor"
            etiqueta="Conductor"
            max={150}
            className="sm:col-span-2"
            disabled={readOnly}
          />
          <Campo
            name="vehiculo.clave_credencial"
            etiqueta="Clave de la credencial para votar"
            max={18}
            placeholder="18 caracteres"
            className="sm:col-span-2"
            transformar={MAYUSCULAS_ALFANUMERICO(18)}
            disabled={readOnly}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Custodia</h3>
        <FormField
          control={control}
          name="custodia.custodiado"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3 space-y-0">
              <FormControl>
                <Switch
                  id="acta-custodiado"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={readOnly}
                />
              </FormControl>
              <FormLabel htmlFor="acta-custodiado" className="cursor-pointer">
                El traslado fue custodiado
              </FormLabel>
            </FormItem>
          )}
        />
        {custodiado && (
          <div className="grid gap-4 sm:grid-cols-4">
            <Campo
              name="custodia.corporacion"
              etiqueta="Corporación"
              max={100}
              className="sm:col-span-2"
              disabled={readOnly}
            />
            <Campo
              name="custodia.numero_patrulla"
              etiqueta="Número de patrulla"
              max={20}
              transformar={MAYUSCULAS_ALFANUMERICO(20)}
              disabled={readOnly}
            />
            <Campo
              name="custodia.numero_elementos"
              etiqueta="Elementos"
              max={2}
              inputMode="numeric"
              transformar={SOLO_DIGITOS}
              disabled={readOnly}
            />
            <Campo
              name="custodia.conductor_nombre"
              etiqueta="Conductor de la patrulla"
              max={150}
              className="sm:col-span-2"
              disabled={readOnly}
            />
            <Campo
              name="custodia.conductor_identificacion"
              etiqueta="Identificación del conductor"
              max={40}
              className="sm:col-span-2"
              disabled={readOnly}
            />
          </div>
        )}
        <LeyendaObligatorios />
      </section>
    </>
  );
}
