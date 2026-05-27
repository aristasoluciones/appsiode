'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { toast } from 'sonner';

interface ExportarBotonProps {
  tipoConsejo: string;
}

export function ExportarBoton({ tipoConsejo }: ExportarBotonProps) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExportar() {
    setIsExporting(true);
    try {
      const { data, headers } = await apiClient.get(
        API_ENDPOINTS.BODEGAS.EXPORTAR(tipoConsejo),
        { responseType: 'blob' },
      );

      const contentDisposition = headers['content-disposition'] as string | undefined;
      const filenameMatch = contentDisposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      const filename = filenameMatch ? filenameMatch[1].replace(/['"]/g, '') : 'bodegas.xlsx';

      const url = window.URL.createObjectURL(new Blob([data as BlobPart]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Exportación descargada correctamente.');
    } catch {
      toast.error('No se pudo exportar. Intenta nuevamente.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="min-h-[44px] gap-1.5"
      onClick={handleExportar}
      disabled={isExporting}
      aria-label="Exportar bodegas a Excel"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Download className="h-4 w-4" aria-hidden="true" />
      )}
      Exportar
    </Button>
  );
}
