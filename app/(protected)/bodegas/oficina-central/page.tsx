import { Metadata } from 'next';
import { Container } from '@/components/common/container';
import { BodegasListaClient } from '../_components/bodegas-lista-client';

export const metadata: Metadata = {
  title: 'Oficina Central | Bodegas',
  description: 'Listado de bodegas de la Oficina Central.',
};

export default async function BodegasOficinaCentralPage() {
  return (
    <Container>
      <BodegasListaClient tipo="OC" />
    </Container>
  );
}
