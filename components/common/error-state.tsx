'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Error al cargar la información',
  message = 'No se pudo obtener la información. Verifica e intenta nuevamente.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center" role="alert">
      <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <h2 className="text-base font-semibold text-foreground mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground mb-5">{message}</p>
      {onRetry && (
        <Button size="sm" onClick={onRetry}>Reintentar</Button>
      )}
    </div>
  );
}
