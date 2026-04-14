'use client';

import { FileText, Loader2, PanelRightClose } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { IExpediente } from './expedientes-data';

export interface PdfPreviewPanelProps {
  exp: IExpediente;
  url: string | null;
  loading: boolean;
  onClose: () => void;
}

export function PdfPreviewPanel({ exp, url, loading, onClose }: PdfPreviewPanelProps) {
  return (
    <div className="flex-1 flex flex-col border-t border-border lg:border-t-0 min-h-[480px] lg:min-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">{exp.no_doc}</span>
          <Badge variant="secondary" appearance="light" size="sm" className="shrink-0">
            {exp.tipo}
          </Badge>
        </div>
        <button
          type="button"
          onClick={onClose}
          title="Cerrar vista previa"
          className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <PanelRightClose className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col">
        {loading || !url ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 w-full">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Cargando documento...</span>
          </div>
        ) : (
          <iframe
            src={`${url}#view=Fit&zoom=60`}
            title={exp.no_doc}
            className="flex-1 w-full border-0"
            style={{ minHeight: '800px' }}
          />
        )}
      </div>
    </div>
  );
}
