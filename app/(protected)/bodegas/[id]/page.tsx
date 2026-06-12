'use client';

import { Container } from '@/components/common/container';
import { BodegaDetalleClient } from '../_components/bodega-detalle-client';
import { use } from 'react';

interface BodegaDetallePageProps {
  params: Promise<{ id: string }>;
}

export default function BodegaDetallePage({ params }: BodegaDetallePageProps) {
  const { id } = use(params);

  return (
    <Container>
      <BodegaDetalleClient id={id} />
    </Container>
  );
}
