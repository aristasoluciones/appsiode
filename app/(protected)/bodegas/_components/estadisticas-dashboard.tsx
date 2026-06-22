'use client';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Warehouse,
  FileText,
  AlertTriangle,
  ShieldCheck,
  Info,
  PenTool,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { IBodegaDashboard, TStatusBodega } from '@/types/bodegas';

const ALL_STATUSES: TStatusBodega[] = [
  'En captura',
  'Capturada',
  'Observada',
  'Determinada',
  'Verificada',
  'Aceptada',
  'Rechazada',
];

const STATS_CONFIG = [
  {
    key: 'total' as const,
    label: 'Total',
    status: null as TStatusBodega | null,
    icon: Warehouse,
    colorIcon: 'text-blue-500 dark:text-blue-400',
    colorBg: 'bg-blue-50 dark:bg-blue-900/20',
    colorValue: 'text-gray-900 dark:text-gray-100',
  },
  {
    key: 'captura' as const,
    label: 'En captura',
    status: 'En captura' as TStatusBodega,
    icon: PenTool,
    colorIcon: 'text-sky-500 dark:text-sky-400',
    colorBg: 'bg-sky-50 dark:bg-sky-900/20',
    colorValue: 'text-sky-700 dark:text-sky-400',
  },
  {
    key: 'capturada' as const,
    label: 'Capturadas',
    status: 'Capturada' as TStatusBodega,
    icon: FileText,
    colorIcon: 'text-gray-500 dark:text-gray-400',
    colorBg: 'bg-gray-100 dark:bg-gray-800',
    colorValue: 'text-gray-700 dark:text-gray-300',
  },
  {
    key: 'observada' as const,
    label: 'Observadas',
    status: 'Observada' as TStatusBodega,
    icon: AlertTriangle,
    colorIcon: 'text-rose-500 dark:text-rose-400',
    colorBg: 'bg-rose-50 dark:bg-rose-900/20',
    colorValue: 'text-rose-700 dark:text-rose-400',
  },
  {
    key: 'determinada' as const,
    label: 'Determinadas',
    status: 'Determinada' as TStatusBodega,
    icon: ShieldCheck,
    colorIcon: 'text-emerald-600 dark:text-emerald-400',
    colorBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    colorValue: 'text-emerald-700 dark:text-emerald-400',
  },
  {
    key: 'verificada' as const,
    label: 'Verificadas',
    status: 'Verificada' as TStatusBodega,
    icon: Info,
    colorIcon: 'text-yellow-600 dark:text-yellow-400',
    colorBg: 'bg-yellow-50 dark:bg-yellow-900/20',
    colorValue: 'text-yellow-700 dark:text-yellow-400',
  },
  {
    key: 'aceptada' as const,
    label: 'Aceptadas',
    status: 'Aceptada' as TStatusBodega,
    icon: CheckCircle,
    colorIcon: 'text-green-600 dark:text-green-400',
    colorBg: 'bg-green-50 dark:bg-green-900/20',
    colorValue: 'text-green-700 dark:text-green-400',
  },
  {
    key: 'rechazada' as const,
    label: 'Rechazadas',
    status: 'Rechazada' as TStatusBodega,
    icon: XCircle,
    colorIcon: 'text-red-600 dark:text-red-400',
    colorBg: 'bg-red-50 dark:bg-red-900/20',
    colorValue: 'text-red-700 dark:text-red-400',
  },
] as const;

type StatKey = (typeof STATS_CONFIG)[number]['key'];

interface StatCardProps {
  label: string;
  value: number | undefined;
  Icon: React.ComponentType<{ className?: string }>;
  colorIcon: string;
  colorBg: string;
  colorValue: string;
  isLoading: boolean;
  isActive: boolean;
  isTotal: boolean;
  onClick: () => void;
}

function StatCard({ label, value, Icon, colorIcon, colorBg, colorValue, isLoading, isActive, isTotal, onClick }: StatCardProps) {
  const activeStyle = isActive
    ? 'border-primary/70 bg-primary/[0.02]'
    : 'border-gray-300 dark:border-gray-600 bg-card hover:bg-accent/30';
  const base = `flex items-center gap-2 rounded-lg border px-3 py-2 ${isTotal ? '' : 'cursor-pointer hover:shadow-sm active:scale-[0.98] transition-all'} ${isTotal ? 'border-border bg-card' : activeStyle}`;
  const content = (
    <>
      <div className={`shrink-0 rounded-md p-1.5 ${colorBg}`} aria-hidden="true">
        <Icon className={`h-3.5 w-3.5 ${colorIcon}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[0.6875rem] font-medium text-muted-foreground truncate">{label}</p>
        {isLoading ? (
          <Skeleton className="h-4 w-7 mt-0.5 animate-pulse motion-reduce:animate-none" />
        ) : (
          <p className={`text-base font-bold leading-tight ${colorValue}`}>{value ?? 0}</p>
        )}
      </div>
    </>
  );
  if (isTotal) return <div className={base} role="region" aria-label={label}>{content}</div>;
  return (
    <button type="button" className={base} onClick={onClick} role="checkbox" aria-checked={isActive} aria-label={label}>
      {content}
    </button>
  );
}

interface EstadisticasDashboardProps {
  data: IBodegaDashboard | undefined;
  isLoading: boolean;
  activeFilters: TStatusBodega[];
  onFilterToggle: (status: TStatusBodega) => void;
  onRestoreAll: () => void;
}

export function EstadisticasDashboard({ data, isLoading, activeFilters, onFilterToggle, onRestoreAll }: EstadisticasDashboardProps) {
  const progreso = data?.progreso;
  const hasFilter = activeFilters.length > 0;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
        {STATS_CONFIG.map((s) => {
          if (s.status == null) {
            return (
              <StatCard
                key={s.key}
                label={s.label}
                value={progreso?.[s.key as StatKey]}
                Icon={s.icon}
                colorIcon={s.colorIcon}
                colorBg={s.colorBg}
                colorValue={s.colorValue}
                isLoading={isLoading}
                isActive={true}
                isTotal={true}
                onClick={() => {}}
              />
            );
          }
          const isActive = activeFilters.includes(s.status);
          return (
            <StatCard
              key={s.key}
              label={s.label}
              value={progreso?.[s.key as StatKey]}
              Icon={s.icon}
              colorIcon={s.colorIcon}
              colorBg={s.colorBg}
              colorValue={s.colorValue}
              isLoading={isLoading}
              isActive={isActive}
              isTotal={false}
              onClick={() => onFilterToggle(s.status!)}
            />
          );
        })}
      </div>
      {hasFilter && (
        <p className="text-xs text-muted-foreground text-center">
          Filtro activo: {activeFilters.length} estado{activeFilters.length === 1 ? '' : 's'} seleccionado{activeFilters.length === 1 ? '' : 's'}.
          <button type="button" className="ml-1 text-primary underline underline-offset-2 hover:no-underline" onClick={onRestoreAll}>
            Limpiar filtros
          </button>
        </p>
      )}
    </div>
  );
}
