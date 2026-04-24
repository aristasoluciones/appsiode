'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
  TEstadoIndicador,
  IIndicadorAPI,
  IConsejoIndicador,
  ISesionDistinct,
} from '@/types/sesiones';
import { TIPO_CONSEJO_CHAR, type TTipoConsejo } from '@/hooks/use-proceso';

// ─── Re-exports para consumidores de este módulo ───────────────────────────────

export type { TEstadoIndicador, IConsejoIndicador, ISesionOption } from '@/types/sesiones';
export type { TTipoConsejo } from '@/hooks/use-proceso';

// ─── Configuración de colores por estado ──────────────────────────────────────

export const ESTADOS_CONFIG: Record<
  TEstadoIndicador,
  { label: string; colorText: string; colorBg: string; colorBorder: string; colorBar: string }
> = {
  programada: {
    label: 'Programadas',
    colorText: 'text-violet-500',
    colorBg: 'bg-violet-50 dark:bg-violet-900/20',
    colorBorder: 'border-violet-400',
    colorBar: 'bg-violet-400',
  },
  con_demora: {
    label: 'Con Demora',
    colorText: 'text-red-500',
    colorBg: 'bg-red-50 dark:bg-red-900/20',
    colorBorder: 'border-red-400',
    colorBar: 'bg-red-400',
  },
  en_proceso: {
    label: 'En Proceso',
    colorText: 'text-yellow-500',
    colorBg: 'bg-yellow-50 dark:bg-yellow-900/20',
    colorBorder: 'border-yellow-400',
    colorBar: 'bg-yellow-400',
  },
  concluida: {
    label: 'Concluidas',
    colorText: 'text-green-500',
    colorBg: 'bg-green-50 dark:bg-green-900/20',
    colorBorder: 'border-green-400',
    colorBar: 'bg-green-400',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MESES = [
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre',
];

function formatFechaHora(iso: string): string {
  const d = new Date(iso);
  if (!iso || isNaN(d.getTime())) return 'Fecha inválida';
  const day = String(d.getDate()).padStart(2, '0');
  const month = MESES[d.getMonth()];
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} de ${month} ${year} ${hh}:${mm}`;
}

function mapIndicador(item: IIndicadorAPI): IConsejoIndicador {
  return {
    clave: item.clave_consejo,
    nombre: item.consejo,
    programadas: item.sesiones_programadas,
    conDemora: item.sesiones_con_demora,
    enProceso: item.sesiones_en_proceso,
    concluidas: item.sesiones_concluidas,
    total: item.sesiones_total,
  };
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useIndicadoresData(
  tipoConsejo: TTipoConsejo,
  sesionId: string | null,
) {
  return useQuery({
    queryKey: ['sesiones', 'indicadores', tipoConsejo, sesionId],
    queryFn: async (): Promise<IConsejoIndicador[]> => {
      const { data } = await apiClient.get<IIndicadorAPI[]>(
        API_ENDPOINTS.SESIONES.INDICADORES(TIPO_CONSEJO_CHAR[tipoConsejo], sesionId),
      );
      return data.map(mapIndicador);
    },
    staleTime: 30_000,
  });
}

export function useSesionesOptions(tipoConsejo: TTipoConsejo) {
  return useQuery({
    queryKey: ['sesiones', 'opciones', tipoConsejo],
    queryFn: async () => {
      const { data } = await apiClient.get<ISesionDistinct[] | null>(
        API_ENDPOINTS.SESIONES.DISTINCT,
      );
      // Formato esperado por el API: "no_sesion;tipo;fecha_hora"
      return (data ?? []).map((s) => ({
        id: `${s.no_sesion};${s.tipo};${s.fecha_hora}`,
        label: `${s.no_sesion} ${s.tipo} (${formatFechaHora(s.fecha_hora)})`,
      }));
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
  });
}
