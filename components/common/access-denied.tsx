'use client';

import { ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AccessDeniedProps {
  title?: string;
  description?: string;
  onBack?: () => void;
}

export function AccessDenied({
  title = 'Acceso restringido',
  description = 'No tienes permiso para acceder a este recurso.',
  onBack,
}: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <ShieldOff className="h-6 w-6 text-destructive" />
      </div>
      <h2 className="text-base font-semibold text-foreground mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground mb-5">{description}</p>
      {onBack && (
        <Button variant="outline" size="sm" onClick={onBack}>
          Regresar
        </Button>
      )}
    </div>
  );
}
