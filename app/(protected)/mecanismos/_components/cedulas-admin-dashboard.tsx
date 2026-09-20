'use client';

import { useMemo, useState } from 'react';
import { Download, FileArchive, LoaderCircleIcon } from 'lucide-react';
import type { TCedulaEstatus } from '@/types/mecanismos';
import { useProceso } from '@/hooks/use-proceso';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AccessDenied } from '@/components/common/access-denied';
import { ChipFiltro } from '@/components/common/chip-filtro';
import { ErrorState } from '@/components/common/error-state';
import {
  opcionesTipoConsejo,
  TipoConsejoPills,
} from '@/components/common/tipo-consejo-pills';
import { useCedulasResumen } from '../_hooks/use-cedulas';
import { useDescargarReporteCedulasGeneral } from '../_hooks/use-mecanismos-reportes';
import { ESTATUS_CEDULA } from '../_lib/estatus';
import { CedulasDocumentosDialog } from './cedulas-documentos-dialog';
import { CedulasResumenTable, COLUMNAS_RESUMEN } from './cedulas-resumen-table';

/**
 * Tablero de cédulas de oficina central: todos los consejos del tipo con sus
 * cédulas por estatus; al abrir un consejo se opera el ciclo de cada cédula.
 * La carga por zip y la exportación salen de aquí.
 */
export function CedulasAdminDashboard() {
  const { hasPermission } = useAuth();
  const { data: proceso, isLoading: isLoadingProceso } = useProceso();

  const puedeBandeja = hasPermission('mecanismos.cedulas.bandeja');
  const puedeImportar = hasPermission('mecanismos.importar');
  const puedeExportar = hasPermission('mecanismos.exportar');

  const opciones = useMemo(() => opcionesTipoConsejo(proceso), [proceso]);
  const [tipoElegido, setTipoElegido] = useState<'D' | 'M' | null>(null);
  const tipoConsejo = tipoElegido ?? opciones[0]?.value ?? null;

  const [estatusActivos, setEstatusActivos] = useState<TCedulaEstatus[]>([]);
  const [zipAbierto, setZipAbierto] = useState(false);

  const resumen = useCedulasResumen(
    tipoConsejo,
    !isLoadingProceso && puedeBandeja,
  );
  const exportar = useDescargarReporteCedulasGeneral();
  const consejos = useMemo(() => resumen.data ?? [], [resumen.data]);

  // Total de cédulas por estatus en el tipo de consejo, para los chips.
  const totales = useMemo(() => {
    const t = Object.fromEntries(
      COLUMNAS_RESUMEN.map((c) => [c.estatus, 0]),
    ) as Record<TCedulaEstatus, number>;
    for (const c of consejos)
      for (const col of COLUMNAS_RESUMEN)
        t[col.estatus] += Number(c[col.campo]);
    return t;
  }, [consejos]);

  if (isLoadingProceso) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Cargando cédulas">
        <Skeleton className="h-8.5 w-48 rounded-md" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!puedeBandeja) {
    return (
      <AccessDenied description="Tu cuenta no tiene el permiso de la bandeja de cédulas; pide a un administrador que lo asigne." />
    );
  }

  if (resumen.isError) {
    return (
      <ErrorState
        title="No se pudo cargar el resumen de cédulas."
        onRetry={() => resumen.refetch()}
      />
    );
  }

  const acciones = (
    <>
      {puedeImportar && (
        <Button variant="outline" size="sm" onClick={() => setZipAbierto(true)}>
          <FileArchive className="h-4 w-4" aria-hidden="true" />
          Cargar PDF por zip
        </Button>
      )}
      {puedeExportar && tipoConsejo && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportar.mutate({ tipoConsejo })}
          disabled={exportar.isPending}
        >
          {exportar.isPending ? (
            <LoaderCircleIcon
              className="h-4 w-4 animate-spin"
              aria-hidden="true"
            />
          ) : (
            <Download className="h-4 w-4" aria-hidden="true" />
          )}
          Exportar
        </Button>
      )}
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TipoConsejoPills
          opciones={opciones}
          value={tipoConsejo}
          onChange={(v) => {
            setTipoElegido(v);
            setEstatusActivos([]);
          }}
          disabled={resumen.isLoading}
        />
        <div
          className="flex flex-wrap gap-1.5 ml-auto"
          role="group"
          aria-label="Filtrar por estatus"
        >
          {COLUMNAS_RESUMEN.map((col) => (
            <ChipFiltro
              key={col.estatus}
              activo={estatusActivos.includes(col.estatus)}
              disabled={resumen.isLoading}
              onClick={() =>
                setEstatusActivos((prev) =>
                  prev.includes(col.estatus)
                    ? prev.filter((e) => e !== col.estatus)
                    : [...prev, col.estatus],
                )
              }
            >
              {ESTATUS_CEDULA[col.estatus].label}
              <span className="tabular-nums font-semibold">
                {totales[col.estatus]}
              </span>
            </ChipFiltro>
          ))}
        </div>
      </div>

      {tipoConsejo && (
        <div
          className={[
            'transition-opacity duration-150 motion-reduce:transition-none',
            resumen.isFetching && !resumen.isLoading
              ? 'opacity-60'
              : 'opacity-100',
          ].join(' ')}
        >
          <CedulasResumenTable
            data={consejos}
            isLoading={resumen.isLoading}
            tipoConsejo={tipoConsejo}
            estatusActivos={estatusActivos}
            onLimpiarFiltro={() => setEstatusActivos([])}
            acciones={acciones}
          />
        </div>
      )}

      <CedulasDocumentosDialog open={zipAbierto} onOpenChange={setZipAbierto} />
    </div>
  );
}
