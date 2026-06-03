import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container } from '@/components/common/container';
import { BodegasConsejoListaClient } from './components/bodegas-consejo-lista-client';

interface Props {
  params: Promise<{ tipoConsejo: string; idConsejo: string }>;
}

export const metadata: Metadata = {
  title: 'Lista de Bodegas | Bodegas',
  description: 'Listado de bodegas electorales.',
};

export default async function BodegasConsejoListaPage({ params }: Props) {
  const { tipoConsejo, idConsejo } = await params;
  const tipoConsejoUpper = tipoConsejo.toUpperCase();
  if (tipoConsejoUpper !== 'D' && tipoConsejoUpper !== 'M') notFound();

  const id = Number(idConsejo);

  return (
    <>
      <Container>
        <BodegasConsejoListaClient
          tipo="C"
          tipoConsejo={tipoConsejoUpper}
          idConsejo={id}
          tipoConsejoUrl={tipoConsejo}
        />
      </Container>
    </>
  );
}
