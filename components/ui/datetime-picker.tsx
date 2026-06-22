'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { es } from 'react-day-picker/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
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
}

function DateTimePicker({ value, onChange, disabled }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);

  const datePart = value ? value.slice(0, 10) : '';

  const selectedDate = datePart ? new Date(`${datePart}T12:00`) : undefined;

  const displayValue = datePart
    ? new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(`${datePart}T12:00`))
    : '';

  function handleDaySelect(day: Date | undefined) {
    if (!day) return;
    const y = day.getFullYear();
    const m = String(day.getMonth() + 1).padStart(2, '0');
    const d = String(day.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}T00:00`);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full justify-start gap-2 font-normal"
        >
          <Calendar className="h-4 w-4 opacity-50 shrink-0" />
          {displayValue || (
            <span className="text-muted-foreground">Selecciona fecha...</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
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
      </PopoverContent>
    </Popover>
  );
}

export { DateTimePicker };
export type { DateTimePickerProps };
