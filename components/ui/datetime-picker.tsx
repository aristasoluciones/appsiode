'use client';

import { useState } from 'react';
import { Calendar, CalendarClock, Clock } from 'lucide-react';
import { es } from 'react-day-picker/locale';
import { Time } from '@internationalized/date';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { TimeField, DateInput } from '@/components/ui/datefield';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateTimePickerProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  /**
   * Solo fecha: oculta el campo de hora, cierra el popover al elegir el día y
   * emite siempre `yyyy-MM-ddT00:00`. Sin esta prop el componente captura
   * fecha y hora (`yyyy-MM-ddTHH:mm`), como lo usa el módulo de sesiones.
   */
  dateOnly?: boolean;
}

function DateTimePicker({ value, onChange, disabled, dateOnly = false }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);

  const datePart = value ? value.slice(0, 10) : '';
  const timePart = value && value.length >= 16 ? value.slice(11, 16) : '';

  // Use noon to avoid UTC midnight shifting the date by one day
  const selectedDate = datePart ? new Date(`${datePart}T12:00`) : undefined;

  const displayParts: string[] = [];
  if (datePart) {
    displayParts.push(
      new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(`${datePart}T12:00`)),
    );
  }
  if (!dateOnly && timePart) displayParts.push(timePart);
  const displayValue = displayParts.join(' ');

  function handleDaySelect(day: Date | undefined) {
    if (!day) return;
    const y = day.getFullYear();
    const m = String(day.getMonth() + 1).padStart(2, '0');
    const d = String(day.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}T${(dateOnly ? '' : timePart) || '00:00'}`);
    if (dateOnly) setOpen(false);
  }

  const Icon = dateOnly ? Calendar : CalendarClock;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full justify-start gap-2 font-normal"
        >
          <Icon className="h-4 w-4 opacity-50 shrink-0" />
          {displayValue || (
            <span className="text-muted-foreground">
              {dateOnly ? 'Selecciona fecha...' : 'Selecciona fecha y hora...'}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={dateOnly ? 'w-auto p-3' : 'w-auto p-0'} align="start">
        <CalendarComponent
          mode="single"
          selected={selectedDate}
          onSelect={handleDaySelect}
          captionLayout="dropdown"
          locale={es}
          className="px-0"
          classNames={{
            caption_label: 'hidden',
            month_caption: 'relative mx-10 mb-1 flex h-8 items-center justify-center z-20 gap-2',
          }}
          startMonth={new Date(2020, 0)}
          endMonth={new Date(2035, 11)}
        />
        {!dateOnly && (
          <div className="border-t border-border px-4 py-3 flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium text-foreground">Hora</span>
            <TimeField
              value={timePart ? new Time(...(timePart.split(':').map(Number) as [number, number])) : null}
              onChange={(t) => {
                if (!datePart || !t) return;
                const hh = String(t.hour).padStart(2, '0');
                const mm = String(t.minute).padStart(2, '0');
                onChange(`${datePart}T${hh}:${mm}`);
              }}
              isDisabled={disabled || !datePart}
              granularity="minute"
              hourCycle={24}
            >
              <DateInput />
            </TimeField>
            <Button type="button" size="sm" className="ml-auto" onClick={() => setOpen(false)}>
              Listo
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export { DateTimePicker };
export type { DateTimePickerProps };
