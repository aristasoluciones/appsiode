import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container } from '@/components/common/container';
import { BodegasListaClient } from '../../../_components/bodegas-lista-client';

interface Props {
  params: Promise<{ tipo: string; id: string }>;
}

export const metadata: Metadata = {
  title: 'Consejo | Bodegas',
  description: 'Listado de bodegas del consejo.',
};

export default async function BodegasConsejoListaPage({ params }: Props) {
  const { tipo, id } = await params;
  const tipoLower = tipo.toLowerCase();

  // Validar que el tipo sea válido
  if (tipoLower !== 'distritales' && tipoLower !== 'municipales') {
    notFound();
  }

  // Mapear a parámetro de API
  const tipoConsejo = tipoLower === 'distritales' ? 'D' : 'M';
  const idConsejo = Number(id);

  return (
    <Container>
      <BodegasListaClient
        tipo="C"
        tipoConsejo={tipoConsejo}
        idConsejo={idConsejo}
      />
    </Container>
  );
}
