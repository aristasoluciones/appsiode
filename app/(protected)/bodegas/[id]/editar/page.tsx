'use client';

import { Container } from '@/components/common/container';
import { EditarBodegaClient } from '../../_components/editar-bodega-client';
import { useAuth } from '@/providers/auth-provider';
import { use } from 'react';
import { ShieldOff } from 'lucide-react';

interface EditarBodegaPageProps {
  params: Promise<{ id: string }>;
}

export default function EditarBodegaPage({ params }: EditarBodegaPageProps) {
  const { id } = use(params);
  const { hasPermission } = useAuth();
  const canEditar = hasPermission('bodegas.be.actualizar');

  if (!canEditar) {
    return (
      <Container>
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-12 text-center space-y-3">
          <ShieldOff className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-sm font-medium text-destructive">
            No tienes permiso para editar bodegas.
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <EditarBodegaClient id={id} />
    </Container>
  );
}
