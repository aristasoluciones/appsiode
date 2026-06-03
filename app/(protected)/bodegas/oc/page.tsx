import { Metadata } from 'next';
import { Container } from '@/components/common/container';
import { BodegasListaClient } from '../lista/components/bodegas-lista-client';

export const metadata: Metadata = {
  title: 'Lista de Bodegas | Bodegas',
  description: 'Listado de bodegas electorales.',
};

export default async function BodegasOCPage() {
  return (
    <Container>
      <BodegasListaClient
        tipo="OC"
      />
    </Container>
  );
}
