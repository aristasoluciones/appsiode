'use client';

import { useState } from 'react';
import { FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { IConsejoIndicador } from './indicadores-data';

interface ExportButtonsProps {
  data: IConsejoIndicador[];
  disabled?: boolean;
}

type TExportFormat = 'pdf' | 'csv';

export function ExportButtons({ data, disabled = false }: ExportButtonsProps) {
  const [loadingFormat, setLoadingFormat] = useState<TExportFormat | null>(null);

  async function handleExport(format: TExportFormat) {
    if (loadingFormat) return;
    setLoadingFormat(format);
    try {
      // TODO: reemplazar con llamada real a endpoint de exportación
      // Simulación de exportación
      await new Promise<void>((resolve) => setTimeout(resolve, 1500));

      if (format === 'csv') {
        // Generar CSV con los datos filtrados actuales
        const headers = ['Clave', 'Consejo', 'Programadas', 'Con Demora', 'En Proceso', 'Concluidas', 'Total'];
        const rows = data.map((r) => [
          r.clave,
          `"${r.nombre}"`,
          r.programadas,
          r.conDemora,
          r.enProceso,
          r.concluidas,
          r.total,
        ]);
        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'indicadores-sesiones.csv';
        a.click();
        URL.revokeObjectURL(url);
      }
      // Para PDF: el backend generaría el archivo

      toast.success('Archivo generado correctamente.');
    } catch {
      toast.error('Error al generar el archivo. Intente de nuevo.');
    } finally {
      setLoadingFormat(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline" 
        size="sm"
        onClick={() => handleExport('csv')}
        disabled={disabled || loadingFormat !== null}
        className="gap-1.5"
        aria-label="Exportar a CSV"
      >
        {loadingFormat === 'csv' ? (
          <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
        )}
        <span>CSV</span>
      </Button>
    </div>
  );
}
