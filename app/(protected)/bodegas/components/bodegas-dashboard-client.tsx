'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Building2, Building, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProceso } from '@/hooks/use-proceso';
import { useAuth } from '@/providers/auth-provider';
import { useBodegasDashboard } from './bodegas-data';
import { EstadisticasDashboard } from './estadisticas-dashboard';
import { ConsejosDashboard } from './consejos-dashboard';

// ─── Opciones de pills ──────────────────────────────────────────────────────────

type TPillValue = 'oc' | 'c-d' | 'c-m';

interface PillOption {
  value: TPillValue;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PILLS: PillOption[] = [
  { value: 'oc', label: 'Oficina Central', icon: Building2 },
  { value: 'c-d', label: 'Distritales', icon: Building },
  { value: 'c-m', label: 'Municipales', icon: MapPin },
];

// ─── Selector de pills ────────────────────────────────────────────────────────

function BodegaPills({
  value,
  onChange,
  disabled = false,
}: {
  value: TPillValue | null;
  onChange: (v: TPillValue) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Ámbito de bodegas" className="flex flex-wrap gap-2">
      {PILLS.map((op) => {
        const isActive = value === op.value;
        const Icon = op.icon;
        return (
          <button
            key={op.value}
            role="radio"
            aria-checked={isActive}
            type="button"
            disabled={disabled}
            onClick={() => onChange(op.value)}
            className={[
              'inline-flex items-center gap-2 h-8.5 px-3 rounded-md border text-[0.8125rem] font-medium',
              'transition-colors duration-150 motion-reduce:transition-none',
              'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:border-ring',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              isActive
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-background border-input text-foreground hover:bg-accent',
            ].join(' ')}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{op.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Helpers para mapear pills a parámetros de API ────────────────────────────

function parsePill(value: TPillValue): { tipo: 'OC' | 'C'; tipoConsejo?: string } {
  if (value === 'oc') return { tipo: 'OC' };
  if (value === 'c-d') return { tipo: 'C', tipoConsejo: 'D' };
  return { tipo: 'C', tipoConsejo: 'M' };
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function BodegasDashboardClient() {
  const { data: proceso, isLoading: isLoadingProceso } = useProceso();
  const { hasPermission } = useAuth();
  const router = useRouter();

  const canCrear = hasPermission('bodegas.ver');

  // Determinar pill inicial según elecciones del proceso
  const defaultPill: TPillValue | null = useMemo(() => {
    if (!proceso?.elecciones?.length) return null;
    const firstTipo = proceso.elecciones[0].consejo_tipo as 'D' | 'M' | undefined;
    if (!firstTipo) return null;
    return `c-${firstTipo.toLowerCase()}` as TPillValue;
  }, [proceso]);

  const [pill, setPill] = useState<TPillValue | null>(defaultPill);

  const { tipo, tipoConsejo } = pill ? parsePill(pill) : { tipo: 'OC' as const, tipoConsejo: undefined };
  const esConsejo = tipo === 'C';

  const queryEnabled = pill != null;

  const {
    data: dashboard,
    isLoading: isLoadingDashboard,
    isError: isErrorDashboard,
    refetch: refetchDashboard,
  } = useBodegasDashboard(tipo, tipoConsejo, queryEnabled);

  function handleRetry() {
    refetchDashboard();
  }

  if (isLoadingProceso) {
    return (
      <div className="space-y-4 animate-pulse motion-reduce:animate-none" aria-busy="true" aria-label="Cargando bodegas">
        <div className="h-8.5 bg-muted rounded-md w-48" />
        <div className="h-24 bg-muted rounded-lg" />
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selector de pills + acción */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BodegaPills
          value={pill}
          onChange={setPill}
          disabled={isLoadingProceso}
        />

        {canCrear && (
          <Button
            variant="primary"
            size="sm"
            className="gap-1.5 self-start sm:self-auto"
            onClick={() => router.push('/bodegas/nueva')}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nueva Bodega
          </Button>
        )}
      </div>

      {/* Estadísticas */}
      <EstadisticasDashboard data={dashboard} isLoading={isLoadingDashboard} />

      <ConsejosDashboard
        consejos={dashboard?.consejos ?? []}
        isLoading={isLoadingDashboard}
        tipoConsejo={tipoConsejo}
      />
    </div>
  );
}
