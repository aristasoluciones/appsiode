import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ComprobacionesConsejoClient } from '../../../../_components/comprobaciones-consejo-client';

interface Props {
  params: Promise<{ tipo: string; id: string }>;
}

export const metadata: Metadata = {
  title: 'Comprobación del Consejo | SIODE',
  description:
    'Comprobación física de la documentación y el material electoral de un consejo, vista desde oficina central.',
};

export default async function ComprobacionConsejoPage({ params }: Props) {
  const { tipo, id } = await params;
  const tipoLower = tipo.toLowerCase();

  if (tipoLower !== 'distritales' && tipoLower !== 'municipales') {
    notFound();
  }

  const tipoConsejo = tipoLower === 'distritales' ? 'D' : 'M';
  const idConsejo = Number(id);

  if (!Number.isInteger(idConsejo) || idConsejo <= 0) {
    notFound();
  }

  return (
    <ComprobacionesConsejoClient
      tipoConsejo={tipoConsejo}
      idConsejo={idConsejo}
    />
  );
}
