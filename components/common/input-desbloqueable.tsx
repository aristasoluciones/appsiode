'use client';

import { useRef, useState } from 'react';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface InputDesbloqueableProps extends React.ComponentProps<typeof Input> {
  /** Nombre del campo para el botón de edición («Editar ciudad»). */
  etiqueta: string;
}

/**
 * Campo que llega lleno en automático y se muestra de solo lectura; el lápiz
 * dentro del campo lo desbloquea para corregirlo. Si viene vacío se puede
 * capturar directo, sin desbloquear.
 */
export function InputDesbloqueable({
  etiqueta,
  className,
  disabled,
  value,
  onChange,
  ref,
  ...props
}: InputDesbloqueableProps) {
  const propio = useRef<HTMLInputElement | null>(null);
  /** Valor al empezar a editar, para restaurarlo con Escape. */
  const original = useRef('');
  const [editable, setEditable] = useState(false);
  const bloqueado = !editable && !disabled && String(value ?? '') !== '';

  function empezarEdicion() {
    if (editable) return;
    original.current = String(value ?? '');
    setEditable(true);
  }

  function asignarRef(el: HTMLInputElement | null) {
    propio.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  }

  function desbloquear() {
    empezarEdicion();
    // Tras desbloquear, el cursor queda al final para seguir escribiendo.
    requestAnimationFrame(() => {
      const el = propio.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
  }

  return (
    <div className="relative">
      <Input
        {...props}
        ref={asignarRef}
        value={value}
        disabled={disabled}
        readOnly={bloqueado}
        aria-readonly={bloqueado}
        // La ventana que lo contiene no debe cerrarse con Escape mientras se edita.
        data-desbloqueable={editable ? 'editando' : undefined}
        onChange={(e) => {
          // Al capturar en un campo vacío, queda editable aunque se llene.
          empezarEdicion();
          onChange?.(e);
        }}
        onKeyDown={(e) => {
          if (editable && e.key === 'Enter') {
            // Enter confirma lo capturado sin enviar el formulario.
            e.preventDefault();
            setEditable(false);
          } else if (editable && e.key === 'Escape') {
            // Escape descarta lo capturado y regresa al valor anterior. Se
            // entrega como evento para que lo acepte cualquier onChange
            // (react-hook-form lee `target.value`).
            onChange?.({
              target: { value: original.current },
            } as React.ChangeEvent<HTMLInputElement>);
            setEditable(false);
          }
          props.onKeyDown?.(e);
        }}
        className={cn(
          bloqueado && 'pr-10 bg-muted/40 text-foreground/80 cursor-default',
          className,
        )}
      />
      {bloqueado && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={desbloquear}
              aria-label={`Editar ${etiqueta}`}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Editar</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
