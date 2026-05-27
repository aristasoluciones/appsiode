'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TStatusBodega } from '@/types/bodegas';

const STATUS_OPTIONS: { value: TStatusBodega | ''; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'Registrada', label: 'Registrada' },
  { value: 'Verificada', label: 'Verificada' },
  { value: 'Comprobada', label: 'Comprobada' },
  { value: 'Informada', label: 'Informada' },
];

interface FiltrosBodegasProps {
  busqueda: string;
  onBusquedaChange: (v: string) => void;
  statusFiltro: TStatusBodega | '';
  onStatusChange: (v: TStatusBodega | '') => void;
}

export function FiltrosBodegas({
  busqueda,
  onBusquedaChange,
  statusFiltro,
  onStatusChange,
}: FiltrosBodegasProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Buscar por órgano o consejo…"
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          className="pl-9 min-h-[44px]"
          aria-label="Buscar bodegas"
        />
      </div>

      <Select
        value={statusFiltro === '' ? '__all__' : statusFiltro}
        onValueChange={(v) => onStatusChange(v === '__all__' ? '' : (v as TStatusBodega))}
      >
        <SelectTrigger
          className="w-full sm:w-48 min-h-[44px]"
          aria-label="Filtrar por estado"
        >
          <SelectValue placeholder="Todos los estados" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((op) => (
            <SelectItem key={op.value === '' ? '__all__' : op.value} value={op.value === '' ? '__all__' : op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
