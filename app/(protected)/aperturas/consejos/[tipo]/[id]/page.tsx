import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AperturasConsejoClient } from '../../../components/aperturas-consejo-client';

interface Props {
  params: Promise<{ tipo: string; id: string }>;
}

export const metadata: Metadata = {
  title: 'Aperturas del Consejo | SIODE',
  description: 'Bitácora de aperturas de bodega del consejo.',
};

export default async function AperturasConsejoPage({ params }: Props) {
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

  return <AperturasConsejoClient tipoConsejo={tipoConsejo} idConsejo={idConsejo} />;
}
