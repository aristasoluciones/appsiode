'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Warehouse, CheckCircle, ClipboardCheck, FileText, Info } from 'lucide-react';
import type { IBodegaDashboard } from '@/types/bodegas';

// ─── Configuración de estados ──────────────────────────────────────────────────

const STATS_CONFIG = [
  {
    key: 'total' as const,
    label: 'Total',
    icon: Warehouse,
    colorIcon: 'text-blue-500 dark:text-blue-400',
    colorBg: 'bg-blue-50 dark:bg-blue-900/20',
    colorValue: 'text-gray-900 dark:text-gray-100',
  },
  {
    key: 'registradas' as const,
    label: 'Registradas',
    icon: FileText,
    colorIcon: 'text-gray-500 dark:text-gray-400',
    colorBg: 'bg-gray-100 dark:bg-gray-800',
    colorValue: 'text-gray-700 dark:text-gray-300',
  },
  {
    key: 'verificadas' as const,
    label: 'Verificadas',
    icon: Info,
    colorIcon: 'text-yellow-600 dark:text-yellow-400',
    colorBg: 'bg-yellow-50 dark:bg-yellow-900/20',
    colorValue: 'text-yellow-700 dark:text-yellow-400',
  },
  {
    key: 'comprobadas' as const,
    label: 'Comprobadas',
    icon: CheckCircle,
    colorIcon: 'text-green-600 dark:text-green-400',
    colorBg: 'bg-green-50 dark:bg-green-900/20',
    colorValue: 'text-green-700 dark:text-green-400',
  },
  {
    key: 'informadas' as const,
    label: 'Informadas',
    icon: ClipboardCheck,
    colorIcon: 'text-violet-600 dark:text-violet-400',
    colorBg: 'bg-violet-50 dark:bg-violet-900/20',
    colorValue: 'text-violet-700 dark:text-violet-400',
  },
] as const;

type StatKey = (typeof STATS_CONFIG)[number]['key'];

// ─── Tarjeta individual ───────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | undefined;
  Icon: React.ComponentType<{ className?: string }>;
  colorIcon: string;
  colorBg: string;
  colorValue: string;
  isLoading: boolean;
}

function StatCard({ label, value, Icon, colorIcon, colorBg, colorValue, isLoading }: StatCardProps) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
      role="region"
      aria-label={label}
    >
      <div
        className={`shrink-0 rounded-md p-2 ${colorBg}`}
        aria-hidden="true"
      >
        <Icon className={`h-4 w-4 ${colorIcon}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
        {isLoading ? (
          <Skeleton className="h-5 w-8 mt-0.5 animate-pulse motion-reduce:animate-none" />
        ) : (
          <p className={`text-lg font-semibold leading-tight ${colorValue}`}>
            {value ?? 0}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Grid de estadísticas ─────────────────────────────────────────────────────

interface EstadisticasDashboardProps {
  data: IBodegaDashboard | undefined;
  isLoading: boolean;
}

export function EstadisticasDashboard({ data, isLoading }: EstadisticasDashboardProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
      {STATS_CONFIG.map((s) => (
        <StatCard
          key={s.key}
          label={s.label}
          value={data?.[s.key as StatKey]}
          Icon={s.icon}
          colorIcon={s.colorIcon}
          colorBg={s.colorBg}
          colorValue={s.colorValue}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
