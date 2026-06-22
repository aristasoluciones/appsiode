'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Building, MapPin } from 'lucide-react';
import { useProceso } from '@/hooks/use-proceso';
import { useAuth } from '@/providers/auth-provider';
import { useBodegasDashboard } from '../_hooks/use-bodegas';
import { EstadisticasDashboard } from './estadisticas-dashboard';
import { ConsejosDashboard } from './consejos-dashboard';
import { descargarXLSX } from '@/lib/export-xlsx';
import type { TStatusBodega, IBodegaDashboardConsejo } from '@/types/bodegas';

type TPillValue = 'oc' | 'c-d' | 'c-m';

const PILLS = [
  { value: 'oc' as TPillValue, label: 'Oficina Central', icon: Building2 },
  { value: 'c-d' as TPillValue, label: 'Distritales', icon: Building },
  { value: 'c-m' as TPillValue, label: 'Municipales', icon: MapPin },
];

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

function parsePill(value: TPillValue): { tipo: 'OC' | 'C'; tipoConsejo?: string } {
  if (value === 'oc') return { tipo: 'OC' };
  if (value === 'c-d') return { tipo: 'C', tipoConsejo: 'D' };
  return { tipo: 'C', tipoConsejo: 'M' };
}

export function BodegasDashboardClient() {
  const { data: proceso, isLoading: isLoadingProceso } = useProceso();
  const { user, hasPermission } = useAuth();
  const router = useRouter();

  const canCrear = hasPermission('bodegas.be.registrar');

  const [activeFilters, setActiveFilters] = useState<TStatusBodega[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const isCapturista = parseInt(user?.idConsejo ?? '0') > 0;

  useEffect(() => {
    if (isCapturista && user?.tipoConsejo && user?.idConsejo) {
      const tipo = user.tipoConsejo.toUpperCase() === 'D' ? 'distritales' : 'municipales';
      router.replace(`/bodegas/consejos/${tipo}/${user.idConsejo}`);
    }
  }, [isCapturista, user?.tipoConsejo, user?.idConsejo, router]);

  if (isCapturista) {
    return (
      <div className="space-y-4 animate-pulse motion-reduce:animate-none" aria-busy="true" aria-label="Redirigiendo...">
        <div className="h-8.5 bg-muted rounded-md w-48" />
        <div className="h-24 bg-muted rounded-lg" />
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    );
  }

  const defaultPill: TPillValue | null = useMemo(() => {
    if (!proceso?.elecciones?.length) return null;
    const firstTipo = proceso.elecciones[0].consejo_tipo as 'D' | 'M' | undefined;
    if (!firstTipo) return null;
    return `c-${firstTipo.toLowerCase()}` as TPillValue;
  }, [proceso]);

  const [pill, setPill] = useState<TPillValue | null>(defaultPill);

  const { tipo, tipoConsejo } = pill ? parsePill(pill) : { tipo: 'OC' as const, tipoConsejo: undefined };
  const queryEnabled = pill != null;

  const {
    data: dashboard,
    isLoading: isLoadingDashboard,
  } = useBodegasDashboard(tipo, tipoConsejo, queryEnabled);

  function handleExportar() {
    setIsExporting(true);
    try {
      const consejos = dashboard?.consejos ?? [];
      const rows = consejos.map((c: IBodegaDashboardConsejo) => ({
        Clave: c.id_consejo ?? '—',
        Consejo: c.nombre_consejo,
        Tipo: c.tipo_consejo === 'D' ? 'Distrital' : c.tipo_consejo ? 'Municipal' : 'Oficina Central',
        Total: c.total,
        'En captura': c.captura,
        Capturada: c.capturada,
        Observada: c.observada,
        Determinada: c.determinada,
        Verificada: c.verificada,
        Aceptada: c.aceptada,
        Rechazada: c.rechazada,
      }));
      descargarXLSX(rows, 'dashboard-bodegas');
    } catch {
      console.error('Error al exportar');
    } finally {
      setIsExporting(false);
    }
  }

  function handleNueva() {
    router.push('/bodegas/nueva');
  }

  const handleFilterToggle = useCallback((status: TStatusBodega) => {
    setActiveFilters((prev) => {
      if (prev.includes(status)) return prev.filter((s) => s !== status);
      return [...prev, status];
    });
  }, []);

  const handleRestoreAll = useCallback(() => {
    setActiveFilters([]);
  }, []);

  if (isLoadingProceso) {
    return (
      <div className="space-y-4 animate-pulse motion-reduce:animate-none" aria-busy="true" aria-label="Cargando bodegas">
        <div className="h-8.5 bg-muted rounded-md w-48" />
        <div className="h-24 bg-muted rounded-lg" />
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    );
  }

  function handlePillChange(v: TPillValue) {
    setPill(v);
    setActiveFilters([]);
  }

  return (
    <div className="space-y-4">
      <BodegaPills
        value={pill}
        onChange={handlePillChange}
        disabled={isLoadingProceso}
      />

      <EstadisticasDashboard
        data={dashboard}
        isLoading={isLoadingDashboard}
        activeFilters={activeFilters}
        onFilterToggle={handleFilterToggle}
        onRestoreAll={handleRestoreAll}
      />

      <ConsejosDashboard
        consejos={dashboard?.consejos ?? []}
        isLoading={isLoadingDashboard}
        tipoConsejo={tipoConsejo}
        activeFilters={activeFilters}
        onExport={handleExportar}
        isExporting={isExporting}
        canCrear={canCrear}
        onNueva={handleNueva}
        onRestoreAll={handleRestoreAll}
      />
    </div>
  );
}
